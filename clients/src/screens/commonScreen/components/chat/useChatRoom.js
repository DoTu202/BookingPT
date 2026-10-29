import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import chatApi from '../../../../apis/chatApi';
import {emitSocket, useSocketEvent} from '../../../../apis/socketClient';
import dayjs from '../../../../utils/dayjs';

// How long a typing hint stays up without a new one, and how often we send ours.
const TYPING_SHOW_MS = 3000;
const TYPING_SEND_MS = 1500;

// Adds messages not seen yet (by _id) and keeps the list in send order.
const mergeMessages = (current, incoming) => {
  const known = new Set(current.map(m => m._id));
  const added = incoming.filter(m => !known.has(m._id));
  if (added.length === 0) {
    return current;
  }
  return [...current, ...added].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

export const dayLabel = iso => {
  const day = dayjs(iso).utcOffset(7 * 60).startOf('day');
  const today = dayjs().utcOffset(7 * 60).startOf('day');
  const diff = today.diff(day, 'day');
  if (diff === 0) {
    return 'Hôm nay';
  }
  if (diff === 1) {
    return 'Hôm qua';
  }
  return day.format('DD/MM/YYYY');
};

// State of one chat room: loaded + live messages, optimistic sends (with
// retry), and the other member's typing hint. Writes go over REST; the socket
// only pushes (see socketClient).
const useChatRoom = (chatRoomId, myId) => {
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState([]); // optimistic messages not yet confirmed
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);

  const fetchMessages = useCallback(async () => {
    const response = await chatApi.getMessages(null, chatRoomId);
    setMessages(prev => mergeMessages(prev, response.data?.messages || []));
  }, [chatRoomId]);

  const reload = useCallback(
    () =>
      fetchMessages()
        .then(() => setStatus('ready'))
        .catch(err => {
          setError(err.message);
          setStatus('error');
        }),
    [fetchMessages],
  );

  // Load when the chat is shown; new messages then arrive over the socket.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchMessages()
        .then(() => active && setStatus('ready'))
        .catch(err => {
          if (active) {
            setError(err.message);
            setStatus('error');
          }
        });
      return () => {
        active = false;
      };
    }, [fetchMessages]),
  );

  // After a reconnect, pick up whatever was sent while we were offline.
  useSocketEvent('connect', () => {
    fetchMessages().catch(() => {});
  });

  useSocketEvent('chat:message', ({chatRoomId: roomId, message, clientId}) => {
    if (roomId !== chatRoomId) {
      return;
    }
    setMessages(prev => mergeMessages(prev, [message]));
    if (clientId) {
      setPending(prev => prev.filter(p => p.tempId !== clientId));
    }
    if (String(message.sender?._id) !== String(myId)) {
      clearTimeout(typingTimer.current);
      setOtherTyping(false);
    }
  });

  useSocketEvent('chat:typing', ({chatRoomId: roomId}) => {
    if (roomId !== chatRoomId) {
      return;
    }
    setOtherTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setOtherTyping(false), TYPING_SHOW_MS);
  });

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  // Tell the other member we're typing, at most every TYPING_SEND_MS.
  const notifyTyping = useCallback(
    text => {
      const now = Date.now();
      if (text.trim() && now - lastTypingSent.current > TYPING_SEND_MS) {
        lastTypingSent.current = now;
        emitSocket('chat:typing', {chatRoomId});
      }
    },
    [chatRoomId],
  );

  const deliver = useCallback(
    async item => {
      setPending(prev => prev.map(p => (p.tempId === item.tempId ? {...p, failed: false} : p)));
      try {
        const response = await chatApi.sendMessage(null, chatRoomId, item.content, item.tempId);
        // The socket event may already have delivered it.
        setMessages(prev => mergeMessages(prev, [response.data]));
        setPending(prev => prev.filter(p => p.tempId !== item.tempId));
      } catch {
        setPending(prev => prev.map(p => (p.tempId === item.tempId ? {...p, failed: true} : p)));
      }
    },
    [chatRoomId],
  );

  const send = useCallback(
    content => {
      const item = {
        tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        content,
        createdAt: new Date().toISOString(),
        sender: {_id: myId},
      };
      setPending(prev => [...prev, item]);
      deliver(item);
    },
    [deliver, myId],
  );

  // Newest first for the inverted list, with a date separator before the
  // first message of each day.
  const rows = useMemo(() => {
    const all = [...messages, ...pending];
    const result = [];
    for (let i = all.length - 1; i >= 0; i--) {
      const message = all[i];
      result.push({type: 'message', key: message._id || message.tempId, message});
      const previous = all[i - 1];
      if (!previous || dayLabel(previous.createdAt) !== dayLabel(message.createdAt)) {
        result.push({type: 'day', key: `day-${message._id || message.tempId}`, label: dayLabel(message.createdAt)});
      }
    }
    return result;
  }, [messages, pending]);

  return {rows, status, error, reload, otherTyping, notifyTyping, send, retry: deliver};
};

export default useChatRoom;
