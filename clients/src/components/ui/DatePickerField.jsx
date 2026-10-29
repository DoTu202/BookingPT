import React, {useState} from 'react';
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Calendar} from 'iconsax-react-native';
import ButtonComponent from './ButtonComponent';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing, TOUCH_TARGET} from '../../constants/theme';
import dayjs from '../../utils/dayjs';

// Labelled field that opens the native date picker (inline spinner + "Xong"
// on iOS, dialog on Android). `value` / `onChange` use Date objects.
const DatePickerField = ({
  label,
  value,
  onChange,
  placeholder = 'Chọn ngày',
  defaultDate = new Date(2000, 0, 1),
  minimumDate,
  maximumDate,
}) => {
  const [open, setOpen] = useState(false);

  const handleChange = (event, date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'set' && date) {
      onChange(date);
    }
  };

  return (
    <View>
      {label ? <TextComponent text={label} size={13} font={fontFamilies.medium} styles={styles.label} /> : null}
      <TouchableOpacity
        style={styles.field}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}>
        <Calendar size={20} color={appColors.textMuted} />
        <TextComponent
          text={value ? dayjs(value).format('DD/MM/YYYY') : placeholder}
          size={15}
          color={value ? appColors.text : appColors.placeholder}
        />
      </TouchableOpacity>
      {open ? (
        <View>
          <DateTimePicker
            value={value || defaultDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={handleChange}
            locale="vi-VN"
          />
          {Platform.OS === 'ios' ? (
            <ButtonComponent text="Xong" type="secondary" size="sm" onPress={() => setOpen(false)} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export default DatePickerField;

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: TOUCH_TARGET,
    borderWidth: 1.5,
    borderColor: appColors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
});
