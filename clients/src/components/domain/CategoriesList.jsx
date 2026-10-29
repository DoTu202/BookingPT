import React from 'react';
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TextComponent from '../ui/TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {SPECIALIZATIONS} from '../../constants/labels';
import {radius, shadow, spacing} from '../../constants/theme';

// Icon + accent colour per specialization (keys match the server enum).
const CATEGORY_STYLE = {
  weight_loss: {Icon: FontAwesome5, name: 'fire', color: '#F0544F'},
  muscle_building: {Icon: FontAwesome5, name: 'dumbbell', color: '#14A39A'},
  cardio: {Icon: FontAwesome5, name: 'heartbeat', color: '#2E8FD6'},
  yoga: {Icon: MaterialCommunityIcons, name: 'meditation', color: '#3FA37A'},
  strength: {Icon: MaterialIcons, name: 'fitness-center', color: '#E69B00'},
  general: {Icon: MaterialIcons, name: 'sports-gymnastics', color: '#D9468F'},
  functional_training: {Icon: MaterialIcons, name: 'accessibility-new', color: '#3B6FE0'},
  rehabilitation: {Icon: FontAwesome5, name: 'user-md', color: '#6D3FD6'},
  nutrition: {Icon: MaterialCommunityIcons, name: 'food-apple', color: '#0E9EA0'},
  pilates: {Icon: MaterialCommunityIcons, name: 'yoga', color: '#B23FD6'},
};

const CATEGORIES = Object.entries(SPECIALIZATIONS).map(([id, title]) => ({
  id,
  title,
  ...CATEGORY_STYLE[id],
}));

const CategoriesList = ({selectedCategory, onSelectCategory}) => (
  <FlatList
    data={CATEGORIES}
    keyExtractor={item => item.id}
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.list}
    renderItem={({item}) => {
      const selected = selectedCategory?.id === item.id;
      const {Icon} = item;
      return (
        <TouchableOpacity
          style={[styles.card, selected && {backgroundColor: item.color}]}
          onPress={() => onSelectCategory?.(item)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={item.title}>
          <View style={[styles.icon, {backgroundColor: `${item.color}1F`}]}>
            <Icon name={item.name} size={20} color={selected ? appColors.white : item.color} />
          </View>
          <TextComponent
            text={item.title}
            size={12}
            font={fontFamilies.semiBold}
            color={selected ? appColors.white : appColors.text}
            numberOfLines={2}
            styles={styles.title}
          />
        </TouchableOpacity>
      );
    }}
  />
);

export default CategoriesList;

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  card: {
    width: 92,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
    backgroundColor: appColors.surface,
    ...shadow.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    textAlign: 'center',
    lineHeight: 16,
  },
});
