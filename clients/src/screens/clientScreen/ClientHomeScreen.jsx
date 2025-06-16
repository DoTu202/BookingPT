import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  Platform,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {authSelector} from '../../redux/reducers/authReducer';
import {globalStyles} from '../../styles/globalStyles';
import appColors from '../../constants/appColors';
import {useSelector} from 'react-redux';
import ptApi from '../../apis/ptApi';
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
  
  // State for PT data
  const [ptList, setPtList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch PT data when component mounts
  useEffect(() => {
    fetchFeaturedPTs();
  }, []);

  const fetchFeaturedPTs = async () => {
    try {
      setLoading(true);
      setError(null);
      

      const response = await ptApi.searchPTs({
        limit: 8 // Limit to 8 featured trainers
      });
      
      console.log('API Response:', response); // Debug log
      console.log('Response data:', response.data); // Debug log
      
      // Handle response properly - response.data contains the server response
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setPtList(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setPtList(response.data);
      } else {
        console.log('Unexpected response format:', response);
        setError('Failed to load trainers');
      }
    } catch (err) {
      console.error('Error fetching PTs:', err);
      setError('Error loading trainers');
    } finally {
      setLoading(false);
    }
  };

  const renderPTItem = ({item}) => {
    // Convert location object to string
    const locationString = item.location && typeof item.location === 'object' 
      ? `${item.location.district}, ${item.location.city}` 
      : (item.location || 'Ha Noi');

    return (
      <PtItem 
        type="card"
        size="medium" // Use medium size for featured trainers
        item={{
          _id: item._id,
          title: `${item.user?.username || 'Personal Trainer'}`,
          description: item.bio || 'Professional Personal Trainer',
          location: locationString, // Convert object to string
          imageURL: item.user?.photoUrl || '',
          rating: item.rating || 0,
          hourlyRate: item.hourlyRate || 0,
          specializations: item.specializations || [],
          experienceYears: item.experienceYears || 0,
          ptData: item // Pass full PT data
        }}
        onPress={() => navigation.navigate('PTDetailScreen', { item: item })} // Truyền object gốc từ API
      />
    );
  };

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
          <RowComponent justify="space-between" styles={{alignItems: 'center'}}>
            {/* Left side - Menu button */}
            <View style={{width: 100, alignItems: 'flex-start'}}>
              <TouchableOpacity onPress={() => navigation.openDrawer()}>
                <HambergerMenu color={appColors.white} size={24} />
              </TouchableOpacity>
            </View>

            {/* Center - Location */}
            <View style={{position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1}}>
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

            {/* Right side - Action buttons */}
            <View style={{width: 100, alignItems: 'flex-end', zIndex: 2}}>
              <RowComponent>
                <TouchableOpacity 
                  onPress={() => {
                    console.log('📅 Calendar button pressed - navigating to ClientBookings');
                    navigation.navigate('ClientBookings');
                  }}
                  style={{
                    marginRight: 8,
                    padding: 4, // Expand touch area
                    zIndex: 2   // Above location
                  }}
                >
                  <CircleComponent color="rgba(255,255,255,0.2)" size={36}>
                    <TextComponent text="📅" size={18} />
                  </CircleComponent>
                </TouchableOpacity>
                
                <CircleComponent color="rgba(255,255,255,0.2)" size={36}>
                  <View>
                    <Notification color={appColors.white} size={20} />
                    <View
                      style={{
                        position: 'absolute',
                        borderRadius: 4,
                        borderWidth: 1,
                        width: 6,
                        height: 6,
                        backgroundColor: appColors.white,
                        top: -2,
                        right: -2,
                      }}
                    />
                  </View>
                </CircleComponent>
              </RowComponent>
            </View>
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
        {loading ? (
          <View style={{padding: 20, alignItems: 'center'}}>
            <ActivityIndicator size="large" color={appColors.primary} />
            <SpaceComponent height={10} />
            <TextComponent text="Loading trainers..." color={appColors.gray} />
          </View>
        ) : error ? (
          <View style={{padding: 20, alignItems: 'center'}}>
            <TextComponent text={error} color={appColors.danger} />
            <SpaceComponent height={10} />
            <TouchableOpacity 
              onPress={fetchFeaturedPTs}
              style={{
                backgroundColor: appColors.primary,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8
              }}
            >
              <TextComponent text="Retry" color={appColors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            key="featured-trainers-v3" // Force re-render với key unique
            horizontal
            showsHorizontalScrollIndicator={false}
            data={ptList}
            keyExtractor={(item) => `${item._id}-card-v3`} // Update keyExtractor
            renderItem={renderPTItem}
            contentContainerStyle={{
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
            ItemSeparatorComponent={() => <View style={{width: 4}} />}
            ListEmptyComponent={() => (
              <View style={{padding: 20, alignItems: 'center'}}>
                <TextComponent text="No trainers available" color={appColors.gray} />
              </View>
            )}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default ClientHomeScreen;

const styles = StyleSheet.create({});
