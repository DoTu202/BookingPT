import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Add, CalendarAdd, Clock, Edit2, Flash, Lock1, Trash} from 'iconsax-react-native';
import {
  ButtonComponent,
  ChipComponent,
  DateStrip,
  HeaderIconButton,
  ScreenHeader,
  StateView,
  TextComponent,
} from '../../components';
import {formatBookingDate} from '../../components/BookingCard';
import {todayKey} from '../../components/DateStrip';
import ptApi from '../../apis/ptApi';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../constants/theme';
import dayjs from '../../utils/dayjs';
import {formatHours} from '../../utils/format';
import {timeUtils} from '../../utils/timeUtils';

const SLOT_STATUS = {
  available: {label: 'Còn trống', color: appColors.success, soft: appColors.successSoft},
  booked: {label: 'Đã có người đặt', color: appColors.info, soft: appColors.infoSoft},
  unavailable_by_pt: {label: 'Đã khóa', color: appColors.textMuted, soft: appColors.gray6},
};

// Days shown in the strip (and loaded at once).
const DAYS = 14;
const DURATIONS = [60, 90, 120];
// One-tap 1-hour slots offered under the day's list.
const PRESET_HOURS = [6, 7, 8, 9, 10, 16, 17, 18, 19, 20];

// "HH:mm" helpers for the time pickers (values are Vietnam local time).
const toMinutes = hhmm => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fromMinutes = total => {
  const clamped = Math.min(Math.max(total, 0), 23 * 60 + 59);
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
};
const toPickerDate = hhmm => {
  const date = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date;
};
const fromPickerDate = date =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const dayOf = iso => dayjs(iso).utcOffset(7 * 60).format('YYYY-MM-DD');
const hhmm = hour => `${String(hour).padStart(2, '0')}:00`;

const EMPTY_FORM = {startTime: '07:00', endTime: '08:00'};

