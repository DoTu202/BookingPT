import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Send2} from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import {EvolveULogo} from '../../components';

// Import ảnh mặc định từ assets
import DefaultAvatar from '../../../assets/images/Main.png';

const ChatScreen = ({route, navigation}) => {
  // Get conversation info from route params
  const conversationData = route?.params?.conversation || {
    id: 1,
    name: 'EvolveU Team',
    avatar: null, // Sẽ sử dụng ảnh mặc định
    isOnline: true,
  };

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Auto welcome message when user enters chat
  useEffect(() => {
    const welcomeMessages = [
      {
        id: '1',
        text: `Hello! Welcome to ${conversationData.name}'s chat! 👋`,
        sender: 'other',
        timestamp: new Date(),
        isWelcome: true,
      },
      {
        id: '2',
        text: "I'm here to help you with your fitness journey. How can I assist you today?",
        sender: 'other',
        timestamp: new Date(Date.now() + 1000),
        isWelcome: true,
      },
    ];

    // Simulate typing effect for welcome messages
    setTimeout(() => {
      setMessages([welcomeMessages[0]]);
    }, 500);

    setTimeout(() => {
      setMessages(welcomeMessages);
    }, 2000);
  }, [conversationData.name]);

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: inputText.trim(),
        sender: 'me',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      setInputText('');

      // Show typing indicator
      setIsTyping(true);

      // Simulate trainer response
      setTimeout(() => {
        setIsTyping(false);
        const responses = [
          "Thanks for your message! I'll get back to you shortly.",
          'That sounds great! Let me help you with that.',
          'Perfect! When would be the best time for your training session?',
          'I understand. Let me create a personalized plan for you.',
          "Excellent question! Here's what I recommend...",
        ];

        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];

        const response = {
          id: (Date.now() + 1).toString(),
          text: randomResponse,
          sender: 'other',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, response]);
      }, 1500);
    }
  };

  const renderMessage = ({item, index}) => {
    const isLastMessage = index === messages.length - 1;
    const showAvatar =
      item.sender === 'other' &&
      (index === messages.length - 1 ||
        messages[index + 1]?.sender !== 'other');

    return (
      <View
        style={[
          styles.messageContainer,
          item.sender === 'me'
            ? styles.myMessageContainer
            : styles.otherMessageContainer,
        ]}>
        {/* Avatar for other person's messages */}
        {item.sender === 'other' && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              conversationData.avatar ? (
                <Image
                  source={{uri: conversationData.avatar}}
                  style={styles.messageAvatar}
                />
              ) : (
                <EvolveULogo width={28} height={28} color={appColors.primary} />
              )
            ) : (
              <View style={styles.avatarSpacer} />
            )}
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            item.sender === 'me' ? styles.myMessage : styles.otherMessage,
            item.isWelcome && styles.welcomeMessage,
          ]}>
          <Text
            style={[
              styles.messageText,
              item.sender === 'me'
                ? styles.myMessageText
                : styles.otherMessageText,
            ]}>
            {item.text}
          </Text>
          <Text
            style={[
              styles.timestamp,
              item.sender === 'me' ? styles.myTimestamp : styles.otherTimestamp,
            ]}>
            {item.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.otherMessageContainer]}>
        <View style={styles.avatarContainer}>
          <Image
            source={
              conversationData.avatar
                ? {uri: conversationData.avatar}
                : DefaultAvatar
            }
            style={styles.messageAvatar}
            defaultSource={DefaultAvatar}
          />
        </View>
        <View
          style={[
            styles.messageBubble,
            styles.otherMessage,
            styles.typingBubble,
          ]}>
          <View style={styles.typingIndicator}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={appColors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => {
            // Navigate to trainer profile
            console.log('Navigate to trainer profile');
          }}>
          <View style={styles.headerAvatarContainer}>
            <EvolveULogo width={40} height={40} color={appColors.white} />
          </View>

          <View style={styles.nameContainer}>
            <Text style={styles.trainerName}>{conversationData.name}</Text>
            <Text style={styles.onlineStatus}>
              {conversationData.isOnline ? 'Online' : 'Last seen recently'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Messages List */}
        <FlatList
          data={[...messages]}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={appColors.gray}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, {opacity: inputText.trim() ? 1 : 0.5}]}
              onPress={sendMessage}
              disabled={!inputText.trim()}>
              <Send2 size={20} color={appColors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: appColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerOnlineIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: appColors.primary,
    bottom: 0,
    right: 0,
  },
  nameContainer: {
    flex: 1,
  },
  trainerName: {
    color: appColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    alignItems: 'center',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarSpacer: {
    width: 28,
    height: 28,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  myMessage: {
    backgroundColor: appColors.primary,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderBottomLeftRadius: 4,
    marginLeft: 4,
  },
  welcomeMessage: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: appColors.black,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  myTimestamp: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: appColors.gray,
  },
  typingBubble: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: 70,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9E9E9E',
    marginHorizontal: 3,
  },
  typingDot1: {
    opacity: 0.6,
  },
  typingDot2: {
    opacity: 0.8,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    color: appColors.black,
  },
  sendButton: {
    backgroundColor: appColors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
