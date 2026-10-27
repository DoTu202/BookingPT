const request = require('supertest');
const app = require('../src/app');
const Availability = require('../src/models/AvailabilityModel');
const Booking = require('../src/models/bookingModel');
const Notification = require('../src/models/NotificationModel');
const PTProfile = require('../src/models/PTProfileModel');
const {
  sendBookingReminders,
  autoCompleteBookings,
} = require('../src/services/bookingService');
const {startDb, clearDb, stopDb, createUser, createPtWithSlot} = require('./setup');

beforeAll(startDb);
afterEach(clearDb);
afterAll(stopDb);

const HOUR = 3600 * 1000;

// A booking that already holds its slot, like one created through the API.
const bookingFor = async ({pt, slot, client, status}) => {
  await Availability.updateOne({_id: slot._id}, {status: 'booked'});
  return Booking.create({
    client: client.user._id,
    pt: pt.user._id,
    availabilitySlot: slot._id,
    bookingTime: {startTime: slot.startTime, endTime: slot.endTime},
    status,
    priceAtBooking: 200000,
  });
};

const setup = async ({hoursFromNow = 48, status = 'confirmed'} = {}) => {
  const {pt, slot} = await createPtWithSlot({hoursFromNow});
  const client = await createUser('client');
  const booking = await bookingFor({pt, slot, client, status});
  return {pt, slot, client, booking};
};

const ptAction = (auth, bookingId, action, body) =>
  request(app)
    .post(`/api/pt/bookings/${bookingId}/${action}`)
    .set('Authorization', auth)
    .send(body);

describe('PT cancels a confirmed session', () => {
  it('cancels with a reason, blocks the slot and tells the client why', async () => {
    const {pt, slot, client, booking} = await setup();

    const res = await ptAction(pt.auth, booking._id, 'cancel', {reason: 'I am sick'});

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled_by_pt');
    expect(res.body.data.cancellationReason).toBe('I am sick');
    expect(res.body.data.cancelledAt).toBeDefined();
    expect((await Availability.findById(slot._id)).status).toBe('unavailable_by_pt');
    const notification = await Notification.findOne({
      recipient: client.user._id,
      type: 'booking_cancelled_by_pt',
    });
    expect(notification.message).toContain('I am sick');
  });

  it('requires a reason', async () => {
    const {pt, booking} = await setup();
    const res = await ptAction(pt.auth, booking._id, 'cancel', {reason: '   '});
    expect(res.status).toBe(400);
    expect((await Booking.findById(booking._id)).status).toBe('confirmed');
  });

  it('rejects reasons that are too long or not text', async () => {
    const {pt, booking} = await setup();
    const long = await ptAction(pt.auth, booking._id, 'cancel', {reason: 'x'.repeat(501)});
    const object = await ptAction(pt.auth, booking._id, 'cancel', {reason: {$ne: null}});
    expect(long.status).toBe(400);
    expect(object.status).toBe(400);
  });

  it('only applies to confirmed sessions that have not started', async () => {
    const pending = await setup({status: 'pending_confirmation'});
    const started = await setup({hoursFromNow: -0.5});

    const pendingRes = await ptAction(pending.pt.auth, pending.booking._id, 'cancel', {
      reason: 'busy',
    });
    const startedRes = await ptAction(started.pt.auth, started.booking._id, 'cancel', {
      reason: 'busy',
    });

    expect(pendingRes.status).toBe(400);
    expect(pendingRes.body.message).toMatch(/Reject it instead/);
    expect(startedRes.status).toBe(400);
    expect(startedRes.body.message).toMatch(/already started/);
  });

  it("forbids cancelling another PT's booking", async () => {
    const {booking} = await setup();
    const otherPt = await createUser('pt');
    const res = await ptAction(otherPt.auth, booking._id, 'cancel', {reason: 'busy'});
    expect(res.status).toBe(403);
  });

  it('lets the PT re-open the blocked slot by moving it', async () => {
    const {pt, slot, booking} = await setup();
    await ptAction(pt.auth, booking._id, 'cancel', {reason: 'busy'});

    const start = new Date(Date.now() + 72 * HOUR);
    const res = await request(app)
      .put(`/api/pt/availability/${slot._id}`)
      .set('Authorization', pt.auth)
      .send({startTime: start.toISOString(), endTime: new Date(start.getTime() + HOUR).toISOString()});

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('available');
  });
});

