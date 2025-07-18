import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import {TextComponent, SpaceComponent, RowComponent} from '.';
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

  const formatPrice = (price: number) => {
    if (!price || price === 0) return 'Contact';
    return `${(price / 1000).toFixed(0)}K VND`;
  };

  const getCardWidth = () => {
    if (type === 'list') return '100%';
    const screenWidth = Dimensions.get('window').width;
    switch (size) {
      case 'small':
        return screenWidth * 0.45;
      case 'large':
        return screenWidth * 0.65;
      default:
        return screenWidth * 0.55;
    }
  };

  const renderSeparator = (key: string) => (
    <TextComponent key={key} text=" • " size={12} color={appColors.gray} />
  );

  const renderListDetails = () => {
    const details = [];

    // 1. Add Rating
    if (item.rating && item.rating > 0) {
      details.push(
        <RowComponent key="rating" styles={{alignItems: 'center'}}>
          <Star1 size={12} color={appColors.yellow} variant="Bold" />
          <TextComponent
            text={item.rating.toFixed(1)}
            size={12}
            color={appColors.gray2}
            font="medium"
            styles={{marginLeft: 2}}
          />
        </RowComponent>,
      );
    }

    // 2. Add Experience
    if (item.experienceYears && item.experienceYears > 0) {
      details.push(
        <TextComponent
          key="exp"
          text={`${item.experienceYears} năm`}
          size={12}
          color={appColors.gray}
          font="medium"
        />,
      );
    }

    // 3. Add Main Specialization
    if (item.specializations && item.specializations.length > 0) {
      details.push(
        <View key="spec" style={styles.inlineSpecTag}>
          <TextComponent
            text={item.specializations[0]
              .replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase())}
            size={11}
            color={appColors.primary}
            font="medium"
          />
        </View>,
      );
    }

    // Render the details array with separators in between
    return (
      <RowComponent styles={{alignItems: 'center'}}>
        {details.map((detail, index) => (
          <React.Fragment key={index}>
            {detail}
            {index < details.length - 1 && renderSeparator(`sep-${index}`)}
          </React.Fragment>
        ))}
      </RowComponent>
    );
  };

  // Main Render Functions

  const renderCardType = () => {
    return (
      <TouchableOpacity
        onPress={() => onPress && onPress(item.ptData || item)}
        style={[styles.cardContainer, {width: getCardWidth()}]}
        activeOpacity={0.8}>
        <Image
          source={
            item.imageURL
              ? {uri: item.imageURL}
              : require('../../assets/images/default.png')
          }
          style={styles.cardImage}
        />
        <View style={styles.cardContent}>
          <TextComponent
            text={item.title}
            font="bold"
            size={14}
            numberOfLines={1}
          />
          <SpaceComponent height={4} />
          <RowComponent styles={{alignItems: 'center'}}>
            <Star1 size={12} color={appColors.yellow} variant="Bold" />
            <TextComponent
              text={` ${item.rating?.toFixed(1) || 'N/A'}`}
              size={12}
              color={appColors.gray2}
              styles={{marginLeft: 2}}
            />
          </RowComponent>
          <SpaceComponent height={4} />
          <RowComponent styles={{alignItems: 'center'}}>
            <Location size={12} color={appColors.gray} />
            <TextComponent
              text={` ${item.location}`}
              size={12}
              color={appColors.gray}
              styles={{marginLeft: 4, flex: 1}}
              numberOfLines={1}
            />
          </RowComponent>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListType = () => (
    <TouchableOpacity
      onPress={() => onPress && onPress(item.ptData || item)}
      style={styles.listContainer}
      activeOpacity={0.8}>
      <Image
        source={
          item.imageURL
            ? {uri: item.imageURL}
            : require('../../assets/images/default.png')
        }
        style={styles.avatar}
      />
      <View style={styles.listContentContainer}>
        <RowComponent justify="space-between">
          <TextComponent
            text={item.title}
            size={16}
            font="bold"
            styles={{flex: 1}}
            numberOfLines={1}
          />
          <TouchableOpacity style={styles.listFavoriteButton}>
            <Heart size={16} color={appColors.gray} />
          </TouchableOpacity>
        </RowComponent>

        <TextComponent
          text={item.description}
          size={13}
          numberOfLines={1}
          color={appColors.gray}
        />

        {/* USE THE NEW, SAFE RENDER FUNCTION HERE */}
        {renderListDetails()}

        <RowComponent styles={{alignItems: 'center'}}>
          <Location size={12} color={appColors.gray} />
          <SpaceComponent width={4} />
          <TextComponent
            text={item.location}
            size={12}
            color={appColors.gray}
            numberOfLines={1}
          />
        </RowComponent>

        <View style={styles.listPriceContainer}>
          <TextComponent
            text={formatPrice(item.hourlyRate || 0)}
            size={15}
            color={appColors.primary}
            font="bold"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return type === 'list' ? renderListType() : renderCardType();
};

export default PtItem;

const styles = StyleSheet.create({
  // --- List Styles ---
  listContainer: {
    backgroundColor: appColors.white,
    padding: 12,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: appColors.gray5,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
  },
  listContentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listFavoriteButton: {
    paddingLeft: 8,
  },
  inlineSpecTag: {
    backgroundColor: `${appColors.primary}1A`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  listPriceContainer: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },

   cardContainer: {
    borderRadius: 16,
    backgroundColor: appColors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
  },
});
