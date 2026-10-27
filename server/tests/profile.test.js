const fs = require('fs');
const path = require('path');
const request = require('supertest');

const sentCodes = {};
jest.mock('../src/services/mailService', () => ({
  sendOtpMail: jest.fn(async (to, code, purpose) => {
    sentCodes[`${purpose}:${to}`] = code;
  }),
}));

const app = require('../src/app');
const User = require('../src/models/userModel');
const {PROFILE_DIR} = require('../src/middleware/uploadMiddleware');
const {startDb, clearDb, stopDb, createUser} = require('./setup');

beforeAll(startDb);
afterEach(async () => {
  await clearDb();
  Object.keys(sentCodes).forEach(key => delete sentCodes[key]);
});
afterAll(stopDb);

describe('email change', () => {
  it('cannot be done through the plain profile update', async () => {
    const {auth} = await createUser('client');
    const res = await request(app)
      .put('/api/profile/profile')
      .set('Authorization', auth)
      .send({email: 'new@example.com'});
    expect(res.status).toBe(400);
  });

  it('requires the code sent to the new address', async () => {
    const {user, auth} = await createUser('client');
    await request(app)
      .post('/api/profile/email/request')
      .set('Authorization', auth)
      .send({newEmail: 'New@Example.com'})
      .expect(200);
    const code = sentCodes['change_email:new@example.com'];
    expect(code).toMatch(/^\d{4}$/);

    const wrong = await request(app)
      .post('/api/profile/email/confirm')
      .set('Authorization', auth)
      .send({newEmail: 'new@example.com', code: code === '0000' ? '0001' : '0000'});
    expect(wrong.status).toBe(400);

    const ok = await request(app)
      .post('/api/profile/email/confirm')
      .set('Authorization', auth)
      .send({newEmail: 'new@example.com', code});
    expect(ok.status).toBe(200);
    expect((await User.findById(user._id)).email).toBe('new@example.com');
  });

  it('does not let another user redeem someone else\'s code', async () => {
    const alice = await createUser('client');
    const mallory = await createUser('client');
    await request(app)
      .post('/api/profile/email/request')
      .set('Authorization', alice.auth)
      .send({newEmail: 'shared@example.com'});
    const code = sentCodes['change_email:shared@example.com'];

    const res = await request(app)
      .post('/api/profile/email/confirm')
      .set('Authorization', mallory.auth)
      .send({newEmail: 'shared@example.com', code});

    expect(res.status).toBe(400);
    expect((await User.findById(mallory.user._id)).email).not.toBe('shared@example.com');
  });

  it('refuses an address that is already taken', async () => {
    const {auth} = await createUser('client');
    const other = await createUser('client');
    const res = await request(app)
      .post('/api/profile/email/request')
      .set('Authorization', auth)
      .send({newEmail: other.user.email});
    expect(res.status).toBe(400);
  });
});

describe('sign out of all devices', () => {
  it('revokes every token issued before it', async () => {
    const {auth} = await createUser('client');
    await new Promise(resolve => setTimeout(resolve, 1100));

    await request(app).post('/api/profile/logout-all').set('Authorization', auth).expect(200);

    const res = await request(app).get('/api/profile/profile').set('Authorization', auth);
    expect(res.status).toBe(401);
  });
});

describe('profile photo upload', () => {
  const upload = (auth, buffer, contentType, filename) =>
    request(app)
      .post('/api/profile/upload-photo')
      .set('Authorization', auth)
      .attach('photo', buffer, {filename, contentType});

  // Smallest valid PNG header followed by filler bytes.
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(32),
  ]);

  it('accepts a real image and builds an absolute URL', async () => {
    const {auth} = await createUser('client');
    const res = await upload(auth, png, 'image/png', 'me.png');
    expect(res.status).toBe(200);
    expect(res.body.data.photoUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/uploads\/profiles\/profile-.*\.png$/);
    fs.unlinkSync(path.join(PROFILE_DIR, path.basename(res.body.data.photoUrl)));
  });

  it('rejects a file whose content does not match its image type', async () => {
    const {auth} = await createUser('client');
    const res = await upload(
      auth,
      Buffer.from('<html><script>alert(1)</script></html>'),
      'image/png',
      'evil.png',
    );
    expect(res.status).toBe(400);
  });
});
