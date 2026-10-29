import React from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import appColors from '../../constants/appColors';

// Circular progress (0..1, or null for "no data"), children drawn centered.
const RingProgress = ({progress, size = 64, stroke = 7, color = appColors.primary, children}) => {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const value = Math.min(Math.max(progress || 0, 0), 1);

  return (
    <View style={{width: size, height: size}}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={appColors.gray6} strokeWidth={stroke} fill="none" />
        {value > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - value)}
            // Start at 12 o'clock.
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
};

export default RingProgress;

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
