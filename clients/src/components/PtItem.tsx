import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import {CardComponent, TextComponent, SpaceComponent, RowComponent} from '.';
import appColors from '../constants/appColors';
import {Location, Star1} from 'iconsax-react-native';
import {Heart} from 'lucide-react-native';

interface PTData {
  _id: string;
  title: string;
  description: string;
  location: string;
  imageURL?: string;
  rating?: number;
  hourlyRate?: number;
  specializations?: string[];
  experienceYears?: number;
  ptData?: any;
}

interface Props {
  item: PTData;
  type: 'card' | 'list';
  size?: 'small' | 'medium' | 'large';
  onPress?: (item: PTData) => void;
}

const PtItem = (props: Props) => {
  const {item, type, size = 'medium', onPress} = props;

  // Define sizes based on prop
  const getCardWidth = () => {
    if (type === 'list') return '100%';
    
    const screenWidth = Dimensions.get('window').width;
    switch (size) {
      case 'small':
        return screenWidth * 0.45; // 45% for small cards (thon hơn nữa)
      case 'large':
        return screenWidth * 0.65;  // 65% for large cards (thon hơn nữa)
      default:
        return screenWidth * 0.55;  // 55% for medium cards (thon hơn nữa)
    }
  };

  // Debug log
  console.log('PtItem render:', {type, size, cardWidth: getCardWidth()});

  const getNumericCardWidth = () => {
    const screenWidth = Dimensions.get('window').width;
    switch (size) {
      case 'small':
        return screenWidth * 0.45; // 45% for small cards (thon hơn nữa)
      case 'large':
        return screenWidth * 0.65;  // 65% for large cards (thon hơn nữa)
      default:
        return screenWidth * 0.55;  // 55% for medium cards (thon hơn nữa)
    }
  };

  const formatPrice = (price: number) => {
    if (!price || price === 0) return 'Contact';
    return `${(price / 1000).toFixed(0)}K VND`;
  };

  // Debug log để kiểm tra props
  console.log('PtItem render:', { type, size, itemTitle: item.title });
  if (type === 'card') {
    console.log('Card width:', getCardWidth());
  }

  const renderSpecializations = () => {
    if (!item.specializations || item.specializations.length === 0) return null;
    
    const maxSpecs = type === 'list' ? 2 : (size === 'small' ? 2 : 3);
    
    return (
      <View style={[styles.specializationsContainer, type === 'list' && styles.specializationsListContainer]}>
        {item.specializations.slice(0, maxSpecs).map((spec, index) => (
          <View
            key={index}
            style={[
              styles.specializationTag,
              type === 'list' && styles.specializationTagList,
              { 
                paddingHorizontal: type === 'list' ? 6 : (size === 'small' ? 6 : 8),
                paddingVertical: type === 'list' ? 2 : (size === 'small' ? 2 : 3),
              }
            ]}>
            <TextComponent
              text={spec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              size={type === 'list' ? 9 : (size === 'small' ? 9 : 10)}
              color={appColors.primary}
              font="medium"
            />
          </View>
        ))}
        {item.specializations.length > maxSpecs && (
          <View style={[styles.specializationTag, styles.moreTag, type === 'list' && styles.specializationTagList]}>
            <TextComponent
              text={`+${item.specializations.length - maxSpecs}`}
              size={type === 'list' ? 9 : (size === 'small' ? 9 : 10)}
              color={appColors.gray}
              font="medium"
            />
          </View>
        )}
      </View>
    );
  };

  const renderCardType = () => (
    <TouchableOpacity 
      onPress={() => onPress && onPress(item.ptData || item)}
      style={[
        styles.cardContainer,
        {
          width: getCardWidth(),
          backgroundColor: appColors.white, 
        }
      ]}
      activeOpacity={0.9}
    >
      {/* Avatar and Info Section */}
      <View style={styles.cardContent}>
        {/* Avatar Section - Top */}
        <View style={styles.cardAvatarContainer}>
          <Image
            source={
              item.imageURL 
                ? {uri: item.imageURL}
                : require('../../assets/images/default.png')
            }
            style={styles.cardAvatar}
          />
          
          {/* Favorite Button */}
          <TouchableOpacity style={styles.cardFavoriteButton}>
            <Heart size={14} color={appColors.gray} />
          </TouchableOpacity>
          
          {/* Rating Badge on Avatar */}
          {item.rating && item.rating > 0 && (
            <View style={styles.cardRatingBadge}>
              <Star1 size={10} color={appColors.yellow} variant="Bold" />
              <TextComponent
                text={item.rating.toFixed(1)}
                size={9}
                color={appColors.white}
                font="bold"
                styles={{marginLeft: 1}}
              />
            </View>
          )}
        </View>

        <SpaceComponent height={12} />

        {/* Information Section */}
        <View style={styles.cardInfoContainer}>
          {/* Row 1: Name */}
          <TextComponent 
            text={item.title} 
            size={size === 'small' ? 14 : 15} 
            numberOfLines={1}
            font="bold"
            color={appColors.gray2}
            styles={{textAlign: 'center'}}
          />

          <SpaceComponent height={4} />

          {/* Row 2: Description */}
          <TextComponent 
            text={item.description} 
            size={size === 'small' ? 11 : 12} 
            numberOfLines={1} 
            color={appColors.gray}
            styles={{textAlign: 'center', lineHeight: 16}}
          />

          <SpaceComponent height={6} />

          {/* Row 3: Experience & Specialization */}
          <View style={styles.cardMiddleRow}>
            {item.experienceYears && item.experienceYears > 0 && (
              <TextComponent
                text={`${item.experienceYears} năm`}
                size={size === 'small' ? 10 : 11}
                color={appColors.gray}
                font="medium"
              />
            )}
            
            {item.specializations && item.specializations.length > 0 && item.experienceYears && (
              <TextComponent
                text=" • "
                size={11}
                color={appColors.gray}
              />
            )}
            
            {item.specializations && item.specializations.length > 0 && (
              <View style={styles.cardInlineSpecTag}>
                <TextComponent
                  text={item.specializations[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  size={size === 'small' ? 9 : 10}
                  color={appColors.primary}
                  font="medium"
                />
              </View>
            )}
          </View>

          <SpaceComponent height={6} />

          {/* Row 4: Location */}
          <RowComponent styles={{justifyContent: 'center', alignItems: 'center'}}>
            <Location size={size === 'small' ? 11 : 12} color={appColors.gray} />
            <SpaceComponent width={2} />
            <TextComponent
              text={item.location}
              size={2} 
              numberOfLines={1}
              color={appColors.gray}
              styles={{textAlign: 'center', maxWidth: getNumericCardWidth() - 40}}
            />
          </RowComponent>

          <SpaceComponent height={8} />

          {/* Row 5: Price (in đậm) */}
          <View style={styles.cardPriceContainer}>
            <TextComponent
              text={formatPrice(item.hourlyRate || 0)}
              size={size === 'small' ? 13 : 14}
              color={appColors.primary}
              font="bold"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListType = () => (
    <TouchableOpacity 
      onPress={() => onPress && onPress(item.ptData || item)}
      style={styles.listContainer}
      activeOpacity={0.8}
    >
      {/* Avatar Section - Left */}
      <View style={styles.avatarContainer}>
        <Image
          source={
            item.imageURL 
              ? {uri: item.imageURL}
              : require('../../assets/images/default.png')
          }
          style={styles.avatar}
        />
        
        {/* Rating Badge on Avatar */}
        {item.rating && item.rating > 0 && (
          <View style={styles.avatarRatingBadge}>
            <Star1 size={10} color={appColors.yellow} variant="Bold" />
            <TextComponent
              text={item.rating.toFixed(1)}
              size={9}
              color={appColors.white}
              font="bold"
              styles={{marginLeft: 1}}
            />
          </View>
        )}
      </View>

      {/* Information Section - Right */}
      <View style={styles.listContentContainer}>
        {/* Row 1: Name & Favorite */}
        <View style={styles.listRowContainer}>
          <TextComponent 
            text={item.title} 
            size={16} 
            numberOfLines={1}
            font="bold"
            color={appColors.gray2}
            styles={{flex: 1}}
          />
          <TouchableOpacity style={styles.listFavoriteButton}>
            <Heart size={16} color={appColors.gray} />
          </TouchableOpacity>
        </View>

        {/* Row 2: Description */}
        <View style={styles.listRowContainer}>
          <TextComponent 
            text={item.description} 
            size={13} 
            numberOfLines={1} 
            color={appColors.gray}
            styles={{lineHeight: 18}}
          />
        </View>

        {/* Row 3: Rating/Experience & Specializations (cùng 1 hàng) */}
        <View style={styles.listRowContainer}>
          <View style={styles.ratingExperienceRow}>
            {/* Rating */}
            {item.rating && item.rating > 0 && (
              <View style={styles.ratingContainer}>
                <Star1 size={12} color={appColors.yellow} variant="Bold" />
                <TextComponent
                  text={item.rating.toFixed(1)}
                  size={12}
                  color={appColors.gray2}
                  font="medium"
                  styles={{marginLeft: 2}}
                />
              </View>
            )}
            
            {/* Experience */}
            {item.experienceYears && item.experienceYears > 0 && (
              <View style={styles.bulletSeparator}>
                <TextComponent
                  text="•"
                  size={12}
                  color={appColors.gray}
                  styles={{marginHorizontal: 6}}
                />
                <TextComponent
                  text={`${item.experienceYears} năm`}
                  size={12}
                  color={appColors.gray}
                  font="medium"
                />
              </View>
            )}
            
            {/* Main Specialization */}
            {item.specializations && item.specializations.length > 0 && (
              <View style={styles.bulletSeparator}>
                <TextComponent
                  text="•"
                  size={12}
                  color={appColors.gray}
                  styles={{marginHorizontal: 6}}
                />
                <View style={styles.inlineSpecTag}>
                  <TextComponent
                    text={item.specializations[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    size={11}
                    color={appColors.primary}
                    font="medium"
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Row 4: Location (riêng dòng) */}
        <View style={styles.listRowContainer}>
          <RowComponent styles={{alignItems: 'center'}}>
            <Location size={12} color={appColors.gray} />
            <SpaceComponent width={4} />
            <TextComponent
              text={item.location}
              size={12}
              numberOfLines={1}
              color={appColors.gray}
              styles={{lineHeight: 16, maxWidth: Dimensions.get('window').width - 150}}
            />
          </RowComponent>
        </View>

        {/* Row 5: Price (riêng dòng, in đậm) */}
        <View style={styles.listRowContainer}>
          <View style={styles.listPriceContainer}>
            <TextComponent
              text={formatPrice(item.hourlyRate || 0)}
              size={15}
              color={appColors.primary}
              font="bold"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {type === 'card' ? renderCardType() : renderListType()}
    </>
  );
};

export default PtItem;

const styles = StyleSheet.create({
  // Card Styles - Refactored
  cardContainer: {
    backgroundColor: appColors.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    paddingVertical: 20,
    paddingHorizontal: 10,
    minHeight: 260, // Tăng height thêm nữa để dài hơn
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
  },
  cardAvatarContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  cardAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: appColors.gray4,
  },
  cardFavoriteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRatingBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.white,
  },
  cardInfoContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  cardInlineSpecTag: {
    backgroundColor: appColors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: appColors.primary + '30',
  },
  cardPriceContainer: {
    backgroundColor: appColors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.primary + '30',
  },

  // Legacy Card Styles (không dùng nữa)
  container: {
    backgroundColor: appColors.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
    backgroundColor: appColors.gray4,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contentContainer: {
    padding: 16,
    flex: 1,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceContainer: {
    backgroundColor: appColors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  specializationTag: {
    backgroundColor: appColors.primary + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.primary + '30',
  },
  moreTag: {
    backgroundColor: appColors.lightGray,
    borderColor: appColors.gray4,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  experienceBadge: {
    backgroundColor: appColors.success + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // List Styles
  listContainer: {
    backgroundColor: appColors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: appColors.lightGray,
    minHeight: 110,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: appColors.gray4,
  },
  avatarRatingBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.white,
  },
  listContentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  listRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    minHeight: 18,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listFavoriteButton: {
    padding: 4,
    marginLeft: 8,
  },
  ratingExperienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'nowrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineSpecTag: {
    backgroundColor: appColors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: appColors.primary + '30',
  },
  ratingExperienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainSpecContainer: {
    backgroundColor: appColors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: appColors.primary + '30',
  },
  specializationsListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  specializationTagList: {
    backgroundColor: appColors.primary + '10',
    borderColor: appColors.primary + '20',
  },
  listBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listPriceContainer: {
    backgroundColor: appColors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.primary + '30',
    alignSelf: 'flex-start',
  },
  listExperienceBadge: {
    backgroundColor: appColors.success + '10',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
