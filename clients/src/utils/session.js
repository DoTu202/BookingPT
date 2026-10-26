import AsyncStorage from '@react-native-async-storage/async-storage';
import {removeAuth} from '../redux/reducers/authReducer';

// Clears both the in-memory session and the persisted "Remember me" copy.
// Clearing only Redux signed the user straight back in on the next launch.
export const signOut = async dispatch => {
  try {
    await AsyncStorage.removeItem('auth');
  } finally {
    dispatch(removeAuth());
  }
};
