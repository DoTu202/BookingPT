import React, {useEffect, useRef, useState} from 'react';
import {Animated, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import GradientView from './GradientView';
import ScreenHeader from './ScreenHeader';
import appColors from '../constants/appColors';

const OVERSCROLL_HEIGHT = 1000;

// Collapsing header for screens that open on a gradient hero (home, profile).
// At rest the hero runs edge to edge under the status bar / notch. Once it has
// scrolled up to the height of a regular header, a compact ScreenHeader
// (`title`, `left`, `right`) fades in and stays pinned, so the screen keeps its
// title and main actions while scrolling. Scroll props pass through; a refresh
// control should use a white tint (it shows on the gradient).
const HeroScrollView = ({hero, title, subtitle, left, right, children, onScroll, ...props}) => {
  const insets = useSafeAreaInsets();
  const [heroHeight, setHeroHeight] = useState(0);
  const [barHeight, setBarHeight] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: collapsed ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [collapsed, progress]);

  const threshold = Math.max(insets.top + heroHeight - barHeight, 1);
  const handleScroll = event => {
    const next = event.nativeEvent.contentOffset.y >= threshold;
    if (next !== collapsed) {
      setCollapsed(next);
    }
    onScroll?.(event);
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.gradientPrimary[1]} />
      <ScrollView style={styles.flex} scrollEventThrottle={16} onScroll={handleScroll} {...props}>
        {/* Fills the iOS pull-to-refresh / bounce area above the hero. */}
        <GradientView style={styles.overscroll} />
        <GradientView style={{height: insets.top}} />
        <View onLayout={e => setHeroHeight(e.nativeEvent.layout.height)}>{hero}</View>
        {children}
      </ScrollView>

      <Animated.View
        pointerEvents={collapsed ? 'box-none' : 'none'}
        accessibilityElementsHidden={!collapsed}
        importantForAccessibility={collapsed ? 'auto' : 'no-hide-descendants'}
        onLayout={e => setBarHeight(e.nativeEvent.layout.height)}
        style={[
          styles.bar,
          {
            opacity: progress,
            transform: [
              {translateY: progress.interpolate({inputRange: [0, 1], outputRange: [-8, 0]})},
            ],
          },
        ]}>
        <ScreenHeader title={title} subtitle={subtitle} left={left} right={right} />
      </Animated.View>
    </View>
  );
};

export default HeroScrollView;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overscroll: {
    position: 'absolute',
    top: -OVERSCROLL_HEIGHT,
    left: 0,
    right: 0,
    height: OVERSCROLL_HEIGHT,
  },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
