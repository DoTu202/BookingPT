// import React, { useState, useEffect } from 'react';
// import {
//   StyleSheet,
//   View,
//   FlatList,
//   TouchableOpacity,
//   RefreshControl,
//   SafeAreaView,
//   StatusBar,
//   Alert,
// } from 'react-native';
// import {
//   SectionComponent,
//   RowComponent,
//   TextComponent,
//   SpaceComponent,
//   CardComponent,
//   ButtonComponent,
// } from '../../components';
// import {
//   ArrowLeft,
//   Calendar,
//   Clock,
//   User,
//   CheckCircle,
//   CloseCircle,
//   Filter,
// } from 'iconsax-react-native';
// import appColors from '../../constants/appColors';
// import ptApi from '../../apis/ptApi';

// const PTBookingsScreen = ({ navigation }) => {
//   const [activeTab, setActiveTab] = useState('pending');
//   const [bookings, setBookings] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   const tabs = [
//     { key: 'pending', label: 'Pending', color: appColors.warning },
//     { key: 'confirmed', label: 'Confirmed', color: appColors.success },
//     { key: 'completed', label: 'Completed', color: appColors.info },
//     { key: 'cancelled', label: 'Cancelled', color: appColors.danger },
//   ];

//   useEffect(() => {
//     loadBookings();
//   }, [activeTab]);

//   const loadBookings = async () => {
//     try {
//       setLoading(true);
//       const response = await ptApi.getBookings({ status: activeTab });
      
//       if (response.data && response.data.data) {
//         setBookings(response.data.data);
//       } else if (response.data && Array.isArray(response.data)) {
//         setBookings(response.data);
//       } else {
//         setBookings([]);
//       }
//     } catch (error) {
//       console.error('Error loading bookings:', error);
//       setBookings([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadBookings();
//     setRefreshing(false);
//   };

//   const handleBookingAction = async (bookingId, action) => {
//     try {
//       let response;
      
//       if (action === 'confirm') {
//         response = await ptApi.confirmBooking(bookingId);
//         Alert.alert('Success', 'Booking confirmed successfully');
//       } else if (action === 'reject') {
//         response = await ptApi.rejectBooking(bookingId);
//         Alert.alert('Success', 'Booking rejected');
//       } else if (action === 'complete') {
//         response = await ptApi.markBookingAsCompleted(bookingId);
//         Alert.alert('Success', 'Booking marked as completed');
//       }
      
