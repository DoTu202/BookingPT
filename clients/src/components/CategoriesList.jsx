import {View, FlatList, TouchableOpacity, Dimensions} from 'react-native';
import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {RowComponent, SpaceComponent, TextComponent} from '.';
import appColors from '../constants/appColors';

const {width} = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2.8;

const CategoriesList = ({selectedCategory, onSelectCategory}) => {
  const categories = [
    {
      key: '1',
      id: 'weight_loss',
      IconComponent: FontAwesome5,
      iconName: 'fire',
      title: 'Weight Loss',
      subtitle: 'Fat Burning',
      color: '#FF6B6B',
      lightColor: '#FFE5E5',
    },
    {
      key: '2',
      id: 'muscle_building',
      IconComponent: FontAwesome5,
      iconName: 'dumbbell',
      title: 'Muscle Building',
      subtitle: 'Build Mass',
      color: '#4ECDC4',
      lightColor: '#E5F9F6',
    },
    {
      key: '3',
      id: 'cardio',
      IconComponent: FontAwesome5,
      iconName: 'heartbeat',
      title: 'Cardio',
      subtitle: 'Heart Health',
      color: '#45B7D1',
      lightColor: '#E5F4FB',
    },
    {
      key: '4',
      id: 'yoga',
      IconComponent: MaterialCommunityIcons,
      iconName: 'meditation',
      title: 'Yoga',
      subtitle: 'Flexibility',
      color: '#96CEB4',
      lightColor: '#F0F8F4',
    },
    {
      key: '5',
      id: 'strength',
      IconComponent: MaterialIcons,
      iconName: 'fitness-center',
      title: 'Strength',
      subtitle: 'Power Training',
      color: '#FECA57',
      lightColor: '#FEF5E7',
    },
    {
      key: '6',
      id: 'general',
      IconComponent: MaterialIcons,
      iconName: 'sports-gymnastics',
      title: 'General',
      subtitle: 'All-Round',
      color: '#FF9FF3',
      lightColor: '#FDF2FF',
    },
    {
      key: '7',
      id: 'functional_training',
      IconComponent: MaterialIcons,
      iconName: 'accessibility-new',
      title: 'Functional',
      subtitle: 'Movement',
      color: '#54A0FF',
      lightColor: '#EBF4FF',
    },
    {
      key: '8',
      id: 'rehabilitation',
      IconComponent: FontAwesome5,
      iconName: 'user-md',
      title: 'Rehabilitation',
      subtitle: 'Recovery',
      color: '#5F27CD',
      lightColor: '#F0EBFF',
    },
    {
      key: '9',
      id: 'nutrition',
      IconComponent: MaterialCommunityIcons,
      iconName: 'nutrition',
      title: 'Nutrition',
      subtitle: 'Diet Plan',
      color: '#00D2D3',
      lightColor: '#E5FBFB',
    },
    {
      key: '10',
      id: 'pilates',
      IconComponent: MaterialCommunityIcons,
      iconName: 'yoga',
      title: 'Pilates',
      subtitle: 'Core & Balance',
      color: '#E056FD',
      lightColor: '#F8E5FF',
    },
  ];

  const renderCategory = ({item}) => {
    const isSelected = selectedCategory?.id === item.id;
    const {IconComponent, iconName} = item;

    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          {
            backgroundColor: isSelected ? item.color : appColors.white,
            borderColor: isSelected ? item.color : '#E8E8E8',
            transform: [{scale: isSelected ? 1.02 : 1}],
          },
        ]}
        onPress={() => onSelectCategory && onSelectCategory(item)}
        activeOpacity={0.85}>
        {/* Background gradient */}
        {!isSelected && (
          <View
            style={[styles.gradientBg, {backgroundColor: item.lightColor}]}
          />
        )}

        {/* Icon container */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isSelected
                ? 'rgba(255,255,255,0.2)'
                : item.lightColor,
            },
          ]}>
          <IconComponent
            name={iconName}
            size={22}
            color={isSelected ? appColors.white : item.color}
          />
        </View>

        <SpaceComponent height={10} />

        {/* Title */}
        <TextComponent
          text={item.title}
          size={12}
          weight="bold"
          color={isSelected ? appColors.white : appColors.black}
          style={{textAlign: 'center', width: '100%'}}
          numberOfLines={2}
        />

        {/* Subtitle */}
        <TextComponent
          text={item.subtitle}
          size={10}
          color={isSelected ? 'rgba(255,255,255,0.8)' : appColors.gray}
          style={{textAlign: 'center', marginTop: 2, width: '100%'}}
          numberOfLines={1}
        />

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectedDot}>
            <Ionicons name="checkmark" size={10} color={appColors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={item => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <SpaceComponent width={12} />}
      />
    </View>
  );
};

export default CategoriesList;

const styles = {
  container: {},
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  categoryCard: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: CARD_WIDTH,
    height: 110,
    borderWidth: 1.5,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    opacity: 0.15,
  },
  iconContainer: {
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
};
