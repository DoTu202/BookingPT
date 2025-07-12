import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import {
  SectionComponent,
  RowComponent,
  TextComponent,
  SpaceComponent,
  CardComponent,
  ButtonComponent,
  InputComponent,
} from '../../components';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Add,
  Edit,
  Trash,
  Calendar1,
} from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import ptApi from '../../apis/ptApi';
import {timeUtils} from '../../utils/timeUtils';
import {fontFamilies} from '../../constants/fontFamilies';

const PTAvailabilityScreen = ({navigation}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [newSlot, setNewSlot] = useState({
    startTime: '',
    endTime: '',
  });

  // Utility function to format date for display
  const formatDate = date => {
    if (!date) return '';
    return dayjs(date).format('dddd, DD MMMM YYYY');
  };

  useEffect(() => {
    loadAvailabilitySlots();
  }, [selectedDate]);

  const loadAvailabilitySlots = async () => {
    try {
      setLoading(true);
      const dateString = dayjs(selectedDate).format('YYYY-MM-DD');

      const response = await ptApi.getAvailabilitySlots({date: dateString});

      // API returns an array of availability slots with startTime and endTime as UTC ISO strings
      const slots = response.data?.data || response.data || [];
      setAvailabilitySlots(slots);
    } catch (error) {
      console.error('Error loading availability slots:', error);
      setAvailabilitySlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      if (!newSlot.startTime || !newSlot.endTime) {
        Alert.alert('Error', 'Please fill in both start and end times.');
        return;
      }

      // Use dayjs to format date
      const dateString = dayjs(selectedDate).format('YYYY-MM-DD');

      // Use new timeUtils to create UTC ISO strings
      const startTimeIso = timeUtils.createUtcIsoString(
        dateString,
        newSlot.startTime,
      );
      const endTimeIso = timeUtils.createUtcIsoString(
        dateString,
        newSlot.endTime,
      );

      if (!startTimeIso || !endTimeIso) {
        Alert.alert('Error', 'Invalid date or time.');
        return;
      }

      // Data sent to API in new format
      const slotData = {
        startTime: startTimeIso,
        endTime: endTimeIso,
      };

      if (editingSlot) {
        await ptApi.updateAvailabilitySlot(editingSlot._id, slotData);
        Alert.alert('Success', 'Time slot updated successfully.');
      } else {
        await ptApi.addAvailabilitySlot(slotData);
        Alert.alert('Success', 'Time slot added successfully.');
      }

      handleModalClose();
      await loadAvailabilitySlots();
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed.';
      Alert.alert('Error', message);
      console.error('Error in handleAddSlot:', error);
    }
  };

  const handleDeleteSlot = async slotId => {
    // Logic to delete remains unchanged
    Alert.alert(
      'Delete Time Slot',
      'Are you sure you want to delete this time slot?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ptApi.deleteAvailabilitySlot(slotId);
              Alert.alert('Success', 'Successfully deleted time slot.');
              await loadAvailabilitySlots();
            } catch (error) {
              console.error('Error deleting slot:', error);
              Alert.alert('Error', 'Failed to delete time slot.');
            }
          },
        },
      ],
    );
  };

  const generateWeekDates = () => {
    const today = dayjs();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(today.add(i, 'day').toDate());
    }
    return dates;
  };

  const AvailabilitySlot = ({slot}) => (
    <CardComponent
      styles={[styles.slotCard, slot.isBooked && styles.bookedSlotCard]}>
      <RowComponent justify="space-between">
        <View style={{flex: 1}}>
          <RowComponent>
            <Clock
              size={16}
              color={slot.isBooked ? appColors.white : appColors.primary}
            />
            <SpaceComponent width={8} />
            <TextComponent
              text={`${timeUtils.formatToVietnameseTime(
                slot.startTime,
              )} - ${timeUtils.formatToVietnameseTime(slot.endTime)}`}
              size={16}
              font="Poppins-SemiBold"
              color={slot.isBooked ? appColors.white : appColors.black}
            />
          </RowComponent>
          {slot.isBooked && slot.clientName && (
            <>
              <SpaceComponent height={4} />
              <TextComponent
                text={`Booked by: ${slot.clientName}`}
                size={12}
                color={appColors.white}
              />
            </>
          )}
          {slot.isBooked && slot.client && (
            <>
              <SpaceComponent height={4} />
              <TextComponent
                text={`Booked by: ${slot.client.username || 'Client'}`}
                size={12}
                color={appColors.white}
              />
            </>
          )}
        </View>

        {!slot.isBooked && (
          <RowComponent>
            <TouchableOpacity
              style={styles.slotActionButton}
              onPress={() => {
                setEditingSlot(slot);

                // Convert UTC ISO strings from API back to 24-hour format for editing
                setNewSlot({
                  startTime: timeUtils.formatTo24HourTime(slot.startTime),
                  endTime: timeUtils.formatTo24HourTime(slot.endTime),
                });
                setShowAddModal(true);
              }}>
              <Edit size={16} color={appColors.primary} />
            </TouchableOpacity>
            <SpaceComponent width={8} />
            <TouchableOpacity
              style={styles.slotActionButton}
              onPress={() => handleDeleteSlot(slot._id || slot.id)}>
              <Trash size={16} color={appColors.danger} />
            </TouchableOpacity>
          </RowComponent>
        )}
      </RowComponent>
    </CardComponent>
  );

  const DateSelector = () => (
    <View style={styles.dateSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {generateWeekDates().map((date, index) => {
          const isSelected =
            date.toDateString() === selectedDate.toDateString();
          return (
            <TouchableOpacity
              key={date.toDateString()}
              style={[
                styles.dateButton,
                isSelected && styles.selectedDateButton,
              ]}
              onPress={() => setSelectedDate(date)}>
              <TextComponent
                text={date.getDate().toString()}
                size={16}
                font="Poppins-SemiBold"
                color={isSelected ? appColors.white : appColors.black}
              />
              <TextComponent
                text={dayjs(date).format('ddd')}
                size={12}
                color={isSelected ? appColors.white : appColors.gray}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const AddSlotModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleModalClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleModalClose}>
            <TextComponent text="Cancel" size={16} color={appColors.primary} />
          </TouchableOpacity>
          <TextComponent
            text={editingSlot ? 'Edit Slot' : 'Add Slot'}
            size={18}
            font="Poppins-SemiBold"
            color={appColors.black}
          />
          <TouchableOpacity onPress={handleAddSlot}>
            <TextComponent
              text="Save"
              size={16}
              color={appColors.primary}
              font="Poppins-SemiBold"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          keyboardShouldPersistTaps="handled">
          <SectionComponent>
            <TextComponent
              text="Date"
              size={16}
              font="Poppins-SemiBold"
              color={appColors.black}
            />
            <SpaceComponent height={8} />
            <View style={styles.dateDisplay}>
              <Calendar1 size={20} color={appColors.primary} />
              <SpaceComponent width={8} />
              <TextComponent
                text={formatDate(selectedDate)}
                size={14}
                color={appColors.black}
              />
            </View>
          </SectionComponent>

          <SectionComponent>
            <TextComponent
              text="Start Time"
              size={16}
              font="Poppins-SemiBold"
              color={appColors.black}
            />
            <SpaceComponent height={8} />
            <TouchableOpacity
              style={styles.timeInput}
              onPress={() => setShowStartTimePicker(true)}>
              <TextComponent
                text={newSlot.startTime || 'Select start time'}
                size={16}
                color={newSlot.startTime ? appColors.black : appColors.gray}
              />
              <Clock size={20} color={appColors.primary} />
            </TouchableOpacity>
          </SectionComponent>

          <SectionComponent>
            <TextComponent
              text="End Time"
              size={16}
              font="Poppins-SemiBold"
              color={appColors.black}
            />
            <SpaceComponent height={8} />
            <TouchableOpacity
              style={styles.timeInput}
              onPress={() => setShowEndTimePicker(true)}>
              <TextComponent
                text={newSlot.endTime || 'Select end time'}
                size={16}
                color={newSlot.endTime ? appColors.black : appColors.gray}
              />
              <Clock size={20} color={appColors.primary} />
            </TouchableOpacity>
          </SectionComponent>
        </ScrollView>

        {/* Time Pickers */}
        {showStartTimePicker && (
          <View>
            {Platform.OS === 'ios' && (
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                  <TextComponent
                    text="Cancel"
                    size={16}
                    color={appColors.primary}
                  />
                </TouchableOpacity>
                <TextComponent
                  text="Select Start Time"
                  size={16}
                  font="Poppins-SemiBold"
                />
                <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                  <TextComponent
                    text="Done"
                    size={16}
                    color={appColors.primary}
                    font="Poppins-SemiBold"
                  />
                </TouchableOpacity>
              </View>
            )}
            <DateTimePicker
              value={createTimeFromString(newSlot.startTime)}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartTimeChange}
            />
          </View>
        )}

        {showEndTimePicker && (
          <View>
            {Platform.OS === 'ios' && (
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                  <TextComponent
                    text="Cancel"
                    size={16}
                    color={appColors.primary}
                  />
                </TouchableOpacity>
                <TextComponent
                  text="Select End Time"
                  size={16}
                  font="Poppins-SemiBold"
                />
                <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                  <TextComponent
                    text="Done"
                    size={16}
                    color={appColors.primary}
                    font="Poppins-SemiBold"
                  />
                </TouchableOpacity>
              </View>
            )}
            <DateTimePicker
              value={createTimeFromString(newSlot.endTime)}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndTimeChange}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const resetModal = () => {
    setEditingSlot(null);
    setNewSlot({
      startTime: '',
      endTime: '',
    });
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    resetModal();
  };

  const formatTimeForInput = time => {
    if (!time) return '';

    // If it's already in HH:MM format, return as is
    if (typeof time === 'string' && time.match(/^\d{2}:\d{2}$/)) {
      return time;
    }

    // Use timeUtils to format time in 24-hour format
    return timeUtils.formatTo24HourTime(time);
  };

  const handleStartTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (selectedTime) {
      // Get time directly from Date object (local time)
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      setNewSlot({...newSlot, startTime: timeString});
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (selectedTime) {
      // Get time directly from Date object
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setNewSlot({...newSlot, endTime: timeString});
    }
  };

  const createTimeFromString = timeString => {
    if (!timeString) {
      // Return current time
      return new Date();
    }

    const [hours, minutes] = timeString.split(':');

    // Create Date object with today's date and specified time
    // Use setHours to set local time
    const date = new Date();
    date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);

    return date;
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />

      {/* Header */}
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
            text="My Availability"
            size={18}
            font={fontFamilies.semiBold}
            color={appColors.white}
            styles={{marginTop: 40}}
          />
          <TouchableOpacity
            onPress={() => {
              resetModal();
              setShowAddModal(true);
            }}
            style={{marginTop: 40}}>
            <Add size={24} color={appColors.white} />
          </TouchableOpacity>
        </RowComponent>
      </View>

      <ScrollView style={styles.content}>
        {/* Date Selector */}
        <DateSelector />

        {/* Selected Date Info */}
        <SectionComponent>
          <TextComponent
            text={formatDate(selectedDate)}
            size={18}
            font="Poppins-SemiBold"
            color={appColors.black}
          />
          <SpaceComponent height={4} />
          <TextComponent
            text={`${availabilitySlots.length} time slots available`}
            size={14}
            color={appColors.gray}
          />
        </SectionComponent>

        {/* Availability Slots */}
        <SectionComponent>
          {availabilitySlots.length > 0 ? (
            availabilitySlots.map((slot, index) => (
              <View key={slot._id || slot.id || `slot-${index}`}>
                <AvailabilitySlot slot={slot} />
                {index < availabilitySlots.length - 1 && (
                  <SpaceComponent height={12} />
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Calendar size={64} color={appColors.gray} />
              <SpaceComponent height={16} />
              <TextComponent
                text="No availability slots"
                size={18}
                font="Poppins-SemiBold"
                color={appColors.gray}
                styles={{textAlign: 'center'}}
              />
              <SpaceComponent height={8} />
              <TextComponent
                text="Add time slots to let clients book sessions"
                size={14}
                color={appColors.gray}
                styles={{textAlign: 'center'}}
              />
              <SpaceComponent height={20} />
              <ButtonComponent
                text="Add First Slot"
                type="primary"
                onPress={() => {
                  resetModal();
                  setShowAddModal(true);
                }}
              />
            </View>
          )}
        </SectionComponent>

        <SpaceComponent height={100} />
      </ScrollView>

      <AddSlotModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  header: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
    height: 140,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  dateSelector: {
    marginBottom: 20,
  },
  dateButton: {
    width: 60,
    height: 70,
    borderRadius: 35,
    backgroundColor: appColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDateButton: {
    backgroundColor: appColors.primary,
  },
  slotCard: {
    padding: 16,
  },
  bookedSlotCard: {
    backgroundColor: appColors.primary,
  },
  slotActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: appColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: appColors.gray2,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  timeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: appColors.gray4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default PTAvailabilityScreen;
