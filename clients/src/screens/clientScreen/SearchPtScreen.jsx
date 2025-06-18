import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  SectionComponent,
  RowComponent,
  TextComponent,
  ButtonComponent,
  InputComponent,
  SpaceComponent,
  PtItem,
  CardComponent,
} from '../../components';
import {
  ArrowLeft,
  SearchNormal1,
  Filter,
  Setting2,
  CloseCircle,
} from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import ptApi from '../../apis/ptApi';

const SearchPtScreen = ({navigation, route}) => {
  const {isFilter} = route.params || {isFilter: false};

  console.log('SearchPtScreen mounted with isFilter:', isFilter); // Debug log

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    specialization: '',
    location: '',
    minRate: '',
    maxRate: '',
    sortBy: 'rating',
  });

  const specializations = [
    'All',
    'YOGA',
    'CARDIO',
    'STRENGTH_TRAINING',
    'WEIGHT_LOSS',
    'MUSCLE_BUILDING',
    'PILATES',
    'FUNCTIONAL_TRAINING',
    'REHABILITATION',
    'GENERAL_FITNESS',
  ];

  const specializationLabels = {
    All: 'All',
    YOGA: 'Yoga',
    CARDIO: 'Cardio',
    STRENGTH_TRAINING: 'Strength Training',
    WEIGHT_LOSS: 'Weight Loss',
    MUSCLE_BUILDING: 'Muscle Building',
    PILATES: 'Pilates',
    FUNCTIONAL_TRAINING: 'Functional Training',
    REHABILITATION: 'Rehabilitation',
    GENERAL_FITNESS: 'General Fitness',
  };

  const locations = [
    'All',
    'Cau Giay',
    'Thanh Xuan',
    'Hoan Kiem',
    'Hai Ba Trung',
    'Dong Da',
    'Long Bien',
    'Nam Tu Liem',
    'Bac Tu Liem',
    'Hoang Mai',
    'Tu Liem',
    'Gia Lam',
    'Other',
    'District 1',
    'District 2',
    'District 3',
    'District 4',
    'District 5',
    'District 6',
    'District 7',
    'District 10',
    'Binh Thanh District',
    'Phu Nhuan District',
  ];

  const sortOptions = [
    {value: 'rating', label: 'Rating'},
    {value: 'hourlyRate', label: 'Price: Low to High'},
    {value: '-hourlyRate', label: 'Price: High to Low'},
    {value: 'experienceYears', label: 'Experience'},
  ];

  useEffect(() => {
    searchPTs();

    if (isFilter) {
      setTimeout(() => setShowFilters(true), 300);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        searchPTs();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters]);

  const searchPTs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (searchQuery) params.name = searchQuery;
      if (filters.specialization && filters.specialization !== 'All') {
        params.specialization = filters.specialization;
      }
      if (filters.location && filters.location !== 'All') {
        params.location = filters.location;
      }
      if (filters.minRate) params.minRate = filters.minRate;
      if (filters.maxRate) params.maxRate = filters.maxRate;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      console.log('Search params:', params);

      const response = await ptApi.searchPTs(params);

      if (response.data && response.data.data) {
        setSearchResults(response.data.data);
        console.log('Search results:', response.data.data.length, 'PTs found');
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching PTs:', error);
      setError('Failed to search trainers');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      specialization: '',
      location: '',
      minRate: '',
      maxRate: '',
      sortBy: 'rating',
    });
  };

  const renderPTItem = ({item}) => {
    // Convert location object to string
    const locationString = item.location && typeof item.location === 'object' 
      ? `${item.location.district}, ${item.location.city}` 
      : (item.location || 'Ha Noi');

    return (
      <PtItem
        type="list"
        item={{
          _id: item._id,
          title:
            item.user?.fullName || item.user?.username || 'Personal Trainer',
          description:
            item.bio || item.description || 'Professional Personal Trainer',
          location: locationString, // Convert object to string
          imageURL: item.user?.photoUrl || item.profileImage || item.avatar || '',
          rating: parseFloat(item.rating) || 0,
          hourlyRate: parseInt(item.hourlyRate) || 0,
          specializations: Array.isArray(item.specializations)
            ? item.specializations
            : [],
          experienceYears: parseInt(item.experienceYears) || 0,
          ptData: item,
        }}
        onPress={() => navigation.navigate('PTDetailScreen', {item})}
      />
    );
  };

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.filterModal}>
        {/* Filter Header */}
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <ArrowLeft size={24} color={appColors.black} />
          </TouchableOpacity>
          <TextComponent
            text="Filter & Sort"
            size={20}
            font="Poppins-Bold"
            color={appColors.black}
          />
          <TouchableOpacity onPress={clearFilters}>
            <TextComponent
              text="Clear"
              size={16}
              color={appColors.primary}
              font="Poppins-Medium"
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {/* Specialization Filter */}
          <SectionComponent>
            <TextComponent
              text="Specialization"
              size={16}
              font="Poppins-SemiBold"
              color={appColors.black}
            />
            <SpaceComponent height={12} />
            <View style={styles.chipContainer}>
              {specializations.map(spec => (
                <TouchableOpacity
                  key={spec}
                  style={[
                    styles.chip,
                    filters.specialization === spec && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setFilters(prev => ({
                      ...prev,
                      specialization: prev.specialization === spec ? '' : spec,
                    }))
                  }>
                  <TextComponent
                    text={specializationLabels[spec] || spec}
                    size={14}
                    color={
                      filters.specialization === spec
                        ? appColors.white
                        : appColors.gray
                    }
                    font={
                      filters.specialization === spec
                        ? 'Poppins-Medium'
                        : 'Poppins-Regular'
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          </SectionComponent>

          {/* Location Filter */}
          <SectionComponent>
            <TextComponent
              text="Location"
              size={16}
              font="Poppins-SemiBold"
              color={appColors.black}
            />
            <SpaceComponent height={12} />
            <View style={styles.chipContainer}>
              {locations.map(loc => (
                <TouchableOpacity
                  key={loc}
                  style={[
                    styles.chip,
                    filters.location === loc && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setFilters(prev => ({
                      ...prev,
                      location: prev.location === loc ? '' : loc,
                    }))
                  }>
                  <TextComponent
                    text={loc}
                    size={14}
                    color={
                      filters.location === loc
                        ? appColors.white
                        : appColors.gray
                    }
                    font={
                      filters.location === loc
                        ? 'Poppins-Medium'
                        : 'Poppins-Regular'
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          </SectionComponent>

          {/* Price Range */}
          <SectionComponent>
            <TextComponent
              text="Price Range (VND)"
              size={16}
              font="Poppins-SemiBold"
              color={appColors.black}
            />
            <SpaceComponent height={12} />
            <RowComponent>
              <View style={{flex: 1}}>
                <TextInput
                  style={styles.priceInput}
                  value={filters.minRate}
                  onChangeText={text =>
                    setFilters(prev => ({...prev, minRate: text}))
                  }
                  placeholder="Min price"
                  keyboardType="numeric"
                  placeholderTextColor={appColors.gray}
                />
              </View>
              <SpaceComponent width={16} />
              <View style={{flex: 1}}>
                <TextInput
                  style={styles.priceInput}
                  value={filters.maxRate}
                  onChangeText={text =>
                    setFilters(prev => ({...prev, maxRate: text}))
                  }
                  placeholder="Max price"
                  keyboardType="numeric"
                  placeholderTextColor={appColors.gray}
                />
              </View>
            </RowComponent>
          </SectionComponent>

          {/* Sort By */}
          <SectionComponent>
            <TextComponent
              text="Sort By"
              size={16}
              font="Poppins-SemiBold"
              color={appColors.black}
            />
            <SpaceComponent height={12} />
            {sortOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.sortOption}
                onPress={() =>
                  setFilters(prev => ({...prev, sortBy: option.value}))
                }>
                <TextComponent
                  text={option.label}
                  size={14}
                  color={
                    filters.sortBy === option.value
                      ? appColors.primary
                      : appColors.black
                  }
                  font={
                    filters.sortBy === option.value
                      ? 'Poppins-SemiBold'
                      : 'Poppins-Regular'
                  }
                />
                <View
                  style={[
                    styles.radioButton,
                    filters.sortBy === option.value &&
                      styles.radioButtonSelected,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </SectionComponent>
        </ScrollView>

        <View style={styles.filterFooter}>
          <ButtonComponent
            text={loading ? 'Applying...' : 'Apply Filters'}
            type="primary"
            disabled={loading}
            onPress={() => {
              setShowFilters(false);
              searchPTs();
            }}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={appColors.primary}
        translucent={false}
      />
      {/* Custom Header */}
      <View style={styles.header}>
          <RowComponent justify="space-between" styles={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerButton}>
              <ArrowLeft size={24} color={appColors.white} />
            </TouchableOpacity>
            <TextComponent
              text="Find Trainers"
              size={20}
              font="Poppins-Bold"
              color={appColors.white}
            />
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              style={styles.headerButton}>
              <Filter size={24} color={appColors.white} />
            </TouchableOpacity>
          </RowComponent>

          <SpaceComponent height={16} />

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <SearchNormal1 size={18} color={appColors.gray} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search trainers by name..."
              placeholderTextColor={appColors.gray}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}>
                <CloseCircle size={18} color={appColors.gray} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appColors.primary} />
              <SpaceComponent height={16} />
              <TextComponent
                text="Searching for trainers..."
                color={appColors.gray}
              />
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <TextComponent
                text="⚠️"
                size={48}
                styles={{textAlign: 'center'}}
              />
              <SpaceComponent height={16} />
              <TextComponent
                text="Something went wrong"
                size={18}
                font="Poppins-SemiBold"
                color={appColors.gray}
                styles={{textAlign: 'center'}}
              />
              <SpaceComponent height={8} />
              <TextComponent
                text={error}
                size={14}
                color={appColors.gray}
                styles={{textAlign: 'center'}}
              />
              <SpaceComponent height={20} />
              <TouchableOpacity style={styles.retryButton} onPress={searchPTs}>
                <TextComponent
                  text="Try Again"
                  size={16}
                  color={appColors.primary}
                  font="Poppins-Medium"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Results Header */}
              <SectionComponent>
                <RowComponent justify="space-between">
                  <TextComponent
                    text={`${searchResults.length} trainers found`}
                    size={16}
                    font="Poppins-SemiBold"
                    color={appColors.black}
                  />
                  <TouchableOpacity onPress={() => setShowFilters(true)}>
                    <RowComponent>
                      <Setting2 size={16} color={appColors.primary} />
                      <SpaceComponent width={4} />
                      <TextComponent
                        text="Filters"
                        size={14}
                        color={appColors.primary}
                        font="Poppins-Medium"
                      />
                    </RowComponent>
                  </TouchableOpacity>
                </RowComponent>
              </SectionComponent>

              {/* Results List */}
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={item => item._id}
                  renderItem={renderPTItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.resultsList}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <SearchNormal1 size={64} color={appColors.gray} />
                  <SpaceComponent height={16} />
                  <TextComponent
                    text="No trainers found"
                    size={18}
                    font="Poppins-SemiBold"
                    color={appColors.gray}
                    styles={{textAlign: 'center'}}
                  />
                  <SpaceComponent height={8} />
                  <TextComponent
                    text="Try adjusting your search criteria or filters"
                    size={14}
                    color={appColors.gray}
                    styles={{textAlign: 'center'}}
                  />
                  <SpaceComponent height={20} />
                  <ButtonComponent
                    text="Clear All Filters"
                    type="link"
                    onPress={clearFilters}
                  />
                </View>
              )}
            </>
          )
        }
      </View>

      <FilterModal />
    </View>
  );
};

export default SearchPtScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  header: {
    backgroundColor: appColors.primary,
    paddingTop: 60, // Safe area for status bar
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: appColors.black,
    marginLeft: 8,
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.primary,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: appColors.gray2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: appColors.black,
  },
  filterModal: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: appColors.gray2,
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: appColors.gray2,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: appColors.primary,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: appColors.gray2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: appColors.gray,
  },
  radioButtonSelected: {
    borderColor: appColors.primary,
    backgroundColor: appColors.primary,
  },
  filterFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: appColors.gray2,
  },
});
