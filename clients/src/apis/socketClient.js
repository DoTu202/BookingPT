import {useEffect, useRef} from 'react';
import {AppState} from 'react-native';
import {io} from 'socket.io-client';
import {appInfo} from '../constants/appInfos';

// Realtime channel (Socket.IO). The server only pushes events; writes still go
// through the REST API. One socket per signed-in session: MainNavigator opens
// it with the current token and closes it on sign-out / token change.
//
// Events from the server: 'chat:message' {chatRoomId, message, clientId?},
// 'chat:typing' {chatRoomId, userId}. Local pseudo-event: 'connect' (fired on
// every (re)connect, so screens can refetch what they missed while offline).

/** @typedef {(payload?: any) => void} Handler */

/** @type {import('socket.io-client').Socket | null} */
let socket = null;
/** @type {Map<string, Set<Handler>>} */
const listeners = new Map();

/**
 * @param {string} event
 * @param {any} [payload]
 */
const notify = (event, payload) => {
  listeners.get(event)?.forEach(handler => handler(payload));
};

/** @param {string} token */
const connectSocket = token => {
  // `auth` is the object passed to io() below (it can also be a callback).
  const current = /** @type {{token?: string} | undefined} */ (socket?.auth);
  if (socket && current?.token === token) {
    return socket;
  }
  disconnectSocket();
  const next = io(appInfo.BASE_URL, {
    auth: {token},
    // React Native has no reliable long-polling fallback; go straight to WS.
    transports: ['websocket'],
  });
  next.on('connect', () => notify('connect'));
  next.onAny(notify);
  socket = next;
  return next;
};

const disconnectSocket = () => {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
};

// Fire-and-forget; dropped while offline (only used for typing hints).
/**
 * @param {string} event
 * @param {any} payload
 */
export const emitSocket = (event, payload) => {
  if (socket?.connected) {
    socket.emit(event, payload);
  }
};

/**
 * @param {string} event
 * @param {Handler} handler
 * @returns {() => void} unsubscribe
 */
const subscribe = (event, handler) => {
  let handlers = listeners.get(event);
  if (!handlers) {
    handlers = new Set();
    listeners.set(event, handlers);
  }
  handlers.add(handler);
  return () => listeners.get(event)?.delete(handler);
};

// Subscribes for the lifetime of the component; always calls the latest
// `handler`, so it doesn't need to be memoized.
/**
 * @param {string} event
 * @param {Handler} handler
 */
export const useSocketEvent = (event, handler) => {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => subscribe(event, payload => ref.current(payload)), [event]);
};

// Opens the socket for a signed-in session. iOS suspends sockets in the
// background; reconnect as soon as the app is back in front.
/** @param {string | undefined} token */
export const useRealtimeConnection = token => {
  useEffect(() => {
    if (!token) {
      return undefined;
    }
    connectSocket(token);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && socket && !socket.connected) {
        socket.connect();
      }
    });
    return () => {
      subscription.remove();
      disconnectSocket();
    };
  }, [token]);
};
