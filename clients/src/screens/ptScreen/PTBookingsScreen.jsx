import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import dayjs from 'dayjs';
import {fontFamilies} from '../../constants/fontFamilies';
import appColors from '../../constants/appColors';
import {LoadingModal} from '../../modals';
import ptApi from '../../apis/ptApi';
import {timeUtils} from '../../utils/timeUtils';
import {authSelector} from '../../redux/reducers/authReducer';
import chatApi from '../../apis/chatApi';
import {RowComponent} from '../../components'; 


const PTBookingsScreen = ({navigation}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); 
  const auth = useSelector(authSelector);

  const fetchBookings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = {};
      if (filter !== 'all') {
        params.status = filter === 'pending' ? 'pending_confirmation' : filter;
      }

      const response = await ptApi.getBookings(params);
      if (response.data?.data) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Unable to load bookings list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [filter]),
  );

  const handleConfirmBooking = async bookingId => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to confirm this booking?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setLoading(true);
              await ptApi.confirmBooking(bookingId);
              fetchBookings();
              Alert.alert('Success', 'Booking has been confirmed');
            } catch (error) {
              console.error('Error confirming booking:', error);
              Alert.alert('Error', 'Unable to confirm booking');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleRejectBooking = async bookingId => {
    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this booking?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await ptApi.rejectBooking(bookingId);
              fetchBookings();
              Alert.alert('Success', 'Booking has been rejected');
            } catch (error) {
              console.error('Error rejecting booking:', error);
              Alert.alert('Error', 'Unable to reject booking');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleMarkCompleted = async bookingId => {
    Alert.alert('Complete Session', 'Mark this session as completed?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Complete',
        onPress: async () => {
          try {
            setLoading(true);
            await ptApi.markBookingAsCompleted(bookingId);
            fetchBookings();
            Alert.alert('Success', 'Session has been marked as completed');
          } catch (error) {
            console.error('Error marking booking completed:', error);
            Alert.alert('Error', 'Unable to mark as completed');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleStartChat = async clientId => {
    try {
      setLoading(true);
      // Get or create chat room with client
      const response = await chatApi.startChat(auth.accesstoken, clientId);

      if (response.success) {
        // Navigate to chat screen
        navigation.navigate('ChatScreen', {
          chatRoomId: response.data._id,
          otherUser: response.data.clientUser,
        });
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Unable to start chat');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'pending_confirmation':
        return appColors.warning;
      case 'confirmed':
        return appColors.success;
      case 'completed':
        return appColors.primary;
      case 'rejected_by_pt':
      case 'cancelled_by_client':
        return appColors.danger;
      default:
        return appColors.text2;
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'pending_confirmation':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'rejected_by_pt':
        return 'Rejected';
      case 'cancelled_by_client':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderBookingItem = ({item}) => {
    if (
      !item.bookingTime ||
      !item.bookingTime.startTime ||
      !item.bookingTime.endTime
    ) {
      return (
        <View style={styles.bookingCard}>
          <Text style={styles.errorText}>Invalid booking data</Text>
        </View>
      );
    }

    const startTimeStr = item.bookingTime.startTime;
    const endTimeStr = item.bookingTime.endTime;

    // Check if time strings are valid
    if (typeof startTimeStr !== 'string' || typeof endTimeStr !== 'string') {
      return (
        <View style={styles.bookingCard}>
          <Text style={styles.errorText}>Invalid time format</Text>
        </View>
      );
    }

    const canConfirmOrReject = item.status === 'pending_confirmation';
    const canMarkCompleted =
      item.status === 'confirmed' && dayjs(endTimeStr).isBefore(dayjs());

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {item.client?.username || 'Client'}
            </Text>
            <Text style={styles.clientEmail}>{item.client?.email || ''}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(item.status)},
            ]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={16} color={appColors.text2} />
            <Text style={styles.detailText}>
              {timeUtils.formatToShortDate(startTimeStr)} • {timeUtils.formatToVietnameseTime(startTimeStr)} -{' '}
              {timeUtils.formatToVietnameseTime(endTimeStr)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons
              name="attach-money"
              size={16}
              color={appColors.text2}
            />
            <Text style={styles.detailText}>
              {item.priceAtBooking?.toLocaleString() || '0'} VNĐ
            </Text>
          </View>

          {item.notesFromClient && (
            <View style={styles.detailRow}>
              <MaterialIcons name="note" size={16} color={appColors.text2} />
              <Text style={styles.detailText}>{item.notesFromClient}</Text>
            </View>
          )}
        </View>

        {(canConfirmOrReject || canMarkCompleted || item.client) && (
          <View style={styles.actionButtons}>
            {canConfirmOrReject && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectBooking(item._id)}>
                  <MaterialIcons
                    name="close"
                    size={16}
                    color={appColors.white}
                  />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => handleConfirmBooking(item._id)}>
                  <MaterialIcons
                    name="check"
                    size={16}
                    color={appColors.white}
                  />
                  <Text style={styles.actionButtonText}>Confirm</Text>
                </TouchableOpacity>
              </>
            )}

            {canMarkCompleted && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleMarkCompleted(item._id)}>
                <MaterialIcons
                  name="done-all"
                  size={16}
                  color={appColors.white}
                />
                <Text style={styles.actionButtonText}>Complete</Text>
              </TouchableOpacity>
            )}

            {item.client && (
              <TouchableOpacity
                style={[styles.actionButton, styles.chatButton]}
                onPress={() => handleStartChat(item.client._id)}>
                <RowComponent justify="center">
                  <MaterialIcons
                    name="chat"
                    size={16}
                    color={appColors.white}
                  />
                  <Text style={styles.actionButtonText}> Chat</Text>
                </RowComponent>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const filterOptions = [
    {key: 'all', label: 'All', count: bookings.length},
    {
      key: 'pending',
      label: 'Pending',
      count: bookings.filter(b => b.status === 'pending_confirmation').length,
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      count: bookings.filter(b => b.status === 'confirmed').length,
    },
    {
      key: 'completed',
      label: 'Completed',
      count: bookings.filter(b => b.status === 'completed').length,
    },
  ];

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="event-busy" size={80} color={appColors.text2} />
      <Text style={styles.emptyTitle}>No bookings yet</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'pending'
          ? 'No pending bookings to review'
          : 'Your bookings will appear here'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={item => item.key}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === item.key && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(item.key)}>
              <Text
                style={[
                  styles.filterText,
                  filter === item.key && styles.filterTextActive,
                ]}>
                {item.label} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={bookings}
        keyExtractor={item => item._id}
        renderItem={renderBookingItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBookings(true)}
          />
        }
        ListEmptyComponent={!loading && renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <LoadingModal visible={loading} />
    </SafeAreaView>
  );
};

export default PTBookingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: appColors.primary,
    height: 140,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamilies.semiBold,
    color: appColors.white,
    marginTop: 20,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: appColors.gray5,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: appColors.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: appColors.gray4,
  },
  filterButtonActive: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  filterText: {
    fontSize: 14,
    color: appColors.text,
    fontWeight: '500',
  },
  filterTextActive: {
    color: appColors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  bookingCard: {
    backgroundColor: appColors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: appColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: appColors.gray5,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: appColors.text,
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 12,
    color: appColors.text2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: appColors.white,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: appColors.text,
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  confirmButton: {
    backgroundColor: appColors.success,
  },
  rejectButton: {
    backgroundColor: appColors.danger,
  },
  completeButton: {
    backgroundColor: appColors.primary,
  },
  chatButton: {
    backgroundColor: appColors.primary,
    shadowColor: appColors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: appColors.white,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 14,
    color: appColors.danger,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: appColors.text2,
    textAlign: 'center',
    lineHeight: 20,
  },
});