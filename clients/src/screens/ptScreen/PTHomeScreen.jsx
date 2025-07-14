import React, {useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Calendar,
  DollarSign,
  Users,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
} from 'lucide-react-native';
import dayjs from 'dayjs';

import {authSelector, removeAuth} from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {timeUtils} from '../../utils/timeUtils';
import LoadingModal from '../../modals/LoadingModal';
import HeaderNotificationButton from '../../components/HeaderNotificationButton';
import ptApi from '../../apis/ptApi';
import profileApi from '../../apis/profileApi';

const {width} = Dimensions.get('window');

const PTHomeScreen = () => {
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // State for real data
  const [dashboardData, setDashboardData] = useState({
    hasProfile: false,
    ptProfile: null,
    todayBookings: 0,
    monthlyEarnings: 0,
    totalClients: 0,
    rating: 0,
    weeklyStats: {
      completedSessions: 0,
      totalHours: 0,
      newClients: 0,
      cancelledSessions: 0,
    },
  });
  const [todayBookings, setTodayBookings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real data loading function
  const loadDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // Load all data in parallel
      const [profileResponse, bookingsResponse, userProfileResponse] = await Promise.all([
        loadProfile(),
        loadBookings(),
        loadUserProfile(),
      ]);

      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await profileApi.getProfile();
      if (response.data && response.data.success) {
        setUserProfile(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  const loadProfile = async () => {
    try {
      const response = await ptApi.getProfile();

      let hasProfile = false;
      let ptProfile = null;

      if (response.data) {
        if (response.data.data && response.data.data._id) {
          hasProfile = true;
          ptProfile = response.data.data;
        } else if (response.data._id) {
          hasProfile = true;
          ptProfile = response.data;
        }
      }

      setDashboardData(prev => ({
        ...prev,
        hasProfile,
        ptProfile,
      }));

      return ptProfile;
    } catch (error) {
      console.log('No profile found:', error);
      setDashboardData(prev => ({
        ...prev,
        hasProfile: false,
        ptProfile: null,
      }));
      return null;
    }
  };

  const loadBookings = async () => {
    try {
      const response = await ptApi.getBookings();
      const allBookings = response.data?.data || [];

      // Calculate stats from bookings
      const stats = calculateStatsFromBookings(allBookings);

      // Get today's bookings
      const today = dayjs().format('YYYY-MM-DD');
      const todayBookingsList = allBookings.filter(booking => {
        if (!booking.bookingTime?.startTime) return false;
        const bookingDate = dayjs(booking.bookingTime.startTime).format(
          'YYYY-MM-DD',
        );
        return bookingDate === today;
      });

      setDashboardData(prev => ({
        ...prev,
        ...stats,
      }));

      setTodayBookings(todayBookingsList);

      return allBookings;
    } catch (error) {
      console.error('Error loading bookings:', error);
      return [];
    }
  };

  const calculateStatsFromBookings = bookings => {
    const now = dayjs();

    // Today's bookings count
    const today = now.format('YYYY-MM-DD');
    const todayBookingsCount = bookings.filter(booking => {
      if (!booking.bookingTime?.startTime) return false;
      const bookingDate = dayjs(booking.bookingTime.startTime).format(
        'YYYY-MM-DD',
      );
      return bookingDate === today;
    }).length;

    // Monthly earnings (current month)
    const monthStart = now.startOf('month');
    const monthlyBookings = bookings.filter(booking => {
      if (!booking.bookingTime?.startTime || booking.status !== 'completed')
        return false;
      const bookingDate = dayjs(booking.bookingTime.startTime);
      return bookingDate.isAfter(monthStart);
    });

    const monthlyEarnings = monthlyBookings.reduce((total, booking) => {
      return total + (booking.priceAtBooking || 0);
    }, 0);

    // Total unique clients
    const uniqueClients = new Set();
    bookings.forEach(booking => {
      if (booking.client?._id) {
        uniqueClients.add(booking.client._id);
      } else if (booking.clientId) {
        uniqueClients.add(booking.clientId);
      }
    });
    const totalClients = uniqueClients.size;

    // Average rating (synthetic calculation based on completed bookings)
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const rating = completedBookings.length > 0
      ? Math.min(3.5 + Math.min(completedBookings.length * 0.1, 1.5), 5.0).toFixed(1)
      : 0;

    // Weekly stats
    const weekStart = now.startOf('week');
    const weeklyBookings = bookings.filter(booking => {
      if (!booking.bookingTime?.startTime) return false;
      const bookingDate = dayjs(booking.bookingTime.startTime);
      return bookingDate.isAfter(weekStart);
    });

    const completedThisWeek = weeklyBookings.filter(
      b => b.status === 'completed',
    ).length;
    
    const cancelledThisWeek = weeklyBookings.filter(
      b => b.status === 'cancelled_by_client' || b.status === 'rejected_by_pt',
    ).length;

    // Calculate total hours (assuming 1 hour per session for now)
    const totalHours = weeklyBookings.reduce((total, booking) => {
      if (booking.bookingTime?.startTime && booking.bookingTime?.endTime) {
        const start = dayjs(booking.bookingTime.startTime);
        const end = dayjs(booking.bookingTime.endTime);
        const durationHours = end.diff(start, 'hour', true);
        return total + (durationHours > 0 ? durationHours : 1);
      }
      return total + 1; // Default to 1 hour if time data is missing
    }, 0);

    // New clients this week
    const weeklyClients = new Set();
    weeklyBookings.forEach(booking => {
      if (booking.client?._id) {
        weeklyClients.add(booking.client._id);
      } else if (booking.clientId) {
        weeklyClients.add(booking.clientId);
      }
    });
    const newClients = weeklyClients.size;

    return {
      todayBookings: todayBookingsCount,
      monthlyEarnings,
      totalClients,
      rating,
      weeklyStats: {
        completedSessions: completedThisWeek,
        totalHours: Math.round(totalHours),
        newClients,
        cancelledSessions: cancelledThisWeek,
      },
    };
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, []),
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(removeAuth()),
      },
    ]);
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = appColors.primary,
    onPress,
  }) => (
    <TouchableOpacity
      style={[styles.statCard, onPress && styles.statCardTouchable]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={[styles.statIconContainer, {backgroundColor: color + '15'}]}>
        <Icon size={24} color={color} strokeWidth={2} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );

  const BookingCard = ({booking}) => {
    const getStatusColor = status => {
      switch (status) {
        case 'confirmed':
          return appColors.success;
        case 'pending_confirmation':
          return appColors.warning;
        case 'completed':
          return appColors.primary;
        case 'cancelled_by_client':
        case 'rejected_by_pt':
          return appColors.danger;
        default:
          return appColors.gray;
      }
    };

    const getStatusIcon = status => {
      switch (status) {
        case 'confirmed':
          return CheckCircle;
        case 'completed':
          return CheckCircle;
        case 'cancelled_by_client':
        case 'rejected_by_pt':
          return XCircle;
        default:
          return Clock;
      }
    };

    const StatusIcon = getStatusIcon(booking.status);

    const formatTime = timeString => {
      if (!timeString) return '';
      return timeUtils.formatToVietnameseTime(timeString);
    };

    const getStatusText = status => {
      switch (status) {
        case 'pending_confirmation':
          return 'Pending';
        case 'confirmed':
          return 'Confirmed';
        case 'completed':
          return 'Completed';
        case 'cancelled_by_client':
          return 'Cancelled';
        case 'rejected_by_pt':
          return 'Rejected';
        default:
          return status;
      }
    };

    return (
      <TouchableOpacity 
        style={styles.bookingCard}
        onPress={() => navigation.navigate('PTBookings')}>
        <View style={styles.bookingHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {booking.client?.username || 'Client'}
            </Text>
            <Text style={styles.bookingTime}>
              {formatTime(booking.bookingTime?.startTime)} -{' '}
              {formatTime(booking.bookingTime?.endTime)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(booking.status) + '15'},
            ]}>
            <StatusIcon
              size={14}
              color={getStatusColor(booking.status)}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.statusText,
                {color: getStatusColor(booking.status)},
              ]}>
              {getStatusText(booking.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.sessionType}>Personal Training Session</Text>
        <Text style={styles.bookingPrice}>
          {booking.priceAtBooking
            ? `${booking.priceAtBooking.toLocaleString()} VND`
            : 'Price not set'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingModal visible={loading} />;
  }

  // Setup Profile Card Component
  const SetupProfileCard = () => (
    <View style={styles.setupProfileCard}>
      <View style={styles.setupProfileIcon}>
        <Users size={48} color={appColors.primary} strokeWidth={1.5} />
      </View>
      <Text style={styles.setupProfileTitle}>Complete Your Profile</Text>
      <Text style={styles.setupProfileSubtitle}>
        Set up your trainer profile to start receiving bookings and track your
        progress
      </Text>
      <TouchableOpacity
        style={styles.setupProfileButton}
        onPress={() => navigation.navigate('PTProfile')}>
        <Text style={styles.setupProfileButtonText}>Setup Profile</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>
            {userProfile?.username || 
              dashboardData.ptProfile?.name ||
              auth.username ||
              auth.email ||
              'PT'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <HeaderNotificationButton color={appColors.white} />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Show Setup Profile if no profile */}
        {!dashboardData.hasProfile ? (
          <SetupProfileCard />
        ) : (
          <>
            {/* Profile Summary */}
            {dashboardData.ptProfile && (
              <View style={styles.profileSummary}>
                <View style={styles.profileHeader}>
                  <Text style={styles.profileName}>
                    {dashboardData.ptProfile.name || userProfile?.username || auth.username}
                  </Text>
                  <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={() =>
                      navigation.getParent()?.navigate('PTProfile')
                    }>
                    <Text style={styles.editProfileText}>View Profile</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.profileSpecialization}>
                  {Array.isArray(dashboardData.ptProfile.specializations) && dashboardData.ptProfile.specializations.length > 0
                    ? dashboardData.ptProfile.specializations
                        .map(spec =>
                          spec
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, l => l.toUpperCase()),
                        )
                        .join(' • ')
                    : 'Personal Trainer'}
                </Text>
                <Text style={styles.profileExperience}>
                  {dashboardData.ptProfile.experienceYears || 0} years
                  experience
                </Text>
              </View>
            )}

            {/* Stats Grid */}
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <StatCard
                  icon={Calendar}
                  title="Today's Sessions"
                  value={dashboardData.todayBookings}
                  color={appColors.primary}
                  onPress={() => navigation.navigate('PTBookings')}
                />
                <StatCard
                  icon={DollarSign}
                  title="Monthly Earnings"
                  value={`${(dashboardData.monthlyEarnings / 1000).toFixed(
                    0,
                  )}K VND`}
                  color={appColors.success}
                  onPress={() => navigation.navigate('PTBookings')}
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  icon={Users}
                  title="Total Clients"
                  value={dashboardData.totalClients}
                  color={appColors.info}
                  onPress={() => navigation.navigate('PTBookings')}
                />
                <StatCard
                  icon={Star}
                  title="Rating"
                  value={
                    dashboardData.rating > 0
                      ? dashboardData.rating
                      : 'New'
                  }
                  subtitle={dashboardData.rating > 0 ? 'out of 5.0' : ''}
                  color={appColors.warning}
                />
              </View>
            </View>

            {/* Weekly Performance */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>This Week Performance</Text>
              <View style={styles.performanceGrid}>
                <View style={styles.performanceCard}>
                  <CheckCircle
                    size={20}
                    color={appColors.success}
                    strokeWidth={2}
                  />
                  <Text style={styles.performanceValue}>
                    {dashboardData.weeklyStats.completedSessions}
                  </Text>
                  <Text style={styles.performanceLabel}>Completed</Text>
                </View>
                <View style={styles.performanceCard}>
                  <Clock size={20} color={appColors.primary} strokeWidth={2} />
                  <Text style={styles.performanceValue}>
                    {dashboardData.weeklyStats.totalHours}h
                  </Text>
                  <Text style={styles.performanceLabel}>Total Hours</Text>
                </View>
                <View style={styles.performanceCard}>
                  <UserPlus size={20} color={appColors.info} strokeWidth={2} />
                  <Text style={styles.performanceValue}>
                    {dashboardData.weeklyStats.newClients}
                  </Text>
                  <Text style={styles.performanceLabel}>New Clients</Text>
                </View>
                <View style={styles.performanceCard}>
                  <XCircle size={20} color={appColors.danger} strokeWidth={2} />
                  <Text style={styles.performanceValue}>
                    {dashboardData.weeklyStats.cancelledSessions}
                  </Text>
                  <Text style={styles.performanceLabel}>Cancelled</Text>
                </View>
              </View>
            </View>

            {/* Today's Bookings */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Schedule</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('PTBookings')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              {todayBookings.length > 0 ? (
                todayBookings
                  .slice(0, 3)
                  .map(booking => (
                    <BookingCard key={booking._id} booking={booking} />
                  ))
              ) : (
                <View style={styles.emptyState}>
                  <Calendar
                    size={48}
                    color={appColors.gray2}
                    strokeWidth={1.5}
                  />
                  <Text style={styles.emptyText}>
                    No sessions scheduled for today
                  </Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('PTAvailability')}>
                    <Text style={styles.addButtonText}>Manage Schedule</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('PTAvailability')}>
                  <Calendar
                    size={24}
                    color={appColors.primary}
                    strokeWidth={2}
                  />
                  <Text style={styles.quickActionText}>Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('PTBookings')}>
                  <Clock size={24} color={appColors.info} strokeWidth={2} />
                  <Text style={styles.quickActionText}>Bookings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('PTBookings')}>
                  <Users size={24} color={appColors.success} strokeWidth={2} />
                  <Text style={styles.quickActionText}>Clients</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('PTBookings')}>
                  <TrendingUp
                    size={24}
                    color={appColors.warning}
                    strokeWidth={2}
                  />
                  <Text style={styles.quickActionText}>Earnings</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{height: 100}} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default PTHomeScreen;

