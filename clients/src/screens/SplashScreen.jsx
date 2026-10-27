import React from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {AppBackground, EvolveULogo, TextComponent} from '../components';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';

const SplashScreen = () => (
  <AppBackground style={styles.center}>
    <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
    <View style={styles.logo}>
      <EvolveULogo width={56} height={56} color={appColors.white} />
    </View>
    <TextComponent text="BookingPT" size={30} font={fontFamilies.bold} color={appColors.white} />
    <TextComponent
      text="Tập luyện cùng huấn luyện viên phù hợp"
      size={14}
      color="rgba(255,255,255,0.7)"
      styles={styles.tagline}
    />
    <ActivityIndicator color={appColors.primaryLight} style={styles.spinner} />
  </AppBackground>
);

export default SplashScreen;

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primary,
    marginBottom: 20,
    shadowColor: appColors.primary,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  tagline: {
    marginTop: 6,
  },
  spinner: {
    marginTop: 40,
  },
});
