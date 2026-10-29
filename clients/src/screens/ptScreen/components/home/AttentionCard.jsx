import React from 'react';
import {StyleSheet, View} from 'react-native';
import {ArrowRight2, TaskSquare} from 'iconsax-react-native';
import {Card, IconBox, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {spacing} from '../../../../constants/theme';

// What needs the PT now: pending requests and ended sessions to complete.
const AttentionCard = ({pending, toComplete, onPress}) => {
  const count = pending + toComplete;
  return (
    <Card variant="floating" onPress={onPress}>
      <View style={styles.row}>
        <IconBox size={46} color={count > 0 ? appColors.primary : appColors.successSoft}>
          <TaskSquare size={22} color={count > 0 ? appColors.white : appColors.success} variant="Bold" />
        </IconBox>
        <View style={styles.flex}>
          <TextComponent text={count > 0 ? 'Cần bạn xử lý' : 'Bạn đã xử lý hết'} size={16} font={fontFamilies.semiBold} />
          <TextComponent
            text={
              count > 0
                ? `${pending} yêu cầu chờ xác nhận • ${toComplete} buổi chờ hoàn thành`
                : 'Không có yêu cầu nào đang chờ.'
            }
            size={13}
            color={appColors.textMuted}
          />
        </View>
        <ArrowRight2 size={18} color={appColors.placeholder} />
      </View>
    </Card>
  );
};

export default AttentionCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
