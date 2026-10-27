const http = require('http');
const request = require('supertest');
const {io: connect} = require('socket.io-client');
const app = require('../src/app');
const {initRealtime, closeRealtime} = require('../src/services/realtimeService');
const {startDb, clearDb, stopDb, createUser} = require('./setup');

let server;
let url;
const sockets = [];

beforeAll(async () => {
  await startDb();
  server = http.createServer(app);
  initRealtime(server);
  await new Promise(resolve => server.listen(0, resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});
afterEach(async () => {
  sockets.splice(0).forEach(socket => socket.disconnect());
  await clearDb();
});
afterAll(async () => {
  await new Promise(resolve => closeRealtime(resolve));
  await stopDb();
});

const open = token => {
  const socket = connect(url, {auth: {token}, transports: ['websocket'], reconnection: false});
  sockets.push(socket);
  return socket;
};

const connected = socket =>
  new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });

const nextEvent = (socket, event, timeout = 2000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no ${event} within ${timeout}ms`)), timeout);
    socket.once(event, payload => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

// Resolves to the payloads of `event` received during `ms`.
const collect = (socket, event, ms = 300) =>
  new Promise(resolve => {
    const received = [];
    const handler = payload => received.push(payload);
    socket.on(event, handler);
    setTimeout(() => {
      socket.off(event, handler);
      resolve(received);
    }, ms);
  });

const openRoom = async (client, pt) => {
  const res = await request(app)
    .get(`/api/chat/room/${pt.user._id}`)
    .set('Authorization', client.auth);
  return res.body.data._id;
};

describe('realtime chat', () => {
  it('rejects connections without a valid token', async () => {
    await expect(connected(open(''))).rejects.toThrow('Unauthorized');
    await expect(connected(open('not-a-jwt'))).rejects.toThrow('Invalid token');
  });

  it('pushes a sent message to both members, not to outsiders', async () => {
    const client = await createUser('client');
    const pt = await createUser('pt');
    const outsider = await createUser('client');
    const roomId = await openRoom(client, pt);

    const clientSocket = open(client.token);
    const ptSocket = open(pt.token);
    const outsiderSocket = open(outsider.token);
    await Promise.all([clientSocket, ptSocket, outsiderSocket].map(connected));

    const toPt = nextEvent(ptSocket, 'chat:message');
    const toSender = nextEvent(clientSocket, 'chat:message');
    const toOutsider = collect(outsiderSocket, 'chat:message');

    await request(app)
      .post(`/api/chat/send/${roomId}`)
      .set('Authorization', client.auth)
      .send({content: 'Hi coach', clientId: 'temp-123'})
      .expect(200);

    const event = await toPt;
    expect(event.chatRoomId).toBe(roomId);
    expect(event.message.content).toBe('Hi coach');
    expect(event.message.sender.username).toBe(client.user.username);
    expect(event.clientId).toBe('temp-123');
    expect((await toSender).message._id).toBe(event.message._id);
    expect(await toOutsider).toEqual([]);
  });

  it('relays typing to the other member only', async () => {
    const client = await createUser('client');
    const pt = await createUser('pt');
    const outsider = await createUser('client');
    const roomId = await openRoom(client, pt);

    const clientSocket = open(client.token);
    const ptSocket = open(pt.token);
    const outsiderSocket = open(outsider.token);
    await Promise.all([clientSocket, ptSocket, outsiderSocket].map(connected));

    const toPt = nextEvent(ptSocket, 'chat:typing');
    clientSocket.emit('chat:typing', {chatRoomId: roomId});
    expect(await toPt).toEqual({chatRoomId: roomId, userId: client.user._id.toString()});

    // An outsider can't use someone else's room to reach its members.
    const leaked = collect(ptSocket, 'chat:typing');
    outsiderSocket.emit('chat:typing', {chatRoomId: roomId});
    expect(await leaked).toEqual([]);
  });

  it('drops open sockets when the user signs out of all devices', async () => {
    const client = await createUser('client');
    const socket = open(client.token);
    await connected(socket);

    const dropped = nextEvent(socket, 'disconnect');
    await request(app)
      .post('/api/profile/logout-all')
      .set('Authorization', client.auth)
      .expect(200);

    expect(await dropped).toBe('io server disconnect');
  });
});
