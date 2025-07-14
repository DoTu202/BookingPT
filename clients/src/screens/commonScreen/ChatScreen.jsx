import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import chatApi from '../../apis/chatApi';
import { authSelector } from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import { timeUtils } from '../../utils/timeUtils';
import { fontFamilies } from '../../constants/fontFamilies';

const ChatScreen = ({ navigation, route }) => {
  const { chatRoomId, otherUser } = route.params;
  const auth = useSelector(authSelector);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  
  // Reference Flatlist to scroll to bottom
  const flatListRef = useRef(null);

  // Get messages from API
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getMessages(auth.accesstoken, chatRoomId);

      if (response.success) {
        // Sort messages from oldest to newest
        const sortedMessages = [...(response.data.messages || [])].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setMessages(sortedMessages);
        // Scroll to the last message after loading
        setTimeout(() => {
          scrollToBottom(false);
        }, 200);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Cannot load messages');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to the last message
  const scrollToBottom = (animated = true) => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated });
    }
  };

  // Poll for new messages
  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await chatApi.getMessages(auth.accesstoken, chatRoomId);
        if (response.success) {
          // Sắp xếp tin nhắn từ cũ đến mới (theo thứ tự thời gian)
          const sortedMessages = [...(response.data.messages || [])].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          
          // Kiểm tra xem có tin nhắn mới không
          const shouldScroll = 
            messages.length < sortedMessages.length ||
            (sortedMessages.length > 0 && 
            messages.length > 0 && 
            sortedMessages[sortedMessages.length-1]._id !== messages[messages.length-1]._id);
            
          setMessages(sortedMessages);
          
          // Scroll xuống nếu có tin nhắn mới
          if (shouldScroll) {
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);
      const response = await chatApi.sendMessage(auth.accesstoken, chatRoomId, messageText);
      
      if (response.success) {
        // Add the new message to the list
        setMessages(prev => [...prev, response.data]);
        
        // Scroll to the bottom after sending
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Cannot send message');
      setNewMessage(messageText); // Restore the message text if sending fails
    } finally {
      setSending(false);
    }
  };

  // Format the message time
  const formatMessageTime = (date) => {
    if (!date) return '';
    return timeUtils.formatMessageTime(date);
  };

  // Render a message
  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender._id === auth.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timeText,
            isMyMessage ? styles.myTimeText : styles.otherTimeText
          ]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    loadMessages();
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, [chatRoomId]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {otherUser.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.headerTitle}>{otherUser.username}</Text>
              <Text style={styles.headerSubtitle}>
                {otherUser.role === 'pt' ? 'Personal Trainer' : 'Client'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <Icon name="more-vert" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Icon name="chat-bubble-outline" size={48} color={appColors.gray} />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Say hello to start the conversation!</Text>
              </View>
            )
          }
          onContentSizeChange={() => {
            if (messages.length > 0 && !loading) {
              scrollToBottom(false);
            }
          }}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={appColors.gray}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Icon 
              name="send" 
              size={20} 
              color={(!newMessage.trim() || sending) ? appColors.gray : 'white'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <SafeAreaView edges={['bottom']} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamilies.bold,
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontFamily: fontFamilies.regular,
  },
  moreButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 8,
    justifyContent: 'flex-end', 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fontFamilies.semiBold,
    color: appColors.gray,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: appColors.gray,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: fontFamilies.regular,
  },
  messageContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 18,
    marginVertical: 2,
  },
  myBubble: {
    backgroundColor: appColors.primary,
    borderBottomRightRadius: 6,
    shadowColor: appColors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: fontFamilies.regular,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: appColors.text,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.7,
    fontFamily: fontFamilies.regular,
  },
  myTimeText: {
    color: 'white',
    textAlign: 'right',
  },
  otherTimeText: {
    color: appColors.gray,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-end',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: appColors.lightGray,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    fontFamily: fontFamilies.regular,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: appColors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: appColors.lightGray,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ChatScreen;