import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ImageBackground,
} from 'react-native'; // Sửa: Dimension -> Dimensions
import React from 'react';
import {CardComponent, TextComponent} from '.';
import {PtFeature} from '../model/PtFeature';
import {RowComponent} from './';
import appColors from '../constants/appColors';
import {Location} from 'iconsax-react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';


interface Props {
  item: PtFeature;
  type: 'card' | 'list';
  onPress?: (item: PtFeature) => void;
}

const PtItem = (props: Props) => {
  const {item, type, onPress} = props;

  const navigation : any = useNavigation();

  return (
    <CardComponent
      onPress={() => navigation.navigate('PtDetailScreen', {item})}
      styles={{width: Dimensions.get('window').width * 0.6}}>
      <ImageBackground
        style={{flex: 1, marginBottom: 12, height: 130, padding: 10}}
        source={require('../../assets/images/Main.png')}
        imageStyle={{
          resizeMode: 'cover',
          borderRadius: 12,
        }}>
        <RowComponent justify="flex-end">
          <CardComponent
            style={{
              alignItems: 'center',
              width: 15,
              height: 15,
              justifyContent: 'center',
            }}>
            <MaterialIcons
              name="bookmark"
              color={appColors.black}
              size={20}
              style={styles}
            />
          </CardComponent>
        </RowComponent>
      </ImageBackground>
      <TextComponent text={item.title} title size={18} numberOfLines={1} />
      <RowComponent>
        <Location size={18} color={appColors.black} />
        <TextComponent
          text={item.location}
          size={12}
          numberOfLines={1}
          flex={1}
          appColor={appColors.gray}
        />
      </RowComponent>
    </CardComponent>
  );
};

export default PtItem;

const styles = StyleSheet.create({


});
