// import React, { useState, useEffect } from 'react';
// import {
//   StyleSheet,
//   View,
//   ScrollView,
//   TouchableOpacity,
//   RefreshControl,
//   StatusBar,
//   SafeAreaView,
// } from 'react-native';
// import {
//   SectionComponent,
//   RowComponent,
//   TextComponent,
//   SpaceComponent,
//   CardComponent,
// } from '../../components';
// import {
//   Calendar,
//   Clock,
//   Money,
//   Users,
//   Star1,
//   Notification,
//   Setting2,
// } from 'iconsax-react-native';
// import appColors from '../../constants/appColors';
// import { useSelector, useDispatch } from 'react-redux';
// import { authSelector, removeAuth } from '../../redux/reducers/authReducer';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import ptApi from '../../apis/ptApi';

// const PTHomeScreen = ({ navigation }) => {
//   const dispatch = useDispatch();
//   const auth = useSelector(authSelector);
  
//   const [refreshing, setRefreshing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [dashboardData, setDashboardData] = useState({
//     todayBookings: 0,
//     monthlyEarnings: 0,
//     totalClients: 0,
//     rating: 0,
//     upcomingBookings: [],
//     recentActivity: []
//   });

//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
//       const response = await ptApi.getDashboardStats();
      
//       if (response.data) {
//         setDashboardData(response.data);
//       }
//     } catch (error) {
//       console.error('Error loading dashboard data:', error);
//       // Fallback to default data if API fails
//       setDashboardData({
//         todayBookings: 0,
//         monthlyEarnings: 0,
//         totalClients: 0,
//         rating: 0,
//         upcomingBookings: [],
//         recentActivity: []
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadDashboardData();
//     setRefreshing(false);
//   };

