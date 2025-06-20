import React, { useState, useEffect, useCallback } from 'react';
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
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

import { authSelector, removeAuth } from '../../redux/reducers/authReducer';
import appColors from '../../constants/appColors';
import { fontFamilies } from '../../constants/fontFamilies';
import ptApi from '../../apis/ptApi';
import LoadingModal from '../../modals/LoadingModal';
import HeaderNotificationButton from '../../components/HeaderNotificationButton';

const { width } = Dimensions.get('window');

const PTHomeScreen = () => {
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [dashboardData, setDashboardData] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const [statsResponse, bookingsResponse] = await Promise.all([
        ptApi.getDashboardStats(),
        ptApi.getTodayBookings(),
      ]);

      setDashboardData(statsResponse.data);
      setTodayBookings(bookingsResponse.data?.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(removeAuth()),
      },
    ]);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = appColors.primary, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, onPress && styles.statCardTouchable]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Icon size={24} color={color} strokeWidth={2} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );

  const BookingCard = ({ booking }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'confirmed': return appColors.success;
        case 'pending': return appColors.warning;
        case 'completed': return appColors.primary;
        case 'cancelled': return appColors.danger;
        default: return appColors.gray;
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'confirmed': return CheckCircle;
        case 'completed': return CheckCircle;
        case 'cancelled': return XCircle;
        default: return Clock;
      }
    };

    const StatusIcon = getStatusIcon(booking.status);

    return (
      <TouchableOpacity style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {booking.client?.fullname || 'Client'}
            </Text>
            <Text style={styles.bookingTime}>
              {booking.startTime} - {booking.endTime}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '15' }]}>
            <StatusIcon size={14} color={getStatusColor(booking.status)} strokeWidth={2} />
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status}
            </Text>
          </View>
        </View>
        <Text style={styles.sessionType}>{booking.sessionType || 'Personal Training'}</Text>
        <Text style={styles.bookingPrice}>${booking.price || 0}</Text>
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
        Set up your trainer profile to start receiving bookings and track your progress
      </Text>
      <TouchableOpacity 
        style={styles.setupProfileButton}
        onPress={() => navigation.navigate('PTProfileScreen')}
      >
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
          <Text style={styles.userName}>{auth.username || auth.email || 'PT'}</Text>
        </View>
        
        <View style={styles.headerActions}>
          <HeaderNotificationButton color={appColors.white}  />
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
        }
      >
        {/* Show Setup Profile if no profile */}
        {dashboardData?.hasProfile === false ? (
          <SetupProfileCard />
        ) : (
          <>
            {/* Profile Summary */}
            {dashboardData?.ptProfile && (
              <View style={styles.profileSummary}>
                <View style={styles.profileHeader}>
                  <Text style={styles.profileName}>
                    {dashboardData.ptProfile.name || auth.username}
                  </Text>
                  <TouchableOpacity 
                    style={styles.editProfileButton}
                    onPress={() => navigation.getParent()?.navigate('PTProfile')}
                  >
                    <Text style={styles.editProfileText}>View Profile</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.profileSpecialization}>
                  {Array.isArray(dashboardData.ptProfile.specialization) 
                    ? dashboardData.ptProfile.specialization.join(' • ') 
                    : 'Personal Trainer'}
                </Text>
                <Text style={styles.profileExperience}>
                  {dashboardData.ptProfile.experience || 0} years experience
                </Text>
              </View>
            )}

            {/* Stats Grid */}
            <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon={Calendar}
              title="Today's Sessions"
              value={dashboardData?.todayBookings || 0}
              color={appColors.primary}
              onPress={() => navigation.navigate('PTBookings')}
            />
            <StatCard
              icon={DollarSign}
              title="Monthly Earnings"
              value={`$${dashboardData?.monthlyEarnings || 0}`}
              color={appColors.success}
              onPress={() => navigation.navigate('PTEarnings')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon={Users}
              title="Total Clients"
              value={dashboardData?.totalClients || 0}
              color={appColors.info}
              onPress={() => navigation.navigate('PTClients')}
            />
            <StatCard
              icon={Star}
              title="Rating"
              value={dashboardData?.rating?.toFixed(1) || '0.0'}
              subtitle="out of 5.0"
              color={appColors.warning}
            />
          </View>
        </View>

        {/* Weekly Performance */}
        {dashboardData?.weeklyStats && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>This Week Performance</Text>
            <View style={styles.performanceGrid}>
              <View style={styles.performanceCard}>
                <CheckCircle size={20} color={appColors.success} strokeWidth={2} />
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
        )}

        {/* Today's Bookings */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PTBookings')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {todayBookings.length > 0 ? (
            todayBookings.slice(0, 3).map((booking) => (
              <BookingCard key={booking._id} booking={booking} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color={appColors.gray2} strokeWidth={1.5} />
              <Text style={styles.emptyText}>No sessions scheduled for today</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('PTAvailability')}
              >
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
              onPress={() => navigation.navigate('PTAvailability')}
            >
              <Calendar size={24} color={appColors.primary} strokeWidth={2} />
              <Text style={styles.quickActionText}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('PTBookings')}
            >
              <Clock size={24} color={appColors.info} strokeWidth={2} />
              <Text style={styles.quickActionText}>Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('PTClients')}
            >
              <Users size={24} color={appColors.success} strokeWidth={2} />
              <Text style={styles.quickActionText}>Clients</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('PTEarnings')}
            >
              <TrendingUp size={24} color={appColors.warning} strokeWidth={2} />
              <Text style={styles.quickActionText}>Earnings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default PTHomeScreen;

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
    transform: [{ scale: 1 }],
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
  // Setup Profile Card Styles
  setupProfileCard: {
    backgroundColor: appColors.white,
    borderRadius: 16,
    margin: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  // Profile Summary Styles
  profileSummary: {
    backgroundColor: appColors.white,
    borderRadius: 16,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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