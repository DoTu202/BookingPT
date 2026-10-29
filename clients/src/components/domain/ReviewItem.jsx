import React from 'react';
import {StyleSheet, View} from 'react-native';
import RatingStars from '../ui/RatingStars';
import TextComponent from '../ui/TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {spacing} from '../../constants/theme';
import {formatRelativeTime} from '../../utils/format';

// One client review: name + stars, comment, optional relative date. Rows are
// separated by a line, so it is meant for a list inside a Card.
const ReviewItem = ({review, showDate}) => (
  <View style={styles.review}>
    <View style={styles.top}>
      <TextComponent
        text={review.client?.username || 'Học viên'}
        font={fontFamilies.medium}
        numberOfLines={1}
        styles={styles.flex}
      />
      <RatingStars rating={review.rating} />
    </View>
    {review.comment ? <TextComponent text={review.comment} size={13} color={appColors.textMuted} /> : null}
    {showDate ? (
      <TextComponent text={formatRelativeTime(review.createdAt)} size={11} color={appColors.placeholder} />
    ) : null}
  </View>
);

export default ReviewItem;

const styles = StyleSheet.create({
  review: {
    gap: 2,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
