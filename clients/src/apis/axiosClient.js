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
    // Return full response object for flexibility
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
        // You might want to redirect to login screen here
        // But we can't import navigation here, so we'll throw a specific error
        throw new Error('Token expired');
      } catch (storageError) {
        console.log('Error clearing auth data:', storageError);
      }
    }

    // Better error handling
    if (error.response) {
      // Server responded with error status
      const message =
        error.response.data?.message ||
        error.response.statusText ||
        'Server Error';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network Error - No response from server');
    } else {
      // Something else happened
      throw new Error(error.message || 'Unknown error occurred');
    }
  },
);

export default axiosClient;
