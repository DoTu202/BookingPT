import React, {useState} from 'react';
import {FlatList, KeyboardAvoidingView, Platform, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {Messages2} from 'iconsax-react-native';
import {AsyncView, Screen, StateView} from '../../components';
import {ChatHeader, DaySeparator, MessageBubble, MessageComposer, useChatRoom} from './components/chat';
import {authSelector} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';

const ChatScreen = ({navigation, route}) => {
  const {chatRoomId, otherUser} = route.params;
  const auth = useSelector(authSelector);
  const [draft, setDraft] = useState('');
  const chat = useChatRoom(chatRoomId, auth.id);

  const changeDraft = text => {
    setDraft(text);
    chat.notifyTyping(text);
  };

  const send = () => {
    const content = draft.trim();
    if (content) {
      setDraft('');
      chat.send(content);
    }
  };

  const renderRow = ({item}) =>
    item.type === 'day' ? (
      <DaySeparator label={item.label} />
    ) : (
      <MessageBubble
        message={item.message}
        mine={String(item.message.sender?._id || item.message.sender) === String(auth.id)}
        onRetry={chat.retry}
      />
    );

  return (
    <Screen>
      <ChatHeader user={otherUser} typing={chat.otherTyping} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AsyncView status={chat.status} error={chat.error} onRetry={chat.reload}>
          {chat.rows.length === 0 ? (
            <StateView
              icon={<Messages2 size={30} color={appColors.primary} />}
              title="Chưa có tin nhắn"
              message={`Gửi lời chào tới ${otherUser?.username || 'người dùng'} để bắt đầu.`}
            />
          ) : (
            <FlatList
              inverted
              data={chat.rows}
              keyExtractor={item => item.key}
              renderItem={renderRow}
              contentContainerStyle={styles.messages}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            />
          )}
        </AsyncView>
        <MessageComposer value={draft} onChangeText={changeDraft} onSend={send} />
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  messages: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
