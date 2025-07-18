import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft} from 'iconsax-react-native';
import {
  ContainerComponent,
  SectionComponent,
  RowComponent,
  TextComponent,
  ButtonComponent,
  CardComponent,
  SpaceComponent,
} from '../../components';
import {Star1, Location} from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import clientApi from '../../apis/clientApi';
import {timeUtils} from '../../utils/timeUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {fontFamilies} from '../../constants/fontFamilies';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const {width} = Dimensions.get('window');

const PTDetailScreen = ({navigation, route}) => {
  // Get PT data from navigation params
  const {item} = route.params;

  // Component states
  const [ptProfile, setPtProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [imageError, setImageError] = useState(false);

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

  const initializePTData = async () => {
    try {
      if (!item || typeof item !== 'object') {
        console.error('Invalid PT data received');
        Alert.alert('Error', 'Invalid trainer data');
        navigation.goBack();
        return;
      }
      const ptData = item.ptData || item;

      if (!ptData.user?._id) {
        console.error('Missing user information in PT data');
        Alert.alert('Error', 'Trainer information incomplete');
        navigation.goBack();
        return;
      }

      setLoadingProfile(true);

      // Fetch complete PT profile to get all details
      try {
        const response = await clientApi.getPTProfile(ptData.user._id);
        if (response.data) {
          setPtProfile(response.data);
        } else {
          // If detailed profile fetch fails, use the data we already have
          setPtProfile(ptData);
        }
      } catch (profileError) {
        console.error('Error fetching detailed profile:', profileError);
        // If detailed profile fetch fails, use the data we already have
        setPtProfile(ptData);
      }

      // Set default date to today or first reasonable date
      const today = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
      setSelectedDate(today);
    } catch (error) {
      console.error('Error initializing PT data:', error);
      // If detailed profile fetch fails, use the data we already have
      const ptData = item.ptData || item;
      setPtProfile(ptData);

      const today = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
      setSelectedDate(today);
    } finally {
      setLoading(false);
      setLoadingProfile(false);
    }
  };

  const loadAvailability = async () => {
    try {
      // Format selectedDate to YYYY-MM-DD string if it's a Date object
      let dateString = selectedDate;
      if (selectedDate instanceof Date) {
        dateString = selectedDate.toISOString().split('T')[0];
      } else if (
        typeof selectedDate === 'string' &&
        selectedDate.includes('T')
      ) {
        dateString = selectedDate.split('T')[0];
      }

      const response = await clientApi.getPTAvailability(ptProfile.user._id, {
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
                  routes: [{name: 'Login'}],
                });
              },
            },
          ],
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
        notesFromClient: `Mobile app booking - Duration: ${
          sessionDetails.duration
        }h, Total: ${sessionDetails.totalPrice.toLocaleString()} VND`,
      };

      const response = await clientApi.createBooking(bookingData);

      if (response.data.success || response.data.message) {
        Alert.alert(
          'Booking Success! ',
          `Your booking request has been sent successfully!\n\nTrainer: ${
            ptProfile.user.username
          }\nTime: ${timeUtils.formatToVietnameseTime(
            selectedSlot.startTime,
          )} - ${timeUtils.formatToVietnameseTime(
            selectedSlot.endTime,
          )}\nDate: ${timeUtils.formatToEnglishDate(
            selectedDate,
          )}\nTotal: ${sessionDetails.totalPrice.toLocaleString()} VND\n\nThe trainer will confirm your booking soon.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh availability after booking
                loadAvailability();
                setSelectedSlot(null);
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error creating booking:', error);

      let errorTitle = 'Booking Failed ';
      let errorMessage = 'Failed to create booking. Please try again.';

      if (error.response?.data) {
        const responseData = error.response.data;

        if (responseData.message) {
          errorMessage = responseData.message;

          if (errorMessage.includes('Conflict ') || errorMessage.includes('')) {
            errorTitle = 'Schedule Conflict ';
            errorMessage =
              'You already have a booking that conflicts with this time slot. Please choose a different time.';
          } else if (errorMessage.includes('status')) {
            errorTitle = 'Time Slot Unavailable ';
            errorMessage =
              'This time slot is no longer available. Please select another time.';
          } else if (errorMessage.includes('past')) {
            errorTitle = 'Invalid Time ';
            errorMessage =
              'Cannot book a time slot in the past. Please select a future time.';
          } else if (
            errorMessage.includes('authorization') ||
            errorMessage.includes('token')
          ) {
            errorTitle = 'Authentication Error ';
            errorMessage = 'Please log in again to continue.';
          } else {
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
            loadAvailability();
            setSelectedSlot(null);
          },
        },
      ]);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      if (!ptProfile?.user?._id) {
        Alert.alert('Error', 'Cannot start chat with this trainer');
        return;
      }
      const chatResponse = await clientApi.startChatWithPT(ptProfile.user._id);
      if (chatResponse?.data?.chatRoomId) {
        navigation.navigate('ChatScreen', {
          chatRoomId: chatResponse.data.chatRoomId,
          otherUser: ptProfile.user,
        });
      } else {
        navigation.navigate('ChatListScreen');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      navigation.navigate('ChatListScreen');
    }
  };

  // Calculate session duration and total price
  const calculateSessionDetails = slot => {
    if (!slot || !ptProfile?.hourlyRate) return {duration: 0, totalPrice: 0};

    // Parse ISO time strings from backend to dayjs objects in Vietnam timezone
    const startTime = dayjs(slot.startTime).tz('Asia/Ho_Chi_Minh');
    const endTime = dayjs(slot.endTime).tz('Asia/Ho_Chi_Minh');
    const durationHours = endTime.diff(startTime, 'hour', true);
    const totalPrice = durationHours * ptProfile.hourlyRate;

    return {
      duration: durationHours,
      totalPrice: Math.round(totalPrice),
    };
  };

  // Render loading state
  if (loading) {
    return (
      <ContainerComponent>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <SpaceComponent height={16} />
          <TextComponent
            text="Loading trainer information..."
            color={appColors.gray}
          />
        </View>
      </ContainerComponent>
    );
  }

  const photoUrl = ptProfile.user?.photoUrl || '';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />

      <View style={styles.header}>
        <RowComponent justify="space-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft
              size={24}
              color={appColors.white}
              style={{marginTop: 40}}
            />
          </TouchableOpacity>
          <TextComponent
            text="Personal Trainer Details"
            size={20}
            font={fontFamilies.bold}
            color={appColors.white}
            styles={{marginTop: 40}}
          />
          <View style={{width: 24}} />
        </RowComponent>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* PT Profile Card */}
        <CardComponent styles={styles.profileCard}>
          <RowComponent>
            {/* PT Avatar - Show image if available, fallback to text avatar */}
            {loadingProfile ? (
              <View style={styles.avatarContainer}>
                <ActivityIndicator size="small" color={appColors.white} />
              </View>
            ) : photoUrl && !imageError ? (
              <View style={styles.avatarContainer}>
                <Image
                  source={{uri: photoUrl}}
                  style={styles.avatarImage}
                  onError={() => setImageError(true)}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.avatarContainer}>
                <TextComponent
                  text={(ptProfile.user?.username || 'PT')
                    .charAt(0)
                    .toUpperCase()}
                  size={28}
                  color={appColors.white}
                  font="Poppins-Bold"
                />
              </View>
            )}

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
                  text={`${(
                    ptProfile.rating ||
                    ptProfile.averageRating ||
                    4.5
                  ).toFixed(1)} (${
                    ptProfile.totalSessions || ptProfile.numReviews || 0
                  } sessions)`}
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
                      ? `${ptProfile.location.district || ''}, ${
                          ptProfile.location.city || ''
                        }`
                      : ptProfile.location || 'Ha Noi'
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
                styles={{lineHeight: 20}}
              />
              <SpaceComponent height={12} />
            </>
          )}

          {/* Specializations */}
          {ptProfile.specializations &&
            ptProfile.specializations.length > 0 && (
              <>
                <TextComponent
                  text="Specializations"
                  size={16}
                  font="Poppins-SemiBold"
                  color={appColors.black}
                />
                <SpaceComponent height={8} />
                <View style={styles.specializationsContainer}>
                  {ptProfile.specializations.map((spec, index) => (
                    <View key={index} style={styles.specializationTag}>
                      <TextComponent
                        text={
                          typeof spec === 'string'
                            ? spec.replace('_', ' ')
                            : 'Specialization'
                        }
                        size={12}
                        color={appColors.primary}
                      />
                    </View>
                  ))}
                </View>
                <SpaceComponent height={12} />
              </>
            )}

          {/* Price and Experience */}
          <RowComponent justify="space-between">
            <View>
              <TextComponent
                text="Experience"
                size={14}
                color={appColors.gray}
              />
              <TextComponent
                text={`${ptProfile.experienceYears || 3} years`}
                size={16}
                font="Poppins-SemiBold"
                color={appColors.black}
              />
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <TextComponent
                text="Price per hour"
                size={14}
                color={appColors.gray}
              />
              <TextComponent
                text={`${ptProfile.hourlyRate.toLocaleString()} VND`}
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
                const date = dayjs().tz('Asia/Ho_Chi_Minh').add(index, 'day');
                const dateStr = date.format('YYYY-MM-DD');
                const isSelected = selectedDate === dateStr;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateItem,
                      isSelected && styles.selectedDateItem,
                    ]}
                    onPress={() => setSelectedDate(dateStr)}>
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
              {availability
                .filter(
                  slot =>
                    !slot.isBooked &&
                    (!slot.status || slot.status === 'available'),
                )
                .map((slot, index) => {
                  const isSelected = selectedSlot?._id === slot._id;

                  return (
                    <TouchableOpacity
                      key={slot._id || index}
                      style={[
                        styles.timeSlot,
                        isSelected && styles.selectedTimeSlot,
                      ]}
                      onPress={() => setSelectedSlot(slot)}>
                      <TextComponent
                        text={`${timeUtils.formatToVietnameseTime(
                          slot.startTime,
                        )} - ${timeUtils.formatToVietnameseTime(slot.endTime)}`}
                        size={14}
                        color={isSelected ? appColors.white : appColors.black}
                        font={
                          isSelected ? 'Poppins-SemiBold' : 'Poppins-Regular'
                        }
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
                styles={{textAlign: 'center'}}
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
                    text={`${timeUtils.formatToVietnameseTime(
                      selectedSlot.startTime,
                    )} - ${timeUtils.formatToVietnameseTime(
                      selectedSlot.endTime,
                    )}`}
                    size={16}
                    font="Poppins-SemiBold"
                    color={appColors.black}
                  />
                  <TextComponent
                    text={timeUtils.formatToEnglishDate(selectedDate)}
                    size={14}
                    color={appColors.gray}
                  />
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <TextComponent
                    text="Duration"
                    size={14}
                    color={appColors.gray}
                  />
                  <TextComponent
                    text={`${
                      calculateSessionDetails(selectedSlot).duration
                    } hours`}
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
                    text={`${calculateSessionDetails(
                      selectedSlot,
                    ).totalPrice.toLocaleString()} VND`}
                    size={16}
                    font="Poppins-Bold"
                    color={appColors.primary}
                  />
                </View>
              </RowComponent>
              <SpaceComponent height={16} />
              <ButtonComponent
                text={bookingLoading ? 'Booking...' : 'Book This Session'}
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

          <SpaceComponent height={12} />

          {/* Chat Button */}
          <ButtonComponent
            text="Chat with this PT"
            type="outline"
            onPress={handleStartChat}
            textColor={appColors.primary}
          />
        </SectionComponent>

        <SpaceComponent height={30} />
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    padding: 16,
    marginTop: 10,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specializationTag: {
    backgroundColor: `${appColors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
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
  header: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
    height: 140,
    borderRadius: 20,
  },
});
