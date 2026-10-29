import React, {useState} from 'react';
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Clock} from 'iconsax-react-native';
import {Banner, BottomSheet, ButtonComponent, ChipComponent, RowComponent, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {radius, spacing} from '../../../../constants/theme';
import {formatHours} from '../../../../utils/format';
import {DURATIONS} from './constants';
import {fromMinutes, fromPickerDate, toMinutes, toPickerDate} from './slotTime';

const FIELDS = [
  ['startTime', 'Bắt đầu'],
  ['endTime', 'Kết thúc'],
];

// Add / edit one slot. Owns the form while open; remount it (via `key`) to
// start from a new `initialForm`. `onSubmit(form)` may throw — its message is
// shown in the sheet.
const SlotFormSheet = ({visible, title, subtitle, submitLabel, initialForm, onSubmit, onClose}) => {
  const [form, setForm] = useState(initialForm);
  const [picker, setPicker] = useState(null); // 'startTime' | 'endTime' | null
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const durationMinutes = toMinutes(form.endTime) - toMinutes(form.startTime);
  const localError = durationMinutes <= 0 ? 'Giờ kết thúc phải sau giờ bắt đầu.' : '';

  const close = () => {
    setPicker(null);
    onClose();
  };

  const save = async () => {
    if (localError) {
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
      setPicker(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onPickerChange = (event, value) => {
    const field = picker;
    if (Platform.OS === 'android') {
      setPicker(null);
    }
    if (event.type !== 'set' || !value) {
      return;
    }
    const time = fromPickerDate(value);
    setForm(prev => {
      if (field === 'startTime') {
        // Keep the chosen duration when moving the start time.
        const keep = Math.max(toMinutes(prev.endTime) - toMinutes(prev.startTime), 60);
        return {startTime: time, endTime: fromMinutes(toMinutes(time) + keep)};
      }
      return {...prev, endTime: time};
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={title}
      subtitle={subtitle}
      footer={
        <ButtonComponent
          text={submitLabel}
          type="primary"
          size="lg"
          onPress={save}
          isLoading={saving}
          disable={Boolean(localError)}
        />
      }>
      <View style={styles.timeRow}>
        {FIELDS.map(([field, label]) => (
          <TouchableOpacity
            key={field}
            style={[styles.timeField, picker === field && styles.timeFieldActive]}
            onPress={() => setPicker(picker === field ? null : field)}
            accessibilityRole="button"
            accessibilityLabel={`Chọn giờ ${label.toLowerCase()}`}>
            <TextComponent text={label} size={12} color={appColors.textMuted} />
            <View style={styles.timeValue}>
              <Clock size={18} color={appColors.primary} />
              <TextComponent text={form[field]} size={20} font={fontFamilies.semiBold} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {picker ? (
        <DateTimePicker
          value={toPickerDate(form[picker])}
          mode="time"
          is24Hour
          minuteInterval={Platform.OS === 'ios' ? 15 : undefined}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
          locale="vi-VN"
        />
      ) : null}

      <View>
        <TextComponent text="Thời lượng nhanh" size={13} font={fontFamilies.medium} styles={styles.label} />
        <RowComponent wrap gap={spacing.sm}>
          {DURATIONS.map(minutes => (
            <ChipComponent
              key={minutes}
              label={formatHours(minutes / 60)}
              selected={durationMinutes === minutes}
              onPress={() => setForm(prev => ({...prev, endTime: fromMinutes(toMinutes(prev.startTime) + minutes)}))}
            />
          ))}
        </RowComponent>
      </View>

      <Banner message={localError || error} />
    </BottomSheet>
  );
};

export default SlotFormSheet;

const styles = StyleSheet.create({
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeField: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: appColors.border,
    gap: 4,
  },
  timeFieldActive: {
    borderColor: appColors.primary,
    backgroundColor: appColors.primarySoft,
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    marginBottom: spacing.sm,
  },
});