//   const handleLogout = async () => {
//     try {
//       await AsyncStorage.removeItem('auth');
//       dispatch(removeAuth());
//     } catch (error) {
//       console.error('Error during logout:', error);
//     }
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('vi-VN', {
//       style: 'currency',
//       currency: 'VND',
//     }).format(amount);
//   };

//   const QuickStatsCard = ({ icon, title, value, color, onPress }) => (
//     <TouchableOpacity onPress={onPress} style={styles.statsCard}>
//       <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
//         {icon}
//       </View>
//       <SpaceComponent height={8} />
//       <TextComponent
//         text={value}
//         size={20}
//         font="Poppins-Bold"
//         color={appColors.black}
//       />
//       <TextComponent
//         text={title}
//         size={12}
//         color={appColors.gray}
//       />
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <RowComponent justify="space-between">
//           <View>
//             <TextComponent
//               text="Good morning!"
//               size={14}
//               color={appColors.white}
//             />
//             <TextComponent
//               text={auth.user?.username || 'Trainer'}
//               size={20}
//               font="Poppins-Bold"
//               color={appColors.white}
//             />
//           </View>
//           <RowComponent>
//             <TouchableOpacity style={styles.headerButton}>
//               <Notification size={24} color={appColors.white} />
//             </TouchableOpacity>
//             <SpaceComponent width={12} />
//             <TouchableOpacity 
//               style={styles.headerButton}
//               onPress={handleLogout}
//             >
//               <Setting2 size={24} color={appColors.white} />
//             </TouchableOpacity>
//           </RowComponent>
//         </RowComponent>
//       </View>

//       <ScrollView 
//         style={styles.content}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         {/* Quick Stats */}
//         <SectionComponent>
//           <TextComponent
//             text="Today's Overview"
//             size={18}
//             font="Poppins-SemiBold"
//             color={appColors.black}
//           />
//           <SpaceComponent height={16} />
          
//           <View style={styles.statsContainer}>
//             <QuickStatsCard
//               icon={<Calendar size={24} color={appColors.primary} />}
//               title="Today's Bookings"
//               value={dashboardData.todayBookings.toString()}
//               color={appColors.primary}
//               onPress={() => navigation.navigate('PTBookings')}
//             />
//             <QuickStatsCard
//               icon={<Money size={24} color={appColors.success} />}
//               title="Monthly Earnings"
//               value={formatCurrency(dashboardData.monthlyEarnings)}
//               color={appColors.success}
//               onPress={() => navigation.navigate('PTEarnings')}
//             />
//           </View>
          
//           <SpaceComponent height={12} />
          
//           <View style={styles.statsContainer}>
//             <QuickStatsCard
//               icon={<Users size={24} color={appColors.info} />}
//               title="Total Clients"
//               value={dashboardData.totalClients.toString()}
//               color={appColors.info}
//               onPress={() => navigation.navigate('PTClients')}
//             />
//             <QuickStatsCard
//               icon={<Star1 size={24} color={appColors.warning} variant="Bold" />}
//               title="Average Rating"
//               value={dashboardData.rating.toString()}
//               color={appColors.warning}
//               onPress={() => navigation.navigate('PTProfile')}
//             />
//           </View>
//         </SectionComponent>

//         {/* Quick Actions */}
//         <SectionComponent>
//           <TextComponent
//             text="Quick Actions"
//             size={18}
//             font="Poppins-SemiBold"
//             color={appColors.black}
//           />
//           <SpaceComponent height={16} />
          
//           <View style={styles.actionsContainer}>
//             <TouchableOpacity 
//               style={styles.actionButton}
//               onPress={() => navigation.navigate('PTAvailability')}
//             >
//               <Clock size={20} color={appColors.white} />
//               <SpaceComponent width={8} />
//               <TextComponent
//                 text="Set Availability"
//                 color={appColors.white}
//                 font="Poppins-Medium"
//               />
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={[styles.actionButton, styles.actionButtonSecondary]}
//               onPress={() => navigation.navigate('PTBookings')}
//             >
//               <Calendar size={20} color={appColors.primary} />
//               <SpaceComponent width={8} />
//               <TextComponent
//                 text="View Bookings"
//                 color={appColors.primary}
//                 font="Poppins-Medium"
//               />
//             </TouchableOpacity>
//           </View>
//         </SectionComponent>

//         {/* Recent Clients */}
//         <SectionComponent>
//           <RowComponent justify="space-between">
//             <TextComponent
//               text="Recent Clients"
//               size={18}
//               font="Poppins-SemiBold"
//               color={appColors.black}
//             />
//             <TouchableOpacity onPress={() => navigation.navigate('PTClients')}>
//               <TextComponent
//                 text="View All"
//                 size={14}
//                 color={appColors.primary}
//               />
//             </TouchableOpacity>
//           </RowComponent>
//           <SpaceComponent height={16} />
          
//           {dashboardData.recentClients?.length > 0 ? (
//             dashboardData.recentClients.slice(0, 3).map((client, index) => (
//               <CardComponent key={client.id} styles={styles.clientCard}>
//                 <RowComponent justify="space-between">
//                   <RowComponent>
//                     <View style={styles.clientAvatar}>
//                       <TextComponent
//                         text={client.name.charAt(0).toUpperCase()}
//                         size={16}
//                         font="Poppins-SemiBold"
//                         color={appColors.white}
//                       />
//                     </View>
//                     <SpaceComponent width={12} />
//                     <View>
//                       <TextComponent
//                         text={client.name}
//                         size={16}
//                         font="Poppins-SemiBold"
//                         color={appColors.black}
//                       />
//                       <TextComponent
//                         text={`${client.totalSessions} sessions • $${client.totalSpent.toFixed(0)} spent`}
//                         size={12}
//                         color={appColors.gray}
//                       />
//                     </View>
//                   </RowComponent>
//                   <TouchableOpacity style={styles.clientActionButton}>
//                     <Users size={16} color={appColors.primary} />
//                   </TouchableOpacity>
//                 </RowComponent>
//               </CardComponent>
//             ))
//           ) : (
//             <CardComponent styles={styles.emptyCard}>
//               <TextComponent
//                 text="No recent client activity"
//                 size={14}
//                 color={appColors.gray}
//                 styles={{ textAlign: 'center' }}
//               />
//             </CardComponent>
//           )}
//         </SectionComponent>

//         {/* Upcoming Bookings */}
//         <SectionComponent>
//           <RowComponent justify="space-between">
//             <TextComponent
//               text="Upcoming Sessions"
//               size={18}
//               font="Poppins-SemiBold"
//               color={appColors.black}
//             />
//             <TouchableOpacity onPress={() => navigation.navigate('PTBookings')}>
//               <TextComponent
//                 text="View All"
//                 size={14}
//                 color={appColors.primary}
//               />
//             </TouchableOpacity>
//           </RowComponent>
//           <SpaceComponent height={16} />
          
//           {dashboardData.upcomingBookings.length > 0 ? (
//             dashboardData.upcomingBookings.map((booking, index) => (
//               <CardComponent key={booking._id || booking.id} styles={styles.bookingCard}>
//                 <RowComponent justify="space-between">
//                   <View style={{ flex: 1 }}>
//                     <TextComponent
//                       text={booking.client?.username || booking.clientName || 'Client'}
//                       size={16}
//                       font="Poppins-SemiBold"
//                       color={appColors.black}
//                     />
//                     <TextComponent
//                       text={booking.service || booking.type || 'Personal Training'}
//                       size={14}
//                       color={appColors.gray}
//                     />
//                   </View>
//                   <View style={styles.timeContainer}>
//                     <TextComponent
//                       text={booking.time || `${booking.startTime}-${booking.endTime}`}
//                       size={14}
//                       font="Poppins-Medium"
//                       color={appColors.primary}
//                     />
//                   </View>
//                 </RowComponent>
//                 {index < dashboardData.upcomingBookings.length - 1 && (
//                   <SpaceComponent height={12} />
//                 )}
//               </CardComponent>
//             ))
//           ) : (
//             <CardComponent styles={styles.emptyCard}>
//               <TextComponent
//                 text="No upcoming sessions today"
//                 size={14}
//                 color={appColors.gray}
//                 styles={{ textAlign: 'center' }}
//               />
//             </CardComponent>
//           )}
//         </SectionComponent>

//         <SpaceComponent height={100} />
//       </ScrollView>
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
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//   },
//   headerButton: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 20,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   statsCard: {
//     flex: 1,
//     backgroundColor: appColors.white,
//     paddingVertical: 16,
//     paddingHorizontal: 12,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginHorizontal: 4,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   statsIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   actionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   actionButton: {
//     flex: 1,
//     backgroundColor: appColors.primary,
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginHorizontal: 4,
//   },
//   actionButtonSecondary: {
//     backgroundColor: appColors.white,
//     borderWidth: 1,
//     borderColor: appColors.primary,
//   },
//   bookingCard: {
//     marginBottom: 12,
//   },
//   timeContainer: {
//     backgroundColor: appColors.primary + '20',
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 6,
//   },
//   emptyCard: {
//     paddingVertical: 24,
//     alignItems: 'center',
//     backgroundColor: appColors.gray2,
//   },
//   clientCard: {
//     marginBottom: 12,
//     backgroundColor: appColors.white,
//   },
//   clientAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: appColors.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   clientActionButton: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: appColors.gray2,
//   },
// });

// export default PTHomeScreen;

import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const PTHomeScreen = () => {
  return (
    <View>
      <Text>PTHomeScreen</Text>
    </View>
  )
}

export default PTHomeScreen

const styles = StyleSheet.create({})