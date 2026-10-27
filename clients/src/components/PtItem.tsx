import React from 'react';
import {Image, StyleSheet, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import {Location, Star1} from 'iconsax-react-native';
import TextComponent from './TextComponent';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';
import {getSpecializationLabel} from '../constants/labels';
import {radius, shadow, spacing} from '../constants/theme';
import {formatCurrency, formatLocation} from '../utils/format';

interface PTData {
  _id: string;
  title: string;
  description: string;
  location: string;
  imageURL?: string;
  rating?: number;
  numReviews?: number;
  hourlyRate?: number;
  specializations?: string[];
  experienceYears?: number;
  ptData?: any;
}

interface Props {
  item: PTData;
  type: 'card' | 'list';
  size?: 'small' | 'medium' | 'large';
  onPress?: (item: any) => void;
}

// Maps a PT profile from the API (`/api/client/pt`) to the props PtItem shows.
export const toPtItem = (profile: any): PTData => ({
  _id: profile._id,
  title: profile.user?.username || 'Huấn luyện viên',
  description: profile.bio || '',
  location: formatLocation(profile.location),
  imageURL: profile.user?.photoUrl || '',
  rating: profile.rating || 0,
  numReviews: profile.numReviews || 0,
  hourlyRate: profile.hourlyRate || 0,
  specializations: profile.specializations || [],
  experienceYears: profile.experienceYears || 0,
  ptData: profile,
});

const CARD_WIDTH = {small: 0.45, medium: 0.55, large: 0.65};
// Keeps cards from stretching on tablets / landscape.
const CARD_MAX_WIDTH = 300;

const Avatar = ({uri, name, style}: {uri?: string; name: string; style: any}) =>
  uri ? (
    <Image source={{uri}} style={style} />
  ) : (
    <View style={[style, styles.avatarFallback]}>
      <TextComponent
        text={(name || 'P').charAt(0).toUpperCase()}
        size={26}
        font={fontFamilies.bold}
        color={appColors.primary}
      />
    </View>
  );

const Rating = ({rating, numReviews}: {rating?: number; numReviews?: number}) =>
  rating && rating > 0 ? (
    <View style={styles.inline}>
      <Star1 size={13} color={appColors.yellow} variant="Bold" />
      <TextComponent
        text={` ${rating.toFixed(1)}${numReviews ? ` (${numReviews})` : ''}`}
        size={12}
        font={fontFamilies.medium}
        color={appColors.text}
      />
    </View>
  ) : (
    <TextComponent text="Chưa có đánh giá" size={12} color={appColors.textMuted} />
  );

const PtItem = ({item, type, size = 'medium', onPress}: Props) => {
  const {width: windowWidth} = useWindowDimensions();
  const handlePress = () => onPress && onPress(item.ptData || item);
  const label = `${item.title}, ${formatCurrency(item.hourlyRate)} mỗi giờ`;

  if (type === 'card') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.card, {width: Math.min(windowWidth * CARD_WIDTH[size], CARD_MAX_WIDTH)}]}>
        <Avatar uri={item.imageURL} name={item.title} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <TextComponent text={item.title} font={fontFamilies.semiBold} size={15} numberOfLines={1} />
          <Rating rating={item.rating} numReviews={item.numReviews} />
          <View style={styles.inline}>
            <Location size={12} color={appColors.textMuted} />
            <TextComponent
              text={` ${item.location}`}
              size={12}
              color={appColors.textMuted}
              numberOfLines={1}
              styles={styles.flex}
            />
          </View>
          <TextComponent
            text={`${formatCurrency(item.hourlyRate)}/giờ`}
            size={14}
            font={fontFamilies.semiBold}
            color={appColors.primary}
          />
        </View>
      </TouchableOpacity>
    );
  }

  const specs = (item.specializations || []).slice(0, 2);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.listItem}>
      <Avatar uri={item.imageURL} name={item.title} style={styles.avatar} />
      <View style={styles.listContent}>
        <View style={styles.rowBetween}>
          <TextComponent
            text={item.title}
            size={16}
            font={fontFamilies.semiBold}
            numberOfLines={1}
            styles={styles.flex}
          />
          <Rating rating={item.rating} numReviews={item.numReviews} />
        </View>
        <View style={styles.inline}>
          <Location size={12} color={appColors.textMuted} />
          <TextComponent
            text={` ${item.location}${item.experienceYears ? ` • ${item.experienceYears} năm KN` : ''}`}
            size={12}
            color={appColors.textMuted}
            numberOfLines={1}
            styles={styles.flex}
          />
        </View>
        {specs.length > 0 ? (
          <View style={styles.tags}>
            {specs.map(spec => (
              <View key={spec} style={styles.tag}>
                <TextComponent
                  text={getSpecializationLabel(spec)}
                  size={11}
                  font={fontFamilies.medium}
                  color={appColors.primaryDark}
                />
              </View>
            ))}
          </View>
        ) : null}
        <TextComponent
          text={`${formatCurrency(item.hourlyRate)}/giờ`}
          size={15}
          font={fontFamilies.semiBold}
          color={appColors.primary}
        />
      </View>
    </TouchableOpacity>
  );
};

export default PtItem;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  avatarFallback: {
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    marginRight: spacing.md,
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: appColors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: appColors.surface,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: spacing.md,
    gap: 4,
  },
});
