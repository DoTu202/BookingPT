import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  SectionComponent,
  RowComponent,
  TextComponent,
  ButtonComponent,
  SpaceComponent,
  PtItem,
} from '../../components';
import {
  ArrowLeft,
  SearchNormal1,
  Filter,
  CloseCircle,
  Setting2,
} from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import clientApi from '../../apis/clientApi';

const SearchPtScreen = ({navigation, route}) => {
  const {isFilter: initialFilterState} = route.params || {isFilter: false};

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(initialFilterState);
  const [filters, setFilters] = useState({
    specialization: '',
    location: '',
    minRate: '',
    maxRate: '',
    sortBy: 'rating',
  });

  // Simplified useEffect for searching
  useEffect(() => {
    const handler = setTimeout(() => {
      searchPTs();
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, filters]);

  const searchPTs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build search parameters
      const params = {name: searchQuery};
      if (filters.specialization && filters.specialization !== 'All')
        params.specialization = filters.specialization;
      if (filters.location && filters.location !== 'All')
        params.location = filters.location;
      if (filters.minRate) params.minRate = filters.minRate;
      if (filters.maxRate) params.maxRate = filters.maxRate;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      console.log('Search params:', params);

      const response = await clientApi.searchPTs(params);
      console.log('API response:', response.data);

      if (response.data && Array.isArray(response.data.data)) {
        setSearchResults(response.data.data);
        console.log('Search results count:', response.data.data.length);
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

  const renderPTItem = ({item, index}) => {
    console.log(`Rendering item ${index}:`, item);

    // Xử lý location an toàn hơn
    let locationString = 'Location not set';
    if (item.location) {
      if (typeof item.location === 'string') {
        locationString = item.location;
      } else if (typeof item.location === 'object') {
        if (item.location.district && item.location.city) {
          locationString = `${item.location.district}, ${item.location.city}`;
        } else if (item.location.city) {
          locationString = item.location.city;
        } else if (item.location.district) {
          locationString = item.location.district;
        }
      }
    }

    const ptItemData = {
      _id: item._id,
      title: item.user?.username || 'Personal Trainer',
      description: item.bio || 'Professional Personal Trainer',
      location: locationString,
      imageURL: item.user?.photoUrl || '',
      rating: item.averageRating || item.rating || 0,
      hourlyRate: item.hourlyRate || 0,
      specializations: item.specializations || [],
      experienceYears: item.experienceYears || 0,
      ptData: item,
    };

    console.log('PT item data:', ptItemData);

    return (
      <PtItem
        type="list"
        item={ptItemData}
        onPress={() => {
          console.log('PT item pressed:', item);
          navigation.navigate('PTDetailScreen', {item});
        }}
      />
    );
  };

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TextComponent
              text="Filters"
              size={18}
              font="Poppins-Bold"
              color={appColors.gray2}
            />
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <CloseCircle size={24} color={appColors.gray} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterContent}>
            <View style={styles.filterSection}>
              <TextComponent
                text="Specialization"
                size={14}
                font="Poppins-SemiBold"
                color={appColors.gray2}
              />
              <TextInput
                style={styles.filterInput}
                value={filters.specialization}
                onChangeText={(text) => setFilters({...filters, specialization: text})}
                placeholder="e.g., weight_loss, muscle_building"
                placeholderTextColor={appColors.gray}
              />
            </View>

            <View style={styles.filterSection}>
              <TextComponent
                text="Location"
                size={14}
                font="Poppins-SemiBold"
                color={appColors.gray2}
              />
              <TextInput
                style={styles.filterInput}
                value={filters.location}
                onChangeText={(text) => setFilters({...filters, location: text})}
                placeholder="e.g., District 1, Ho Chi Minh City"
                placeholderTextColor={appColors.gray}
              />
            </View>

            <View style={styles.filterSection}>
              <TextComponent
                text="Price Range (VND)"
                size={14}
                font="Poppins-SemiBold"
                color={appColors.gray2}
              />
              <RowComponent>
                <TextInput
                  style={[styles.filterInput, {flex: 1, marginRight: 8}]}
                  value={filters.minRate}
                  onChangeText={(text) => setFilters({...filters, minRate: text})}
                  placeholder="Min"
                  placeholderTextColor={appColors.gray}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.filterInput, {flex: 1, marginLeft: 8}]}
                  value={filters.maxRate}
                  onChangeText={(text) => setFilters({...filters, maxRate: text})}
                  placeholder="Max"
                  placeholderTextColor={appColors.gray}
                  keyboardType="numeric"
                />
              </RowComponent>
            </View>

            <View style={styles.filterSection}>
              <TextComponent
                text="Sort By"
                size={14}
                font="Poppins-SemiBold"
                color={appColors.gray2}
              />
              <View style={styles.sortOptions}>
                {['rating', 'hourlyRate', 'experienceYears'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.sortOption,
                      filters.sortBy === option && styles.sortOptionActive,
                    ]}
                    onPress={() => setFilters({...filters, sortBy: option})}>
                    <TextComponent
                      text={option === 'rating' ? 'Rating' : option === 'hourlyRate' ? 'Price' : 'Experience'}
                      size={13}
                      color={filters.sortBy === option ? appColors.white : appColors.gray}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => setFilters({
                specialization: '',
                location: '',
                minRate: '',
                maxRate: '',
                sortBy: 'rating',
              })}>
              <TextComponent
                text="Clear All"
                size={14}
                color={appColors.gray}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}>
              <TextComponent
                text="Apply Filters"
                size={14}
                color={appColors.white}
                font="Poppins-SemiBold"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      
      {/* Header */}
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

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
            <SpaceComponent height={12} />
            <TextComponent text="Searching trainers..." />
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <TextComponent text={error} color={appColors.red} />
            <SpaceComponent height={12} />
            <TouchableOpacity
              onPress={() => searchPTs()}
              style={styles.retryButton}>
              <TextComponent text="Retry" color={appColors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <SectionComponent>
              <RowComponent justify="space-between">
                <TextComponent
                  text={`${searchResults.length} trainers found`}
                  font="Poppins-SemiBold"
                />
                <TouchableOpacity onPress={() => setShowFilters(true)}>
                  <RowComponent>
                    <Setting2 size={16} color={appColors.primary} />
                    <SpaceComponent width={4} />
                    <TextComponent text="Filters" color={appColors.primary} />
                  </RowComponent>
                </TouchableOpacity>
              </RowComponent>
            </SectionComponent>

            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => item._id?.toString() || index.toString()}
              renderItem={renderPTItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
              ListEmptyComponent={() =>
                !loading && (
                  <View style={styles.emptyContainer}>
                    <TextComponent text="No trainers match your criteria." />
                    <SpaceComponent height={8} />
                    <TextComponent 
                      text="Try adjusting your search terms or filters." 
                      size={12}
                      color={appColors.gray}
                    />
                  </View>
                )
              }
            />
          </>
        )}
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
    paddingTop: 60,
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: appColors.black,
    marginLeft: 8,
    height: 48,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.primary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: appColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: appColors.lightGray,
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: appColors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    fontSize: 14,
    color: appColors.gray2,
  },
  sortOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: appColors.lightGray,
    marginRight: 8,
  },
  sortOptionActive: {
    backgroundColor: appColors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: appColors.lightGray,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.lightGray,
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: appColors.primary,
  },
});