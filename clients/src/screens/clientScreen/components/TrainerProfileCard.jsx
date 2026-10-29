import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Location, Star1, Warning2} from 'iconsax-react-native';
import {
  Avatar,
  Banner,
  Card,
  IconText,
  RowComponent,
  StatGroup,
  Tag,
  TextComponent,
} from '../../../components';
import appColors from '../../../constants/appColors';
import {fontFamilies} from '../../../constants/fontFamilies';
import {getSpecializationLabel} from '../../../constants/labels';
import {spacing} from '../../../constants/theme';
import {formatCurrency, formatLocation} from '../../../utils/format';

// Trainer summary on the detail screen: photo, rating, area, key numbers,
// booking notice, bio and specializations.
const TrainerProfileCard = ({profile, acceptingClients, hasPricing}) => {
  const name = profile.user?.username || 'Huấn luyện viên';
  return (
    <Card>
      <View style={styles.header}>
        <Avatar uri={profile.user?.photoUrl} name={name} size={84} />
        <View style={[styles.flex, styles.details]}>
          <TextComponent text={name} size={20} font={fontFamilies.bold} numberOfLines={2} />
          <IconText
            icon={<Star1 size={15} color={appColors.yellow} variant="Bold" />}
            text={
              profile.numReviews > 0
                ? `${Number(profile.rating).toFixed(1)} • ${profile.numReviews} đánh giá`
                : 'Chưa có đánh giá'
            }
          />
          <IconText
            icon={<Location size={15} color={appColors.textMuted} />}
            text={formatLocation(profile.location)}
          />
        </View>
      </View>

      <StatGroup
        variant="inset"
        items={[
          {label: 'Kinh nghiệm', value: `${profile.experienceYears || 0} năm`},
          {label: 'Buổi đã dạy', value: String(profile.totalSessions || 0)},
          {label: 'Mỗi giờ', value: hasPricing ? formatCurrency(profile.hourlyRate) : '—', highlight: true},
        ]}
      />

      {!acceptingClients || !hasPricing ? (
        <Banner
          tone="warning"
          icon={<Warning2 size={18} color={appColors.warning} />}
          message={
            !acceptingClients
              ? 'Huấn luyện viên này hiện không nhận học viên mới.'
              : 'Huấn luyện viên chưa cập nhật giá nên chưa thể đặt lịch.'
          }
        />
      ) : null}

      {profile.bio ? (
        <View style={styles.block}>
          <TextComponent text="Giới thiệu" font={fontFamilies.semiBold} size={15} />
          <TextComponent text={profile.bio} size={14} color={appColors.textMuted} styles={styles.bio} />
        </View>
      ) : null}

      {profile.specializations?.length ? (
        <View style={styles.block}>
          <TextComponent text="Chuyên môn" font={fontFamilies.semiBold} size={15} />
          <RowComponent wrap gap={spacing.sm}>
            {profile.specializations.map(spec => (
              <Tag key={spec} label={getSpecializationLabel(spec)} />
            ))}
          </RowComponent>
        </View>
      ) : null}
    </Card>
  );
};

export default TrainerProfileCard;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  details: {
    gap: 4,
  },
  block: {
    gap: spacing.sm,
  },
  bio: {
    lineHeight: 21,
  },
});
