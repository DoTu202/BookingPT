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