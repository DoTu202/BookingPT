import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {
  ArrowRight2,
  Calendar,
  Clock,
  HambergerMenu,
  SearchNormal1,
  Setting4,
  TickCircle,
  Timer1,
} from 'iconsax-react-native';
import {
  Avatar,
  ButtonComponent,
  GradientView,
  HeaderIconButton,
  CategoriesList,
  HeroScrollView,
  PtItem,
  StatCard,
  StateView,
  StatusBadge,
  TextComponent,
} from '../../components';
import {toPtItem} from '../../components/PtItem';
import {formatBookingDate} from '../../components/BookingCard';
import HeaderNotificationButton from '../../components/HeaderNotificationButton';
import clientApi from '../../apis/clientApi';
import {authSelector} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {header, radius, shadow, spacing} from '../../constants/theme';
import {timeUtils} from '../../utils/timeUtils';

const greeting = () => {
  const hour = timeUtils.getCurrentVietnamHour();
  if (hour < 11) {
    return 'Chào buổi sáng';
  }
  if (hour < 14) {
    return 'Chào buổi trưa';
  }
  if (hour < 18) {
    return 'Chào buổi chiều';
  }
  return 'Chào buổi tối';
};

const hoursOf = booking =>
  (new Date(booking.bookingTime.endTime) - new Date(booking.bookingTime.startTime)) / 3600000;

