import { StyleSheet, Text, View, Button } from 'react-native'
import React from 'react'
import { useDispatch } from 'react-redux'
import {removeAuth} from '../../redux/reducers/authReducer'


const HomeScreen = () => {
  const dispatch = useDispatch

  return (
    <View style={styles.container}>
      <Button title="Logout" onPress={() => dispatch(removeAuth({}))} />
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