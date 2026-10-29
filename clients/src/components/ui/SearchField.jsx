import React from 'react';
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {CloseCircle, SearchNormal1} from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing, TOUCH_TARGET} from '../../constants/theme';

// Search input with a magnifier and a clear button.
const SearchField = ({value, onChangeText, placeholder, accessibilityLabel, style, ...props}) => (
  <View style={[styles.box, style]}>
    <SearchNormal1 size={18} color={appColors.textMuted} />
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={appColors.placeholder}
      returnKeyType="search"
      autoCorrect={false}
      accessibilityLabel={accessibilityLabel || placeholder}
      {...props}
    />
    {value ? (
      <TouchableOpacity
        onPress={() => onChangeText('')}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        accessibilityRole="button"
        accessibilityLabel="Xóa từ khóa">
        <CloseCircle size={18} color={appColors.placeholder} />
      </TouchableOpacity>
    ) : null}
  </View>
);

export default SearchField;

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: TOUCH_TARGET,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
    fontFamily: fontFamilies.regular,
    color: appColors.text,
    paddingVertical: spacing.sm,
  },
});