const SectionTitle = ({title, action, onAction}) => (
  <View style={styles.sectionHeader}>
    <TextComponent text={title} size={18} font={fontFamilies.bold} />
    {action ? (
      <TouchableOpacity onPress={onAction} style={styles.sectionAction} accessibilityRole="button">
        <TextComponent text={action} size={13} font={fontFamilies.semiBold} color={appColors.primary} />
        <ArrowRight2 size={14} color={appColors.primary} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const ClientHomeScreen = ({navigation}) => {
  const auth = useSelector(authSelector);

  const [trainers, setTrainers] = useState([]);
  const [trainersStatus, setTrainersStatus] = useState('loading');
  const [trainersError, setTrainersError] = useState('');
  const [nextBooking, setNextBooking] = useState(null);
  const [stats, setStats] = useState({completed: 0, upcoming: 0, hours: 0});
  const [refreshing, setRefreshing] = useState(false);

  const loadTrainers = useCallback(async () => {
    try {
      const response = await clientApi.searchPTs({pageSize: 8});
      setTrainers(response.data?.data || []);
      setTrainersStatus('ready');
    } catch (error) {
      setTrainersError(error.message);
      setTrainersStatus('error');
    }
  }, []);

  // Real numbers from the user's bookings.
  const loadBookings = useCallback(async () => {
    try {
      const [upcomingRes, completedRes] = await Promise.all([
        clientApi.getMyBookings({upcoming: 'true', pageSize: 50}),
        clientApi.getMyBookings({status: 'completed', pageSize: 50}),
      ]);
      const upcoming = upcomingRes.data?.data || [];
      const completed = completedRes.data?.data || [];
      setNextBooking(upcoming[0] || null);
      setStats({
        upcoming: upcomingRes.data?.count ?? upcoming.length,
        completed: completedRes.data?.count ?? completed.length,
        hours: Math.round(completed.reduce((sum, b) => sum + hoursOf(b), 0)),
      });
    } catch {
      // The home screen still works without the summary.
    }
  }, []);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  // The summary changes after booking/cancelling, so refresh it on focus.
  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBookings(), loadTrainers()]);
    setRefreshing(false);
  };

  const firstName = (auth.username || '').trim().split(' ').pop() || 'bạn';

  return (
    <View style={styles.container}>
      <HeroScrollView
        hero={
          <GradientView style={styles.hero}>
            <View style={styles.heroTop}>
              <HeaderIconButton
                icon={<HambergerMenu size={header.iconSize} color={appColors.white} />}
                onPress={() => navigation.openDrawer()}
                accessibilityLabel="Mở menu"
              />
              <HeaderNotificationButton />
            </View>

            <TextComponent text={`${greeting()},`} size={15} color="rgba(255,255,255,0.85)" />
            <TextComponent
              text={`${firstName} 👋`}
              size={28}
              font={fontFamilies.bold}
              color={appColors.white}
              numberOfLines={1}
            />
            <TextComponent
              text="Hôm nay bạn muốn tập gì?"
              size={14}
              color="rgba(255,255,255,0.85)"
              styles={styles.heroSubtitle}
            />

            <View style={styles.searchRow}>
              <TouchableOpacity
                style={styles.search}
                onPress={() => navigation.navigate('SearchPtScreen')}
                activeOpacity={0.85}
                accessibilityRole="search"
                accessibilityLabel="Tìm huấn luyện viên">
                <SearchNormal1 size={20} color={appColors.textMuted} />
                <TextComponent
                  text="Tìm huấn luyện viên..."
                  size={15}
                  color={appColors.placeholder}
                  styles={styles.searchText}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => navigation.navigate('SearchPtScreen', {isFilter: true})}
                accessibilityRole="button"
                accessibilityLabel="Bộ lọc">
                <Setting4 size={20} color={appColors.white} />
              </TouchableOpacity>
            </View>
          </GradientView>
        }
        title={`Xin chào, ${firstName}`}
        left={
          <HeaderIconButton
            icon={<HambergerMenu size={header.iconSize} color={appColors.white} />}
            onPress={() => navigation.openDrawer()}
            accessibilityLabel="Mở menu"
          />
        }
        right={<HeaderNotificationButton />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={appColors.white}
            colors={[appColors.primary]}
          />
        }>
        {/* Next session (overlaps the hero) */}
        <View style={styles.overlap}>
          {nextBooking ? (
            <TouchableOpacity
              style={styles.nextCard}
              onPress={() => navigation.navigate('ClientBookings')}
              activeOpacity={0.9}
              accessibilityRole="button">
              <View style={styles.nextHeader}>
                <TextComponent
                  text="BUỔI TẬP SẮP TỚI"
                  size={11}
                  font={fontFamilies.semiBold}
                  color={appColors.textMuted}
                  styles={styles.overline}
                />
                <StatusBadge status={nextBooking.status} />
              </View>
              <View style={styles.nextBody}>
                <Avatar uri={nextBooking.pt?.photoUrl} name={nextBooking.pt?.username} size={52} />
                <View style={styles.flex}>
                  <TextComponent
                    text={nextBooking.pt?.username || 'Huấn luyện viên'}
                    size={16}
                    font={fontFamilies.semiBold}
                    numberOfLines={1}
                  />
                  <View style={styles.inline}>
                    <Calendar size={14} color={appColors.primary} />
                    <TextComponent
                      text={` ${formatBookingDate(nextBooking.bookingTime.startTime)}`}
                      size={13}
                      color={appColors.textMuted}
                    />
                  </View>
                  <View style={styles.inline}>
                    <Clock size={14} color={appColors.primary} />
                    <TextComponent
                      text={` ${timeUtils.formatTo24HourTime(
                        nextBooking.bookingTime.startTime,
                      )} – ${timeUtils.formatTo24HourTime(nextBooking.bookingTime.endTime)}`}
                      size={13}
                      color={appColors.textMuted}
                    />
                  </View>
                </View>
                <ArrowRight2 size={18} color={appColors.placeholder} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.nextCard, styles.ctaCard]}>
              <View style={styles.flex}>
                <TextComponent text="Bắt đầu hành trình" size={16} font={fontFamilies.semiBold} />
                <TextComponent
                  text="Đặt buổi tập đầu tiên với huấn luyện viên phù hợp."
                  size={13}
                  color={appColors.textMuted}
                />
              </View>
              <ButtonComponent
                text="Đặt lịch"
                type="primary"
                size="sm"
                onPress={() => navigation.navigate('SearchPtScreen')}
              />
            </View>
          )}
        </View>

        {/* Stats */}
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

        {/* Categories */}
        <SectionTitle title="Bạn muốn tập gì?" />
        <CategoriesList
          onSelectCategory={category =>
            navigation.navigate('SearchPtScreen', {specialization: category.id})
          }
        />

        {/* Trainers */}
        <SectionTitle
          title="Huấn luyện viên nổi bật"
          action="Xem tất cả"
          onAction={() => navigation.navigate('SearchPtScreen')}
        />
        {trainersStatus === 'loading' ? (
          <ActivityIndicator color={appColors.primary} style={styles.loader} />
        ) : trainersStatus === 'error' ? (
          <StateView type="error" message={trainersError} onAction={loadTrainers} compact />
        ) : (
          <FlatList
            horizontal
            data={trainers}
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
            ListEmptyComponent={
              <StateView
                compact
                title="Chưa có huấn luyện viên"
                message="Hãy quay lại sau nhé."
              />
            }
          />
        )}
      </HeroScrollView>
    </View>
  );
};

export default ClientHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  hero: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg + 4,
    paddingBottom: 64,
    borderBottomLeftRadius: header.radius,
    borderBottomRightRadius: header.radius,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroSubtitle: {
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: appColors.surface,
  },
  searchText: {
    marginLeft: spacing.sm,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  overlap: {
    marginTop: -44,
    paddingHorizontal: spacing.lg,
  },
  nextCard: {
    backgroundColor: appColors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.md,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overline: {
    letterSpacing: 0.8,
  },
  nextBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
  },
  trainers: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  loader: {
    paddingVertical: spacing.xl,
  },
});
