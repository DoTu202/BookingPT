import {Dimensions, Platform} from 'react-native';

// Set this to your computer's LAN address (e.g. 'http://192.168.1.45:3001')
// when running on a physical device. Simulators/emulators work without it.
const DEV_API_URL_OVERRIDE = '';

// Production API. Must be HTTPS: iOS ATS and Android block cleartext traffic
// in release builds.
const PROD_API_URL = 'https://api.your-domain.com';

const DEV_API_URL =
  DEV_API_URL_OVERRIDE ||
  // The Android emulator reaches the host machine through 10.0.2.2.
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001');

export const appInfo = {
  sizes: {
    WIDTH: Dimensions.get('window').width,
    HEIGHT: Dimensions.get('window').height,
  },

  BASE_URL: __DEV__ ? DEV_API_URL : PROD_API_URL,
};
