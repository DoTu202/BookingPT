import {createNavigationContainerRef} from '@react-navigation/native';

// Lets code outside screens navigate (e.g. opening a push notification).
export const navigationRef = createNavigationContainerRef();

// The signed-in navigator may still be mounting (cold start from a tapped
// notification), so retry briefly until the target route exists.
export const navigateWhenReady = (name, params, attempts = 50) => {
  const routeNames = navigationRef.isReady() ? navigationRef.getRootState()?.routeNames : null;
  if (routeNames?.includes(name)) {
    navigationRef.navigate(name, params);
    return;
  }
  if (attempts > 0) {
    setTimeout(() => navigateWhenReady(name, params, attempts - 1), 100);
  }
};
