import React from 'react';
import {StyleSheet} from 'react-native';
import Svg, {Circle, Defs, RadialGradient, Stop} from 'react-native-svg';
import GradientView from './GradientView';
import appColors from '../constants/appColors';

// Brand backdrop drawn in code (replaces the old Main.png photo): a deep
// navy gradient with soft orange glows. Used by the splash and auth screens.
const AppBackground = ({children, style}) => (
  <GradientView colors={appColors.gradientDark} direction="diagonal" style={[styles.container, style]}>
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <RadialGradient id="glowOrange" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FF8A3D" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#FF8A3D" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glowWarm" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#F2611D" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#F2611D" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glowBlue" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#6366F1" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#6366F1" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="360" cy="40" r="260" fill="url(#glowOrange)" />
      <Circle cx="0" cy="430" r="230" fill="url(#glowBlue)" />
      <Circle cx="330" cy="780" r="280" fill="url(#glowWarm)" />
      <Circle cx="330" cy="120" r="150" stroke="#FFFFFF" strokeOpacity="0.06" strokeWidth="1.5" fill="none" />
      <Circle cx="330" cy="120" r="210" stroke="#FFFFFF" strokeOpacity="0.04" strokeWidth="1.5" fill="none" />
    </Svg>
    {children}
  </GradientView>
);

export default AppBackground;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.ink,
  },
});
