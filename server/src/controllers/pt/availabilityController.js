const Availability = require('../../models/AvailabilityModel');
const asyncHandler = require('express-async-handler');
const {dayjs, dayRange, assertValidId} = require('../../utils/helpers');
const {badRequest, notFound} = require('../../utils/httpError');

const MAX_SLOT_HOURS = 12;
const MAX_RANGE_DAYS = 62;

// Validates a start/end pair sent as ISO 8601 strings and returns Dates.
const parseSlotTimes = (startTime, endTime) => {
  if (!startTime || !endTime) {
    throw badRequest('startTime and endTime are required as UTC ISO strings');
  }

  const start = dayjs(startTime);
  const end = dayjs(endTime);
  if (!start.isValid() || !end.isValid()) {
    throw badRequest('Invalid ISO 8601 format for startTime or endTime');
  }
  if (!end.isAfter(start)) {
    throw badRequest('End time must be after start time');
  }
  if (end.diff(start, 'hour', true) > MAX_SLOT_HOURS) {
    throw badRequest(`A slot cannot be longer than ${MAX_SLOT_HOURS} hours`);
  }
  if (start.isBefore(dayjs())) {
    throw badRequest('Start time must be in the future');
  }
  return {start: start.toDate(), end: end.toDate()};
};

// Two intervals overlap when each starts before the other ends.
const findOverlap = (ptId, start, end, excludeId) =>
  Availability.findOne({
    pt: ptId,
    ...(excludeId ? {_id: {$ne: excludeId}} : {}),
    startTime: {$lt: end},
    endTime: {$gt: start},
  });

const addAvailability = asyncHandler(async (req, res) => {
  const ptId = req.user._id;
  const {start, end} = parseSlotTimes(req.body.startTime, req.body.endTime);

  if (await findOverlap(ptId, start, end)) {
    throw badRequest('This time slot overlaps with an existing one');
  }

  const newAvailability = await Availability.create({
    pt: ptId,
    startTime: start,
    endTime: end,
  });

  res.status(201).json({
    success: true,
    data: newAvailability,
  });
});

const updateAvailability = asyncHandler(async (req, res) => {
  const {availabilityId} = req.params;
  const ptId = req.user._id;
  assertValidId(availabilityId, 'availability id');

  const availability = await Availability.findOne({_id: availabilityId, pt: ptId});
  if (!availability) {
    throw notFound('Availability slot not found');
  }
  // A booked slot is referenced by a booking that copied its times; moving it
  // would silently desynchronise the two.
  if (availability.status === 'booked') {
    throw badRequest('Cannot change a slot that already has a booking');
  }

  const {start, end} = parseSlotTimes(req.body.startTime, req.body.endTime);

  if (await findOverlap(ptId, start, end, availabilityId)) {
    throw badRequest('Updated time slot overlaps with an existing one');
  }

  availability.startTime = start;
  availability.endTime = end;
  // Moving a slot blocked by a PT cancellation re-opens it for booking.
  if (availability.status === 'unavailable_by_pt') {
    availability.status = 'available';
  }
  await availability.save();

  res.status(200).json({
    success: true,
    data: availability,
  });
});

const getAvailabilitySlots = asyncHandler(async (req, res) => {
  const query = {pt: req.user._id};

  const {date, from, to} = req.query;
  if (date) {
    const range = dayRange(date);
    if (!range) {
      throw badRequest('date is not a valid date');
    }
    query.startTime = {$gte: range.start, $lte: range.end};
  } else if (from || to) {
    // Several days at once (the app marks which days have slots).
    const first = dayRange(from);
    const last = dayRange(to);
    if (!first || !last || last.end < first.start) {
      throw badRequest('from and to must be valid dates, from not after to');
    }
    if (last.end - first.start > MAX_RANGE_DAYS * 24 * 3600 * 1000) {
      throw badRequest(`The range cannot be longer than ${MAX_RANGE_DAYS} days`);
    }
    query.startTime = {$gte: first.start, $lte: last.end};
  }

  const availabilitySlots = await Availability.find(query)
    .sort({startTime: 1})
    .limit(500);

  res.status(200).json({
    success: true,
    data: availabilitySlots,
  });
});

const deleteAvailabilitySlot = asyncHandler(async (req, res) => {
  const {availabilityId} = req.params;
  assertValidId(availabilityId, 'availability id');

  const availability = await Availability.findOne({
    _id: availabilityId,
    pt: req.user._id,
  });

  if (!availability) {
    throw notFound('Availability slot not found');
  }

  if (availability.status === 'booked') {
    throw badRequest('Cannot delete a booked time slot');
  }

  await availability.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Availability slot deleted successfully',
  });
});

module.exports = {
  addAvailability,
  updateAvailability,
  getAvailabilitySlots,
  deleteAvailabilitySlot,
};
