import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import chatApi from '../apis/chatApi';
import {authSelector} from '../redux/reducers/authReducer';

// Opens (or creates) the chat room with another user and navigates to it.
//   const {openChat, opening} = useOpenChat();
//   openChat(booking.pt._id);
const useOpenChat = () => {
  const navigation = useNavigation();
  const {role} = useSelector(authSelector);
  const [opening, setOpening] = useState(false);

  const openChat = useCallback(
    async otherUserId => {
      setOpening(true);
      try {
        const res = await chatApi.startChat(null, otherUserId);
        const room = res.data;
        navigation.navigate('ChatScreen', {
          chatRoomId: room._id,
          otherUser: role === 'pt' ? room.clientUser : room.ptUser,
        });
      } catch (err) {
        Alert.alert('Không mở được cuộc trò chuyện', err.message);
      } finally {
        setOpening(false);
      }
    },
    [navigation, role],
  );

  return {openChat, opening};
};

export default useOpenChat;
