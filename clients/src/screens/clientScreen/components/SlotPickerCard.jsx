import React from 'react';
import {StyleSheet} from 'react-native';
import {Calendar} from 'iconsax-react-native';
import {
  AsyncView,
  Card,
  ChipComponent,
  DateStrip,
  RowComponent,
  StateView,
  TextComponent,
} from '../../../components';
import appColors from '../../../constants/appColors';
import {fontFamilies} from '../../../constants/fontFamilies';
import {spacing} from '../../../constants/theme';
import {timeUtils} from '../../../utils/timeUtils';

// Day strip + the trainer's free slots that day; `children` render under the
// slots (e.g. the notes field once a slot is picked).
const SlotPickerCard = ({days, date, onChangeDate, slots, status, error, onRetry, selectedSlot, onSelectSlot, children}) => (
  <Card>
    <TextComponent text="Chọn ngày" font={fontFamilies.semiBold} size={16} />
    <DateStrip value={date} onChange={onChangeDate} days={days} />

    <TextComponent text="Khung giờ trống" font={fontFamilies.semiBold} size={16} />
    <AsyncView status={status} error={error} onRetry={onRetry} compact>
      {() =>
        slots.length === 0 ? (
          <StateView
            compact
            icon={<Calendar size={28} color={appColors.primary} />}
            title="Không có khung giờ trống"
            message="Hãy chọn một ngày khác."
          />
        ) : (
          <RowComponent wrap gap={spacing.sm}>
            {slots.map(slot => (
              <ChipComponent
                key={slot._id}
                label={timeUtils.formatTimeRange(slot.startTime, slot.endTime)}
                selected={selectedSlot?._id === slot._id}
                onPress={() => onSelectSlot(selectedSlot?._id === slot._id ? null : slot)}
                styles={styles.chip}
              />
            ))}
          </RowComponent>
        )
      }
    </AsyncView>
    {children}
  </Card>
);

export default SlotPickerCard;

const styles = StyleSheet.create({
  chip: {
    minWidth: 130,
  },
});
