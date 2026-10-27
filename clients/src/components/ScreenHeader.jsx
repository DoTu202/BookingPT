import React from 'react';
import {StatusBar, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'iconsax-react-native';
import GradientView from './GradientView';
import TextComponent from './TextComponent';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';
import {header, spacing} from '../constants/theme';

// Gradient header used by the main screens. Handles the status bar and the
// top safe-area inset, so screens don't hard-code paddingTop values.
const ScreenHeader = ({title, subtitle, onBack, left, right, children}) => {
  const insets = useSafeAreaInsets();

  return (
    <GradientView style={[styles.container, {paddingTop: insets.top + spacing.sm}]}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.gradientPrimary[1]} />
      <View style={styles.row}>
        {left ? (
          <View style={styles.sideLeft}>{left}</View>
        ) : onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Quay lại">
            <ArrowLeft size={header.iconSize} color={appColors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}
        <View style={styles.titleBox}>
          <TextComponent
            text={title}
            size={18}
            font={fontFamilies.semiBold}
            color={appColors.white}
            numberOfLines={1}
            styles={styles.center}
          />
          {subtitle ? (
            <TextComponent
              text={subtitle}
              size={12}
              color="rgba(255,255,255,0.85)"
              numberOfLines={1}
              styles={styles.center}
            />
          ) : null}
        </View>
        <View style={styles.side}>{right}</View>
      </View>
      {children ? <View style={styles.extra}>{children}</View> : null}
    </GradientView>
  );
};

export const HeaderIconButton = ({icon, onPress, accessibilityLabel}) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.iconButton}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}>
    {icon}
  </TouchableOpacity>
);

export default ScreenHeader;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: header.radius,
    borderBottomRightRadius: header.radius,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: header.iconButton,
  },
  side: {
    width: header.iconButton,
    alignItems: 'flex-end',
  },
  sideLeft: {
    width: header.iconButton,
  },
  iconButton: {
    width: header.iconButton,
    height: header.iconButton,
    borderRadius: header.iconButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  titleBox: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  extra: {
    marginTop: spacing.md,
  },
});
