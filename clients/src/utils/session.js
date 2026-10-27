import AsyncStorage from '@react-native-async-storage/async-storage';
import {addAuth, removeAuth} from '../redux/reducers/authReducer';
import {unregisterPush} from './pushNotifications';

// Clears both the in-memory session and the persisted "Remember me" copy.
// Clearing only Redux signed the user straight back in on the next launch.
export const signOut = async dispatch => {
  // First, while the token still works: stop pushes to this device.
  await unregisterPush();
  try {
    await AsyncStorage.removeItem('auth');
  } finally {
    dispatch(removeAuth());
  }
};

// Merges `patch` into the session (e.g. new username, photo or token) and
// keeps the persisted copy in sync when "Remember me" is on.
export const updateSession = async (dispatch, auth, patch) => {
  const next = {...auth, ...patch};
  dispatch(addAuth(next));
  try {
    if (await AsyncStorage.getItem('auth')) {
      await AsyncStorage.setItem('auth', JSON.stringify(next));
    }
  } catch {
    // Redux already has the new values; persistence is best effort.
  }
  return next;
};
