import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import chatApi from '../../apis/chatApi';
import { authSelector } from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import { fontFamilies } from '../../constants/fontFamilies';

const ChatListScreen = ({ navigation }) => {
  const auth = useSelector(authSelector);
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get chat list from API
  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getChatRooms(auth.accesstoken);

      if (response.success) {
        setChatRooms(response.data || []);
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      Alert.alert('Error', 'Cannot load chat list');
    } finally {
      setLoading(false);
    }
  };

  // Get information about the other user (PT or Client)
  const getOtherUser = (chatRoom) => {
    if (auth.role === 'pt') {
      return chatRoom.clientUser; // PT, show Client chat
    } else {
      return chatRoom.ptUser; // Client, show PT chat
    }
  };

  // Format the last message time
  const formatLastMessageTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  // Render một item chat
  const renderChatItem = ({ item }) => {
    const otherUser = getOtherUser(item);
    
    if (!otherUser) return null;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('ChatScreen', {
          chatRoomId: item._id,
          otherUser: otherUser
        })}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {otherUser.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.chatContent}>
          <View style={styles.headerRow}>
            <Text style={styles.userName}>{otherUser.username}</Text>
            <Text style={styles.timeText}>
              {formatLastMessageTime(item.lastMessageTime)}
            </Text>
          </View>
          
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.content || 'Start a conversation...'}
          </Text>
        </View>

        <Icon name="chevron-right" size={20} color={appColors.gray} />
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    loadChatRooms();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
        <SafeAreaView edges={['bottom']} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {chatRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="chat-bubble-outline" size={64} color={appColors.gray} />
          <Text style={styles.emptyTitle}>No Messages</Text>
          <Text style={styles.emptyMessage}>
            Start a conversation with a trainer or client
          </Text>
        </View>
      ) : (
        <FlatList
          data={chatRooms}
          keyExtractor={(item) => item._id}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <SafeAreaView edges={['bottom']} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    height: 140,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20, 
    fontFamily: fontFamilies.bold,
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: appColors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#f5f5f5',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: appColors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  chatItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: appColors.text,
  },
  timeText: {
    fontSize: 12,
    color: appColors.gray,
  },
  lastMessage: {
    fontSize: 14,
    color: appColors.gray,
    lineHeight: 18,
  },
});

export default ChatListScreen;
