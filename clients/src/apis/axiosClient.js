import axios from 'axios';
import queryString from 'query-string';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {appInfo} from '../constants/appInfos';
import store from '../redux/store';
import {removeAuth} from '../redux/reducers/authReducer';
import {NETWORK_ERROR, GENERIC_ERROR, translateServerMessage} from '../utils/errorMessage';

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
      } catch {
        // Nothing else to clean up; Redux is cleared below.
      }
      store.dispatch(removeAuth());
    }

    // Screens show error.message directly, so it is always Vietnamese.
    let message;
    if (error.response) {
      message = translateServerMessage(error.response.data?.message) || GENERIC_ERROR;
    } else if (error.request) {
      message = NETWORK_ERROR;
    } else {
      message = GENERIC_ERROR;
    }

    // Keep `response` so screens can read the raw server message if needed.
    const wrapped = new Error(message);
    wrapped.status = status;
    wrapped.response = error.response;
    throw wrapped;
  },
);

export default axiosClient;
