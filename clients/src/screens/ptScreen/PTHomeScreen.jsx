// // PTHomeScreen.jsx
// import { useDispatch } from 'react-redux';
// import { removeAuth } from '../../redux/reducers/authReducer'; // Đảm bảo đường dẫn đúng
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import React from 'react';
// import { View, Button, StyleSheet } from 'react-native'; // Import các thành phần cần thiết
// // ... các imports khác ...

// const PTHomeScreen = () => { // Đổi tên HomeScreen thành PTHomeScreen cho rõ
//   const dispatch = useDispatch();
//   // const auth = useSelector(authSelector); // Không cần useSelector ở đây nếu chỉ để logout

//   const handleLogout = async () => {
//     try {
//       await AsyncStorage.removeItem('auth'); // XÓA item 'auth'
//       dispatch(removeAuth()); // Dispatch action để reset Redux state
//       // Sau khi dispatch removeAuth, AppRouter sẽ tự động render lại
//       // và vì auth.accesstoken không còn, nó sẽ chuyển về AuthNavigator.
//       // Bạn không cần navigation.navigate ở đây nếu AppRouter xử lý đúng.
//     } catch (e) {
//       console.error("Error during logout:", e);
//       // Có thể hiển thị Alert cho người dùng nếu cần
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Button title="Logout" onPress={handleLogout} />
//       {/* Hiển thị thông tin user nếu cần */}
//       {/* <Text>Logged in as: {auth.email} ({auth.role})</Text> */}
//     </View>
//   );
// };

// export default PTHomeScreen; // Đổi tên export

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

import { StyleSheet, Text, View, Button } from 'react-native'
import React from 'react'
import { useDispatch } from 'react-redux'
import { removeAuth } from '../../redux/reducers/authReducer'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authSelector } from '../../redux/reducers/authReducer'
import { useSelector } from 'react-redux'

const HomeScreen = () => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  return (
    <View style={styles.container}>
      <Button title="Logout" onPress={async () => {
        await AsyncStorage.setItem('auth', auth.email);
        dispatch(removeAuth({}));
      }} />
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})