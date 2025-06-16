// import React, {useEffect, useState, useCallback} from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   RefreshControl,
//   Alert,
//   Image,
//   StyleSheet,
//   SafeAreaView,
// } from 'react-native';
// import {
//   User,
//   Edit3,
//   Star,
//   Calendar,
//   Users,
//   Award,
//   Settings,
//   LogOut,
//   Camera,
//   Mail,
//   Phone,
//   MapPin,
//   Clock,
//   DollarSign,
// } from 'lucide-react-native';
// import {useSelector, useDispatch} from 'react-redux';
// import appColors from '../../constants/appColors';
// import {fontFamilies} from '../../constants/fontFamilies';
// import {LoadingModal} from '../../modals';
// import ptApi from '../../apis/ptApi';
// import {logout} from '../../redux/reducers/authReducer';

// const PTProfileScreen = ({navigation}) => {
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [profile, setProfile] = useState(null);
//   const [stats, setStats] = useState({
//     totalClients: 0,
//     totalSessions: 0,
//     totalEarnings: 0,
//     rating: 0,
//     reviewCount: 0,
//   });

//   const dispatch = useDispatch();
//   const auth = useSelector(state => state.auth);

//   const fetchProfileData = useCallback(async () => {
//     try {
//       setLoading(true);
      
//       // Get PT profile
//       const profileResponse = await ptApi.getProfile();
//       const profileData = profileResponse.data?.data;
      
//       if (profileData) {
//         setProfile(profileData);
        
//         // Get bookings for stats
//         const bookingsResponse = await ptApi.getBookings();
//         const bookings = bookingsResponse.data?.data || [];
        
//         const completedBookings = bookings.filter(booking => booking.status === 'completed');
//         const uniqueClients = new Set(
//           bookings.map(booking => booking.client?._id || booking.clientId)
//         ).size;
        
//         const totalEarnings = completedBookings.reduce((total, booking) => 
//           total + (booking.price || 0), 0
//         );
        
//         setStats({
//           totalClients: uniqueClients,
//           totalSessions: completedBookings.length,
//           totalEarnings,
//           rating: profileData.rating || 0,
//           reviewCount: profileData.reviews?.length || 0,
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching profile data:', error);
//       Alert.alert('Error', 'Failed to load profile data');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchProfileData();
//   }, [fetchProfileData]);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchProfileData();
//   }, [fetchProfileData]);

//   const handleEditProfile = () => {
//     // Navigate to edit profile screen
//     Alert.alert('Coming Soon', 'Profile editing feature will be available soon');
//   };

//   const handleChangePhoto = () => {
//     Alert.alert('Coming Soon', 'Photo upload feature will be available soon');
//   };

//   const handleLogout = () => {
//     Alert.alert(
//       'Logout',
//       'Are you sure you want to logout?',
//       [
//         {text: 'Cancel', style: 'cancel'},
//         {
//           text: 'Logout',
//           style: 'destructive',
//           onPress: () => {
//             dispatch(logout());
//           },
//         },
//       ]
//     );
//   };

//   const formatCurrency = (amount) => {
//     return `$${amount.toFixed(2)}`;
//   };

//   const renderStatCard = ({title, value, icon: Icon, color}) => (
//     <View style={styles.statCard}>
//       <Icon size={24} color={color} />
//       <Text style={styles.statValue}>{value}</Text>
//       <Text style={styles.statTitle}>{title}</Text>
//     </View>
//   );

//   const renderMenuOption = ({title, icon: Icon, onPress, isDestructive = false}) => (
//     <TouchableOpacity style={styles.menuOption} onPress={onPress}>
//       <View style={styles.menuOptionLeft}>
//         <Icon 
//           size={20} 
//           color={isDestructive ? appColors.error : appColors.gray} 
//         />
//         <Text style={[
//           styles.menuOptionText,
//           isDestructive && {color: appColors.error}
//         ]}>
//           {title}
//         </Text>
//       </View>
//       <Edit3 
//         size={16} 
//         color={isDestructive ? appColors.error : appColors.gray} 
//       />
//     </TouchableOpacity>
//   );

//   if (loading && !refreshing) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <LoadingModal visible={true} />
//       </SafeAreaView>
//     );
//   }

//   if (!profile) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>Failed to load profile</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={fetchProfileData}>
//             <Text style={styles.retryText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }>
        
