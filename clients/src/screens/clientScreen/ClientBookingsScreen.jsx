import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  ContainerComponent,
  SectionComponent,
  RowComponent,
  TextComponent,
  ButtonComponent,
  CardComponent,
  SpaceComponent,
} from '../../components';
import { Calendar, Clock, User, More, Refresh2 } from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import ptApi from '../../apis/ptApi';
import moment from 'moment';

const ClientBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await ptApi.getMyBookings();
      
      console.log('My bookings response:', response.data);
      console.log('Response.data.data array:', response.data.data);
      console.log('First booking detail:', JSON.stringify(response.data.data[0], null, 2));
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        console.log('Setting bookings from data.data:', response.data.data.length, 'items');
        setBookings(response.data.data);
      } else if (Array.isArray(response.data)) {
        console.log('Setting bookings from data:', response.data.length, 'items');
        setBookings(response.data);
      } else {
        console.log('No valid bookings data found, setting empty array');
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return appColors.success;
      case 'completed':
        return appColors.primary;
      case 'pending_confirmation':
        return appColors.warning;
      case 'cancelled_by_client':
      case 'cancelled_by_pt':
      case 'rejected_by_pt':
        return appColors.danger;
      default:
        return appColors.gray;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'pending_confirmation':
        return 'Pending';
      case 'cancelled_by_client':
        return 'Cancelled by you';
      case 'cancelled_by_pt':
        return 'Cancelled by PT';
      case 'rejected_by_pt':
        return 'Rejected';
      default:
        return status;
    }
  };

  const handleCancelBooking = (booking) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await ptApi.cancelBooking(booking._id);
              Alert.alert('Success', 'Booking cancelled successfully');
              loadBookings(); // Refresh list
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const renderBookingItem = (booking, index) => {
    const startTime = moment(booking.bookingTime?.startTime);
    const endTime = moment(booking.bookingTime?.endTime);
    const canCancel = booking.status === 'pending_confirmation' || booking.status === 'confirmed';
    
    return (
      <CardComponent key={booking._id || index} styles={styles.bookingCard}>
        {/* Header with PT info and status */}
        <RowComponent justify="space-between">
          <RowComponent>
            <View style={styles.avatarContainer}>
              <TextComponent
                text={(booking.pt?.username || 'PT').charAt(0).toUpperCase()}
                size={18}
                color={appColors.white}
                font="Poppins-Bold"
              />
            </View>
            <View style={styles.ptInfo}>
              <TextComponent
                text={booking.pt?.username || 'Personal Trainer'}
                size={16}
                font="Poppins-SemiBold"
                color={appColors.black}
              />
              <TextComponent
                text={`Booking #${booking._id?.slice(-6) || 'N/A'}`}
                size={12}
                color={appColors.gray}
              />
            </View>
          </RowComponent>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <TextComponent
              text={getStatusText(booking.status)}
              size={12}
              color={appColors.white}
              font="Poppins-SemiBold"
            />
          </View>
        </RowComponent>

        <SpaceComponent height={12} />

        {/* Booking details */}
        <View style={styles.detailsContainer}>
          <RowComponent>
            <Calendar size={16} color={appColors.primary} />
            <SpaceComponent width={8} />
            <TextComponent
              text={startTime.format('dddd, MMM DD, YYYY')}
              size={14}
              color={appColors.black}
              font="Poppins-Medium"
            />
          </RowComponent>
          
          <SpaceComponent height={8} />
          
          <RowComponent>
            <Clock size={16} color={appColors.primary} />
            <SpaceComponent width={8} />
            <TextComponent
              text={`${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`}
              size={14}
              color={appColors.black}
              font="Poppins-Medium"
            />
            <View style={styles.durationBadge}>
              <TextComponent
                text={`${endTime.diff(startTime, 'hours', true)}h`}
                size={12}
                color={appColors.primary}
                font="Poppins-SemiBold"
              />
            </View>
          </RowComponent>

          <SpaceComponent height={8} />

          <RowComponent justify="space-between">
            <TextComponent
              text="Total:"
              size={14}
              color={appColors.gray}
            />
            <TextComponent
              text={`${(booking.priceAtBooking || 0).toLocaleString()} VND`}
              size={16}
              color={appColors.primary}
              font="Poppins-Bold"
            />
          </RowComponent>
        </View>

        {/* Notes if available */}
        {booking.notesFromClient && (
          <>
            <SpaceComponent height={12} />
            <View style={styles.notesContainer}>
              <TextComponent
                text="Notes:"
                size={12}
                color={appColors.gray}
                font="Poppins-Medium"
              />
              <TextComponent
                text={booking.notesFromClient}
                size={14}
                color={appColors.black}
              />
            </View>
          </>
        )}

        {/* Action buttons */}
        {canCancel && (
          <>
            <SpaceComponent height={12} />
            <RowComponent justify="space-between">
              <ButtonComponent
                text="Cancel Booking"
                type="primary"
                color={appColors.danger}
                onPress={() => handleCancelBooking(booking)}
                styles={{ flex: 1 }}
              />
            </RowComponent>
          </>
        )}
      </CardComponent>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <TextComponent text="Loading your bookings..." color={appColors.gray} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <RowComponent justify="space-between" styles={styles.headerContent}>
          <RowComponent>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <TextComponent
                text="←"
                size={24}
                color={appColors.white}
                font="Poppins-Medium"
              />
            </TouchableOpacity>
            <TextComponent
              text="My Bookings"
              size={20}
              font="Poppins-Bold"
              color={appColors.white}
            />
          </RowComponent>
          <ButtonComponent
            text=""
            type="primary"
            onPress={onRefresh}
            iconFlex="left"
            icon={<Refresh2 size={20} color={appColors.white} />}
            styles={styles.refreshButton}
            isLoading={refreshing}
          />
        </RowComponent>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <SectionComponent>
          <TextComponent
            text="Manage your training sessions"
            size={14}
            color={appColors.gray}
          />
        </SectionComponent>

        {(() => {
          console.log('=== RENDER DEBUG ===');
          console.log('Bookings state length:', bookings.length);
          console.log('Bookings state:', bookings);
          return null;
        })()}

        {bookings.length > 0 ? (
          <SectionComponent>
            {bookings.map((booking, index) => {
              console.log(`Rendering booking ${index}:`, booking);
              return renderBookingItem(booking, index);
            })}
          </SectionComponent>
        ) : (
          <View style={styles.emptyContainer}>
            <Calendar size={64} color={appColors.gray} />
            <SpaceComponent height={16} />
            <TextComponent
              text="No bookings yet"
              size={18}
              font="Poppins-SemiBold"
              color={appColors.gray}
              styles={{ textAlign: 'center' }}
            />
            <SpaceComponent height={8} />
            <TextComponent
              text="Start booking sessions with personal trainers"
              size={14}
              color={appColors.gray}
              styles={{ textAlign: 'center' }}
            />
            <SpaceComponent height={20} />
            <ButtonComponent
              text="Find Trainers"
              type="primary"
              onPress={() => navigation.navigate('ClientHomeScreen')}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ClientBookingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  headerContainer: {
    backgroundColor: appColors.primary,
    padding: Platform.OS === 'android' ? StatusBar.currentHeight : 70,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    minWidth: 40,
    paddingHorizontal: 0,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCard: {
    marginBottom: 16,
    padding: 16,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ptInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailsContainer: {
    backgroundColor: appColors.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  durationBadge: {
    marginLeft: 'auto',
    backgroundColor: appColors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.primary,
  },
  notesContainer: {
    backgroundColor: appColors.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
});