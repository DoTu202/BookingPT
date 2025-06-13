import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  Platform,
  ScrollView,
  FlatList,
} from 'react-native';
import React from 'react';
import {useDispatch} from 'react-redux';
import {authSelector} from '../../redux/reducers/authReducer';
import {globalStyles} from '../../styles/globalStyles';
import appColors from '../../constants/appColors';
import {useSelector} from 'react-redux';
import {
  RowComponent,
  TextComponent,
  CircleComponent,
  SpaceComponent,
  TagComponent,
  CategoriesList,
  TagBarComponent,
  PtItem
} from '../../components';

import {
  ArrowDown,
  HambergerMenu,
  Notification,
  SearchNormal1,
  Sort,
} from 'iconsax-react-native';
import {fontFamilies} from '../../constants/fontFamilies';


const ClientHomeScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);

  const itemEvent = {
    title: 'Personal Training Featured',
    description: 'Enjoy',
    location: 'Cau Giay, Hanoi',
    imageURL: '',
    users: [''],
    authorId: 'ptTrainer',
    startAt: Date.now(),
    endAt: Date.now(),
    date: Date.now(),

  }

  return (
    <View style={[globalStyles.container]}>
      <StatusBar barStyle={'light-content'} />
      <View
        style={{
          backgroundColor: appColors.primary,
          height: 180 + (Platform.OS === 'ios' ? 16 : 0),
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          padding: Platform.OS === 'android' ? StatusBar.currentHeight : 70,
          paddingHorizontal: 20,
        }}>
        <View style={{paddingHorizontal: 16}}>
          <RowComponent>
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <HambergerMenu color={appColors.white} size={24} />
            </TouchableOpacity>
            <View style={{flex: 1, alignItems: 'center'}}>
              <RowComponent>
                <TextComponent
                  text="Current Location"
                  color={appColors.white}
                  size={12}
                />
                <ArrowDown color={appColors.white} size={16} />
              </RowComponent>
              <TextComponent
                text="Cau Giay, Hanoi"
                flex={0}
                color={appColors.white}
                font={fontFamilies.bold}
                size={14}
              />
            </View>

            <CircleComponent color="rgba(255,255,255,0.2)" size={40}>
              <View>
                <Notification color={appColors.white} size={24} />
                <View
                  style={{
                    position: 'absolute',
                    borderRadius: 4,
                    borderWidth: 1,
                    width: 8,
                    height: 8,
                    backgroundColor: appColors.white,
                  }}
                />
              </View>
            </CircleComponent>
          </RowComponent>
          <SpaceComponent height={20} />
          <RowComponent>
            <RowComponent
              styles={{flex: 1}}
              onPress={() =>
                navigation.navigate('SearchPtScreen', {isFilter: false})
              }>
              <SearchNormal1
                color={appColors.white}
                size={20}
                style={{marginRight: 10}}
              />
              <View
                style={{
                  width: 1,
                  height: 18,
                  marginHorizontal: 12,
                  backgroundColor: appColors.white,
                }}
              />
              <TextComponent
                text="Search..."
                color={appColors.white}
                flex={1}
              />
            </RowComponent>
            <RowComponent
              onPress={() =>
                navigation.navigate('SearchPtScreen', {
                  isFilter: true,
                })
              }
              styles={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 100,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}>
              <CircleComponent size={20} color="transparent">
                <Sort size={20} color={appColors.white} />
              </CircleComponent>
              <SpaceComponent width={8} />
              <TextComponent text="Filters" color={appColors.white} />
            </RowComponent>
          </RowComponent>

          <SpaceComponent height={40} />
        </View>
        <View style={{marginBottom: -140}}>
          <CategoriesList isFill />
        </View>
      </View>
          
      <SpaceComponent height={120} />
      <ScrollView
        style={[
          {
            flex: 1,
            paddingTop: 40,
          },
        ]}>
        <TagBarComponent title="Featured Trainers" onPress={() => {}} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={Array.from({length: 8})}
          renderItem={({item}) => <PtItem type="card" item={itemEvent} />}
        />
      </ScrollView>
    </View>
  );
};

export default ClientHomeScreen;

const styles = StyleSheet.create({});
