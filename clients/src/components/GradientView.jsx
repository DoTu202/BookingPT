import React, {useId} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import appColors from '../constants/appColors';

const DIRECTIONS = {
  horizontal: {x1: '0', y1: '0', x2: '1', y2: '0'},
  diagonal: {x1: '0', y1: '0', x2: '1', y2: '1'},
  vertical: {x1: '0', y1: '0', x2: '0', y2: '1'},
};

// A View with a gradient behind its children. The gradient is drawn with
// react-native-svg (Fabric-native). react-native-linear-gradient was removed:
// it ran through the legacy interop layer on the New Architecture and
// mis-drew when the gradient view had padding or children. Style (padding, radius, ...)
// goes on the outer View as usual; corners are clipped.
const GradientView = ({
  colors = appColors.gradientPrimary,
  direction = 'horizontal',
  style,
  children,
  ...props
}) => {
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const last = colors.length - 1;

  return (
    <View style={[styles.container, style]} {...props}>
      {/* The wrapper has no padding: a percentage size on the Svg itself
          would resolve against the parent's content box. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={id} {...DIRECTIONS[direction]}>
              {colors.map((color, i) => (
                <Stop key={color + i} offset={last ? i / last : 0} stopColor={color} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
};

export default GradientView;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
