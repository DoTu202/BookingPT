import React from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import {Calendar, HambergerMenu, TickCircle, Timer1} from 'iconsax-react-native';
import {
  AppRefreshControl,
  AsyncView,
  CategoriesList,
  GreetingHero,
  HeaderIconButton,
  HeaderNotificationButton,
  HeroScrollView,
  PtItem,
  Screen,
  SectionHeader,
  StatCard,
  StateView,
  toPtItem,
} from '../../components';
import HeroSearchBar from './components/HeroSearchBar';
import NextSessionCard from './components/NextSessionCard';
import {useAsync} from '../../hooks';
import clientApi from '../../apis/clientApi';
import {authSelector} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {header, spacing} from '../../constants/theme';
import {bookingHours} from '../../utils/booking';

const EMPTY_SUMMARY = {nextBooking: null, stats: {completed: 0, upcoming: 0, hours: 0}};

const fetchTrainers = () => clientApi.searchPTs({pageSize: 8}).then(res => res.data?.data || []);

// Real numbers from the user's bookings.
const fetchSummary = async () => {
  const [upcomingRes, completedRes] = await Promise.all([
    clientApi.getMyBookings({upcoming: 'true', pageSize: 50}),
    clientApi.getMyBookings({status: 'completed', pageSize: 50}),
  ]);
  const upcoming = upcomingRes.data?.data || [];
  const completed = completedRes.data?.data || [];
  return {
    nextBooking: upcoming[0] || null,
    stats: {
      upcoming: upcomingRes.data?.count ?? upcoming.length,
      completed: completedRes.data?.count ?? completed.length,
      hours: Math.round(completed.reduce((sum, b) => sum + bookingHours(b), 0)),
    },
  };
};

const ClientHomeScreen = ({navigation}) => {
  const auth = useSelector(authSelector);
  const trainers = useAsync(fetchTrainers, {initialData: []});
  // The summary changes after booking/cancelling, so refresh it on focus. The
  // home screen still works without it, so its errors are not shown.
  const summary = useAsync(fetchSummary, {trigger: 'focus', initialData: EMPTY_SUMMARY});
  const {nextBooking, stats} = summary.data;

  const onRefresh = () => {
    trainers.refresh();
    summary.refresh();
  };

  const firstName = (auth.username || '').trim().split(' ').pop() || 'bạn';
  const menuButton = (
    <HeaderIconButton
      icon={<HambergerMenu size={header.iconSize} color={appColors.white} />}
      onPress={() => navigation.openDrawer()}
      accessibilityLabel="Mở menu"
    />
  );

  return (
    <Screen>
      <HeroScrollView
        hero={
          <GreetingHero
            name={`${firstName} 👋`}
            caption="Hôm nay bạn muốn tập gì?"
            overlap={64}
            top={
              <>
                {menuButton}
                <HeaderNotificationButton />
              </>
            }>
            <HeroSearchBar
              onSearch={() => navigation.navigate('SearchPtScreen')}
              onFilter={() => navigation.navigate('SearchPtScreen', {isFilter: true})}
            />
          </GreetingHero>
        }
        title={`Xin chào, ${firstName}`}
        left={menuButton}
        right={<HeaderNotificationButton />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <AppRefreshControl onGradient refreshing={trainers.refreshing || summary.refreshing} onRefresh={onRefresh} />
        }>
        {/* Next session (overlaps the hero) */}
        <View style={styles.overlap}>
          <NextSessionCard
            booking={nextBooking}
            onPress={() => navigation.navigate('ClientBookings')}
            onBook={() => navigation.navigate('SearchPtScreen')}
          />
        </View>

        <View style={styles.stats}>
          <StatCard
            icon={<TickCircle size={18} color={appColors.success} variant="Bold" />}
            value={stats.completed}
            label="Buổi hoàn thành"
            tint={appColors.success}
            soft={appColors.successSoft}
          />
          <StatCard
            icon={<Calendar size={18} color={appColors.primary} variant="Bold" />}
            value={stats.upcoming}
            label="Buổi sắp tới"
            onPress={() => navigation.navigate('ClientBookings')}
          />
          <StatCard
            icon={<Timer1 size={18} color={appColors.info} variant="Bold" />}
            value={`${stats.hours}h`}
            label="Giờ tập"
            tint={appColors.info}
            soft={appColors.infoSoft}
          />
        </View>

        <SectionHeader title="Bạn muốn tập gì?" style={styles.section} />
        <CategoriesList
          onSelectCategory={category => navigation.navigate('SearchPtScreen', {specialization: category.id})}
        />

        <SectionHeader
          title="Huấn luyện viên nổi bật"
          actionText="Xem tất cả"
          onAction={() => navigation.navigate('SearchPtScreen')}
          style={styles.section}
        />
        <AsyncView status={trainers.status} error={trainers.error} onRetry={trainers.reload} compact>
          <FlatList
            horizontal
            data={trainers.data}
            keyExtractor={item => item._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trainers}
            renderItem={({item}) => (
              <PtItem
                type="card"
                size="medium"
                item={toPtItem(item)}
                onPress={() => navigation.navigate('PTDetailScreen', {item})}
              />
            )}
            ListEmptyComponent={<StateView compact title="Chưa có huấn luyện viên" message="Hãy quay lại sau nhé." />}
          />
        </AsyncView>
      </HeroScrollView>
    </Screen>
  );
};

export default ClientHomeScreen;

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
  },
  overlap: {
    marginTop: -44,
    paddingHorizontal: spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  trainers: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
});
