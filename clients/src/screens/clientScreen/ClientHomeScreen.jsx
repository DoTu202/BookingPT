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
  Dimensions,
  Image,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {authSelector} from '../../redux/reducers/authReducer';
import {globalStyles} from '../../styles/globalStyles';
import appColors from '../../constants/appColors';
import {useSelector} from 'react-redux';
import clientApi from '../../apis/clientApi';
import {
  RowComponent,
  TextComponent,
  CircleComponent,
  SpaceComponent,
  TagComponent,
  CategoriesList,
  TagBarComponent,
  PtItem,
  SectionComponent,
} from '../../components';
import HeaderNotificationButton from '../../components/HeaderNotificationButton';
import NotificationBadge from '../../components/NotificationBadge';

import {
  ArrowDown,
  HambergerMenu,
  Notification,
  SearchNormal1,
  Sort,
} from 'iconsax-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {fontFamilies} from '../../constants/fontFamilies';

const {width} = Dimensions.get('window');

const ClientHomeScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);

  const [ptList, setPtList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeaturedPTs();
  }, []);

  const fetchFeaturedPTs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await clientApi.searchPTs({
        pageSize: 8,
      });

      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
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
    const locationString =
      item.location && item.location.district && item.location.city
        ? `${item.location.district}, ${item.location.city}`
        : 'Location not specified';

    return (
      <PtItem
        type="card"
        size="medium"
        item={{
          _id: item._id,
          title: item.user?.username || 'Personal Trainer',
          description: item.bio || 'Professional Personal Trainer',
          location: locationString,
          imageURL: item.user?.photoUrl || '',
          rating: item.rating || 0,
          hourlyRate: item.hourlyRate || 0,
          specializations: item.specializations || [],
          experienceYears: item.experienceYears || 0,
          ptData: item,
        }}
        onPress={() => navigation.navigate('PTDetailScreen', {item: item})}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />

      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          {/* Top Bar */}
          <RowComponent justify="space-between" styles={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              style={styles.menuButton}>
              <HambergerMenu color={appColors.white} size={24} />
            </TouchableOpacity>

            <View style={styles.locationContainer}>
              <RowComponent justify="center">
                <TextComponent
                  text="Current Location"
                  color={appColors.white}
                  size={12}
                  font={fontFamilies.regular}
                />
                <ArrowDown
                  color={appColors.white}
                  size={14}
                  style={styles.locationIcon}
                />
              </RowComponent>
              <TextComponent
                text="Cau Giay, Hanoi"
                color={appColors.white}
                font={fontFamilies.bold}
                size={16}
                styles={styles.locationText}
              />
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ClientBookings')}
                style={styles.actionButton}>
                <CircleComponent color="rgba(255,255,255,0.2)" size={40}>
                  <TextComponent text="📅" size={18} />
                </CircleComponent>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                style={styles.actionButton}>
                <CircleComponent color="rgba(255,255,255,0.2)" size={40}>
                  <View style={styles.notificationIconContainer}>
                    <Icon
                      name="notifications"
                      size={20}
                      color={appColors.white}
                    />
                    <NotificationBadge
                      size={14}
                      style={styles.notificationBadge}
                    />
                  </View>
                </CircleComponent>
              </TouchableOpacity>
            </View>
          </RowComponent>

          {/* Welcome Message */}
          <View style={styles.welcomeSection}>
            <TextComponent
              text={`Hello, ${auth.username || 'User'}! 👋`}
              color={appColors.white}
              size={24}
              font={fontFamilies.bold}
              styles={styles.welcomeText}
            />
            <TextComponent
              text="Ready for your workout today?"
              color="rgba(255,255,255,0.8)"
              size={16}
              font={fontFamilies.regular}
              styles={styles.welcomeSubtext}
            />
          </View>

          {/* Search Bar */}
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={() =>
              navigation.navigate('SearchPtScreen', {isFilter: false})
            }>
            <SearchNormal1
              color={appColors.text2}
              size={20}
              style={styles.searchIcon}
            />
            <TextComponent
              text="Search for trainers..."
              color={appColors.text2}
              size={16}
              flex={1}
              styles={styles.searchText}
            />
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('SearchPtScreen', {isFilter: true})
              }
              style={styles.filterButton}>
              <Sort size={18} color={appColors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <CategoriesList isFill />
        </View>
      </View>

      {/* Content Section */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.contentScrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}>
        {/* Quick Stats */}
        <SectionComponent>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <TextComponent text="💪" size={24} styles={styles.statIcon} />
              <TextComponent
                text="12"
                size={20}
                font={fontFamilies.bold}
                color={appColors.text}
              />
              <TextComponent
                text="Sessions"
                size={12}
                color={appColors.text2}
              />
            </View>
            <View style={styles.statCard}>
              <TextComponent text="🔥" size={24} styles={styles.statIcon} />
              <TextComponent
                text="2.4k"
                size={20}
                font={fontFamilies.bold}
                color={appColors.text}
              />
              <TextComponent
                text="Calories"
                size={12}
                color={appColors.text2}
              />
            </View>
            <View style={styles.statCard}>
              <TextComponent text="⏱️" size={24} styles={styles.statIcon} />
              <TextComponent
                text="18h"
                size={20}
                font={fontFamilies.bold}
                color={appColors.text}
              />
              <TextComponent
                text="Training"
                size={12}
                color={appColors.text2}
              />
            </View>
          </View>
        </SectionComponent>

        {/* Featured Trainers */}
        <SectionComponent>
          <RowComponent justify="space-between" styles={styles.sectionHeader}>
            <TextComponent
              text="Featured Trainers"
              size={20}
              font={fontFamilies.bold}
              color={appColors.text}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('SearchPtScreen')}>
              <TextComponent
                text="See All"
                size={14}
                font={fontFamilies.medium}
                color={appColors.primary}
              />
            </TouchableOpacity>
          </RowComponent>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
              <TextComponent
                text="Loading trainers..."
                color={appColors.text2}
                styles={styles.loadingText}
              />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <TextComponent
                text={error}
                color={appColors.danger}
                styles={styles.errorText}
              />
              <TouchableOpacity
                onPress={fetchFeaturedPTs}
                style={styles.retryButton}>
                <TextComponent
                  text="Retry"
                  color={appColors.white}
                  font={fontFamilies.medium}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={ptList}
              keyExtractor={item => `featured-${item._id}`}
              renderItem={renderPTItem}
              contentContainerStyle={styles.trainersList}
              ItemSeparatorComponent={() => (
                <View style={styles.trainerSeparator} />
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <TextComponent
                    text="No trainers available"
                    color={appColors.text2}
                  />
                </View>
              )}
            />
          )}
        </SectionComponent>

        <SpaceComponent height={100} />
      </ScrollView>
    </View>
  );
};

export default ClientHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.gray5,
  },

  // Header Styles
  headerContainer: {
    backgroundColor: appColors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuButton: {
    padding: 8,
    width: 70, // Fixed width to balance layout
  },
  locationContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  locationIcon: {
    marginLeft: 4,
  },
  locationText: {
    marginTop: 2,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70, // Fixed width to balance layout
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appColors.warning,
    borderWidth: 1,
    borderColor: appColors.white,
  },

  // Welcome Section
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    marginBottom: 4,
  },
  welcomeSubtext: {
    opacity: 0.9,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: appColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchText: {
    flex: 1,
  },
  filterButton: {
    padding: 8,
    backgroundColor: `${appColors.primary}15`,
    borderRadius: 12,
  },

  categoriesContainer: {
    marginTop: 10,
    marginBottom: -30,
  },

  contentContainer: {
    flex: 1,
    marginTop: 40,
  },
  contentScrollView: {
    paddingBottom: 100,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: appColors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: appColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 4,
  },

  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  notificationIconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 1,
  },

  // Trainers List
  trainersList: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  trainerSeparator: {
    width: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
