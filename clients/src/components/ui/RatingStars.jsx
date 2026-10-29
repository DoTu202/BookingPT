import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Star1} from 'iconsax-react-native';
import appColors from '../../constants/appColors';

// Row of `max` stars with the first `rating` filled.
const RatingStars = ({rating = 0, max = 5, size = 12}) => (
  <View style={styles.row} accessibilityLabel={`${rating}/${max} sao`}>
    {Array.from({length: max}, (_, i) => (
      <Star1 key={i} size={size} color={i < rating ? appColors.yellow : appColors.border} variant="Bold" />
    ))}
  </View>
);

export default RatingStars;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
