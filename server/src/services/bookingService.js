const Booking = require('../models/bookingModel');
const Availability = require('../models/AvailabilityModel');
const PTProfile = require('../models/PTProfileModel');
const User = require('../models/userModel');
const logger = require('../configs/logger');
const {notifySafely} = require('./notificationService');
const {dayjs, APP_TIMEZONE} = require('../utils/helpers');
const {badRequest, forbidden, notFound, conflict} = require('../utils/httpError');
const {optionalText} = require('../utils/validators');

// The only place where a booking's status changes. Every transition is a
// conditional update (current status and time rules are part of the filter),
// so two concurrent requests can never both succeed - e.g. a PT confirming
// while the client cancels.
//
//   pending_confirmation ─┬─> confirmed ─┬─> completed (PT, or system after AUTO_COMPLETE_AFTER_HOURS)
//                         │              ├─> cancelled_by_client (>= CLIENT_CANCEL_NOTICE_HOURS before start)
//                         │              └─> cancelled_by_pt (before start, reason required)
//                         ├─> rejected_by_pt
//                         ├─> cancelled_by_client
//                         └─> rejected_by_system (start time passed without an answer)

const BOOKING_STATUSES = Booking.schema.path('status').enumValues;
const ACTIVE_BOOKING_STATUSES = ['pending_confirmation', 'confirmed'];
const CLIENT_CANCEL_NOTICE_HOURS = 24;
const REMINDER_LEAD_HOURS = 24;
const AUTO_COMPLETE_AFTER_HOURS = 12;
const REASON_MAX_LENGTH = 500;

const HOUR_MS = 60 * 60 * 1000;
const hoursFrom = (date, hours) => new Date(date.getTime() + hours * HOUR_MS);

const readReason = value => optionalText(value, {field: 'Reason', max: REASON_MAX_LENGTH});
const withReason = (message, reason) => (reason ? `${message}. Reason: ${reason}` : message);

// Applies a conditional update. When nothing matched, reloads the booking to
// explain why with the right status code (404 / 403 / 400), falling back to
// 409 when another request changed it in between.
const applyTransition = async ({
  bookingId,
  actorField,
  actorId,
  from,
  filter = {},
  update,
  messages,
  check,
}) => {
  const booking = await Booking.findOneAndUpdate(
    {_id: bookingId, [actorField]: actorId, status: {$in: from}, ...filter},
    update,
    {new: true, runValidators: true},
  );
  if (booking) {
    return booking;
  }

  const current = await Booking.findById(bookingId).lean();
  if (!current) {
    throw notFound(messages.notFound);
  }
  if (current[actorField].toString() !== actorId.toString()) {
    throw forbidden(messages.forbidden);
  }
  if (!from.includes(current.status)) {
    throw badRequest(messages.status(current.status));
  }
  const reason = check?.(current);
  if (reason) {
    throw badRequest(reason);
  }
  throw conflict('This booking was just changed by another request. Please refresh and try again.');
};

const ptMessages = action => ({
  notFound: 'Booking not found.',
  forbidden: 'You are not authorized to modify this booking.',
  status: status => `Booking is currently in "${status}" status, cannot ${action}.`,
});

const releaseSlot = (slotId, status = 'available') =>
  Availability.updateOne({_id: slotId, status: 'booked'}, {status});

// Shared by "PT marks as completed" and the automatic completion job.
const finishCompletion = async (booking, {pt = null, log = logger} = {}) => {
  await PTProfile.updateOne({user: booking.pt}, {$inc: {totalSessions: 1}});
  await notifySafely(
    pt
      ? {
          recipient: booking.client,
          sender: pt._id,
          type: 'booking_completed_pt',
          message: `Your session with ${pt.username} has been completed. Please leave a review!`,
          relatedBooking: booking._id,
        }
      : {
          recipient: booking.client,
          senderType: 'System',
          type: 'booking_completed_client',
          message: 'Your session has been marked as completed. How was it? Leave a review for your trainer!',
          relatedBooking: booking._id,
        },
    log,
  );
};

