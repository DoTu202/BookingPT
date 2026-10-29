import React, {useCallback, useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import {Add, CalendarAdd} from 'iconsax-react-native';
import {
  AppRefreshControl,
  AsyncView,
  ButtonComponent,
  Card,
  DateStrip,
  HeaderIconButton,
  Screen,
  ScreenHeader,
  StateView,
  TextComponent,
} from '../../components';
import {
  AvailabilityTotals,
  DAYS,
  PRESET_HOURS,
  QuickAddCard,
  SlotFormSheet,
  SlotTimelineItem,
  dayOf,
  fromMinutes,
  hhmm,
  toMinutes,
} from './components/availability';
import {useAsync} from '../../hooks';
import ptApi from '../../apis/ptApi';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {spacing} from '../../constants/theme';
import dayjs from '../../utils/dayjs';
import {formatBookingDate} from '../../utils/format';
import {timeUtils, todayKey} from '../../utils/timeUtils';

const DEFAULT_START = '07:00';

const fetchSlots = async () => {
  const from = todayKey();
  const to = dayjs(from).add(DAYS - 1, 'day').format('YYYY-MM-DD');
  const response = await ptApi.getAvailabilitySlots({from, to});
  return response.data?.data || [];
};

const PTAvailabilityScreen = () => {
  const [date, setDate] = useState(todayKey());
  const [addingPreset, setAddingPreset] = useState(null);
  // {key, slot, initialForm} while the add/edit sheet is open.
  const [sheet, setSheet] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // All slots of the DAYS-day window.
  const {data: slots, status, error, reload, refresh, refreshing} = useAsync(fetchSlots, {initialData: []});

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
      await reload();
    } catch (err) {
      Alert.alert('Không thêm được', err.message);
    } finally {
      setAddingPreset(null);
    }
  };

  const openSheet = (slot, initialForm) => {
    setSheet({key: Date.now(), slot, initialForm});
    setSheetOpen(true);
  };

  // Start a new slot where the last one ends, which is the common case.
  const openAdd = () => {
    const last = daySlots[daySlots.length - 1];
    const start = last ? timeUtils.formatTo24HourTime(last.endTime) : DEFAULT_START;
    openSheet(null, {startTime: start, endTime: fromMinutes(toMinutes(start) + 60)});
  };

  const openEdit = slot =>
    openSheet(slot, {
      startTime: timeUtils.formatTo24HourTime(slot.startTime),
      endTime: timeUtils.formatTo24HourTime(slot.endTime),
    });

  const saveSlot = useCallback(
    async form => {
      const payload = {
        startTime: timeUtils.createUtcIsoString(date, form.startTime),
        endTime: timeUtils.createUtcIsoString(date, form.endTime),
      };
      if (sheet?.slot) {
        await ptApi.updateAvailabilitySlot(sheet.slot._id, payload);
      } else {
        await ptApi.addAvailabilitySlot(payload);
      }
      setSheetOpen(false);
      reload();
    },
    [date, reload, sheet],
  );

  const remove = slot =>
    Alert.alert('Xóa khung giờ', `Xóa khung ${timeUtils.formatTimeRange(slot.startTime, slot.endTime)}?`, [
      {text: 'Hủy', style: 'cancel'},
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await ptApi.deleteAvailabilitySlot(slot._id);
            reload();
          } catch (err) {
            Alert.alert('Không xóa được', err.message);
          }
        },
      },
    ]);

  const dateLabel = formatBookingDate(timeUtils.createUtcIsoString(date, '12:00'));
  const freeCount = daySlots.filter(s => s.status === 'available').length;
  const quickAdd =
    presets.length > 0 ? (
      <QuickAddCard hours={presets} addingHour={addingPreset} onAdd={addPreset} onCustom={openAdd} />
    ) : null;

  const renderDay = () =>
    daySlots.length === 0 ? (
      <>
        <Card>
          <StateView
            compact
            icon={<CalendarAdd size={30} color={appColors.primary} />}
            title="Ngày này chưa có khung giờ"
            message="Thêm khung giờ rảnh để học viên có thể đặt lịch với bạn."
          />
        </Card>
        {quickAdd || <ButtonComponent text="Thêm khung giờ" type="primary" onPress={openAdd} fullWidth />}
      </>
    ) : (
      <>
        <Card>
          {daySlots.map((slot, index) => (
            <SlotTimelineItem
              key={slot._id}
              slot={slot}
              isLast={index === daySlots.length - 1}
              onEdit={openEdit}
              onDelete={remove}
            />
          ))}
        </Card>
        {quickAdd}
      </>
    );

  return (
    <Screen>
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
        refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <AvailabilityTotals {...totals} />

        <DateStrip value={date} onChange={setDate} days={DAYS} marks={marks} style={styles.strip} />

        <View style={styles.dayHeader}>
          <View style={styles.flex}>
            <TextComponent text={dateLabel} size={16} font={fontFamilies.semiBold} />
            <TextComponent
              text={
                daySlots.length > 0 ? `${daySlots.length} khung giờ • ${freeCount} còn trống` : 'Chưa có khung giờ'
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

        <AsyncView status={status} error={error} onRetry={reload} compact>
          {renderDay}
        </AsyncView>
      </ScrollView>

      {sheet ? (
        <SlotFormSheet
          key={sheet.key}
          visible={sheetOpen}
          title={sheet.slot ? 'Sửa khung giờ' : 'Thêm khung giờ'}
          subtitle={dateLabel}
          submitLabel={sheet.slot ? 'Lưu thay đổi' : 'Thêm khung giờ'}
          initialForm={sheet.initialForm}
          onSubmit={saveSlot}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </Screen>
  );
};

export default PTAvailabilityScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
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
});
