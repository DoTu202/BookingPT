import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {SearchNormal1, Setting4} from 'iconsax-react-native';
import {TextComponent} from '../../../components';
import appColors from '../../../constants/appColors';
import {radius, spacing} from '../../../constants/theme';

// Fake search field + filter button on the home hero; both open the search
// screen.
const HeroSearchBar = ({onSearch, onFilter}) => (
  <View style={styles.row}>
    <TouchableOpacity
      style={styles.search}
      onPress={onSearch}
      activeOpacity={0.85}
      accessibilityRole="search"
      accessibilityLabel="Tìm huấn luyện viên">
      <SearchNormal1 size={20} color={appColors.textMuted} />
      <TextComponent text="Tìm huấn luyện viên..." size={15} color={appColors.placeholder} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.filter} onPress={onFilter} accessibilityRole="button" accessibilityLabel="Bộ lọc">
      <Setting4 size={20} color={appColors.white} />
    </TouchableOpacity>
  </View>
);

export default HeroSearchBar;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: appColors.surface,
  },
  filter: {
    width: 50,
    height: 50,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});
