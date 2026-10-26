import axios from 'axios';
import queryString from 'query-string';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {appInfo} from '../constants/appInfos';
import store from '../redux/store';
import {removeAuth} from '../redux/reducers/authReducer';

const axiosClient = axios.create({
  baseURL: appInfo.BASE_URL,
  timeout: 10000,
  paramsSerializer: {serialize: params => queryString.stringify(params)},
});

// The token lives in Redux for the whole session. AsyncStorage only holds it
// when "Remember me" is ticked, so reading it from there (as before) sent
// unauthenticated requests for users who did not tick it.
const getToken = () => store.getState().authReducer.authData?.accesstoken;

axiosClient.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers.Accept = 'application/json';
  return config;
});

axiosClient.interceptors.response.use(
  res => res,
  async error => {
    const status = error.response?.status;

    // Expired/revoked session: sign out everywhere so the app returns to the
    // login screen instead of showing broken screens.
    if (status === 401 && getToken()) {
      try {
        await AsyncStorage.removeItem('auth');
      } catch (storageError) {
        console.log('Error clearing auth data:', storageError);
      }
      store.dispatch(removeAuth());
    }

    let message;
    if (error.response) {
      message =
        error.response.data?.message || error.response.statusText || 'Server Error';
    } else if (error.request) {
      message = 'Network Error - No response from server';
    } else {
      message = error.message || 'Unknown error occurred';
    }

    // Keep `response` so screens can read error.response?.data?.message.
    const wrapped = new Error(message);
    wrapped.status = status;
    wrapped.response = error.response;
    throw wrapped;
  },
);

export default axiosClient;
