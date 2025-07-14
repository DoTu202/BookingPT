import React, {useState, useEffect, useCallback} from 'react';
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
  RefreshControl,
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
  ArrowSwapVertical,
} from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import clientApi from '../../apis/clientApi';
import {fontFamilies} from '../../constants/fontFamilies';

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
    order: 'desc',
  });
  const [refreshing, setRefreshing] = useState(false);

  // Searc h PTs when the screen loads or when searchQuery or filters change
  useEffect(() => {
    const handler = setTimeout(() => {
      searchPTs();
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, filters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    searchPTs().finally(() => {
      setRefreshing(false);
    });
  }, [searchQuery, filters]);

  const toggleSortOrder = () => {
    setFilters(prev => ({
      ...prev,
      order: prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const searchPTs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};

      if (searchQuery.trim()) {
        params.name = searchQuery.trim();
      }

      // Handle filters
      if (filters.specialization && filters.specialization.trim() !== '') {
        params.specialization = filters.specialization.trim();
      }

      if (filters.location && filters.location.trim() !== '') {
        params.location = filters.location.trim();
      }

      if (filters.minRate && !isNaN(parseFloat(filters.minRate))) {
        params.minRate = parseFloat(filters.minRate);
      }

      if (filters.maxRate && !isNaN(parseFloat(filters.maxRate))) {
        params.maxRate = parseFloat(filters.maxRate);
      }

      // Add sorting parameters
      if (filters.sortBy) {
        params.sortBy = filters.sortBy;
        params.order = filters.order;
      }

      params.pageSize = 8;

      console.log(
        'SearchPtScreen: Search params:',
        JSON.stringify(params, null, 2),
      );

      const response = await clientApi.searchPTs(params);
      console.log('SearchPtScreen: API response received');

      if (response.data && Array.isArray(response.data.data)) {
        console.log(
          `SearchPtScreen: Found ${response.data.data.length} results`,
        );
        setSearchResults(response.data.data);
      } else {
        console.log('SearchPtScreen: No results or unexpected format');
        setSearchResults([]);
        if (response.data && response.data.message) {
          setError(response.data.message);
        }
      }
    } catch (error) {
      console.error('SearchPtScreen: Error searching PTs:', error);
      setError('Failed to search trainers. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const renderPTItem = ({item, index}) => {
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

    return (
      <PtItem
        type="list"
        item={ptItemData}
        onPress={() => {
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
              font={fontFamilies.bold}
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
                font={fontFamilies.semiBold}
                color={appColors.gray2}
              />
              <TextInput
                style={styles.filterInput}
                value={filters.specialization}
                onChangeText={text =>
                  setFilters({...filters, specialization: text})
                }
                placeholder="e.g., yoga, weight_loss, cardio"
                placeholderTextColor={appColors.gray}
              />
              <TextComponent
                text="Enter specialization exactly (e.g., yoga, weight_loss)"
                size={12}
                color={appColors.gray}
                styles={{marginTop: 4}}
              />
            </View>

            <View style={styles.filterSection}>
              <TextComponent
                text="Location"
                size={14}
                font={fontFamilies.semiBold}
                color={appColors.gray2}
              />
              <TextInput
                style={styles.filterInput}
                value={filters.location}
                onChangeText={text => setFilters({...filters, location: text})}
                placeholder="e.g., District 1, Ho Chi Minh City"
                placeholderTextColor={appColors.gray}
              />
              <TextComponent
                text="Enter district name or city name"
                size={12}
                color={appColors.gray}
                styles={{marginTop: 4}}
              />
            </View>

            <View style={styles.filterSection}>
              <TextComponent
                text="Price Range (VND)"
                size={14}
                font={fontFamilies.semiBold}
                color={appColors.gray2}
              />
              <RowComponent>
                <TextInput
                  style={[styles.filterInput, {flex: 1, marginRight: 8}]}
                  value={filters.minRate}
                  onChangeText={text => setFilters({...filters, minRate: text})}
                  placeholder="Min"
                  placeholderTextColor={appColors.gray}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.filterInput, {flex: 1, marginLeft: 8}]}
                  value={filters.maxRate}
                  onChangeText={text => setFilters({...filters, maxRate: text})}
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
                font={fontFamilies.semiBold}
                color={appColors.gray2}
              />
              <View style={styles.sortOptions}>
                {[
                  {id: 'rating', label: 'Rating'},
                  {id: 'hourlyRate', label: 'Price'},
                  {id: 'experienceYears', label: 'Experience'},
                ].map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.sortOption,
                      filters.sortBy === option.id && styles.sortOptionActive,
                    ]}
                    onPress={() => setFilters({...filters, sortBy: option.id})}>
                    <TextComponent
                      text={option.label}
                      size={13}
                      color={
                        filters.sortBy === option.id
                          ? appColors.white
                          : appColors.gray
                      }
                      font={
                        filters.sortBy === option.id
                          ? fontFamilies.medium
                          : fontFamilies.regular
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <RowComponent justify="space-between" styles={{marginTop: 16}}>
                <TextComponent
                  text="Sort Order"
                  size={14}
                  font={fontFamilies.semiBold}
                  color={appColors.gray2}
                />
                <TouchableOpacity
                  style={styles.orderToggle}
                  onPress={() =>
                    setFilters(prev => ({
                      ...prev,
                      order: prev.order === 'asc' ? 'desc' : 'asc',
                    }))
                  }>
                  <RowComponent>
                    <ArrowSwapVertical size={16} color={appColors.primary} />
                    <SpaceComponent width={4} />
                    <TextComponent
                      text={
                        filters.order === 'asc' ? 'Ascending' : 'Descending'
                      }
                      size={13}
                      color={appColors.primary}
                      font={fontFamilies.medium}
                    />
                  </RowComponent>
                </TouchableOpacity>
              </RowComponent>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() =>
                setFilters({
                  specialization: '',
                  location: '',
                  minRate: '',
                  maxRate: '',
                  sortBy: 'rating',
                  order: 'desc',
                })
              }>
              <TextComponent
                text="Clear All"
                size={14}
                color={appColors.gray}
                font={fontFamilies.medium}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => {
                setShowFilters(false);
                searchPTs(); // Gọi ngay lập tức để áp dụng bộ lọc
              }}>
              <TextComponent
                text="Apply Filters"
                size={14}
                color={appColors.white}
                font={fontFamilies.semiBold}
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
            font={fontFamilies.bold}
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
            <TextComponent text={error} color={appColors.danger} />
            <SpaceComponent height={12} />
            <TouchableOpacity
              onPress={() => searchPTs()}
              style={styles.retryButton}>
              <TextComponent
                text="Retry"
                color={appColors.primary}
                font={fontFamilies.medium}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <SectionComponent>
              <RowComponent justify="space-between">
                <TextComponent
                  text={`${searchResults.length} trainers found`}
                  font={fontFamilies.semiBold}
                />
                <RowComponent>
                  <TouchableOpacity
                    onPress={toggleSortOrder}
                    style={styles.sortOrderButton}>
                    <ArrowSwapVertical
                      size={16}
                      color={appColors.primary}
                      style={{
                        transform: [
                          {rotate: filters.order === 'asc' ? '0deg' : '180deg'},
                        ],
                      }}
                    />
                  </TouchableOpacity>
                  <SpaceComponent width={8} />
                  <TouchableOpacity onPress={() => setShowFilters(true)}>
                    <RowComponent>
                      <Filter size={16} color={appColors.primary} />
                      <SpaceComponent width={4} />
                      <TextComponent
                        text="Filters"
                        color={appColors.primary}
                        font={fontFamilies.medium}
                      />
                    </RowComponent>
                  </TouchableOpacity>
                </RowComponent>
              </RowComponent>

              {/* Hiển thị các bộ lọc đang được áp dụng */}
              {(filters.specialization ||
                filters.location ||
                filters.minRate ||
                filters.maxRate) && (
                <View style={styles.activeFiltersContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <RowComponent>
                      {filters.specialization && (
                        <View style={styles.activeFilterTag}>
                          <TextComponent
                            text={`Specialization: ${filters.specialization}`}
                            size={12}
                            color={appColors.primary}
                          />
                        </View>
                      )}
                      {filters.location && (
                        <View style={styles.activeFilterTag}>
                          <TextComponent
                            text={`Location: ${filters.location}`}
                            size={12}
                            color={appColors.primary}
                          />
                        </View>
                      )}
                      {(filters.minRate || filters.maxRate) && (
                        <View style={styles.activeFilterTag}>
                          <TextComponent
                            text={`Price: ${filters.minRate || '0'} - ${
                              filters.maxRate || 'max'
                            }`}
                            size={12}
                            color={appColors.primary}
                          />
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.clearFiltersTag}
                        onPress={() =>
                          setFilters({
                            specialization: '',
                            location: '',
                            minRate: '',
                            maxRate: '',
                            sortBy: 'rating',
                            order: 'desc',
                          })
                        }>
                        <TextComponent
                          text="Clear All"
                          size={12}
                          color={appColors.danger}
                        />
                      </TouchableOpacity>
                    </RowComponent>
                  </ScrollView>
                </View>
              )}
            </SectionComponent>

            <FlatList
              data={searchResults}
              keyExtractor={(item, index) =>
                item._id?.toString() || index.toString()
              }
              renderItem={renderPTItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[appColors.primary]}
                />
              }
              ListEmptyComponent={() =>
                !loading && (
                  <View style={styles.emptyContainer}>
                    <TextComponent
                      text="No trainers match your criteria."
                      font={fontFamilies.medium}
                    />
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
    fontFamily: fontFamilies.regular,
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
    minHeight: 300,
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
    borderBottomColor: appColors.gray5,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterSection: {
    marginVertical: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: appColors.gray5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    fontSize: 14,
    color: appColors.gray2,
    fontFamily: fontFamilies.regular,
  },
  sortOptions: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: appColors.gray5,
    marginRight: 8,
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: appColors.primary,
  },
  orderToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${appColors.primary}15`,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: appColors.gray5,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.gray5,
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: appColors.primary,
  },
  activeFiltersContainer: {
    marginTop: 12,
  },
  activeFilterTag: {
    backgroundColor: `${appColors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  clearFiltersTag: {
    backgroundColor: `${appColors.danger}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortOrderButton: {
    padding: 8,
    backgroundColor: `${appColors.primary}15`,
    borderRadius: 8,
  },
});
