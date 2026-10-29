import React from 'react';
import {StyleSheet, View} from 'react-native';
import TextComponent from '../ui/TextComponent';
import {fontFamilies} from '../../constants/fontFamilies';
import {getBookingStatus} from '../../constants/labels';
import {radius, spacing} from '../../constants/theme';

// Booking status pill with a coloured dot (colour is never the only cue:
// the label is always shown).
const StatusBadge = ({status}) => {
  const {label, color, soft} = getBookingStatus(status);
  return (
    <View style={[styles.badge, {backgroundColor: soft}]}>
      <View style={[styles.dot, {backgroundColor: color}]} />
      <TextComponent text={label} size={12} font={fontFamilies.semiBold} color={color} />
    </View>
  );
};

export default StatusBadge;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
});
