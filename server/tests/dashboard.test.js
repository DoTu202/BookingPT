const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const Availability = require('../src/models/AvailabilityModel');
const Booking = require('../src/models/bookingModel');
const PTProfile = require('../src/models/PTProfileModel');
const Review = require('../src/models/ReviewModel');
const {getPtDashboard} = require('../src/services/dashboardService');
const {startDb, clearDb, stopDb, createUser} = require('./setup');

beforeAll(startDb);
afterEach(clearDb);
afterAll(stopDb);

// Thursday 15/10/2026 10:00 in Vietnam: the week is Mon 12 - Sun 18 Oct.
const NOW = new Date('2026-10-15T10:00:00+07:00');
const vn = local => new Date(`${local}+07:00`);
const HOUR = 3600 * 1000;

const booking = (pt, client, start, status, price) =>
  Booking.create({
    pt: pt.user._id,
    client: client.user._id,
    availabilitySlot: new mongoose.Types.ObjectId(),
    bookingTime: {startTime: vn(start), endTime: new Date(vn(start).getTime() + HOUR)},
    status,
    priceAtBooking: price,
  });

const slot = (pt, start, status) =>
  Availability.create({
    pt: pt.user._id,
    startTime: vn(start),
    endTime: new Date(vn(start).getTime() + HOUR),
    status,
  });

const seed = async () => {
  const pt = await createUser('pt');
  const otherPt = await createUser('pt');
  await PTProfile.create({user: pt.user._id, hourlyRate: 300000, rating: 5, numReviews: 1});
  const [a, b, c, d, e] = await Promise.all([1, 2, 3, 4, 5].map(() => createUser('client')));

  const first = await booking(pt, a, '2026-10-01T09:00:00', 'completed', 200000); // this month
  await booking(pt, a, '2026-10-06T09:00:00', 'completed', 100000); // previous week
  await booking(pt, a, '2026-10-13T09:00:00', 'completed', 300000);
  // 00:30 Monday in Vietnam is still Sunday in UTC: must count in this week.
  await booking(pt, d, '2026-10-12T00:30:00', 'completed', 150000);
  await booking(pt, b, '2026-10-16T18:00:00', 'confirmed', 250000);
  await booking(pt, b, '2026-10-14T18:00:00', 'cancelled_by_client', 250000);
  await booking(pt, c, '2026-10-14T07:00:00', 'rejected_by_pt', 250000);
  await booking(pt, e, '2026-11-20T07:00:00', 'pending_confirmation', 250000);
  await booking(otherPt, a, '2026-10-13T10:00:00', 'completed', 999000);

  await slot(pt, '2026-10-13T09:00:00', 'booked');
  await slot(pt, '2026-10-16T18:00:00', 'booked');
  await slot(pt, '2026-10-17T08:00:00', 'available');
  await slot(pt, '2026-10-18T08:00:00', 'unavailable_by_pt');

  const review = await Review.create({booking: first._id, client: a.user._id, pt: pt.user._id, rating: 5});
  // Written during the test week (raw update: Mongoose keeps createdAt immutable).
  await Review.collection.updateOne({_id: review._id}, {$set: {createdAt: vn('2026-10-14T12:00:00')}});
  return {pt, a, d};
};

describe('PT dashboard', () => {
  it('summarizes the current week in Vietnam time', async () => {
    const {pt, a, d} = await seed();
    const data = await getPtDashboard(pt.user._id, {period: 'week', now: NOW});

    expect(data.range.start).toEqual(vn('2026-10-12T00:00:00'));
    expect(data.range.end).toEqual(vn('2026-10-19T00:00:00'));
    expect(data.earnings).toEqual({total: 450000, previous: 100000, expected: 250000});
    expect(data.sessions).toEqual({completed: 2, previous: 1, upcoming: 1, hours: 2});
    expect(data.status).toMatchObject({
      completed: 2,
      confirmed: 1,
      cancelled_by_client: 1,
      rejected_by_pt: 1,
      pending_confirmation: 0,
    });
    expect(data.completionRate).toBeCloseTo(2 / 3, 2);
    expect(data.cancellationRate).toBe(0.25);
    // a's first session was earlier; b (confirmed) and d are new.
    expect(data.clients).toEqual({active: 3, new: 2});
    expect(data.slots).toEqual({total: 4, booked: 2, available: 1, fillRate: 0.667});

    expect(data.series.map(row => row.key)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ]);
    expect(data.series[0]).toEqual({key: '2026-10-12', earnings: 150000, sessions: 1});
    expect(data.series[1]).toEqual({key: '2026-10-13', earnings: 300000, sessions: 1});
    expect(data.weekdays).toEqual([1, 1, 0, 0, 1, 0, 0]);

    expect(data.topClients.map(row => [String(row._id), row.sessions, row.earnings])).toEqual([
      [String(a.user._id), 1, 300000],
      [String(d.user._id), 1, 150000],
    ]);
    expect(data.topClients[0].username).toBe(a.user.username);
    expect(data.rating).toEqual({
      average: 5,
      count: 1,
      inPeriod: {count: 1, average: 5},
      distribution: {5: 1, 4: 0, 3: 0, 2: 0, 1: 0},
    });
    expect(data.attention).toEqual({pending: 1, toComplete: 0});
  });

  it('supports month / year buckets and going back with offset', async () => {
    const {pt} = await seed();

    const month = await getPtDashboard(pt.user._id, {period: 'month', now: NOW});
    expect(month.series).toHaveLength(31);
    expect(month.earnings.total).toBe(750000);
    expect(month.sessions.completed).toBe(4);

    const year = await getPtDashboard(pt.user._id, {period: 'year', now: NOW});
    expect(year.series).toHaveLength(12);
    expect(year.series[9]).toEqual({key: '2026-10', earnings: 750000, sessions: 4});

    const lastWeek = await getPtDashboard(pt.user._id, {period: 'week', offset: 1, now: NOW});
    expect(lastWeek.range.start).toEqual(vn('2026-10-05T00:00:00'));
    expect(lastWeek.earnings.total).toBe(100000);
    expect(lastWeek.completionRate).toBe(1);
  });

  it('returns empty stats for a new PT', async () => {
    const pt = await createUser('pt');
    const res = await request(app)
      .get('/api/pt/dashboard?period=week')
      .set('Authorization', pt.auth)
      .expect(200);
    const {data} = res.body;
    expect(data.earnings).toEqual({total: 0, previous: 0, expected: 0});
    expect(data.completionRate).toBeNull();
    expect(data.slots.fillRate).toBeNull();
    expect(data.series).toHaveLength(7);
    expect(data.topClients).toEqual([]);
  });

  it('validates the query and is PT-only', async () => {
    const pt = await createUser('pt');
    const client = await createUser('client');
    const get = (query, user = pt) =>
      request(app).get(`/api/pt/dashboard${query}`).set('Authorization', user.auth);

    await get('?period=day').expect(400);
    await get('?period=week&period=month').expect(400);
    await get('?offset=-1').expect(400);
    await get('?offset=1.5').expect(400);
    await get('?offset=61').expect(400);
    await get('', client).expect(403);
    await get('?offset=3').expect(200);
  });
});