//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Profile</Text>
//           <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
//             <Edit3 size={20} color={appColors.primary} />
//           </TouchableOpacity>
//         </View>

//         {/* Profile Card */}
//         <View style={styles.profileCard}>
//           <View style={styles.profileImageContainer}>
//             <Image
//               source={{
//                 uri: profile.avatar || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face'
//               }}
//               style={styles.profileImage}
//             />
//             <TouchableOpacity style={styles.cameraButton} onPress={handleChangePhoto}>
//               <Camera size={16} color={appColors.white} />
//             </TouchableOpacity>
//           </View>
          
//           <Text style={styles.profileName}>
//             {profile.fullName || `${profile.firstName} ${profile.lastName}`}
//           </Text>
//           <Text style={styles.profileSpecialty}>
//             {profile.specializations?.join(', ') || 'Personal Trainer'}
//           </Text>
          
//           {/* Rating */}
//           <View style={styles.ratingContainer}>
//             <Star size={16} color={appColors.warning} fill={appColors.warning} />
//             <Text style={styles.ratingText}>
//               {stats.rating.toFixed(1)} ({stats.reviewCount} reviews)
//             </Text>
//           </View>

//           {/* Contact Info */}
//           <View style={styles.contactInfo}>
//             {profile.email && (
//               <View style={styles.contactItem}>
//                 <Mail size={16} color={appColors.gray} />
//                 <Text style={styles.contactText}>{profile.email}</Text>
//               </View>
//             )}
//             {profile.phone && (
//               <View style={styles.contactItem}>
//                 <Phone size={16} color={appColors.gray} />
//                 <Text style={styles.contactText}>{profile.phone}</Text>
//               </View>
//             )}
//             {profile.location && (
//               <View style={styles.contactItem}>
//                 <MapPin size={16} color={appColors.gray} />
//                 <Text style={styles.contactText}>{profile.location}</Text>
//               </View>
//             )}
//           </View>
//         </View>

//         {/* Stats Grid */}
//         <View style={styles.statsContainer}>
//           <View style={styles.statsRow}>
//             {renderStatCard({
//               title: 'Total Clients',
//               value: stats.totalClients.toString(),
//               icon: Users,
//               color: appColors.primary,
//             })}
//             {renderStatCard({
//               title: 'Sessions',
//               value: stats.totalSessions.toString(),
//               icon: Calendar,
//               color: appColors.success,
//             })}
//           </View>
//           <View style={styles.statsRow}>
//             {renderStatCard({
//               title: 'Total Earnings',
//               value: formatCurrency(stats.totalEarnings),
//               icon: DollarSign,
//               color: appColors.warning,
//             })}
//             {renderStatCard({
//               title: 'Rating',
//               value: stats.rating.toFixed(1),
//               icon: Star,
//               color: appColors.info,
//             })}
//           </View>
//         </View>

//         {/* Professional Info */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Professional Information</Text>
          
//           <View style={styles.infoGrid}>
//             <View style={styles.infoItem}>
//               <Clock size={20} color={appColors.primary} />
//               <View style={styles.infoContent}>
//                 <Text style={styles.infoLabel}>Experience</Text>
//                 <Text style={styles.infoValue}>
//                   {profile.experience || 'Not specified'} years
//                 </Text>
//               </View>
//             </View>
            
//             <View style={styles.infoItem}>
//               <Award size={20} color={appColors.success} />
//               <View style={styles.infoContent}>
//                 <Text style={styles.infoLabel}>Certifications</Text>
//                 <Text style={styles.infoValue}>
//                   {profile.certifications?.length || 0} certificates
//                 </Text>
//               </View>
//             </View>

//             <View style={styles.infoItem}>
//               <DollarSign size={20} color={appColors.warning} />
//               <View style={styles.infoContent}>
//                 <Text style={styles.infoLabel}>Hourly Rate</Text>
//                 <Text style={styles.infoValue}>
//                   {formatCurrency(profile.hourlyRate || 0)}/hour
//                 </Text>
//               </View>
//             </View>
//           </View>

//           {/* Bio */}
//           {profile.bio && (
//             <View style={styles.bioContainer}>
//               <Text style={styles.bioLabel}>About Me</Text>
//               <Text style={styles.bioText}>{profile.bio}</Text>
//             </View>
//           )}
//         </View>

//         {/* Menu Options */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Settings</Text>
          
