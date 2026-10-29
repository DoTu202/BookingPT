import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import TextComponent from '../ui/TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing} from '../../constants/theme';

// Bottom tab bar with a pill behind the active tab. Pass as `tabBar` to a
// bottom-tab navigator; icons come from each screen's `tabBarIcon` option.
const ModernTabBar = ({state, descriptors, navigation}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, {paddingBottom: Math.max(insets.bottom, spacing.sm)}]}>
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? appColors.primary : appColors.textMuted;
        const label = options.tabBarLabel ?? options.title ?? route.name;

        const onPress = () => {
          const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onLongPress={() => navigation.emit({type: 'tabLongPress', target: route.key})}
            accessibilityRole="tab"
            accessibilityState={{selected: focused}}
            accessibilityLabel={options.tabBarAccessibilityLabel || label}
            style={styles.item}>
            <View style={[styles.pill, focused && styles.pillActive]}>
              {options.tabBarIcon?.({focused, color, size: 22})}
            </View>
            <TextComponent
              text={label}
              size={11}
              font={focused ? fontFamilies.semiBold : fontFamilies.medium}
              color={color}
              numberOfLines={1}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default ModernTabBar;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: appColors.surface,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  pill: {
    width: 56,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: appColors.primarySoft,
  },
});
