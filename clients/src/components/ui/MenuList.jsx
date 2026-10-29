import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {ArrowRight2} from 'iconsax-react-native';
import IconBox from './IconBox';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../constants/theme';

// Grouped settings-style rows:
//   <MenuList title="Tài khoản" items={[{key, title, subtitle, icon: Edit, onPress, danger}]} />
const MenuList = ({title, items}) => (
  <View style={styles.section}>
    {title ? (
      <TextComponent
        text={title}
        size={13}
        font={fontFamilies.semiBold}
        color={appColors.textMuted}
        styles={styles.title}
      />
    ) : null}
    <View style={styles.card}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const color = item.danger ? appColors.danger : appColors.primary;
        return (
          <TouchableOpacity
            key={item.key}
            onPress={item.onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            style={[styles.row, index > 0 && styles.divider]}>
            <IconBox size={38} color={item.danger ? appColors.dangerSoft : appColors.primarySoft}>
              <Icon size={20} color={color} />
            </IconBox>
            <View style={styles.text}>
              <TextComponent
                text={item.title}
                size={15}
                font={fontFamilies.medium}
                color={item.danger ? appColors.danger : appColors.text}
              />
              {item.subtitle ? (
                <TextComponent text={item.subtitle} size={12} color={appColors.textMuted} />
              ) : null}
            </View>
            {!item.danger ? <ArrowRight2 size={18} color={appColors.placeholder} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default MenuList;

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  title: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
  },
  text: {
    flex: 1,
  },
});
