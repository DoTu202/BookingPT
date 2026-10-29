import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Profile2User, Setting4} from 'iconsax-react-native';
import {
  AppRefreshControl,
  AsyncView,
  ChipBar,
  HeaderIconButton,
  LoadingFooter,
  PtItem,
  Screen,
  ScreenHeader,
  SearchField,
  StateView,
  TextComponent,
  toPtItem,
} from '../../components';
import FilterSheet from './components/FilterSheet';
import {EMPTY_FILTERS, buildSearchParams, countActiveFilters} from './components/searchFilters';
import {usePaginatedList} from '../../hooks';
import clientApi from '../../apis/clientApi';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {SPECIALIZATIONS} from '../../constants/labels';
import {spacing} from '../../constants/theme';

const PAGE_SIZE = 10;
const SPECIALIZATION_OPTIONS = [
  {key: '', label: 'Tất cả'},
  ...Object.entries(SPECIALIZATIONS).map(([key, label]) => ({key, label})),
];

const SearchPtScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [specialization, setSpecialization] = useState(route.params?.specialization || '');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(Boolean(route.params?.isFilter));

  const fetchPage = useCallback(
    async pageNumber => {
      const response = await clientApi.searchPTs(
        buildSearchParams({query, specialization, filters, pageNumber, pageSize: PAGE_SIZE}),
      );
      const data = response.data;
      return {
        items: Array.isArray(data?.data) ? data.data : [],
        hasMore: pageNumber < (data?.pages || 1),
        total: data?.count || 0,
      };
    },
    [query, specialization, filters],
  );
  const list = usePaginatedList(fetchPage);
  const {reload} = list;

  // Debounce typing; filters and chips also go through here.
  useEffect(() => {
    const timer = setTimeout(reload, query ? 400 : 0);
    return () => clearTimeout(timer);
  }, [reload, query]);

  const applyFilters = next => {
    setFilters(next);
    setShowFilters(false);
  };

  const resetAll = () => {
    setFilters(EMPTY_FILTERS);
    setSpecialization('');
    setQuery('');
  };

  const activeCount = countActiveFilters(filters);
  const hasAnyFilter = activeCount > 0 || specialization || query.trim();

  return (
    <Screen>
      <ScreenHeader
        title="Tìm huấn luyện viên"
        onBack={() => navigation.goBack()}
        right={
          <View>
            <HeaderIconButton
              icon={<Setting4 size={20} color={appColors.white} />}
              onPress={() => setShowFilters(true)}
              accessibilityLabel="Bộ lọc"
            />
            {activeCount > 0 ? (
              <View style={styles.filterBadge}>
                <TextComponent text={String(activeCount)} size={10} font={fontFamilies.bold} color={appColors.primary} />
              </View>
            ) : null}
          </View>
        }>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm theo tên huấn luyện viên"
          accessibilityLabel="Tìm theo tên"
        />
      </ScreenHeader>

      <ChipBar
        options={SPECIALIZATION_OPTIONS}
        value={specialization}
        onChange={key => setSpecialization(key === specialization ? '' : key)}
      />

      <View style={styles.flex}>
        <AsyncView
          status={list.status}
          error={list.error}
          onRetry={reload}
          loadingTitle="Đang tìm huấn luyện viên...">
          <FlatList
            data={list.items}
            keyExtractor={item => item._id}
            renderItem={({item}) => (
              <PtItem type="list" item={toPtItem(item)} onPress={() => navigation.navigate('PTDetailScreen', {item})} />
            )}
            contentContainerStyle={[styles.list, {paddingBottom: insets.bottom + spacing.xl}]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onEndReached={list.loadMore}
            onEndReachedThreshold={0.4}
            refreshControl={<AppRefreshControl refreshing={list.refreshing} onRefresh={list.refresh} />}
            ListHeaderComponent={
              list.items.length > 0 ? (
                <TextComponent
                  text={`${list.total} huấn luyện viên`}
                  size={13}
                  color={appColors.textMuted}
                  styles={styles.count}
                />
              ) : null
            }
            ListFooterComponent={<LoadingFooter visible={list.loadingMore} />}
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
        </AsyncView>
      </View>

      <FilterSheet
        visible={showFilters}
        filters={filters}
        onApply={applyFilters}
        onClose={() => setShowFilters(false)}
      />
    </Screen>
  );
};

export default SearchPtScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
  list: {
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
  },
  count: {
    marginBottom: spacing.sm,
  },
});
