import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  BottomSheet,
  ButtonComponent,
  ChipComponent,
  InputComponent,
  RowComponent,
  TextComponent,
} from '../../../components';
import appColors from '../../../constants/appColors';
import {fontFamilies} from '../../../constants/fontFamilies';
import {spacing} from '../../../constants/theme';
import {EMPTY_FILTERS, SORT_OPTIONS} from './searchFilters';

const digits = value => value.replace(/[^0-9]/g, '');

// Sort / area / price filters. Edits a draft and hands it back on "Áp dụng";
// closing discards the draft.
const FilterSheet = ({visible, filters, onApply, onClose}) => {
  const [draft, setDraft] = useState(filters);

  // Start from the applied filters every time the sheet opens.
  useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [visible, filters]);

  const setField = (key, value) => setDraft(prev => ({...prev, [key]: value}));

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      closeLabel="Đóng bộ lọc"
      title="Bộ lọc"
      headerRight={<ButtonComponent type="link" text="Đặt lại" onPress={() => setDraft(EMPTY_FILTERS)} />}
      scrollable
      footer={<ButtonComponent text="Áp dụng" type="primary" size="lg" onPress={() => onApply(draft)} />}>
      <View style={styles.group}>
        <TextComponent text="Sắp xếp" font={fontFamilies.semiBold} />
        <RowComponent wrap gap={spacing.sm}>
          {SORT_OPTIONS.map(option => (
            <ChipComponent
              key={option.id}
              label={option.label}
              selected={draft.sort === option.id}
              onPress={() => setField('sort', option.id)}
            />
          ))}
        </RowComponent>
      </View>

      <InputComponent
        label="Khu vực"
        value={draft.location}
        onChange={val => setField('location', val)}
        placeholder="VD: Cầu Giấy, Quận 1, Hà Nội"
        autoCapitalize="words"
        allowClear
      />

      <View>
        <TextComponent text="Giá mỗi giờ (₫)" size={13} font={fontFamilies.medium} styles={styles.label} />
        <View style={styles.priceRow}>
          <InputComponent
            value={draft.minRate}
            onChange={val => setField('minRate', digits(val))}
            placeholder="Từ"
            type="number-pad"
            containerStyles={styles.flex}
          />
          <TextComponent text="–" color={appColors.textMuted} />
          <InputComponent
            value={draft.maxRate}
            onChange={val => setField('maxRate', digits(val))}
            placeholder="Đến"
            type="number-pad"
            containerStyles={styles.flex}
          />
        </View>
      </View>
    </BottomSheet>
  );
};

export default FilterSheet;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  group: {
    gap: spacing.sm,
  },
  label: {
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