const PTAvailabilityScreen = () => {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(todayKey());
  const [slots, setSlots] = useState([]); // all slots of the DAYS-day window
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [addingPreset, setAddingPreset] = useState(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [picker, setPicker] = useState(null); // 'startTime' | 'endTime' | null
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try {
      const from = todayKey();
      const to = dayjs(from).add(DAYS - 1, 'day').format('YYYY-MM-DD');
      const response = await ptApi.getAvailabilitySlots({from, to});
      setSlots(response.data?.data || []);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const daySlots = useMemo(() => slots.filter(slot => dayOf(slot.startTime) === date), [slots, date]);

  // Strip dots: green = has free slots, blue = has bookings.
  const marks = useMemo(() => {
    const result = {};
    slots.forEach(slot => {
      const color = slot.status === 'available' ? appColors.success : slot.status === 'booked' ? appColors.info : null;
      const key = dayOf(slot.startTime);
      if (color && !(result[key] || []).includes(color)) {
        result[key] = [...(result[key] || []), color];
      }
    });
    return result;
  }, [slots]);

  const totals = useMemo(
    () => ({
      available: slots.filter(s => s.status === 'available' && new Date(s.startTime) > Date.now()).length,
      booked: slots.filter(s => s.status === 'booked').length,
      locked: slots.filter(s => s.status === 'unavailable_by_pt').length,
    }),
    [slots],
  );

  // Presets that start in the future and don't overlap the day's slots.
  const presets = useMemo(
    () =>
      PRESET_HOURS.filter(hour => {
        const start = new Date(timeUtils.createUtcIsoString(date, hhmm(hour)));
        const end = new Date(start.getTime() + 3600 * 1000);
        return (
          start.getTime() > Date.now() &&
          !daySlots.some(slot => new Date(slot.startTime) < end && new Date(slot.endTime) > start)
        );
      }),
    [date, daySlots],
  );

  const addPreset = async hour => {
    setAddingPreset(hour);
    try {
      await ptApi.addAvailabilitySlot({
        startTime: timeUtils.createUtcIsoString(date, hhmm(hour)),
        endTime: timeUtils.createUtcIsoString(date, hhmm(hour + 1)),
      });
      await load();
    } catch (err) {
      Alert.alert('Không thêm được', err.message);
    } finally {
      setAddingPreset(null);
    }
  };

  const openAdd = () => {
    // Start the new slot where the last one ends, which is the common case.
    const last = daySlots[daySlots.length - 1];
    const start = last ? timeUtils.formatTo24HourTime(last.endTime) : EMPTY_FORM.startTime;
    setForm({startTime: start, endTime: fromMinutes(toMinutes(start) + 60)});
    setEditingSlot(null);
    setFormError('');
    setSheetOpen(true);
  };

  const openEdit = slot => {
    setForm({
      startTime: timeUtils.formatTo24HourTime(slot.startTime),
      endTime: timeUtils.formatTo24HourTime(slot.endTime),
    });
    setEditingSlot(slot);
    setFormError('');
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setPicker(null);
  };

  const durationMinutes = toMinutes(form.endTime) - toMinutes(form.startTime);
  const localError = durationMinutes <= 0 ? 'Giờ kết thúc phải sau giờ bắt đầu.' : '';

  const save = async () => {
    if (localError) {
      return;
    }
    setFormError('');
    setSaving(true);
    const payload = {
      startTime: timeUtils.createUtcIsoString(date, form.startTime),
      endTime: timeUtils.createUtcIsoString(date, form.endTime),
    };
    try {
      if (editingSlot) {
        await ptApi.updateAvailabilitySlot(editingSlot._id, payload);
      } else {
        await ptApi.addAvailabilitySlot(payload);
      }
      closeSheet();
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = slot =>
    Alert.alert(
      'Xóa khung giờ',
      `Xóa khung ${timeUtils.formatTo24HourTime(slot.startTime)} – ${timeUtils.formatTo24HourTime(slot.endTime)}?`,
      [
        {text: 'Hủy', style: 'cancel'},
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await ptApi.deleteAvailabilitySlot(slot._id);
              load();
            } catch (err) {
              Alert.alert('Không xóa được', err.message);
            }
          },
        },
      ],
    );

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

  const freeCount = daySlots.filter(s => s.status === 'available').length;

  const renderSlot = (slot, index) => {
    const info = SLOT_STATUS[slot.status] || SLOT_STATUS.available;
    const past = new Date(slot.startTime).getTime() <= Date.now();
    // The server only accepts future start times, and never touches booked slots.
    const editable = slot.status !== 'booked' && !past;
    const isLast = index === daySlots.length - 1;
    return (
      <View key={slot._id} style={[styles.timelineRow, past && styles.past]}>
        <View style={styles.timeColumn}>
          <TextComponent
            text={timeUtils.formatTo24HourTime(slot.startTime)}
            size={15}
            font={fontFamilies.bold}
          />
          <TextComponent
            text={timeUtils.formatTo24HourTime(slot.endTime)}
            size={12}
            color={appColors.textMuted}
          />
        </View>
        <View style={styles.rail}>
          <View style={[styles.railDot, {borderColor: info.color}]} />
          {!isLast ? <View style={styles.railLine} /> : null}
        </View>
        <View style={[styles.slotCard, {borderLeftColor: info.color}]}>
          <View style={styles.flex}>
            <View style={[styles.slotBadge, {backgroundColor: info.soft}]}>
              {slot.status === 'booked' ? <Lock1 size={12} color={info.color} variant="Bold" /> : null}
              <TextComponent
                text={past && slot.status !== 'booked' ? 'Đã qua' : info.label}
                size={11}
                font={fontFamilies.semiBold}
                color={info.color}
              />
            </View>
            <TextComponent
              text={formatHours((new Date(slot.endTime) - new Date(slot.startTime)) / 3600000)}
              size={12}
              color={appColors.textMuted}
              styles={styles.duration}
            />
          </View>
          {editable ? (
            <View style={styles.slotActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => openEdit(slot)}
                accessibilityRole="button"
                accessibilityLabel="Sửa khung giờ">
                <Edit2 size={17} color={appColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, styles.iconButtonDanger]}
                onPress={() => remove(slot)}
                accessibilityRole="button"
                accessibilityLabel="Xóa khung giờ">
                <Trash size={17} color={appColors.danger} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const renderQuickAdd = () =>
    presets.length > 0 ? (
      <View style={styles.card}>
        <View style={styles.quickHeader}>
          <Flash size={18} color={appColors.primary} variant="Bold" />
          <TextComponent text="Thêm nhanh khung 1 giờ" size={14} font={fontFamilies.semiBold} styles={styles.flex} />
        </View>
        <View style={styles.wrap}>
          {presets.map(hour => (
            <TouchableOpacity
              key={hour}
              style={styles.preset}
              onPress={() => addPreset(hour)}
              disabled={addingPreset !== null}
              accessibilityRole="button"
              accessibilityLabel={`Thêm khung ${hhmm(hour)} đến ${hhmm(hour + 1)}`}>
              {addingPreset === hour ? (
                <ActivityIndicator size="small" color={appColors.primary} />
              ) : (
                <>
                  <Add size={14} color={appColors.primaryDark} />
                  <TextComponent text={hhmm(hour)} size={13} font={fontFamilies.semiBold} color={appColors.primaryDark} />
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={openAdd} accessibilityRole="button">
          <TextComponent text="Chọn giờ khác…" size={13} font={fontFamilies.semiBold} color={appColors.primary} />
        </TouchableOpacity>
      </View>
    ) : null;

  const renderDay = () => {
    if (status === 'loading') {
      return <StateView type="loading" compact />;
    }
    if (status === 'error') {
      return <StateView type="error" message={error} onAction={load} compact />;
    }
    if (daySlots.length === 0) {
      return (
        <>
          <View style={styles.card}>
            <StateView
              compact
              icon={<CalendarAdd size={30} color={appColors.primary} />}
              title="Ngày này chưa có khung giờ"
              message="Thêm khung giờ rảnh để học viên có thể đặt lịch với bạn."
            />
          </View>
          {presets.length > 0 ? (
            renderQuickAdd()
          ) : (
            <ButtonComponent text="Thêm khung giờ" type="primary" onPress={openAdd} fullWidth />
          )}
        </>
      );
    }
    return (
      <>
        <View style={styles.card}>{daySlots.map(renderSlot)}</View>
        {renderQuickAdd()}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Lịch rảnh"
        subtitle={`${DAYS} ngày tới`}
        right={
          <HeaderIconButton
            icon={<Add size={24} color={appColors.white} />}
            onPress={openAdd}
            accessibilityLabel="Thêm khung giờ"
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={[appColors.primary]}
            tintColor={appColors.primary}
          />
        }>
        <View style={styles.totals}>
          {[
            {label: 'Còn trống', value: totals.available, color: appColors.success, soft: appColors.successSoft},
            {label: 'Đã đặt', value: totals.booked, color: appColors.info, soft: appColors.infoSoft},
            {label: 'Đã khóa', value: totals.locked, color: appColors.textMuted, soft: appColors.gray6},
          ].map(item => (
            <View key={item.label} style={[styles.total, {backgroundColor: item.soft}]}>
              <TextComponent text={String(item.value)} size={20} font={fontFamilies.bold} color={item.color} />
              <TextComponent text={item.label} size={12} color={appColors.textMuted} />
            </View>
          ))}
        </View>

        <DateStrip value={date} onChange={setDate} days={DAYS} marks={marks} style={styles.strip} />

        <View style={styles.dayHeader}>
          <View style={styles.flex}>
            <TextComponent
              text={formatBookingDate(timeUtils.createUtcIsoString(date, '12:00'))}
              size={16}
              font={fontFamilies.semiBold}
            />
            <TextComponent
              text={
                daySlots.length > 0
                  ? `${daySlots.length} khung giờ • ${freeCount} còn trống`
                  : 'Chưa có khung giờ'
              }
              size={13}
              color={appColors.textMuted}
            />
          </View>
          {daySlots.length > 0 ? (
            <ButtonComponent
              text="Thêm"
              type="secondary"
              size="sm"
              icon={<Add size={16} color={appColors.primaryDark} />}
              onPress={openAdd}
            />
          ) : null}
        </View>

        {renderDay()}
      </ScrollView>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={closeSheet}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeSheet} accessibilityLabel="Đóng" />
          <View style={[styles.sheet, {paddingBottom: insets.bottom + spacing.lg}]}>
            <View style={styles.sheetHandle} />
            <TextComponent
              text={editingSlot ? 'Sửa khung giờ' : 'Thêm khung giờ'}
              size={18}
              font={fontFamilies.bold}
            />
            <TextComponent
              text={formatBookingDate(timeUtils.createUtcIsoString(date, '12:00'))}
              size={13}
              color={appColors.textMuted}
            />

            <View style={styles.timeRow}>
              {[
                ['startTime', 'Bắt đầu'],
                ['endTime', 'Kết thúc'],
              ].map(([field, label]) => (
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
              <View style={styles.wrap}>
                {DURATIONS.map(minutes => (
                  <ChipComponent
                    key={minutes}
                    label={formatHours(minutes / 60)}
                    selected={durationMinutes === minutes}
                    onPress={() =>
                      setForm(prev => ({...prev, endTime: fromMinutes(toMinutes(prev.startTime) + minutes)}))
                    }
                  />
                ))}
              </View>
            </View>

            {localError || formError ? (
              <View style={styles.errorBox}>
                <TextComponent text={localError || formError} size={13} color={appColors.danger} />
              </View>
            ) : null}

            <ButtonComponent
              text={editingSlot ? 'Lưu thay đổi' : 'Thêm khung giờ'}
              type="primary"
              size="lg"
              onPress={save}
              isLoading={saving}
              disable={Boolean(localError)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default PTAvailabilityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  totals: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  total: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  strip: {
    paddingHorizontal: 0,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  past: {
    opacity: 0.5,
  },
  timeColumn: {
    width: 46,
    paddingTop: spacing.sm,
  },
  rail: {
    width: 14,
    alignItems: 'center',
    paddingTop: spacing.sm + 4,
  },
  railDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    backgroundColor: appColors.surface,
  },
  railLine: {
    flex: 1,
    width: 2,
    marginTop: 4,
    marginBottom: -spacing.md - spacing.sm,
    backgroundColor: appColors.border,
  },
  slotCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    backgroundColor: appColors.background,
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  duration: {
    marginTop: 4,
  },
  slotActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDanger: {
    backgroundColor: appColors.dangerSoft,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
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
  backdrop: {
    flex: 1,
    backgroundColor: appColors.overlay,
  },
  sheet: {
    backgroundColor: appColors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg + 4,
    gap: spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: appColors.border,
    marginTop: spacing.sm,
  },
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
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  errorBox: {
    backgroundColor: appColors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
});