// Styles remain the same as before
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: appColors.primary,
    borderBottomWidth: 1,
    borderBottomColor: appColors.primary,
    height: 140,
    borderRadius: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: appColors.white,
    fontFamily: fontFamilies.regular,
    marginTop: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appColors.white,
    fontFamily: fontFamilies.bold,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 20,
  },
  logoutText: {
    color: appColors.white,
    fontSize: 14,
    fontFamily: fontFamilies.medium,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: appColors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: appColors.gray4,
  },
  statCardTouchable: {
    transform: [{scale: 1}],
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: appColors.gray,
    fontFamily: fontFamilies.regular,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appColors.text,
    fontFamily: fontFamilies.bold,
  },
  statSubtitle: {
    fontSize: 12,
    color: appColors.gray2,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appColors.text,
    fontFamily: fontFamilies.bold,
  },
  seeAllText: {
    fontSize: 14,
    color: appColors.primary,
    fontFamily: fontFamilies.medium,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  performanceCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    backgroundColor: appColors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColors.gray4,
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appColors.text,
    fontFamily: fontFamilies.bold,
    marginTop: 8,
  },
  performanceLabel: {
    fontSize: 12,
    color: appColors.gray,
    fontFamily: fontFamilies.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: appColors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: appColors.gray4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: appColors.text,
    fontFamily: fontFamilies.bold,
  },
  bookingTime: {
    fontSize: 14,
    color: appColors.gray,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: fontFamilies.medium,
    textTransform: 'capitalize',
  },
  sessionType: {
    fontSize: 14,
    color: appColors.gray2,
    fontFamily: fontFamilies.regular,
    marginBottom: 4,
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: appColors.success,
    fontFamily: fontFamilies.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: appColors.gray2,
    fontFamily: fontFamilies.regular,
    marginTop: 12,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: appColors.white,
    fontSize: 14,
    fontFamily: fontFamilies.medium,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: (width - 64) / 2,
    backgroundColor: appColors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColors.gray4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    color: appColors.text,
    fontFamily: fontFamilies.medium,
    marginTop: 8,
  },
  setupProfileCard: {
    backgroundColor: appColors.white,
    borderRadius: 16,
    margin: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: appColors.gray4,
  },
  setupProfileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: appColors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  setupProfileTitle: {
    fontSize: 24,
    fontFamily: fontFamilies.bold,
    color: appColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  setupProfileSubtitle: {
    fontSize: 16,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  setupProfileButton: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 150,
  },
  setupProfileButtonText: {
    fontSize: 16,
    fontFamily: fontFamilies.semiBold,
    color: appColors.white,
    textAlign: 'center',
  },
  profileSummary: {
    backgroundColor: appColors.white,
    borderRadius: 16,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: appColors.gray4,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 20,
    fontFamily: fontFamilies.semiBold,
    color: appColors.text,
    flex: 1,
  },
  editProfileButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.primary,
  },
  editProfileText: {
    fontSize: 14,
    fontFamily: fontFamilies.medium,
    color: appColors.primary,
  },
  profileSpecialization: {
    fontSize: 14,
    fontFamily: fontFamilies.medium,
    color: appColors.primary,
    marginBottom: 4,
  },
  profileExperience: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
  },
});