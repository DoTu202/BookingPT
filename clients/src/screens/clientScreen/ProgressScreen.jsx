import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Platform,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import dayjs from 'dayjs';
import appColors from '../../constants/appColors';
import {
  RowComponent,
  TextComponent,
  CircleComponent,
  SpaceComponent,
  TagBarComponent,
  CardComponent,
} from '../../components';
import {
  HambergerMenu,
  Weight,
  Clock,
  Profile2User,
  Wallet,
  SearchNormal1,
} from 'iconsax-react-native';
import {fontFamilies} from '../../constants/fontFamilies';
import clientApi from '../../apis/clientApi';

const durationMinutes = booking =>
  (new Date(booking.bookingTime.endTime) - new Date(booking.bookingTime.startTime)) /
  60000;

// Summary built from the client's real completed sessions (this screen used
// to show hardcoded weight/body-fat numbers).
const buildSummary = completed => {
  const minutes = completed.reduce((total, b) => total + durationMinutes(b), 0);
  const trainers = new Set(completed.map(b => b.pt?._id).filter(Boolean));
  const spent = completed.reduce((total, b) => total + (b.priceAtBooking || 0), 0);
  const thisMonth = completed.filter(b =>
    dayjs(b.bookingTime.startTime).isSame(dayjs(), 'month'),
  ).length;
  return {
    sessions: completed.length,
    hours: (minutes / 60).toFixed(minutes % 60 ? 1 : 0),
    trainers: trainers.size,
    spent,
    thisMonth,
  };
};

const formatVnd = value =>
  value >= 1000000
    ? `${(value / 1000000).toFixed(1)}M`
    : `${Math.round(value / 1000)}K`;

const StatCard = ({icon, value, unit, name}) => (
  <CardComponent styles={styles.statCard}>
    <RowComponent>
      <CircleComponent size={40} color={appColors.lightGray}>
        {icon}
      </CircleComponent>
      <SpaceComponent width={12} />
      <View style={styles.flex}>
        <RowComponent justify="flex-start">
          <TextComponent
            text={String(value)}
            font={fontFamilies.bold}
            size={18}
            color={appColors.black}
            flex={0}
          />
          {unit ? (
            <TextComponent
              text={` ${unit}`}
              size={14}
              color={appColors.gray}
              flex={0}
            />
          ) : null}
        </RowComponent>
        <TextComponent text={name} size={12} color={appColors.gray} />
      </View>
    </RowComponent>
  </CardComponent>
);

const ActivityItem = ({item}) => (
  <RowComponent styles={styles.activityItem}>
    <CircleComponent size={50} color={`${appColors.primary}20`}>
      <Weight size="22" color={appColors.primary} />
    </CircleComponent>
    <SpaceComponent width={16} />
    <View style={styles.flex}>
      <TextComponent
        text={`Session with ${item.pt?.username || 'your trainer'}`}
        font={fontFamilies.bold}
      />
      <TextComponent
        text={dayjs(item.bookingTime.startTime).format('ddd, DD MMM YYYY · HH:mm')}
        size={12}
        color={appColors.gray}
      />
    </View>
    <TextComponent
      text={`${Math.round(durationMinutes(item))} mins`}
      size={12}
      color={appColors.gray}
      flex={0}
    />
  </RowComponent>
);

const ProgressScreen = ({navigation}) => {
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const response = await clientApi.getMyBookings({
        status: 'completed',
        pageSize: 50,
      });
      setCompleted(response.data?.data || []);
    } catch (err) {
      setError(err.message || 'Could not load your progress');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const summary = buildSummary(completed);

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={appColors.primary}
          style={styles.loader}
          size="large"
        />
      );
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <TextComponent text={error} color={appColors.danger} />
          <SpaceComponent height={16} />
          <TouchableOpacity style={styles.addButton} onPress={load}>
            <TextComponent
              text="Try again"
              color={appColors.white}
              font={fontFamilies.bold}
            />
          </TouchableOpacity>
        </View>
      );
    }
    if (completed.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <CircleComponent size={100} color={appColors.lightGray}>
            <Weight size={40} color={appColors.gray} />
          </CircleComponent>
          <SpaceComponent height={20} />
          <TextComponent
            text="No completed sessions yet"
            font={fontFamilies.bold}
            size={20}
          />
          <TextComponent
            text="Your training history and stats will appear here after your first session."
            color={appColors.gray}
            styles={styles.emptyText}
          />
          <SpaceComponent height={20} />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('SearchPtScreen')}>
            <RowComponent>
              <SearchNormal1 size={18} color={appColors.white} />
              <SpaceComponent width={8} />
              <TextComponent
                text="Find a trainer"
                color={appColors.white}
                font={fontFamilies.bold}
                flex={0}
              />
            </RowComponent>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View>
        <TagBarComponent title="Overall Stats" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}>
          <StatCard
            icon={<Weight size="20" color={appColors.primary} />}
            value={summary.sessions}
            name={`Sessions · ${summary.thisMonth} this month`}
          />
          <SpaceComponent width={16} />
          <StatCard
            icon={<Clock size="20" color={appColors.primary} />}
            value={summary.hours}
            unit="h"
            name="Training time"
          />
          <SpaceComponent width={16} />
          <StatCard
            icon={<Profile2User size="20" color={appColors.primary} />}
            value={summary.trainers}
            name="Trainers"
          />
          <SpaceComponent width={16} />
          <StatCard
            icon={<Wallet size="20" color={appColors.primary} />}
            value={formatVnd(summary.spent)}
            unit="VND"
            name="Invested in yourself"
          />
        </ScrollView>

        <TagBarComponent title="Training History" />
        <View style={styles.history}>
          {completed.map(item => (
            <ActivityItem item={item} key={item._id} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={'light-content'} />

      <View style={styles.header}>
        <RowComponent>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <HambergerMenu color={appColors.white} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <TextComponent
              text="My Progress"
              font={fontFamilies.bold}
              color={appColors.white}
              size={18}
            />
          </View>
          <View style={styles.headerSpacer} />
        </RowComponent>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.flex}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={appColors.primary}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }>
        {renderContent()}
        <SpaceComponent height={100} />
      </ScrollView>
    </View>
  );
};

export default ProgressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: appColors.primary,
    height: 140,
    borderRadius: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  statsRow: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: appColors.white,
    width: 180,
  },
  history: {
    paddingHorizontal: 20,
  },
  activityItem: {
    marginBottom: 16,
    alignItems: 'center',
  },
  loader: {
    marginTop: 80,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  addButton: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
  },
});
