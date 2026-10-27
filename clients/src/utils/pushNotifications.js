import {useEffect} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import {getApps} from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  deleteToken,
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import profileApi from '../apis/profileApi';
import store from '../redux/store';
import {navigateWhenReady} from '../navigators/navigationRef';

// Push notifications (FCM; APNs on iOS goes through Firebase too). The server
// sends a notification for every chat message and app notification; the OS
// shows it while the app is in the background or closed. In the foreground
// nothing is shown: the socket already updates the open screens.
//
// Everything here is a no-op until Firebase is configured natively
// (GoogleService-Info.plist / google-services.json), so the app runs without
// a Firebase project.

const isAvailable = () => {
  try {
    return getApps().length > 0;
  } catch {
    return false;
  }
};

const hasPermission = async messaging => {
  if (Platform.OS === 'android') {
    // Android 13+ asks at runtime; older versions grant it at install.
    if (Platform.Version < 33) {
      return true;
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await requestPermission(messaging);
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
};

const register = token =>
  profileApi.registerPushToken({token, platform: Platform.OS}).catch(() => {
    // Retried on the next app start.
  });

// Opens the screen a tapped notification is about.
const openFromNotification = remoteMessage => {
  const data = remoteMessage?.data;
  if (data?.type === 'chat' && data.chatRoomId) {
    navigateWhenReady('ChatScreen', {
      chatRoomId: data.chatRoomId,
      otherUser: {
        _id: data.senderId,
        username: data.senderName,
        role: data.senderRole,
        photoUrl: data.senderPhoto,
      },
    });
  } else if (data?.type === 'notification') {
    navigateWhenReady('Notifications');
  }
};

// Must run before the app registers (index.js): Android delivers background
// messages to a headless task. The OS already displays notification
// messages, so there is nothing else to do here.
export const registerBackgroundPushHandler = () => {
  if (isAvailable()) {
    setBackgroundMessageHandler(getMessaging(), async () => {});
  }
};

// The cold-start notification is handled once per launch, not again after
// signing out and back in.
let initialNotificationHandled = false;

// Signed-in session: ask for permission, register this device's token (again
// whenever the session token or the FCM token changes) and route taps.
export const usePushNotifications = accessToken => {
  useEffect(() => {
    if (!accessToken || !isAvailable()) {
      return undefined;
    }
    const messaging = getMessaging();
    let cancelled = false;

    (async () => {
      try {
        if (!(await hasPermission(messaging)) || cancelled) {
          return;
        }
        const token = await getToken(messaging);
        if (!cancelled) {
          register(token);
        }
      } catch {
        // No APNs entitlement / Play services: the app works without push.
      }
    })();

    if (!initialNotificationHandled) {
      initialNotificationHandled = true;
      getInitialNotification(messaging)
        .then(openFromNotification)
        .catch(() => {});
    }

    const unsubscribeRefresh = onTokenRefresh(messaging, register);
    const unsubscribeOpened = onNotificationOpenedApp(messaging, openFromNotification);
    return () => {
      cancelled = true;
      unsubscribeRefresh();
      unsubscribeOpened();
      // Session ended without signOut() (e.g. a 401): drop the token on the
      // device, so the server stops pushing to it on its next send.
      if (!store.getState().authReducer.authData?.accesstoken) {
        deleteToken(messaging).catch(() => {});
      }
    };
  }, [accessToken]);
};

// Called by signOut() while the session token is still valid: unlinks this
// device on the server, then drops the FCM token. Never blocks sign-out for
// long.
export const unregisterPush = async () => {
  if (!isAvailable()) {
    return;
  }
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging);
    await Promise.race([
      profileApi.unregisterPushToken(token),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
    await deleteToken(messaging);
  } catch {
    // Signing out must always succeed.
  }
};