// --- Client actions --------------------------------------------------------

const createBooking = async ({client, ptId, availabilitySlotId, notesFromClient, log = logger}) => {
  const ptUser = await User.findOne({_id: ptId, role: 'pt', isActive: true});
  if (!ptUser) {
    throw notFound('Personal Trainer not found.');
  }

  const ptProfile = await PTProfile.findOne({user: ptId});
  if (!ptProfile || typeof ptProfile.hourlyRate !== 'number') {
    throw badRequest('PT has not updated pricing information or profile is incomplete.');
  }
  if (!ptProfile.isAcceptingClients) {
    throw badRequest('This PT is not accepting new clients at the moment.');
  }

  const slot = await Availability.findById(availabilitySlotId);
  if (!slot) {
    throw notFound('Selected time slot does not exist.');
  }
  if (slot.pt.toString() !== ptId) {
    throw badRequest('Time slot does not belong to this PT.');
  }
  if (dayjs(slot.startTime).isBefore(dayjs())) {
    throw badRequest('Cannot book past time slots.');
  }

  const existingClientBooking = await Booking.exists({
    client: client._id,
    status: {$in: ACTIVE_BOOKING_STATUSES},
    'bookingTime.startTime': {$lt: slot.endTime},
    'bookingTime.endTime': {$gt: slot.startTime},
  });
  if (existingClientBooking) {
    throw badRequest('You already have another booking that conflicts with this time slot.');
  }

  // Reserve the slot atomically. Only one concurrent request can flip it from
  // "available" to "booked", which prevents two clients booking the same slot.
  const reservedSlot = await Availability.findOneAndUpdate(
    {_id: availabilitySlotId, pt: ptId, status: 'available'},
    {status: 'booked'},
    {new: true},
  );
  if (!reservedSlot) {
    throw conflict('Time slot is no longer available.');
  }

  let booking;
  try {
    booking = await Booking.create({
      client: client._id,
      pt: ptId,
      availabilitySlot: availabilitySlotId,
      bookingTime: {startTime: slot.startTime, endTime: slot.endTime},
      status: 'pending_confirmation',
      notesFromClient,
      priceAtBooking: ptProfile.hourlyRate,
    });
  } catch (error) {
    // Release the reservation if the booking could not be stored.
    await releaseSlot(availabilitySlotId);
    throw error;
  }

  await notifySafely(
    {
      recipient: ptId,
      sender: client._id,
      type: 'new_booking_request',
      message: `New booking request from ${client.username}`,
      relatedBooking: booking._id,
    },
    log,
  );
  return booking;
};

const cancelByClient = async ({client, bookingId, reason: rawReason, log = logger}) => {
  const reason = readReason(rawReason);
  const now = new Date();
  const noticeDeadline = hoursFrom(now, CLIENT_CANCEL_NOTICE_HOURS);

  const booking = await applyTransition({
    bookingId,
    actorField: 'client',
    actorId: client._id,
    from: ACTIVE_BOOKING_STATUSES,
    // A confirmed session can only be cancelled with enough notice.
    filter: {
      $or: [
        {status: 'pending_confirmation'},
        {'bookingTime.startTime': {$gte: noticeDeadline}},
      ],
    },
    update: {status: 'cancelled_by_client', cancellationReason: reason, cancelledAt: now},
    messages: {
      notFound: 'Booking not found',
      forbidden: 'You are not authorized to cancel this booking.',
      status: status => `Cannot cancel booking in "${status}" status.`,
    },
    check: current =>
      current.status === 'confirmed' && current.bookingTime.startTime < noticeDeadline
        ? `Cannot cancel this booking because it's too close to the appointment time (must cancel at least ${CLIENT_CANCEL_NOTICE_HOURS} hours before).`
        : null,
  });

  // The slot was reserved by this booking; give it back to the PT.
  await releaseSlot(booking.availabilitySlot);

  await notifySafely(
    {
      recipient: booking.pt,
      sender: client._id,
      type: 'booking_cancelled_by_client',
      message: withReason(`${client.username} cancelled their booking`, reason),
      relatedBooking: booking._id,
    },
    log,
  );
  return booking;
};