describe('optional reasons for rejecting and cancelling', () => {
  it('stores the reason a PT rejects a request with', async () => {
    const {pt, client, booking} = await setup({status: 'pending_confirmation'});

    const res = await ptAction(pt.auth, booking._id, 'reject', {reason: 'Fully booked'});

    expect(res.status).toBe(200);
    expect(res.body.data.cancellationReason).toBe('Fully booked');
    const notification = await Notification.findOne({recipient: client.user._id});
    expect(notification.message).toContain('Fully booked');
  });

  it('stores the reason a client cancels with, and still works without one', async () => {
    const first = await setup({status: 'pending_confirmation'});
    const second = await setup({status: 'pending_confirmation'});

    const withReason = await request(app)
      .post(`/api/client/my-bookings/${first.booking._id}/cancel`)
      .set('Authorization', first.client.auth)
      .send({reason: 'Travelling'});
    const withoutBody = await request(app)
      .post(`/api/client/my-bookings/${second.booking._id}/cancel`)
      .set('Authorization', second.client.auth);

    expect(withReason.status).toBe(200);
    expect(withReason.body.data.cancellationReason).toBe('Travelling');
    expect(withoutBody.status).toBe(200);
    expect(withoutBody.body.data.cancellationReason).toBe('');
    expect((await Availability.findById(first.slot._id)).status).toBe('available');
  });
});

describe('concurrent transitions', () => {
  it('lets only one of "PT confirms" and "client cancels" win, keeping the slot consistent', async () => {
    // Inside the 24h notice window a client may cancel a pending request but
    // not a confirmed session, so the two requests genuinely conflict.
    const {pt, slot, client, booking} = await setup({
      hoursFromNow: 5,
      status: 'pending_confirmation',
    });

    const [confirm, cancel] = await Promise.all([
      ptAction(pt.auth, booking._id, 'confirm'),
      request(app)
        .post(`/api/client/my-bookings/${booking._id}/cancel`)
        .set('Authorization', client.auth),
    ]);

    expect([confirm.status, cancel.status].filter(s => s === 200)).toHaveLength(1);
    const final = await Booking.findById(booking._id);
    const slotStatus = (await Availability.findById(slot._id)).status;
    if (final.status === 'confirmed') {
      expect(slotStatus).toBe('booked');
    } else {
      expect(final.status).toBe('cancelled_by_client');
      expect(slotStatus).toBe('available');
    }
  });
});

describe('session reminders', () => {
  it('reminds the client and the PT once, within 24 hours of the session', async () => {
    const {pt, client, booking} = await setup({hoursFromNow: 5});

    expect(await sendBookingReminders()).toBe(1);
    expect(await sendBookingReminders()).toBe(0);

    const reminders = await Notification.find({type: 'booking_reminder'});
    expect(reminders.map(n => n.recipient.toString()).sort()).toEqual(
      [client.user._id.toString(), pt.user._id.toString()].sort(),
    );
    expect(reminders.every(n => n.senderType === 'System')).toBe(true);
    expect((await Booking.findById(booking._id)).reminderSentAt).toBeDefined();
  });

  it('skips sessions further out, pending requests and past sessions', async () => {
    await setup({hoursFromNow: 48});
    await setup({hoursFromNow: 5, status: 'pending_confirmation'});
    await setup({hoursFromNow: -2});

    expect(await sendBookingReminders()).toBe(0);
    expect(await Notification.countDocuments()).toBe(0);
  });
});

describe('automatic completion', () => {
  it('completes sessions that ended 12+ hours ago so the client can review', async () => {
    const {pt, client, booking} = await setup({hoursFromNow: -14});

    expect(await autoCompleteBookings()).toBe(1);

    expect((await Booking.findById(booking._id)).status).toBe('completed');
    expect((await PTProfile.findOne({user: pt.user._id})).totalSessions).toBe(1);
    expect(
      await Notification.countDocuments({
        recipient: client.user._id,
        type: 'booking_completed_client',
      }),
    ).toBe(1);

    const review = await request(app)
      .post(`/api/client/my-bookings/${booking._id}/review`)
      .set('Authorization', client.auth)
      .send({rating: 5});
    expect(review.status).toBe(201);
  });

  it('leaves recent and unconfirmed sessions alone', async () => {
    const recent = await setup({hoursFromNow: -3});
    const pending = await setup({hoursFromNow: -14, status: 'pending_confirmation'});

    expect(await autoCompleteBookings()).toBe(0);
    expect((await Booking.findById(recent.booking._id)).status).toBe('confirmed');
    expect((await Booking.findById(pending.booking._id)).status).toBe('pending_confirmation');
  });
});

describe('client booking history', () => {
  it('lists cancelled future bookings under history, not upcoming', async () => {
    const {client, booking} = await setup({status: 'pending_confirmation'});
    await request(app)
      .post(`/api/client/my-bookings/${booking._id}/cancel`)
      .set('Authorization', client.auth)
      .expect(200);

    const upcoming = await request(app)
      .get('/api/client/my-bookings?upcoming=true')
      .set('Authorization', client.auth);
    const history = await request(app)
      .get('/api/client/my-bookings?upcoming=false')
      .set('Authorization', client.auth);

    expect(upcoming.body.count).toBe(0);
    expect(history.body.count).toBe(1);
    expect(history.body.data[0].status).toBe('cancelled_by_client');
  });
});