//       // Reload bookings
//       await loadBookings();
//     } catch (error) {
//       console.error(`Error ${action} booking:`, error);
//       Alert.alert('Error', `Failed to ${action} booking`);
//     }
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('vi-VN', {
//       style: 'currency',
//       currency: 'VND',
//     }).format(amount);
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       weekday: 'short',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const BookingCard = ({ item }) => (
//     <CardComponent styles={styles.bookingCard}>
//       <RowComponent justify="space-between">
//         <RowComponent styles={{ flex: 1 }}>
//           <View style={styles.avatarContainer}>
//             <User size={20} color={appColors.white} />
//           </View>
//           <SpaceComponent width={12} />
//           <View style={{ flex: 1 }}>
//             <TextComponent
//               text={item.client?.username || item.clientName || 'Client'}
//               size={16}
//               font="Poppins-SemiBold"
//               color={appColors.black}
//             />
//             <TextComponent
//               text={item.service || 'Personal Training'}
//               size={14}
//               color={appColors.gray}
//             />
//             <SpaceComponent height={4} />
//             <RowComponent>
//               <Calendar size={14} color={appColors.gray} />
//               <SpaceComponent width={4} />
//               <TextComponent
//                 text={formatDate(item.date)}
//                 size={12}
//                 color={appColors.gray}
//               />
//               <SpaceComponent width={12} />
//               <Clock size={14} color={appColors.gray} />
//               <SpaceComponent width={4} />
//               <TextComponent
//                 text={item.time || `${item.startTime}-${item.endTime}`}
//                 size={12}
//                 color={appColors.gray}
//               />
//             </RowComponent>
//           </View>
//         </RowComponent>
//         <View style={styles.priceContainer}>
//           <TextComponent
//             text={formatCurrency(item.price || item.hourlyRate || 0)}
//             size={14}
//             font="Poppins-SemiBold"
//             color={appColors.primary}
//           />
//         </View>
//       </RowComponent>

//       {item.notes && (
//         <>
//           <SpaceComponent height={12} />
//           <View style={styles.notesContainer}>
//             <TextComponent
//               text={`Notes: ${item.notes}`}
//               size={12}
//               color={appColors.gray}
//               styles={{ fontStyle: 'italic' }}
//             />
//           </View>
//         </>
//       )}

//       {/* Action Buttons */}
//       {activeTab === 'pending' && (
//         <>
//           <SpaceComponent height={12} />
//           <RowComponent justify="space-between">
//             <TouchableOpacity
//               style={[styles.actionButton, styles.rejectButton]}
//               onPress={() => handleBookingAction(item._id || item.id, 'reject')}
//             >
//               <CloseCircle size={16} color={appColors.danger} />
//               <SpaceComponent width={4} />
//               <TextComponent
//                 text="Reject"
//                 size={12}
//                 color={appColors.danger}
//                 font="Poppins-Medium"
//               />
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[styles.actionButton, styles.confirmButton]}
//               onPress={() => handleBookingAction(item._id || item.id, 'confirm')}
//             >
//               <CheckCircle size={16} color={appColors.success} />
//               <SpaceComponent width={4} />
//               <TextComponent
//                 text="Confirm"
//                 size={12}
//                 color={appColors.success}
//                 font="Poppins-Medium"
//               />
//             </TouchableOpacity>
//           </RowComponent>
//         </>
//       )}

//       {activeTab === 'confirmed' && (
//         <>
//           <SpaceComponent height={12} />
//           <ButtonComponent
//             text="Mark as Completed"
//             type="primary"
//             onPress={() => handleBookingAction(item._id || item.id, 'complete')}
//             styles={styles.completeButton}
//           />
//         </>
//       )}
//     </CardComponent>
//   );

//   const TabButton = ({ tab, isActive, onPress }) => (
//     <TouchableOpacity
//       style={[
//         styles.tabButton,
//         isActive && { backgroundColor: tab.color }
//       ]}
//       onPress={onPress}
//     >
//       <TextComponent
//         text={tab.label}
//         size={14}
//         font={isActive ? "Poppins-SemiBold" : "Poppins-Regular"}
//         color={isActive ? appColors.white : appColors.gray}
//       />
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <RowComponent justify="space-between">
//           <TouchableOpacity onPress={() => navigation.goBack()}>
//             <ArrowLeft size={24} color={appColors.white} />
//           </TouchableOpacity>
//           <TextComponent
//             text="My Bookings"
//             size={20}
//             font="Poppins-Bold"
//             color={appColors.white}
//           />
//           <TouchableOpacity>
//             <Filter size={24} color={appColors.white} />
//           </TouchableOpacity>
//         </RowComponent>
//       </View>

//       {/* Tabs */}
//       <View style={styles.tabsContainer}>
//         <RowComponent justify="space-between">
//           {tabs.map((tab) => (
//             <TabButton
//               key={tab.key}
//               tab={tab}
//               isActive={activeTab === tab.key}
//               onPress={() => setActiveTab(tab.key)}
//             />
//           ))}
//         </RowComponent>
//       </View>

//       {/* Bookings List */}
//       <View style={styles.content}>
//         {bookings.length > 0 ? (
//           <FlatList
//             data={bookings}
//             keyExtractor={(item) => item._id || item.id}
//             renderItem={({ item }) => <BookingCard item={item} />}
//             showsVerticalScrollIndicator={false}
//             refreshControl={
//               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//             }
//             contentContainerStyle={styles.listContainer}
//             ItemSeparatorComponent={() => <SpaceComponent height={12} />}
//           />
//         ) : (
//           <View style={styles.emptyContainer}>
//             <Calendar size={64} color={appColors.gray} />
//             <SpaceComponent height={16} />
//             <TextComponent
//               text={`No ${activeTab} bookings`}
//               size={18}
//               font="Poppins-SemiBold"
//               color={appColors.gray}
//               styles={{ textAlign: 'center' }}
//             />
//             <SpaceComponent height={8} />
//             <TextComponent
//               text="Your bookings will appear here"
//               size={14}
//               color={appColors.gray}
//               styles={{ textAlign: 'center' }}
//             />
//           </View>
//         )}
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: appColors.white,
//   },
//   header: {
//     backgroundColor: appColors.primary,
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 20,
//   },
//   tabsContainer: {
//     backgroundColor: appColors.white,
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: appColors.gray2,
//   },
//   tabButton: {
//     flex: 1,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     marginHorizontal: 4,
//     alignItems: 'center',
//     backgroundColor: appColors.gray2,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 16,
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
//   bookingCard: {
//     padding: 16,
//   },
//   avatarContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: appColors.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   priceContainer: {
//     alignItems: 'flex-end',
//   },
//   notesContainer: {
//     backgroundColor: appColors.gray2,
//     padding: 8,
//     borderRadius: 8,
//   },
//   actionButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     marginHorizontal: 4,
//   },
//   rejectButton: {
//     backgroundColor: appColors.danger + '20',
//   },
//   confirmButton: {
//     backgroundColor: appColors.success + '20',
//   },
//   completeButton: {
//     paddingVertical: 8,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
// });

// export default PTBookingsScreen;

import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const PTBookingsScreen = () => {
  return (
    <View>
      <Text>PTBookingsScreen</Text>
    </View>
  )
}

export default PTBookingsScreen

const styles = StyleSheet.create({})