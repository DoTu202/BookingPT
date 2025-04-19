import { StyleSheet, Text, View, ImageBackground, ActivityIndicator } from 'react-native'
import React from 'react'
import appColors from '../constants/appColors'

const SplashScreen = () => {
  return (
    <ImageBackground source={require('../../assets/images/Main.png')}
    style={styles.images}>
    <ActivityIndicator size={22} color={appColors.primary}  />
    </ImageBackground>
  )
}

export default SplashScreen

const styles = StyleSheet.create({
  images : {
    flex : 1,
    justifyContent : 'center',
    alignItems : 'center'
  }
})