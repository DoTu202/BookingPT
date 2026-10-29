import {useCallback} from 'react';
import {Alert} from 'react-native';
import {useDispatch} from 'react-redux';
import profileApi from '../apis/profileApi';
import {signOut} from '../utils/session';

// Confirmation dialogs for "Đăng xuất" and "Đăng xuất khỏi mọi thiết bị",
// shared by the client and PT profile screens.
const useSignOut = () => {
  const dispatch = useDispatch();

  const confirmSignOut = useCallback(
    () =>
      Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
        {text: 'Hủy', style: 'cancel'},
        {text: 'Đăng xuất', style: 'destructive', onPress: () => signOut(dispatch)},
      ]),
    [dispatch],
  );

  const confirmSignOutEverywhere = useCallback(
    () =>
      Alert.alert(
        'Đăng xuất khỏi mọi thiết bị',
        'Tất cả thiết bị đang đăng nhập (kể cả máy này) sẽ phải đăng nhập lại.',
        [
          {text: 'Hủy', style: 'cancel'},
          {
            text: 'Đăng xuất tất cả',
            style: 'destructive',
            onPress: async () => {
              try {
                await profileApi.logoutAllDevices();
              } catch (err) {
                Alert.alert('Không thực hiện được', err.message);
                return;
              }
              signOut(dispatch);
            },
          },
        ],
      ),
    [dispatch],
  );

  return {confirmSignOut, confirmSignOutEverywhere};
};

export default useSignOut;
