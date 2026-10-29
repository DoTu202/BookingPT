import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Star1} from 'iconsax-react-native';
import {Card, ProgressBar, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {radius, spacing} from '../../../../constants/theme';

// All-time rating: average badge and a bar per star count.
const RatingCard = ({rating}) => {
  const max = Math.max(1, ...Object.values(rating.distribution));
  return (
    <Card
      title="Đánh giá"
      subtitle={rating.count > 0 ? `${rating.count} đánh giá từ trước đến nay` : 'Chưa có đánh giá'}
      right={
        <View style={styles.badge}>
          <Star1 size={16} color={appColors.warning} variant="Bold" />
          <TextComponent
            text={rating.count > 0 ? Number(rating.average).toFixed(1) : '—'}
            size={16}
            font={fontFamilies.bold}
          />
        </View>
      }>
      {[5, 4, 3, 2, 1].map(stars => (
        <View key={stars} style={styles.row}>
          <TextComponent text={String(stars)} size={12} font={fontFamilies.medium} styles={styles.label} />
          <Star1 size={12} color={appColors.warning} variant="Bold" />
          <ProgressBar value={rating.distribution[stars] / max} color={appColors.warning} style={styles.flex} />
          <TextComponent
            text={String(rating.distribution[stars])}
            size={12}
            color={appColors.textMuted}
            styles={styles.count}
          />
        </View>
      ))}
    </Card>
  );
};

export default RatingCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: appColors.warningSoft,
  },
  label: {
    width: 10,
  },
  count: {
    width: 24,
    textAlign: 'right',
  },
});
