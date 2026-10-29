import React, {Fragment} from 'react';
import {StyleSheet, View} from 'react-native';
import Divider from './Divider';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../constants/theme';

// A row of value/label pairs separated by dividers.
//   <StatGroup items={[{label: 'Buổi tập', value: 12}, ...]} />
// variant 'floating': card under a profile hero; 'inset': inside another card.
const StatGroup = ({items, variant = 'floating', style}) => {
  const floating = variant === 'floating';
  return (
    <View style={[styles.base, floating ? styles.floating : styles.inset, style]}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? <Divider vertical /> : null}
          <View style={styles.stat} accessible accessibilityLabel={`${item.label}: ${item.value}`}>
            <TextComponent
              text={String(item.value)}
              size={floating ? 18 : 15}
              font={floating ? fontFamilies.bold : fontFamilies.semiBold}
              color={item.highlight ? appColors.primary : appColors.text}
              numberOfLines={1}
            />
            <TextComponent text={item.label} size={12} color={appColors.textMuted} numberOfLines={1} />
          </View>
        </Fragment>
      ))}
    </View>
  );
};

export default StatGroup;

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
  },
  floating: {
    paddingVertical: spacing.lg,
    backgroundColor: appColors.surface,
    borderRadius: radius.xl,
    ...shadow.md,
  },
  inset: {
    paddingVertical: spacing.md,
    backgroundColor: appColors.background,
    borderRadius: radius.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
});