// --- PT actions ------------------------------------------------------------

const confirmBooking = async ({pt, bookingId, log = logger}) => {
  const now = new Date();
  const booking = await applyTransition({
    bookingId,
    actorField: 'pt',
    actorId: pt._id,
    from: ['pending_confirmation'],
    filter: {'bookingTime.startTime': {$gt: now}},
    update: {status: 'confirmed'},
    messages: ptMessages('confirm'),
    check: current =>
      current.bookingTime.startTime <= now
        ? 'This session has already started and can no longer be confirmed.'
        : null,
  });

  await notifySafely(
    {
      recipient: booking.client,
      sender: pt._id,
      type: 'booking_confirmed',
      message: `Your booking has been confirmed by ${pt.username}`,
      relatedBooking: booking._id,
    },
    log,
  );
  return booking;
};

const rejectBooking = async ({pt, bookingId, reason: rawReason, log = logger}) => {
  const reason = readReason(rawReason);
  const booking = await applyTransition({
    bookingId,
    actorField: 'pt',
    actorId: pt._id,
    from: ['pending_confirmation'],
    update: {status: 'rejected_by_pt', cancellationReason: reason, cancelledAt: new Date()},
    messages: ptMessages('reject'),
  });

  // Free the slot reserved by this booking so other clients can book it.
  await releaseSlot(booking.availabilitySlot);

  await notifySafely(
    {
      recipient: booking.client,
      sender: pt._id,
      type: 'booking_rejected',
      message: withReason(`Your booking has been rejected by ${pt.username}`, reason),
      relatedBooking: booking._id,
    },
    log,
  );
  return booking;
};

// A PT calling off a confirmed session. Pending requests are rejected instead.
const cancelByPt = async ({pt, bookingId, reason: rawReason, log = logger}) => {
  const reason = readReason(rawReason);
  if (!reason) {
    throw badRequest('Please tell your client why you are cancelling this session.');
  }
  const now = new Date();

  const booking = await applyTransition({
    bookingId,
    actorField: 'pt',
    actorId: pt._id,
    from: ['confirmed'],
    filter: {'bookingTime.startTime': {$gt: now}},
    update: {status: 'cancelled_by_pt', cancellationReason: reason, cancelledAt: now},
    messages: {
      ...ptMessages('cancel'),
      status: status =>
        status === 'pending_confirmation'
          ? 'This request has not been confirmed yet. Reject it instead.'
          : `Booking is currently in "${status}" status, cannot cancel.`,
    },
    check: current =>
      current.bookingTime.startTime <= now
        ? 'This session has already started and can no longer be cancelled.'
        : null,
  });

  // The PT said they can't make it, so the slot must not be offered to other
  // clients. The PT can edit (which re-opens it) or delete it later.
  await releaseSlot(booking.availabilitySlot, 'unavailable_by_pt');

  await notifySafely(
    {
      recipient: booking.client,
      sender: pt._id,
      type: 'booking_cancelled_by_pt',
      message: withReason(`${pt.username} cancelled your session`, reason),
      relatedBooking: booking._id,
    },
    log,
  );
  return booking;
};

const completeBooking = async ({pt, bookingId, log = logger}) => {
  const now = new Date();
  const booking = await applyTransition({
    bookingId,
    actorField: 'pt',
    actorId: pt._id,
    from: ['confirmed'],
    filter: {'bookingTime.endTime': {$lte: now}},
    update: {status: 'completed'},
    messages: {
      ...ptMessages('complete'),
      status: status =>
        `Only confirmed bookings can be marked as completed. Current status: "${status}".`,
    },
    check: current =>
      current.bookingTime.endTime > now
        ? 'Cannot mark session as completed before it ends.'
        : null,
  });

  await finishCompletion(booking, {pt, log});
  return booking;
};

