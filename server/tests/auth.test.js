const request = require('supertest');
const bcrypt = require('bcrypt');

// Capture emailed codes instead of sending mail.
const sentCodes = {};
jest.mock('../src/services/mailService', () => ({
  sendOtpMail: jest.fn(async (to, code, purpose) => {
    sentCodes[`${purpose}:${to}`] = code;
  }),
}));

const app = require('../src/app');
const User = require('../src/models/userModel');
const Otp = require('../src/models/OtpModel');
const {startDb, clearDb, stopDb, createUser} = require('./setup');

beforeAll(startDb);
afterEach(async () => {
  await clearDb();
  Object.keys(sentCodes).forEach(key => delete sentCodes[key]);
});
afterAll(stopDb);

const newUser = {
  username: 'alice',
  email: 'Alice@Example.com',
  password: 'correct-horse',
  phoneNumber: '0912345678',
  dob: '1998-05-20',
  role: 'client',
};

const wrongCode = code => String((Number(code) + 1) % 10000).padStart(4, '0');

describe('sign up with email verification', () => {
  it('never returns the verification code to the client', async () => {
    const res = await request(app).post('/auth/verification').send({email: newUser.email});

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/\d{4}/);
    expect(sentCodes['register:alice@example.com']).toMatch(/^\d{4}$/);
  });

  it('rejects registration without the emailed code', async () => {
    await request(app).post('/auth/verification').send({email: newUser.email});
    const code = sentCodes['register:alice@example.com'];

    const missing = await request(app).post('/auth/register').send(newUser);
    expect(missing.status).toBe(400);

    const wrong = await request(app)
      .post('/auth/register')
      .send({...newUser, code: wrongCode(code)});
    expect(wrong.status).toBe(400);
    expect(await User.countDocuments()).toBe(0);
  });

  it('registers with the correct code and stores a bcrypt hash', async () => {
    await request(app).post('/auth/verification').send({email: newUser.email});
    const code = sentCodes['register:alice@example.com'];

    const res = await request(app).post('/auth/register').send({...newUser, code});

    expect(res.status).toBe(201);
    expect(res.body.data.accesstoken).toBeDefined();
    expect(res.body.data.email).toBe('alice@example.com');
    const stored = await User.findOne({email: 'alice@example.com'}).select('+password');
    expect(await bcrypt.compare(newUser.password, stored.password)).toBe(true);
  });

  it('invalidates the code after too many wrong attempts', async () => {
    await request(app).post('/auth/verification').send({email: newUser.email});
    const code = sentCodes['register:alice@example.com'];

    for (let i = 0; i < 5; i++) {
      await request(app).post('/auth/register').send({...newUser, code: wrongCode(code)});
    }
    const res = await request(app).post('/auth/register').send({...newUser, code});

    expect(res.status).toBe(400);
    expect(await Otp.countDocuments()).toBe(0);
  });

  it('does not allow self-registering with an unknown role', async () => {
    await request(app).post('/auth/verification').send({email: newUser.email});
    const code = sentCodes['register:alice@example.com'];

    const res = await request(app)
      .post('/auth/register')
      .send({...newUser, code, role: 'admin'});
    expect(res.status).toBe(400);
  });
});

describe('login', () => {
  beforeEach(async () => {
    await createUser('client', {
      email: 'bob@example.com',
      passwordHash: await bcrypt.hash('bob-password', 4),
    });
  });

  it('returns a token for valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({email: 'BOB@example.com', password: 'bob-password'});
    expect(res.status).toBe(200);
    expect(res.body.data.accesstoken).toBeDefined();
    expect(res.body.data.password).toBeUndefined();
  });

  it('uses the same message for unknown email and wrong password', async () => {
    const unknown = await request(app)
      .post('/auth/login')
      .send({email: 'nobody@example.com', password: 'x'});
    const wrong = await request(app)
      .post('/auth/login')
      .send({email: 'bob@example.com', password: 'wrong'});

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it('is not vulnerable to NoSQL operator injection', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({email: {$ne: null}, password: {$ne: null}});
    expect(res.status).toBe(400);
    expect(res.body.data).toBeUndefined();
  });
});

describe('password reset', () => {
  let auth;
  beforeEach(async () => {
    ({auth} = await createUser('client', {
      email: 'carol@example.com',
      passwordHash: await bcrypt.hash('old-password', 4),
    }));
  });

  it('answers identically for known and unknown emails and does not change the password', async () => {
    const known = await request(app)
      .post('/auth/forgotPassword')
      .send({email: 'carol@example.com'});
    const unknown = await request(app)
      .post('/auth/forgotPassword')
      .send({email: 'ghost@example.com'});

    expect(known.status).toBe(200);
    expect(unknown.body).toEqual(known.body);
    const login = await request(app)
      .post('/auth/login')
      .send({email: 'carol@example.com', password: 'old-password'});
    expect(login.status).toBe(200);
  });

  it('resets the password with the emailed code and revokes old tokens', async () => {
    await request(app).post('/auth/forgotPassword').send({email: 'carol@example.com'});
    const code = sentCodes['reset_password:carol@example.com'];

    // Make sure the old token's iat is strictly before passwordChangedAt.
    await new Promise(resolve => setTimeout(resolve, 1100));
    const res = await request(app)
      .post('/auth/resetPassword')
      .send({email: 'carol@example.com', code, newPassword: 'brand-new-password'});
    expect(res.status).toBe(200);

    const login = await request(app)
      .post('/auth/login')
      .send({email: 'carol@example.com', password: 'brand-new-password'});
    expect(login.status).toBe(200);

    const oldToken = await request(app).get('/api/profile/profile').set('Authorization', auth);
    expect(oldToken.status).toBe(401);
  });
});

describe('authentication middleware', () => {
  it('rejects missing, malformed and forged tokens', async () => {
    const jwt = require('jsonwebtoken');
    const {user} = await createUser('client');
    const forged = jwt.sign({id: user._id.toString(), role: 'pt'}, 'attacker-secret');

    for (const header of [undefined, 'Bearer', 'Basic abc', `Bearer ${forged}`]) {
      const req = request(app).get('/api/profile/profile');
      if (header) req.set('Authorization', header);
      const res = await req;
      expect(res.status).toBe(401);
    }
  });

  it('enforces roles', async () => {
    const {auth} = await createUser('client');
    const res = await request(app).get('/api/pt/bookings').set('Authorization', auth);
    expect(res.status).toBe(403);
  });
});
