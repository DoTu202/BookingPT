const request = require('supertest');
const app = require('../src/app');
const {Message} = require('../src/models/ChatModel');
const PTProfile = require('../src/models/PTProfileModel');
const {startDb, clearDb, stopDb, createUser} = require('./setup');

beforeAll(startDb);
afterEach(clearDb);
afterAll(stopDb);

describe('chat authorization', () => {
  const openRoom = async (client, pt) => {
    const res = await request(app)
      .get(`/api/chat/room/${pt.user._id}`)
      .set('Authorization', client.auth);
    return res.body.data._id;
  };

  it('lets the two members exchange messages', async () => {
    const client = await createUser('client');
    const pt = await createUser('pt');
    const roomId = await openRoom(client, pt);

    await request(app)
      .post(`/api/chat/send/${roomId}`)
      .set('Authorization', pt.auth)
      .send({content: 'Hello!'})
      .expect(200);
    const res = await request(app)
      .get(`/api/chat/messages/${roomId}`)
      .set('Authorization', client.auth)
      .expect(200);

    expect(res.body.data.messages.map(m => m.content)).toEqual(['Hello!']);
  });

  it('blocks outsiders from reading or posting into a room', async () => {
    const client = await createUser('client');
    const pt = await createUser('pt');
    const outsider = await createUser('client');
    const roomId = await openRoom(client, pt);

    const send = await request(app)
      .post(`/api/chat/send/${roomId}`)
      .set('Authorization', outsider.auth)
      .send({content: 'spam'});
    const read = await request(app)
      .get(`/api/chat/messages/${roomId}`)
      .set('Authorization', outsider.auth);

    expect(send.status).toBe(403);
    expect(read.status).toBe(403);
    expect(await Message.countDocuments()).toBe(0);
  });

  it('only creates rooms between a PT and a client, once per pair', async () => {
    const client = await createUser('client');
    const otherClient = await createUser('client');
    const pt = await createUser('pt');

    const sameRole = await request(app)
      .get(`/api/chat/room/${otherClient.user._id}`)
      .set('Authorization', client.auth);
    expect(sameRole.status).toBe(404);

    const [a, b] = await Promise.all([openRoom(client, pt), openRoom(client, pt)]);
    expect(a).toBe(b);
  });

  it('returns the most recent messages, oldest first', async () => {
    const client = await createUser('client');
    const pt = await createUser('pt');
    const roomId = await openRoom(client, pt);
    const base = Date.now();
    await Message.insertMany(
      Array.from({length: 105}, (_, i) => ({
        chatRoom: roomId,
        sender: client.user._id,
        content: `m${i}`,
        createdAt: new Date(base + i * 1000),
      })),
    );

    const res = await request(app)
      .get(`/api/chat/messages/${roomId}`)
      .set('Authorization', client.auth);
    const contents = res.body.data.messages.map(m => m.content);

    expect(contents).toHaveLength(100);
    expect(contents[0]).toBe('m5');
    expect(contents[99]).toBe('m104');
  });
});

describe('public PT search', () => {
  beforeEach(async () => {
    const pt = await createUser('pt', {username: 'Linh Nguyen'});
    await PTProfile.create({
      user: pt.user._id,
      hourlyRate: 300000,
      rating: 4.8,
      location: {city: 'Ho Chi Minh', district: 'District 1'},
    });
  });

  it('does not expose personal data of trainers', async () => {
    const res = await request(app).get('/api/client/pt').expect(200);
    const user = res.body.data[0].user;

    expect(user.username).toBe('Linh Nguyen');
    expect(user.email).toBeUndefined();
    expect(user.phoneNumber).toBeUndefined();
    expect(user.password).toBeUndefined();
  });

  it('filters by location sub-document fields', async () => {
    const hit = await request(app).get('/api/client/pt?location=district%201');
    const miss = await request(app).get('/api/client/pt?location=Hanoi');
    expect(hit.body.count).toBe(1);
    expect(miss.body.count).toBe(0);
  });

  it('treats regex characters in search input literally', async () => {
    const res = await request(app).get(`/api/client/pt?name=${encodeURIComponent('(a+)+$')}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('hides deactivated trainers', async () => {
    const inactive = await createUser('pt', {username: 'Inactive Trainer', isActive: false});
    await PTProfile.create({user: inactive.user._id, hourlyRate: 300000});

    const all = await request(app).get('/api/client/pt').expect(200);
    const byName = await request(app).get('/api/client/pt?name=Inactive').expect(200);
    const profile = await request(app)
      .get(`/api/client/pt/${inactive.user._id}/profile`)
      .set('Authorization', (await createUser('client')).auth);

    expect(all.body.count).toBe(1);
    expect(byName.body.count).toBe(0);
    expect(profile.status).toBe(404);
  });

  it('caps the page size', async () => {
    const res = await request(app).get('/api/client/pt?pageSize=100000');
    expect(res.status).toBe(200);
    expect(res.body.pages).toBe(1);
  });
});

describe('app hardening', () => {
  it('returns JSON 404 for unknown routes and sets security headers', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rejects non-image uploads', async () => {
    const client = await createUser('client');
    const res = await request(app)
      .post('/api/profile/upload-photo')
      .set('Authorization', client.auth)
      .attach('photo', Buffer.from('<script>alert(1)</script>'), {
        filename: 'evil.html',
        contentType: 'text/html',
      });
    expect(res.status).toBe(400);
  });
});
