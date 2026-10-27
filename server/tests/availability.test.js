const request = require('supertest');
const app = require('../src/app');
const Availability = require('../src/models/AvailabilityModel');
const {dayjs, APP_TIMEZONE} = require('../src/utils/helpers');
const {startDb, clearDb, stopDb, createUser} = require('./setup');

beforeAll(startDb);
afterEach(clearDb);
afterAll(stopDb);

const day = offset => dayjs().tz(APP_TIMEZONE).add(offset, 'day');
const slotOn = (pt, offset, hour) => {
  const start = day(offset).hour(hour).minute(0).second(0).millisecond(0);
  return Availability.create({
    pt: pt.user._id,
    startTime: start.toDate(),
    endTime: start.add(1, 'hour').toDate(),
  });
};

describe('GET /api/pt/availability', () => {
  it('lists the slots of a range of days', async () => {
    const pt = await createUser('pt');
    const other = await createUser('pt');
    await slotOn(pt, 1, 8);
    await slotOn(pt, 3, 8);
    await slotOn(pt, 10, 8);
    await slotOn(other, 2, 8);

    const res = await request(app)
      .get('/api/pt/availability')
      .query({from: day(0).format('YYYY-MM-DD'), to: day(5).format('YYYY-MM-DD')})
      .set('Authorization', pt.auth)
      .expect(200);
    expect(res.body.data).toHaveLength(2);

    // `date` (one day) keeps working.
    const one = await request(app)
      .get('/api/pt/availability')
      .query({date: day(3).format('YYYY-MM-DD')})
      .set('Authorization', pt.auth)
      .expect(200);
    expect(one.body.data).toHaveLength(1);
  });

  it('rejects incomplete, reversed or too long ranges', async () => {
    const pt = await createUser('pt');
    const get = query =>
      request(app).get('/api/pt/availability').query(query).set('Authorization', pt.auth);
    const key = offset => day(offset).format('YYYY-MM-DD');

    await get({from: key(0)}).expect(400);
    await get({from: key(5), to: key(0)}).expect(400);
    await get({from: key(0), to: key(90)}).expect(400);
    await get({from: 'nope', to: key(1)}).expect(400);
  });
});

describe('date filters', () => {
  it('answers 400 (not 500) to an unparseable date', async () => {
    const pt = await createUser('pt');
    await request(app)
      .get('/api/pt/availability?date=nope')
      .set('Authorization', pt.auth)
      .expect(400);
    await request(app).get('/api/pt/bookings?date=nope').set('Authorization', pt.auth).expect(400);
  });
});
