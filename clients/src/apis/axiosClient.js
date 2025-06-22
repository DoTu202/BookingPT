import axios from 'axios';
import queryString from 'query-string';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {appInfo} from '../constants/appInfos';

const axiosClient = axios.create({
  baseURL: appInfo.BASE_URL,  
  timeout: 10000, 
  paramSerializer: params => queryString.stringify(params),
});

axiosClient.interceptors.request.use(async config => {
  let token = '';
  try {
    const authData = await AsyncStorage.getItem('auth');
    if (authData) {
      try {
        const auth = JSON.parse(authData);
        token = auth.token || auth.accesstoken || auth.accessToken || '';
      } catch {
        console.log('Auth data is email only, no token available');
      }
    }
  } catch (error) {
    console.log('Error getting token:', error);
  }

  config.headers = {
    Authorization: token ? `Bearer ${token}` : '',
    Accept: 'application/json',
    ...config.headers,
  };
  config.data;

  return config;
});

axiosClient.interceptors.response.use(
  res => {
    return res;
  },
  async error => {
    console.log(`Error: ${JSON.stringify(error)}`);

    // Handle token expiration
    if (error.response?.status === 401) {
      // Token expired or unauthorized
      try {
        await AsyncStorage.removeItem('auth');
        console.log('Token expired - cleared auth data');
        throw new Error('Token expired');
      } catch (storageError) {
        console.log('Error clearing auth data:', storageError);
      }
    }

    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.statusText ||
        'Server Error';
      throw new Error(message);
    } else if (error.request) {
      throw new Error('Network Error - No response from server');
    } else {
      throw new Error(error.message || 'Unknown error occurred');
    }
  },
);

export default axiosClient;
