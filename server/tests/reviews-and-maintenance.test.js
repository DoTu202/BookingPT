const request = require('supertest');
const app = require('../src/app');
const Availability = require('../src/models/AvailabilityModel');
const Booking = require('../src/models/bookingModel');
const Notification = require('../src/models/NotificationModel');
const PTProfile = require('../src/models/PTProfileModel');
const {expireStaleBookings} = require('../src/services/bookingService');
const {startDb, clearDb, stopDb, createUser, createPtWithSlot} = require('./setup');

beforeAll(startDb);
afterEach(clearDb);
afterAll(stopDb);

const bookingFor = async ({pt, slot, client, status}) =>
  Booking.create({
    client: client.user._id,
    pt: pt.user._id,
    availabilitySlot: slot._id,
    bookingTime: {startTime: slot.startTime, endTime: slot.endTime},
    status,
    priceAtBooking: 200000,
  });

describe('stale booking expiry', () => {
  it('rejects unanswered requests whose session has started and frees the slot', async () => {
    const {pt, slot} = await createPtWithSlot({hoursFromNow: -1});
    const client = await createUser('client');
    await Availability.updateOne({_id: slot._id}, {status: 'booked'});
    const booking = await bookingFor({pt, slot, client, status: 'pending_confirmation'});

    expect(await expireStaleBookings()).toBe(1);

    expect((await Booking.findById(booking._id)).status).toBe('rejected_by_system');
    expect((await Availability.findById(slot._id)).status).toBe('available');
    expect(
      await Notification.countDocuments({
        recipient: client.user._id,
        type: 'booking_system_rejected',
      }),
    ).toBe(1);
  });

  it('leaves future and already-confirmed bookings alone', async () => {
    const future = await createPtWithSlot({hoursFromNow: 24});
    const past = await createPtWithSlot({hoursFromNow: -1});
    const client = await createUser('client');
    await bookingFor({...future, client, status: 'pending_confirmation'});
    await bookingFor({...past, client, status: 'confirmed'});

    expect(await expireStaleBookings()).toBe(0);
  });
});

describe('reviews', () => {
  const review = (auth, bookingId, body) =>
    request(app)
      .post(`/api/client/my-bookings/${bookingId}/review`)
      .set('Authorization', auth)
      .send(body);

  it('lets the client review a completed session and updates the PT rating', async () => {
    const {pt, slot} = await createPtWithSlot({hoursFromNow: -3});
    const client = await createUser('client');
    const booking = await bookingFor({pt, slot, client, status: 'completed'});

    const res = await review(client.auth, booking._id, {rating: 4, comment: 'Great session'});

    expect(res.status).toBe(201);
    const profile = await PTProfile.findOne({user: pt.user._id});
    expect(profile.rating).toBe(4);
    expect(profile.numReviews).toBe(1);
    expect(await Notification.countDocuments({type: 'new_review_on_pt_profile'})).toBe(1);

    const list = await request(app)
      .get(`/api/client/pt/${pt.user._id}/reviews`)
      .set('Authorization', client.auth);
    expect(list.body.data[0].comment).toBe('Great session');
    expect(list.body.data[0].client.email).toBeUndefined();

    const bookings = await request(app)
      .get('/api/client/my-bookings')
      .set('Authorization', client.auth);
    expect(bookings.body.data[0].reviewed).toBe(true);
  });

  it('rejects reviews of sessions that are not completed, not yours, duplicated or out of range', async () => {
    const {pt, slot} = await createPtWithSlot({hoursFromNow: 24});
    const client = await createUser('client');
    const other = await createUser('client');
    const confirmed = await bookingFor({pt, slot, client, status: 'confirmed'});
    const done = await bookingFor({pt, slot, client, status: 'completed'});

    expect((await review(client.auth, confirmed._id, {rating: 5})).status).toBe(400);
    expect((await review(other.auth, done._id, {rating: 5})).status).toBe(403);
    expect((await review(client.auth, done._id, {rating: 6})).status).toBe(400);
    expect((await review(client.auth, done._id, {rating: 2.5})).status).toBe(400);
    expect((await review(client.auth, done._id, {rating: 5})).status).toBe(201);
    expect((await review(client.auth, done._id, {rating: 1})).status).toBe(409);
  });

  it('averages several reviews to one decimal', async () => {
    const {pt, slot} = await createPtWithSlot({hoursFromNow: -3});
    for (const rating of [5, 4, 4]) {
      const client = await createUser('client');
      const booking = await bookingFor({pt, slot, client, status: 'completed'});
      await review(client.auth, booking._id, {rating});
    }
    const profile = await PTProfile.findOne({user: pt.user._id});
    expect(profile.rating).toBe(4.3);
    expect(profile.numReviews).toBe(3);

    const mine = await request(app).get('/api/pt/reviews').set('Authorization', pt.auth);
    expect(mine.body.count).toBe(3);
  });
});
