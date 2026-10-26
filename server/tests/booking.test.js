const request = require('supertest');
const app = require('../src/app');
const Availability = require('../src/models/AvailabilityModel');
const Booking = require('../src/models/bookingModel');
const Notification = require('../src/models/NotificationModel');
const {startDb, clearDb, stopDb, createUser, createPtWithSlot} = require('./setup');

beforeAll(startDb);
afterEach(clearDb);
afterAll(stopDb);

const book = (auth, pt, slot) =>
  request(app)
    .post('/api/client/bookings')
    .set('Authorization', auth)
    .send({ptId: pt.user._id.toString(), availabilitySlotId: slot._id.toString()});

describe('booking lifecycle', () => {
  it('reserves the slot and notifies the PT when a booking is created', async () => {
    const {pt, slot} = await createPtWithSlot();
    const client = await createUser('client');

    const res = await book(client.auth, pt, slot);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending_confirmation');
    expect((await Availability.findById(slot._id)).status).toBe('booked');
    expect(await Notification.countDocuments({recipient: pt.user._id})).toBe(1);
  });

  it('lets only one of many concurrent requests book the same slot', async () => {
    const {pt, slot} = await createPtWithSlot();
    const clients = await Promise.all([1, 2, 3, 4, 5].map(() => createUser('client')));

    const results = await Promise.all(clients.map(c => book(c.auth, pt, slot)));

    expect(results.filter(r => r.status === 201)).toHaveLength(1);
    expect(results.filter(r => r.status === 409)).toHaveLength(4);
    expect(await Booking.countDocuments()).toBe(1);
  });

  it('frees the slot when the PT rejects', async () => {
    const {pt, slot} = await createPtWithSlot();
    const client = await createUser('client');
    const {body} = await book(client.auth, pt, slot);

    const res = await request(app)
      .post(`/api/pt/bookings/${body.data._id}/reject`)
      .set('Authorization', pt.auth);

    expect(res.status).toBe(200);
    expect((await Availability.findById(slot._id)).status).toBe('available');
  });

  it('frees the slot when the client cancels', async () => {
    const {pt, slot} = await createPtWithSlot();
    const client = await createUser('client');
    const {body} = await book(client.auth, pt, slot);

    const res = await request(app)
      .post(`/api/client/my-bookings/${body.data._id}/cancel`)
      .set('Authorization', client.auth);

    expect(res.status).toBe(200);
    expect((await Availability.findById(slot._id)).status).toBe('available');
    expect(await Notification.countDocuments({type: 'booking_cancelled_by_client'})).toBe(1);
  });

  it('blocks cancelling a confirmed booking less than 24h before it starts', async () => {
    const {pt, slot} = await createPtWithSlot({hoursFromNow: 5});
    const client = await createUser('client');
    const {body} = await book(client.auth, pt, slot);
    await request(app)
      .post(`/api/pt/bookings/${body.data._id}/confirm`)
      .set('Authorization', pt.auth);

    const res = await request(app)
      .post(`/api/client/my-bookings/${body.data._id}/cancel`)
      .set('Authorization', client.auth);
    expect(res.status).toBe(400);
  });

  it('does not let another PT or client act on a booking', async () => {
    const {pt, slot} = await createPtWithSlot();
    const client = await createUser('client');
    const otherPt = await createUser('pt');
    const otherClient = await createUser('client');
    const {body} = await book(client.auth, pt, slot);

    const confirm = await request(app)
      .post(`/api/pt/bookings/${body.data._id}/confirm`)
      .set('Authorization', otherPt.auth);
    const cancel = await request(app)
      .post(`/api/client/my-bookings/${body.data._id}/cancel`)
      .set('Authorization', otherClient.auth);

    expect(confirm.status).toBe(403);
    expect(cancel.status).toBe(403);
  });

  it('returns 400 (not 500) for malformed ids', async () => {
    const pt = await createUser('pt');
    const res = await request(app)
      .post('/api/pt/bookings/not-an-id/confirm')
      .set('Authorization', pt.auth);
    expect(res.status).toBe(400);
  });
});

describe('PT availability', () => {
  it('refuses to delete or move a booked slot', async () => {
    const {pt, slot} = await createPtWithSlot();
    const client = await createUser('client');
    await book(client.auth, pt, slot);

    const del = await request(app)
      .delete(`/api/pt/availability/${slot._id}`)
      .set('Authorization', pt.auth);
    const move = await request(app)
      .put(`/api/pt/availability/${slot._id}`)
      .set('Authorization', pt.auth)
      .send({
        startTime: new Date(Date.now() + 72 * 3600e3).toISOString(),
        endTime: new Date(Date.now() + 73 * 3600e3).toISOString(),
      });

    expect(del.status).toBe(400);
    expect(move.status).toBe(400);
    expect(await Availability.exists({_id: slot._id})).toBeTruthy();
  });

  it('rejects overlapping and zero-length slots', async () => {
    const {pt, slot} = await createPtWithSlot();
    const add = body =>
      request(app).post('/api/pt/availability').set('Authorization', pt.auth).send(body);

    const overlap = await add({
      startTime: new Date(slot.startTime.getTime() + 30 * 60e3).toISOString(),
      endTime: new Date(slot.endTime.getTime() + 30 * 60e3).toISOString(),
    });
    const zero = await add({
      startTime: new Date(Date.now() + 100 * 3600e3).toISOString(),
      endTime: new Date(Date.now() + 100 * 3600e3).toISOString(),
    });

    expect(overlap.status).toBe(400);
    expect(zero.status).toBe(400);
  });

  it('filters slots by a calendar day in Vietnam time', async () => {
    const pt = await createUser('pt');
    // 2030-01-01 23:30 in Vietnam is 2030-01-01 16:30 UTC.
    await Availability.create({
      pt: pt.user._id,
      startTime: new Date('2030-01-01T16:30:00Z'),
      endTime: new Date('2030-01-01T17:30:00Z'),
    });

    const sameDay = await request(app)
      .get('/api/pt/availability?date=2030-01-01')
      .set('Authorization', pt.auth);
    const nextDay = await request(app)
      .get('/api/pt/availability?date=2030-01-02')
      .set('Authorization', pt.auth);

    expect(sameDay.body.data).toHaveLength(1);
    expect(nextDay.body.data).toHaveLength(0);
  });
});
