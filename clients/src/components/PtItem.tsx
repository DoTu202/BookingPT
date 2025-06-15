import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import {CardComponent, TextComponent, SpaceComponent, RowComponent} from '.';
import appColors from '../constants/appColors';
import {Location, Star1} from 'iconsax-react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

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
  onPress?: (item: PTData) => void;
}

const PtItem = (props: Props) => {
  const {item, type, onPress} = props;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const renderSpecializations = () => {
    if (!item.specializations || item.specializations.length === 0) return null;
    
    return (
      <View style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: 4}}>
        {item.specializations.slice(0, 2).map((spec, index) => (
          <View
            key={index}
            style={{
              backgroundColor: appColors.primary + '20',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              marginRight: 4,
              marginBottom: 2,
            }}>
            <TextComponent
              text={spec.replace('_', ' ')}
              size={10}
              color={appColors.primary}
            />
          </View>
        ))}
        {item.specializations.length > 2 && (
          <TextComponent
            text={`+${item.specializations.length - 2} more`}
            size={10}
            color={appColors.gray}
          />
        )}
      </View>
    );
  };

  return (
    <CardComponent
      onPress={() => onPress && onPress(item.ptData || item)}
      styles={{width: Dimensions.get('window').width * 0.7, marginRight: 12}}>
      <ImageBackground
        style={{flex: 1, marginBottom: 12, height: 130, padding: 10}}
        source={
          item.imageURL 
            ? {uri: item.imageURL}
            : require('../../assets/images/Main.png')
        }
        imageStyle={{
          resizeMode: 'cover',
          borderRadius: 12,
        }}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 12,
          }}
        />
        <RowComponent justify="space-between" styles={{flex: 1}}>
          <View />
          {/* <CardComponent
            styles={{
              alignItems: 'center',
              width: 30,
              height: 30,
              justifyContent: 'center',
            }}>
            <MaterialIcons
              name="bookmark-border"
              color={appColors.white}
              size={20}
            />
          </CardComponent> */}
        </RowComponent>
        
        {/* Rating and Experience */}
        <View style={{position: 'absolute', bottom: 10, left: 10}}>
          {item.rating && item.rating > 0 && (
            <RowComponent styles={{marginBottom: 4}}>
              <Star1 size={14} color={appColors.yellow} variant="Bold" />
              <SpaceComponent width={4} />
              <TextComponent
                text={item.rating.toFixed(1)}
                size={12}
                color={appColors.white}
                font="bold"
              />
            </RowComponent>
          )}
          {item.experienceYears && item.experienceYears > 0 && (
            <TextComponent
              text={`${item.experienceYears}+ years exp`}
              size={10}
              color={appColors.white}
            />
          )}
        </View>
      </ImageBackground>
      
      <TextComponent text={item.title} title size={16} numberOfLines={1} />
      <SpaceComponent height={4} />
      <TextComponent 
        text={item.description} 
        size={12} 
        numberOfLines={2} 
        color={appColors.gray}
      />
      <SpaceComponent height={6} />
      
      <RowComponent justify="space-between">
        <RowComponent styles={{flex: 1}}>
          <Location size={14} color={appColors.gray} />
          <SpaceComponent width={4} />
          <TextComponent
            text={item.location}
            size={11}
            numberOfLines={1}
            flex={1}
            color={appColors.gray}
          />
        </RowComponent>
        {item.hourlyRate && (
          <TextComponent
            text={formatPrice(item.hourlyRate)}
            size={12}
            color={appColors.primary}
            font="bold"
          />
        )}
      </RowComponent>
      
      {renderSpecializations()}
    </CardComponent>
  );
};

export default PtItem;

const styles = StyleSheet.create({


});
