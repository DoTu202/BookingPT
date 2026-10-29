import React from 'react';
import {StyleSheet, View} from 'react-native';
import appColors from '../../constants/appColors';

// A track filled to `value` (0..1). Horizontal by default; `vertical` fills
// from the bottom and takes its size from `style` (e.g. {height: 80}).
const ProgressBar = ({
  value,
  color = appColors.primary,
  trackColor = appColors.gray6,
  thickness = 8,
  vertical,
  style,
}) => {
  const percent = `${Math.min(Math.max(Number(value) || 0, 0), 1) * 100}%`;
  const rounding = {borderRadius: vertical ? 8 : thickness / 2};

  return (
    <View
      style={[
        styles.track,
        vertical ? styles.vertical : {height: thickness},
        rounding,
        {backgroundColor: trackColor},
        style,
      ]}>
      <View
        style={[
          vertical ? [styles.fillVertical, {height: percent}] : [styles.fillHorizontal, {width: percent}],
          rounding,
          {backgroundColor: color},
        ]}
      />
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  vertical: {
    justifyContent: 'flex-end',
  },
  fillVertical: {
    width: '100%',
  },
  fillHorizontal: {
    height: '100%',
  },
});
