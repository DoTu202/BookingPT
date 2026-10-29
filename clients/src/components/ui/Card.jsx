import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../constants/theme';

// White surface that groups content, with an optional header row:
//   <Card title="Lịch hôm nay" subtitle="3 buổi" right={<ButtonComponent type="link" ... />}>
//     ...
//   </Card>
// variant: 'default' | 'floating' (larger radius + shadow, for cards that
// overlap a hero) | 'inset' (flat, on the background colour, nested inside
// another card). With `onPress` the whole card is a button.
const Card = ({
  title,
  subtitle,
  icon,
  right,
  children,
  variant = 'default',
  gap = spacing.md,
  onPress,
  accessibilityLabel,
  style,
}) => {
  const Container = onPress ? TouchableOpacity : View;
  const pressProps = onPress
    ? {onPress, activeOpacity: 0.9, accessibilityRole: 'button', accessibilityLabel}
    : {};

  return (
    <Container style={[styles.base, styles[variant], {gap}, style]} {...pressProps}>
      {title ? (
        <View style={styles.header}>
          {icon}
          <View style={styles.flex}>
            <TextComponent text={title} size={16} font={fontFamilies.semiBold} />
            {subtitle ? <TextComponent text={subtitle} size={12} color={appColors.textMuted} /> : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </Container>
  );
};

export default Card;

const styles = StyleSheet.create({
  base: {
    padding: spacing.lg,
  },
  default: {
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  floating: {
    backgroundColor: appColors.surface,
    borderRadius: radius.xl,
    ...shadow.md,
  },
  inset: {
    backgroundColor: appColors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