// --- Background jobs (see bookingMaintenance.js) ---------------------------
// Each job claims a booking with a conditional update before acting on it, so
// running several API instances at once is safe.

// A request the PT never answered before the session started can no longer
// happen: reject it on the PT's behalf, give the slot back (it would otherwise
// stay "booked" forever) and tell the client.
const expireStaleBookings = async (now = new Date()) => {
  const stale = await Booking.find({
    status: 'pending_confirmation',
    'bookingTime.startTime': {$lte: now},
  })
    .select('_id client pt availabilitySlot')
    .lean();

  let expired = 0;
  for (const booking of stale) {
    const result = await Booking.updateOne(
      {_id: booking._id, status: 'pending_confirmation'},
      {status: 'rejected_by_system', cancelledAt: now},
    );
    if (result.modifiedCount === 0) {
      continue;
    }
    expired += 1;

    await releaseSlot(booking.availabilitySlot);
    await notifySafely({
      recipient: booking.client,
      senderType: 'System',
      type: 'booking_system_rejected',
      message: 'Your booking request expired because the trainer did not respond before the session started.',
      relatedBooking: booking._id,
    });
  }

  if (expired > 0) {
    logger.info({expired}, 'Expired stale booking requests');
  }
  return expired;
};

// Reminds both sides about confirmed sessions starting within
// REMINDER_LEAD_HOURS. Sessions confirmed later than that are reminded on the
// next run.
const sendBookingReminders = async (now = new Date()) => {
  const due = await Booking.find({
    status: 'confirmed',
    reminderSentAt: null,
    'bookingTime.startTime': {$gt: now, $lte: hoursFrom(now, REMINDER_LEAD_HOURS)},
  })
    .select('_id client pt bookingTime')
    .populate('client pt', 'username')
    .lean();

  let sent = 0;
  for (const booking of due) {
    const result = await Booking.updateOne(
      {_id: booking._id, status: 'confirmed', reminderSentAt: null},
      {reminderSentAt: now},
    );
    if (result.modifiedCount === 0) {
      continue;
    }
    sent += 1;

    const time = dayjs(booking.bookingTime.startTime).tz(APP_TIMEZONE).format('HH:mm DD/MM/YYYY');
    const common = {senderType: 'System', type: 'booking_reminder', relatedBooking: booking._id};
    // Populated users can be null if an account vanished; skip that side.
    if (booking.client) {
      await notifySafely({
        ...common,
        recipient: booking.client._id,
        message: `Reminder: your session with ${booking.pt?.username || 'your trainer'} starts at ${time}.`,
      });
    }
    if (booking.pt) {
      await notifySafely({
        ...common,
        recipient: booking.pt._id,
        message: `Reminder: your session with ${booking.client?.username || 'your client'} starts at ${time}.`,
      });
    }
  }

  if (sent > 0) {
    logger.info({sent}, 'Sent booking reminders');
  }
  return sent;
};

// Completes confirmed sessions the PT forgot to close, so the client can
// review them and the PT's session count stays right.
const autoCompleteBookings = async (now = new Date()) => {
  const overdue = await Booking.find({
    status: 'confirmed',
    'bookingTime.endTime': {$lte: hoursFrom(now, -AUTO_COMPLETE_AFTER_HOURS)},
  })
    .select('_id client pt')
    .lean();

  let completed = 0;
  for (const booking of overdue) {
    const result = await Booking.updateOne(
      {_id: booking._id, status: 'confirmed'},
      {status: 'completed'},
    );
    if (result.modifiedCount === 0) {
      continue;
    }
    completed += 1;
    await finishCompletion(booking);
  }

  if (completed > 0) {
    logger.info({completed}, 'Auto-completed past sessions');
  }
  return completed;
};

module.exports = {
  BOOKING_STATUSES,
  ACTIVE_BOOKING_STATUSES,
  createBooking,
  cancelByClient,
  confirmBooking,
  rejectBooking,
  cancelByPt,
  completeBooking,
  expireStaleBookings,
  sendBookingReminders,
  autoCompleteBookings,
};
