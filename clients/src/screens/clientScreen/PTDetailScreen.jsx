import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
import { Star1, Location } from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import ptApi from '../../apis/ptApi';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PTDetailScreen = ({ navigation, route }) => {
  // Get PT data from navigation params
  const { item } = route.params;
  
  // Component states
  const [ptProfile, setPtProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Initialize component
  useEffect(() => {
    initializePTData();
  }, []);

  // Load availability when date or PT changes
  useEffect(() => {
    if (selectedDate && ptProfile?.user?._id) {
      loadAvailability();
    }
  }, [selectedDate, ptProfile]);

  const initializePTData = () => {
    console.log('PTDetailScreen - Initializing with item:', item);
    
    try {
      // Validate input data
      if (!item || typeof item !== 'object') {
        console.error('Invalid PT data received');
        Alert.alert('Error', 'Invalid trainer data');
        navigation.goBack();
        return;
      }

      // Handle both direct API data and formatted data from PtItem
      const ptData = item.ptData || item;
      
      if (!ptData.user?._id) {
        console.error('Missing user information in PT data');
        Alert.alert('Error', 'Trainer information incomplete');
        navigation.goBack();
        return;
      }

      // Set PT profile
      setPtProfile(ptData);

      // Set default date to today or first reasonable date
      const today = moment().format('YYYY-MM-DD');
      setSelectedDate(today);
      
      console.log('PTDetailScreen - Successfully initialized:', ptData.user.username);
      console.log('Default selected date set to:', today);
    
      
    } catch (error) {
      console.error('Error initializing PT data:', error);
      Alert.alert('Error', 'Failed to load trainer information');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      // Format selectedDate to YYYY-MM-DD string if it's a Date object
      let dateString = selectedDate;
      if (selectedDate instanceof Date) {
        dateString = selectedDate.toISOString().split('T')[0];
      } else if (typeof selectedDate === 'string' && selectedDate.includes('T')) {
        dateString = selectedDate.split('T')[0];
      }
      
      const response = await ptApi.getPTAvailability(ptProfile.user._id, {
        startDate: dateString,
        endDate: dateString,
      });
      
      // Handle response format
      if (response.data?.data && Array.isArray(response.data.data)) {
        setAvailability(response.data.data);
      } else if (Array.isArray(response.data)) {
        setAvailability(response.data);
      } else {
        setAvailability([]);
      }
      
    } catch (error) {
      console.error('Error loading availability:', error);
      
      // Handle token expiration
      if (error.message === 'Token expired') {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again to continue',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load availability. Please try again.');
      }
      
      setAvailability([]);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    setBookingLoading(true);

    try {
      const sessionDetails = calculateSessionDetails(selectedSlot);
      
      const bookingData = {
        ptId: ptProfile.user._id,
        availabilitySlotId: selectedSlot._id,
        notesFromClient: `Mobile app booking - Duration: ${sessionDetails.duration}h, Total: ${sessionDetails.totalPrice.toLocaleString()} VND`,
      };

      console.log('Creating booking with data:', bookingData);
      const response = await ptApi.createBooking(bookingData);
      
      if (response.data.success || response.data.message) {
        Alert.alert(
          'Booking Success! ',
          `Your booking request has been sent successfully!\n\nTrainer: ${ptProfile.user.username}\nTime: ${moment(selectedSlot.startTime).format('HH:mm')} - ${moment(selectedSlot.endTime).format('HH:mm')}\nDate: ${moment(selectedDate).format('dddd, MMM DD')}\nTotal: ${sessionDetails.totalPrice.toLocaleString()} VND\n\nThe trainer will confirm your booking soon.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh availability after booking
                loadAvailability();
                setSelectedSlot(null);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorTitle = 'Booking Failed ';
      let errorMessage = 'Failed to create booking. Please try again.';
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        // Check for specific error messages
        if (responseData.message) {
          errorMessage = responseData.message;
          
          // Handle specific error cases with Vietnamese messages
          if (errorMessage.includes('trùng với khoảng thời gian') || 
              errorMessage.includes('lịch đặt khác')) {
            errorTitle = 'Schedule Conflict ';
            errorMessage = 'You already have a booking that conflicts with this time slot. Please choose a different time.';
          } else if (errorMessage.includes('không có sẵn') || 
                     errorMessage.includes('status')) {
            errorTitle = 'Time Slot Unavailable ';
            errorMessage = 'This time slot is no longer available. Please select another time.';
          } else if (errorMessage.includes('đã qua') || 
                     errorMessage.includes('past')) {
            errorTitle = 'Invalid Time ';
            errorMessage = 'Cannot book a time slot in the past. Please select a future time.';
          } else if (errorMessage.includes('authorization') ||
                     errorMessage.includes('token')) {
            errorTitle = 'Authentication Error ';
            errorMessage = 'Please log in again to continue.';
          } else {
            // Use server message as is for other Vietnamese messages
            errorMessage = responseData.message;
          }
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(errorTitle, errorMessage, [
        {
          text: 'OK',
          onPress: () => {
            // Refresh availability in case of schedule conflict
            loadAvailability();
            setSelectedSlot(null);
          },
        },
      ]);
    } finally {
      setBookingLoading(false);
    }
  };

  // Calculate session duration and total price
  const calculateSessionDetails = (slot) => {
    if (!slot || !ptProfile?.hourlyRate) return { duration: 0, totalPrice: 0 };
    
    const startTime = moment(slot.startTime);
    const endTime = moment(slot.endTime);
    const durationHours = endTime.diff(startTime, 'hours', true); // Get decimal hours
    const totalPrice = durationHours * (ptProfile.hourlyRate || 500000);
    
    return {
      duration: durationHours,
      totalPrice: Math.round(totalPrice)
    };
  };

  // Render loading state
  if (loading) {
    return (
      <ContainerComponent>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <SpaceComponent height={16} />
          <TextComponent text="Loading trainer information..." color={appColors.gray} />
        </View>
      </ContainerComponent>
    );
  }

  // Render error state
  if (!ptProfile) {
    return (
      <ContainerComponent>
        <View style={styles.loadingContainer}>
          <TextComponent text="Trainer information not available" color={appColors.gray} />
          <SpaceComponent height={16} />
          <ButtonComponent 
            text="Go Back" 
            onPress={() => navigation.goBack()}
            type="primary"
          />
        </View>
      </ContainerComponent>
    );
  }

  // Main render
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* PT Profile Card */}
        <CardComponent styles={styles.profileCard}>
          <RowComponent>
            <View style={styles.avatarContainer}>
              <TextComponent
                text={(ptProfile.user?.username || 'PT').charAt(0).toUpperCase()}
                size={28}
                color={appColors.white}
                font="Poppins-Bold"
              />
            </View>
            <View style={styles.profileInfo}>
              <TextComponent
                text={ptProfile.user?.username || 'Personal Trainer'}
                size={20}
                font="Poppins-Bold"
                color={appColors.black}
              />
              <RowComponent>
                <Star1 size={16} color="#FFD700" variant="Bold" />
                <SpaceComponent width={4} />
                <TextComponent
                  text={`${(ptProfile.rating || 4.5).toFixed(1)} (${ptProfile.totalSessions || 0} sessions)`}
                  size={14}
                  color={appColors.gray}
                />
              </RowComponent>
              <RowComponent>
                <Location size={16} color={appColors.gray} />
                <SpaceComponent width={4} />
                <TextComponent
                  text={
                    ptProfile.location && typeof ptProfile.location === 'object'
                      ? `${ptProfile.location.district || ''}, ${ptProfile.location.city || ''}`
                      : ptProfile.location || "Ho Chi Minh City"
                  }
                  size={14}
                  color={appColors.gray}
                />
              </RowComponent>
            </View>
          </RowComponent>
          
          <SpaceComponent height={12} />
          
          {/* Bio */}
          {ptProfile.bio && (
            <>
              <TextComponent
                text="About"
                size={16}
                font="Poppins-SemiBold"
                color={appColors.black}
              />
              <SpaceComponent height={8} />
              <TextComponent
                text={ptProfile.bio}
                size={14}
                color={appColors.gray}
                styles={{ lineHeight: 20 }}
              />
              <SpaceComponent height={12} />
            </>
          )}
          
          {/* Price and Experience */}
          <RowComponent justify="space-between">
            <View>
              <TextComponent text="Experience" size={14} color={appColors.gray} />
              <TextComponent
                text={`${ptProfile.experienceYears || 3} years`}
                size={16}
                font="Poppins-SemiBold"
                color={appColors.black}
              />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <TextComponent text="Price per hour" size={14} color={appColors.gray} />
              <TextComponent
                text={`${(ptProfile.hourlyRate || 500000).toLocaleString()} VND`}
                size={16}
                font="Poppins-Bold"
                color={appColors.primary}
              />
            </View>
          </RowComponent>
        </CardComponent>

        {/* Date Selection */}
        <SectionComponent>
          <TextComponent
            text="Select Date"
            size={16}
            font="Poppins-SemiBold"
            color={appColors.black}
          />
          <SpaceComponent height={12} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dateContainer}>
              {/* Show dates from today for next 30 days */}
              {Array.from({length: 30}, (_, index) => {
                const date = moment().add(index, 'days');
                const dateStr = date.format('YYYY-MM-DD');
                const isSelected = selectedDate === dateStr;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dateItem, isSelected && styles.selectedDateItem]}
                    onPress={() => setSelectedDate(dateStr)}
                  >
                    <TextComponent
                      text={date.format('ddd')}
                      size={12}
                      color={isSelected ? appColors.white : appColors.gray}
                    />
                    <TextComponent
                      text={date.format('DD')}
                      size={16}
                      font="Poppins-SemiBold"
                      color={isSelected ? appColors.white : appColors.black}
                    />
                    <TextComponent
                      text={date.format('MMM')}
                      size={10}
                      color={isSelected ? appColors.white : appColors.gray}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SectionComponent>

        {/* Time Slots */}
        <SectionComponent>
          <TextComponent
            text="Available Time Slots"
            size={16}
            font="Poppins-SemiBold"
            color={appColors.black}
          />
          <SpaceComponent height={12} />
          {availability.length > 0 ? (
            <View style={styles.slotsContainer}>
              {availability.filter(slot => !slot.isBooked).map((slot, index) => {
                const isSelected = selectedSlot?._id === slot._id;
                
                return (
                  <TouchableOpacity
                    key={slot._id || index}
                    style={[styles.timeSlot, isSelected && styles.selectedTimeSlot]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <TextComponent
                      text={`${moment(slot.startTime).format('HH:mm')} - ${moment(slot.endTime).format('HH:mm')}`}
                      size={14}
                      color={isSelected ? appColors.white : appColors.black}
                      font={isSelected ? "Poppins-SemiBold" : "Poppins-Regular"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noSlotsContainer}>
              <TextComponent
                text="No available slots for this date"
                size={14}
                color={appColors.gray}
                styles={{ textAlign: 'center' }}
              />
            </View>
          )}
        </SectionComponent>

        {/* Booking Button */}
        <SectionComponent>
          {selectedSlot ? (
            <View style={styles.bookingInfo}>
              <RowComponent justify="space-between">
                <View>
                  <TextComponent
                    text="Selected Time"
                    size={14}
                    color={appColors.gray}
                  />
                  <TextComponent
                    text={`${moment(selectedSlot.startTime).format('HH:mm')} - ${moment(selectedSlot.endTime).format('HH:mm')}`}
                    size={16}
                    font="Poppins-SemiBold"
                    color={appColors.black}
                  />
                  <TextComponent
                    text={moment(selectedDate).format('dddd, MMM DD')}
                    size={14}
                    color={appColors.gray}
                  />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <TextComponent
                    text="Duration"
                    size={14}
                    color={appColors.gray}
                  />
                  <TextComponent
                    text={`${calculateSessionDetails(selectedSlot).duration} hours`}
                    size={16}
                    font="Poppins-SemiBold"
                    color={appColors.black}
                  />
                  <TextComponent
                    text="Total"
                    size={14}
                    color={appColors.gray}
                  />
                  <TextComponent
                    text={`${calculateSessionDetails(selectedSlot).totalPrice.toLocaleString()} VND`}
                    size={16}
                    font="Poppins-Bold"
                    color={appColors.primary}
                  />
                </View>
              </RowComponent>
              <SpaceComponent height={16} />
              <ButtonComponent
                text={bookingLoading ? "Booking..." : "Book This Session"}
                type="primary"
                onPress={handleBooking}
                disable={bookingLoading}
              />
            </View>
          ) : (
            <ButtonComponent
              text="Select a time slot to book"
              type="outline"
              disable={true}
            />
          )}
        </SectionComponent>

        <SpaceComponent height={30} />
      </ScrollView>
    </View>
  );
};

export default PTDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10, // Giảm padding top
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    padding: 16, // Giảm padding từ 20 → 16
    marginTop: 10, // Giảm margin
    marginBottom: 16, // Giảm margin
  },
  avatarContainer: {
    width: 70, // Giảm size từ 80 → 70
    height: 70,
    borderRadius: 35,
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // Giảm margin
  },
  profileInfo: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  dateItem: {
    width: 60,
    height: 70,
    backgroundColor: appColors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: appColors.lightGray,
  },
  selectedDateItem: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: appColors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.lightGray,
    minWidth: 120,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  noSlotsContainer: {
    padding: 20,
    backgroundColor: appColors.lightGray,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookingInfo: {
    padding: 16,
    backgroundColor: appColors.lightGray,
    borderRadius: 8,
  },
});
