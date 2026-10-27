import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CloseCircle, Profile2User, SearchNormal1, Setting4} from 'iconsax-react-native';
import {
  ButtonComponent,
  ChipComponent,
  HeaderIconButton,
  InputComponent,
  PtItem,
  ScreenHeader,
  StateView,
  TextComponent,
} from '../../components';
import {toPtItem} from '../../components/PtItem';
import clientApi from '../../apis/clientApi';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {SPECIALIZATIONS} from '../../constants/labels';
import {radius, spacing} from '../../constants/theme';

const PAGE_SIZE = 10;

// One choice instead of separate "sort by" + "order" controls.
const SORT_OPTIONS = [
  {id: 'rating', label: 'Đánh giá cao', sortBy: 'rating', order: 'desc'},
  {id: 'price_asc', label: 'Giá thấp → cao', sortBy: 'hourlyRate', order: 'asc'},
  {id: 'price_desc', label: 'Giá cao → thấp', sortBy: 'hourlyRate', order: 'desc'},
  {id: 'experience', label: 'Nhiều kinh nghiệm', sortBy: 'experienceYears', order: 'desc'},
];

const EMPTY_FILTERS = {location: '', minRate: '', maxRate: '', sort: 'rating'};

const countActiveFilters = filters =>
  [filters.location, filters.minRate || filters.maxRate, filters.sort !== 'rating'].filter(
    Boolean,
  ).length;

const SearchPtScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [specialization, setSpecialization] = useState(route.params?.specialization || '');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(Boolean(route.params?.isFilter));

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Ignores responses from searches that were superseded while in flight.
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async pageNumber => {
      const sort = SORT_OPTIONS.find(option => option.id === filters.sort) || SORT_OPTIONS[0];
      const params = {
        pageNumber,
        pageSize: PAGE_SIZE,
        sortBy: sort.sortBy,
        order: sort.order,
      };
      if (query.trim()) {
        params.name = query.trim();
      }
      if (specialization) {
        params.specialization = specialization;
      }
      if (filters.location.trim()) {
        params.location = filters.location.trim();
      }
      if (filters.minRate) {
        params.minRate = Number(filters.minRate);
      }
      if (filters.maxRate) {
        params.maxRate = Number(filters.maxRate);
      }
      const response = await clientApi.searchPTs(params);
      return response.data;
    },
    [query, specialization, filters],
  );

  const load = useCallback(
    async ({refresh = false} = {}) => {
      const id = ++requestId.current;
      if (refresh) {
        setRefreshing(true);
      } else {
        setStatus('loading');
      }
      try {
        const data = await fetchPage(1);
        if (id !== requestId.current) {
          return;
        }
        setResults(Array.isArray(data?.data) ? data.data : []);
        setTotal(data?.count || 0);
        setPage(1);
        setPages(data?.pages || 1);
        setStatus('ready');
      } catch (err) {
        if (id === requestId.current) {
          setError(err.message);
          setStatus('error');
        }
      } finally {
        if (id === requestId.current) {
          setRefreshing(false);
        }
      }
    },
    [fetchPage],
  );

  // Debounce typing; filters and chips also go through here.
  useEffect(() => {
    const timer = setTimeout(load, query ? 400 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const loadMore = async () => {
    if (loadingMore || status !== 'ready' || page >= pages) {
      return;
    }
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const data = await fetchPage(page + 1);
      if (id === requestId.current) {
        setResults(prev => [...prev, ...(data?.data || [])]);
        setPage(page + 1);
      }
    } catch {
      // Keep what is already shown; scrolling again retries.
    } finally {
      setLoadingMore(false);
    }
  };

  const openFilters = () => {
    setDraftFilters(filters);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setShowFilters(false);
  };

  const resetAll = () => {
    setFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
    setSpecialization('');
    setQuery('');
  };

  const activeCount = countActiveFilters(filters);
  const hasAnyFilter = activeCount > 0 || specialization || query.trim();

  const renderContent = () => {
    if (status === 'loading' && !refreshing) {
      return <StateView type="loading" title="Đang tìm huấn luyện viên..." />;
    }
    if (status === 'error') {
      return <StateView type="error" message={error} onAction={() => load()} />;
    }
    return (
      <FlatList
        data={results}
        keyExtractor={item => item._id}
        renderItem={({item}) => (
          <PtItem
            type="list"
            item={toPtItem(item)}
            onPress={() => navigation.navigate('PTDetailScreen', {item})}
          />
        )}
        contentContainerStyle={[styles.list, {paddingBottom: insets.bottom + spacing.xl}]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({refresh: true})}
            colors={[appColors.primary]}
            tintColor={appColors.primary}
          />
        }
        ListHeaderComponent={
          results.length > 0 ? (
            <TextComponent
              text={`${total} huấn luyện viên`}
              size={13}
              color={appColors.textMuted}
              styles={styles.count}
            />
          ) : null
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={appColors.primary} style={styles.footer} /> : null
        }
        ListEmptyComponent={
          <StateView
            icon={<Profile2User size={30} color={appColors.primary} />}
            title="Không tìm thấy huấn luyện viên"
            message={
              hasAnyFilter
                ? 'Thử bỏ bớt bộ lọc hoặc tìm với từ khóa khác.'
                : 'Hiện chưa có huấn luyện viên nào nhận học viên.'
            }
            actionText={hasAnyFilter ? 'Xóa bộ lọc' : undefined}
            onAction={hasAnyFilter ? resetAll : undefined}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Tìm huấn luyện viên"
        onBack={() => navigation.goBack()}
        right={
          <View>
            <HeaderIconButton
              icon={<Setting4 size={20} color={appColors.white} />}
              onPress={openFilters}
              accessibilityLabel="Bộ lọc"
            />
            {activeCount > 0 ? (
              <View style={styles.filterBadge}>
                <TextComponent
                  text={String(activeCount)}
                  size={10}
                  font={fontFamilies.bold}
                  color={appColors.primary}
                />
              </View>
            ) : null}
          </View>
        }>
        <View style={styles.searchBox}>
          <SearchNormal1 size={18} color={appColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm theo tên huấn luyện viên"
            placeholderTextColor={appColors.placeholder}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Tìm theo tên"
          />
          {query ? (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              accessibilityLabel="Xóa từ khóa">
              <CloseCircle size={18} color={appColors.placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>
      </ScreenHeader>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          <ChipComponent
            label="Tất cả"
            selected={!specialization}
            onPress={() => setSpecialization('')}
          />
          {Object.entries(SPECIALIZATIONS).map(([key, label]) => (
            <ChipComponent
              key={key}
              label={label}
              selected={specialization === key}
              onPress={() => setSpecialization(specialization === key ? '' : key)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.flex}>{renderContent()}</View>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowFilters(false)}
            accessibilityLabel="Đóng bộ lọc"
          />
          <View style={[styles.sheet, {paddingBottom: insets.bottom + spacing.lg}]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <TextComponent text="Bộ lọc" size={18} font={fontFamilies.semiBold} />
              <ButtonComponent
                type="link"
                text="Đặt lại"
                onPress={() => setDraftFilters(EMPTY_FILTERS)}
              />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
              <TextComponent text="Sắp xếp" font={fontFamilies.semiBold} />
              <View style={styles.wrap}>
                {SORT_OPTIONS.map(option => (
                  <ChipComponent
                    key={option.id}
                    label={option.label}
                    selected={draftFilters.sort === option.id}
                    onPress={() => setDraftFilters(prev => ({...prev, sort: option.id}))}
                  />
                ))}
              </View>

              <InputComponent
                label="Khu vực"
                value={draftFilters.location}
                onChange={val => setDraftFilters(prev => ({...prev, location: val}))}
                placeholder="VD: Cầu Giấy, Quận 1, Hà Nội"
                autoCapitalize="words"
                allowClear
              />

              <View>
                <TextComponent
                  text="Giá mỗi giờ (₫)"
                  size={13}
                  font={fontFamilies.medium}
                  styles={styles.label}
                />
                <View style={styles.priceRow}>
                  <InputComponent
                    value={draftFilters.minRate}
                    onChange={val =>
                      setDraftFilters(prev => ({...prev, minRate: val.replace(/[^0-9]/g, '')}))
                    }
                    placeholder="Từ"
                    type="number-pad"
                    containerStyles={styles.flex}
                  />
                  <TextComponent text="–" color={appColors.textMuted} />
                  <InputComponent
                    value={draftFilters.maxRate}
                    onChange={val =>
                      setDraftFilters(prev => ({...prev, maxRate: val.replace(/[^0-9]/g, '')}))
                    }
                    placeholder="Đến"
                    type="number-pad"
                    containerStyles={styles.flex}
                  />
                </View>
              </View>
            </ScrollView>
            <ButtonComponent text="Áp dụng" type="primary" size="lg" onPress={applyFilters} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default SearchPtScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  flex: {
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
    fontFamily: fontFamilies.regular,
    color: appColors.text,
    paddingVertical: spacing.sm,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: appColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
  },
  count: {
    marginBottom: spacing.sm,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
  backdrop: {
    flex: 1,
    backgroundColor: appColors.overlay,
  },
  sheet: {
    backgroundColor: appColors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg + 4,
    maxHeight: '85%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: appColors.border,
    marginTop: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  sheetBody: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  label: {
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
