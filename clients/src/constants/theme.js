import {Platform} from 'react-native';

// Spacing, radius and type scale shared by components. Use these instead of
// ad-hoc numbers so screens line up with each other.
export const spacing = {xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32};

export const radius = {sm: 8, md: 12, lg: 16, xl: 24, pill: 999};

export const fontSize = {
  caption: 12,
  body: 14,
  bodyLg: 16,
  title: 18,
  h2: 22,
  h1: 28,
};

// Minimum comfortable touch target (Apple HIG 44pt, Material 48dp).
export const TOUCH_TARGET = 48;

export const shadow = {
  sm: Platform.select({
    ios: {
      shadowColor: '#101828',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    android: {elevation: 2},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#101828',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    android: {elevation: 5},
  }),
};

// Shared by the gradient headers (ScreenHeader, heroes, chat, drawer) so they
// line up across screens.
export const header = {
  radius: 28,
  iconButton: 44,
  iconSize: 22,
};