//           <View style={styles.menuContainer}>
//             {renderMenuOption({
//               title: 'Edit Profile',
//               icon: Edit3,
//               onPress: handleEditProfile,
//             })}
//             {renderMenuOption({
//               title: 'Account Settings',
//               icon: Settings,
//               onPress: () => Alert.alert('Coming Soon', 'Account settings will be available soon'),
//             })}
//             {renderMenuOption({
//               title: 'Logout',
//               icon: LogOut,
//               onPress: handleLogout,
//               isDestructive: true,
//             })}
//           </View>
//         </View>

//         <View style={{height: 100}} />
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: appColors.gray5,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     backgroundColor: appColors.white,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontFamily: fontFamilies.bold,
//     color: appColors.text,
//   },
//   editButton: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: appColors.gray5,
//   },
//   profileCard: {
//     backgroundColor: appColors.white,
//     margin: 20,
//     padding: 24,
//     borderRadius: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   profileImageContainer: {
//     position: 'relative',
//     marginBottom: 16,
//   },
//   profileImage: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: appColors.gray4,
//   },
//   cameraButton: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     backgroundColor: appColors.primary,
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 3,
//     borderColor: appColors.white,
//   },
//   profileName: {
//     fontSize: 24,
//     fontFamily: fontFamilies.bold,
//     color: appColors.text,
//     textAlign: 'center',
//     marginBottom: 4,
//   },
//   profileSpecialty: {
//     fontSize: 16,
//     fontFamily: fontFamilies.medium,
//     color: appColors.primary,
//     textAlign: 'center',
//     marginBottom: 12,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   ratingText: {
//     fontSize: 14,
//     fontFamily: fontFamilies.medium,
//     color: appColors.gray,
//     marginLeft: 4,
//   },
//   contactInfo: {
//     width: '100%',
//   },
//   contactItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   contactText: {
//     fontSize: 14,
//     fontFamily: fontFamilies.regular,
//     color: appColors.gray,
//     marginLeft: 8,
//   },
//   statsContainer: {
//     paddingHorizontal: 20,
//     marginBottom: 20,
//   },
//   statsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 12,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: appColors.white,
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginHorizontal: 6,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   statValue: {
//     fontSize: 20,
//     fontFamily: fontFamilies.bold,
//     color: appColors.text,
//     marginVertical: 4,
//   },
//   statTitle: {
//     fontSize: 12,
//     fontFamily: fontFamilies.medium,
//     color: appColors.gray,
//     textAlign: 'center',
//   },
//   section: {
//     backgroundColor: appColors.white,
//     marginHorizontal: 20,
//     marginBottom: 20,
//     padding: 20,
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontFamily: fontFamilies.bold,
//     color: appColors.text,
//     marginBottom: 16,
//   },
//   infoGrid: {
//     marginBottom: 16,
//   },
//   infoItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   infoContent: {
//     marginLeft: 12,
//     flex: 1,
//   },
//   infoLabel: {
//     fontSize: 12,
//     fontFamily: fontFamilies.medium,
//     color: appColors.gray,
//     marginBottom: 2,
//   },
//   infoValue: {
//     fontSize: 16,
//     fontFamily: fontFamilies.medium,
//     color: appColors.text,
//   },
//   bioContainer: {
//     marginTop: 8,
//   },
//   bioLabel: {
//     fontSize: 14,
//     fontFamily: fontFamilies.medium,
//     color: appColors.gray,
//     marginBottom: 8,
//   },
//   bioText: {
//     fontSize: 14,
//     fontFamily: fontFamilies.regular,
//     color: appColors.text,
//     lineHeight: 20,
//   },
//   menuContainer: {
//     marginTop: 8,
//   },
//   menuOption: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: appColors.gray5,
//   },
//   menuOptionLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   menuOptionText: {
//     fontSize: 16,
//     fontFamily: fontFamilies.medium,
//     color: appColors.text,
//     marginLeft: 12,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   errorText: {
//     fontSize: 16,
//     fontFamily: fontFamilies.medium,
//     color: appColors.error,
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   retryButton: {
//     backgroundColor: appColors.primary,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryText: {
//     fontSize: 16,
//     fontFamily: fontFamilies.medium,
//     color: appColors.white,
//   },
// });

// export default PTProfileScreen;


import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const PTProfileScreen = () => {
  return (
    <View>
      <Text>PTProfileScreen</Text>
    </View>
  )
}

export default PTProfileScreen

const styles = StyleSheet.create({})