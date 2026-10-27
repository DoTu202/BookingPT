const request = require('supertest');
const app = require('../src/app');
const DeviceToken = require('../src/models/DeviceTokenModel');
const {setPushTransport} = require('../src/services/pushService');
const {notifySafely} = require('../src/services/notificationService');
const {startDb, clearDb, stopDb, createUser} = require('./setup');

// Fake FCM: records each multicast and answers per token. Tokens listed in
// `deadTokens` fail as unregistered.
let sent;
let deadTokens;
const fakeTransport = async message => {
  sent.push(message);
  return {
    responses: message.tokens.map(token =>
      deadTokens.includes(token)
        ? {success: false, error: {code: 'messaging/registration-token-not-registered'}}
        : {success: true},
    ),
  };
};

// Sends are fire-and-forget; wait until the expected number arrived.
const waitForSends = async count => {
  for (let i = 0; i < 50 && sent.length < count; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  return sent;
};

beforeAll(startDb);
beforeEach(() => {
  sent = [];
  deadTokens = [];
  setPushTransport(fakeTransport);
});
afterEach(async () => {
  setPushTransport(undefined);
  await clearDb();
});
afterAll(stopDb);

const register = (user, token, platform = 'ios') =>
  request(app).post('/api/profile/push-token').set('Authorization', user.auth).send({token, platform});

describe('push tokens', () => {
  it('registers, moves to the last signed-in user and unregisters', async () => {
    const first = await createUser('client');
    const second = await createUser('pt');

    await register(first, 'device-1').expect(200);
    await register(first, 'device-1').expect(200); // idempotent
    expect(await DeviceToken.countDocuments({user: first.user._id})).toBe(1);

    // Same device, another account: the token follows the new user.
    await register(second, 'device-1', 'android').expect(200);
    const doc = await DeviceToken.findOne({token: 'device-1'});
    expect(doc.user.toString()).toBe(second.user._id.toString());
    expect(doc.platform).toBe('android');

    // Someone else's token can't be removed.
    await request(app)
      .delete('/api/profile/push-token')
      .set('Authorization', first.auth)
      .send({token: 'device-1'})
      .expect(200);
    expect(await DeviceToken.countDocuments()).toBe(1);

    await request(app)
      .delete('/api/profile/push-token')
      .set('Authorization', second.auth)
      .send({token: 'device-1'})
      .expect(200);
    expect(await DeviceToken.countDocuments()).toBe(0);
  });

  it('validates input and requires auth', async () => {
    const user = await createUser('client');
    await register(user, '').expect(400);
    await register(user, 'device-1', 'windows').expect(400);
    await register(user, {$gt: ''}).expect(400);
    await request(app).post('/api/profile/push-token').send({token: 'x', platform: 'ios'}).expect(401);
  });

  it('drops every device token on sign-out of all devices', async () => {
    const user = await createUser('client');
    await register(user, 'device-1').expect(200);
    await register(user, 'device-2', 'android').expect(200);

    await request(app).post('/api/profile/logout-all').set('Authorization', user.auth).expect(200);
    expect(await DeviceToken.countDocuments()).toBe(0);
  });
});

describe('push delivery', () => {
  it('pushes a chat message to the recipient only', async () => {
    const client = await createUser('client');
    const pt = await createUser('pt');
    await register(client, 'client-device').expect(200);
    await register(pt, 'pt-device').expect(200);

    const room = await request(app)
      .get(`/api/chat/room/${pt.user._id}`)
      .set('Authorization', client.auth);
    const roomId = room.body.data._id;
    await request(app)
      .post(`/api/chat/send/${roomId}`)
      .set('Authorization', client.auth)
      .send({content: 'Chào coach'})
      .expect(200);

    const [push] = await waitForSends(1);
    expect(sent).toHaveLength(1);
    expect(push.tokens).toEqual(['pt-device']);
    expect(push.notification).toEqual({title: client.user.username, body: 'Chào coach'});
    expect(push.data).toMatchObject({
      type: 'chat',
      chatRoomId: roomId,
      senderId: client.user._id.toString(),
      senderName: client.user.username,
      senderRole: 'client',
    });
    // FCM rejects non-string data values.
    Object.values(push.data).forEach(value => expect(typeof value).toBe('string'));
  });

  it('pushes notifications and prunes tokens FCM reports as dead', async () => {
    const user = await createUser('client');
    await register(user, 'alive').expect(200);
    await register(user, 'dead', 'android').expect(200);
    deadTokens = ['dead'];

    await notifySafely({
      recipient: user.user._id,
      senderType: 'System',
      type: 'booking_reminder',
      message: 'Bạn có buổi tập vào ngày mai',
    });

    const [push] = await waitForSends(1);
    expect(push.tokens.sort()).toEqual(['alive', 'dead']);
    expect(push.notification).toEqual({title: 'Nhắc lịch tập', body: 'Bạn có buổi tập vào ngày mai'});
    expect(push.data).toMatchObject({type: 'notification', notificationType: 'booking_reminder'});

    for (let i = 0; i < 50 && (await DeviceToken.countDocuments()) > 1; i += 1) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    expect((await DeviceToken.find()).map(doc => doc.token)).toEqual(['alive']);
  });

  it('does nothing when push is not configured', async () => {
    setPushTransport(null);
    const user = await createUser('client');
    await register(user, 'device-1').expect(200);
    const result = await notifySafely({
      recipient: user.user._id,
      senderType: 'System',
      type: 'general_update',
      message: 'Hello',
    });
    expect(result).toBeTruthy();
    expect(sent).toEqual([]);
  });
});
