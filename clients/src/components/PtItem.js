import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Star1 } from 'iconsax-react-native';
import { TextComponent, RowComponent, SpaceComponent, CardComponent } from './index';
import appColors from '../constants/appColors';

const PtItem = ({ type = 'card', item, onPress }) => {
  const {
    title,
    description,
    location,
    imageURL,
    rating,
    hourlyRate,
    specializations,
    experienceYears
  } = item;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star1
          key={i}
          size={14}
          variant={i < fullStars ? 'Bold' : 'Outline'}
          color={i < fullStars ? appColors.warning : appColors.gray}
        />
      );
    }
    return stars;
  };

  const formatPrice = (price) => {
    if (!price) return '0';
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  if (type === 'card') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <CardComponent styles={styles.cardContainer}>
          <RowComponent>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: imageURL || 'https://via.placeholder.com/80x80?text=PT'
                }}
                style={styles.avatar}
                defaultSource={{ uri: 'https://via.placeholder.com/80x80?text=PT' }}
              />
            </View>

            <SpaceComponent width={16} />

            {/* Content */}
            <View style={styles.content}>
              <TextComponent
                text={title}
                size={18}
                font="Poppins-SemiBold"
                color={appColors.black}
                numberOfLines={1}
              />
              
              <SpaceComponent height={4} />
              
              <TextComponent
                text={description}
                size={14}
                color={appColors.gray}
                numberOfLines={2}
              />

              <SpaceComponent height={8} />

              {/* Rating */}
              <RowComponent>
                {renderStars(rating)}
                <SpaceComponent width={8} />
                <TextComponent
                  text={`${rating?.toFixed(1) || '0.0'} (${experienceYears || 0} years)`}
                  size={12}
                  color={appColors.gray}
                />
              </RowComponent>

              <SpaceComponent height={8} />

              {/* Specializations */}
              {specializations && specializations.length > 0 && (
                <View style={styles.specializationsContainer}>
                  {specializations.slice(0, 2).map((spec, index) => (
                    <View key={index} style={styles.specializationTag}>
                      <TextComponent
                        text={spec}
                        size={10}
                        color={appColors.primary}
                        font="Poppins-Medium"
                      />
                    </View>
                  ))}
                  {specializations.length > 2 && (
                    <TextComponent
                      text={`+${specializations.length - 2} more`}
                      size={10}
                      color={appColors.gray}
                    />
                  )}
                </View>
              )}

              <SpaceComponent height={8} />

              {/* Price and Location */}
              <RowComponent justify="space-between">
                <TextComponent
                  text={`${formatPrice(hourlyRate)} VND/hour`}
                  size={16}
                  font="Poppins-Bold"
                  color={appColors.primary}
                />
                <TextComponent
                  text={location}
                  size={12}
                  color={appColors.gray}
                  numberOfLines={1}
                />
              </RowComponent>
            </View>
          </RowComponent>
        </CardComponent>
      </TouchableOpacity>
    );
  }

  // List type (for future use)
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.listItem}>
        <RowComponent>
          <Image
            source={{
              uri: imageURL || 'https://via.placeholder.com/60x60?text=PT'
            }}
            style={styles.listAvatar}
          />
          <SpaceComponent width={12} />
          <View style={styles.listContent}>
            <TextComponent
              text={title}
              size={16}
              font="Poppins-SemiBold"
              color={appColors.black}
            />
            <TextComponent
              text={`${formatPrice(hourlyRate)} VND/hour`}
              size={14}
              color={appColors.primary}
              font="Poppins-Medium"
            />
          </View>
        </RowComponent>
      </View>
    </TouchableOpacity>
  );
};

export default PtItem;

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
    marginBottom: 0,
  },
  avatarContainer: {
    shadowColor: appColors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: appColors.gray2,
  },
  content: {
    flex: 1,
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  specializationTag: {
    backgroundColor: appColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: appColors.gray2,
  },
  listAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: appColors.gray2,
  },
  listContent: {
    flex: 1,
  },
});
