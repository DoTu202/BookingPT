import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import dayjs from '../../utils/dayjs';
import {ArrowLeft, Messages2, Send2, Warning2} from 'iconsax-react-native';
import {Avatar, GradientView, HeaderIconButton, StateView, TextComponent} from '../../components';
import chatApi from '../../apis/chatApi';
import {emitSocket, useSocketEvent} from '../../apis/socketClient';
import {authSelector} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {header, radius, spacing} from '../../constants/theme';
import {timeUtils} from '../../utils/timeUtils';

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
const MAX_LENGTH = 2000; // Same limit as the server's Message model.

const dayLabel = iso => {
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

const ChatScreen = ({navigation, route}) => {
  const {chatRoomId, otherUser} = route.params;
  const auth = useSelector(authSelector);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState([]); // optimistic messages not yet confirmed
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);

  const fetchMessages = useCallback(async () => {
    const response = await chatApi.getMessages(null, chatRoomId);
    setMessages(prev => mergeMessages(prev, response.data?.messages || []));
  }, [chatRoomId]);

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
    if (String(message.sender?._id) !== String(auth.id)) {
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

  const changeDraft = text => {
    setDraft(text);
    const now = Date.now();
    if (text.trim() && now - lastTypingSent.current > TYPING_SEND_MS) {
      lastTypingSent.current = now;
      emitSocket('chat:typing', {chatRoomId});
    }
  };

  const deliver = async item => {
    setPending(prev => prev.map(p => (p.tempId === item.tempId ? {...p, failed: false} : p)));
    try {
      const response = await chatApi.sendMessage(null, chatRoomId, item.content, item.tempId);
      // The socket event may already have delivered it.
      setMessages(prev => mergeMessages(prev, [response.data]));
      setPending(prev => prev.filter(p => p.tempId !== item.tempId));
    } catch {
      setPending(prev => prev.map(p => (p.tempId === item.tempId ? {...p, failed: true} : p)));
    }
  };

  const send = () => {
    const content = draft.trim();
    if (!content) {
      return;
    }
    const item = {
      tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      content,
      createdAt: new Date().toISOString(),
      sender: {_id: auth.id},
    };
    setDraft('');
    setPending(prev => [...prev, item]);
    deliver(item);
  };

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

  const renderRow = ({item}) => {
    if (item.type === 'day') {
      return (
        <View style={styles.dayRow}>
          <TextComponent text={item.label} size={11} font={fontFamilies.medium} color={appColors.textMuted} />
        </View>
      );
    }
    const {message} = item;
    const mine = String(message.sender?._id || message.sender) === String(auth.id);
    const isPending = Boolean(message.tempId);
    return (
      <View style={[styles.messageRow, mine ? styles.mineRow : styles.theirRow]}>
        <TouchableOpacity
          activeOpacity={message.failed ? 0.7 : 1}
          disabled={!message.failed}
          onPress={() => deliver(message)}
          style={[styles.bubble, mine ? styles.mineBubble : styles.theirBubble, isPending && !message.failed && styles.pendingBubble]}
          accessibilityLabel={message.failed ? 'Gửi thất bại, chạm để gửi lại' : undefined}>
          <TextComponent
            text={message.content}
            size={15}
            color={mine ? appColors.white : appColors.text}
            styles={styles.messageText}
          />
          <TextComponent
            text={
              message.failed
                ? 'Chưa gửi được • Chạm để thử lại'
                : isPending
                ? 'Đang gửi...'
                : timeUtils.formatTo24HourTime(message.createdAt)
            }
            size={10}
            color={mine ? 'rgba(255,255,255,0.8)' : appColors.textMuted}
            styles={mine ? styles.timeRight : null}
          />
        </TouchableOpacity>
        {message.failed ? <Warning2 size={16} color={appColors.danger} style={styles.failedIcon} /> : null}
      </View>
    );
  };

  const canSend = draft.trim().length > 0;

  return (
    <View style={styles.container}>
      <GradientView style={[styles.header, {paddingTop: insets.top + spacing.sm}]}>
        <StatusBar barStyle="light-content" backgroundColor={appColors.gradientPrimary[1]} />
        <HeaderIconButton
          icon={<ArrowLeft size={header.iconSize} color={appColors.white} />}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Quay lại"
        />
        <Avatar uri={otherUser?.photoUrl} name={otherUser?.username} size={42} style={styles.headerAvatar} />
        <View style={styles.flex}>
          <TextComponent
            text={otherUser?.username || 'Cuộc trò chuyện'}
            size={16}
            font={fontFamilies.semiBold}
            color={appColors.white}
            numberOfLines={1}
          />
          <TextComponent
            text={otherTyping ? 'Đang nhập...' : otherUser?.role === 'pt' ? 'Huấn luyện viên' : 'Học viên'}
            size={12}
            color="rgba(255,255,255,0.85)"
          />
        </View>
      </GradientView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {status === 'loading' ? (
          <View style={styles.center}>
            <ActivityIndicator color={appColors.primary} size="large" />
          </View>
        ) : status === 'error' ? (
          <StateView type="error" message={error} onAction={() => fetchMessages().then(() => setStatus('ready'))} />
        ) : rows.length === 0 ? (
          <StateView
            icon={<Messages2 size={30} color={appColors.primary} />}
            title="Chưa có tin nhắn"
            message={`Gửi lời chào tới ${otherUser?.username || 'người dùng'} để bắt đầu.`}
          />
        ) : (
          <FlatList
            inverted
            data={rows}
            keyExtractor={item => item.key}
            renderItem={renderRow}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />
        )}

        <View style={[styles.inputBar, {paddingBottom: insets.bottom + spacing.sm}]}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={changeDraft}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={appColors.placeholder}
            multiline
            maxLength={MAX_LENGTH}
            accessibilityLabel="Nội dung tin nhắn"
          />
          <TouchableOpacity
            onPress={send}
            disabled={!canSend}
            style={[styles.sendButton, !canSend && styles.sendDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Gửi">
            <Send2 size={20} color={appColors.white} variant="Bold" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md + 2,
    borderBottomLeftRadius: header.radius,
    borderBottomRightRadius: header.radius,
  },
  headerAvatar: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  messages: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dayRow: {
    alignSelf: 'center',
    backgroundColor: appColors.gray6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginVertical: spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  mineRow: {
    justifyContent: 'flex-end',
  },
  theirRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: 20,
  },
  mineBubble: {
    backgroundColor: appColors.primary,
    borderBottomRightRadius: 6,
  },
  theirBubble: {
    backgroundColor: appColors.surface,
    borderBottomLeftRadius: 6,
  },
  pendingBubble: {
    opacity: 0.7,
  },
  messageText: {
    lineHeight: 21,
  },
  timeRight: {
    textAlign: 'right',
  },
  failedIcon: {
    marginLeft: spacing.xs,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: appColors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontFamily: fontFamilies.regular,
    color: appColors.text,
    backgroundColor: appColors.background,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primary,
  },
  sendDisabled: {
    backgroundColor: appColors.border,
  },
});
