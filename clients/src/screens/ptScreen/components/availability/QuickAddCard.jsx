import React from 'react';
import {ActivityIndicator, StyleSheet, TouchableOpacity} from 'react-native';
import {Add, Flash} from 'iconsax-react-native';
import {ButtonComponent, Card, RowComponent, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {radius, spacing} from '../../../../constants/theme';
import {hhmm} from './slotTime';

// One-tap 1-hour slots for the selected day, plus a link to the full form.
const QuickAddCard = ({hours, addingHour, onAdd, onCustom}) => (
  <Card title="Thêm nhanh khung 1 giờ" icon={<Flash size={18} color={appColors.primary} variant="Bold" />}>
    <RowComponent wrap gap={spacing.sm}>
      {hours.map(hour => (
        <TouchableOpacity
          key={hour}
          style={styles.preset}
          onPress={() => onAdd(hour)}
          disabled={addingHour !== null}
          accessibilityRole="button"
          accessibilityLabel={`Thêm khung ${hhmm(hour)} đến ${hhmm(hour + 1)}`}>
          {addingHour === hour ? (
            <ActivityIndicator size="small" color={appColors.primary} />
          ) : (
            <>
              <Add size={14} color={appColors.primaryDark} />
              <TextComponent text={hhmm(hour)} size={13} font={fontFamilies.semiBold} color={appColors.primaryDark} />
            </>
          )}
        </TouchableOpacity>
      ))}
    </RowComponent>
    <ButtonComponent type="link" size="sm" text="Chọn giờ khác…" onPress={onCustom} styles={styles.link} />
  </Card>
);

export default QuickAddCard;

const styles = StyleSheet.create({
  preset: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 76,
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: appColors.primaryLight,
    backgroundColor: appColors.primarySoft,
  },
  link: {
    alignSelf: 'flex-start',
  },
});
