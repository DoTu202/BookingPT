import React from 'react';
import {StyleSheet, View} from 'react-native';
import appColors from '../../constants/appColors';

// Root view of every screen: fills the window with the app background.
//   <Screen>
//     <ScreenHeader title="..." />
//     ...
//   </Screen>
const Screen = ({children, style}) => <View style={[styles.container, style]}>{children}</View>;

export default Screen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
});
