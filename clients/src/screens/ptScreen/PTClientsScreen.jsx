// import React, {useEffect, useState, useCallback} from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   RefreshControl,
//   Alert,
//   FlatList,
//   Image,
//   TextInput,
//   StyleSheet,
//   SafeAreaView,
// } from 'react-native';
// import {
//   Users,
//   Search,
//   Filter,
//   Star,
//   Calendar,
//   MessageCircle,
//   Phone,
//   Mail,
//   MoreVertical,
//   TrendingUp,
//   Clock,
//   DollarSign,
// } from 'lucide-react-native';
// import appColors from '../../constants/appColors';
// import {fontFamilies} from '../../constants/fontFamilies';
// import {LoadingModal} from '../../modals';
// import ptApi from '../../apis/ptApi';

// const PTClientsScreen = () => {
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [clients, setClients] = useState([]);
//   const [filteredClients, setFilteredClients] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedFilter, setSelectedFilter] = useState('all'); // all, active, new, inactive
//   const [showFilters, setShowFilters] = useState(false);

//   const fetchClientsData = useCallback(async () => {
//     try {
//       setLoading(true);
      
//       // Get bookings to extract client information
//       const bookingsResponse = await ptApi.getBookings();
//       const bookings = bookingsResponse.data?.data || [];
      
//       // Process clients from bookings
//       const clientsMap = {};
      
//       bookings.forEach(booking => {
//         const clientId = booking.client?._id || booking.clientId;
//         const client = booking.client;
        
//         if (clientId && client) {
//           if (!clientsMap[clientId]) {
//             clientsMap[clientId] = {
//               id: clientId,
//               name: client.fullName || client.name || 'Unknown Client',
//               email: client.email || '',
//               phone: client.phone || '',
//               avatar: client.avatar || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000)}-person?w=150&h=150&fit=crop&crop=face`,
//               totalSessions: 0,
//               completedSessions: 0,
//               upcomingSessions: 0,
//               totalSpent: 0,
//               lastSession: null,
//               nextSession: null,
//               status: 'active',
//               joinDate: booking.createdAt || new Date().toISOString(),
//               rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3-5
//             };
//           }
          
//           // Update stats
//           clientsMap[clientId].totalSessions += 1;
          
//           if (booking.status === 'completed') {
//             clientsMap[clientId].completedSessions += 1;
//             clientsMap[clientId].totalSpent += booking.price || 0;
            
//             // Update last session
//             const bookingDate = new Date(booking.date);
//             if (!clientsMap[clientId].lastSession || bookingDate > new Date(clientsMap[clientId].lastSession)) {
//               clientsMap[clientId].lastSession = booking.date;
//             }
//           }
          
//           if (booking.status === 'confirmed') {
//             clientsMap[clientId].upcomingSessions += 1;
            
//             // Update next session
//             const bookingDate = new Date(booking.date);
//             if (!clientsMap[clientId].nextSession || bookingDate < new Date(clientsMap[clientId].nextSession)) {
//               clientsMap[clientId].nextSession = booking.date;
//             }
//           }
//         }
//       });
      
//       // Convert to array and determine status
//       const clientsArray = Object.values(clientsMap).map(client => {
//         const daysSinceLastSession = client.lastSession 
//           ? Math.floor((new Date() - new Date(client.lastSession)) / (1000 * 60 * 60 * 24))
//           : null;
        
//         const daysSinceJoin = Math.floor((new Date() - new Date(client.joinDate)) / (1000 * 60 * 60 * 24));
        
//         // Determine status
//         if (daysSinceJoin <= 30) {
//           client.status = 'new';
//         } else if (client.upcomingSessions > 0 || (daysSinceLastSession && daysSinceLastSession <= 14)) {
//           client.status = 'active';
//         } else {
//           client.status = 'inactive';
//         }
        
//         return client;
//       });
      
//       // Sort by total spent (most valuable clients first)
//       clientsArray.sort((a, b) => b.totalSpent - a.totalSpent);
      
//       setClients(clientsArray);
//       setFilteredClients(clientsArray);
//     } catch (error) {
//       console.error('Error fetching clients data:', error);
//       Alert.alert('Error', 'Failed to load clients data');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchClientsData();
//   }, [fetchClientsData]);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchClientsData();
//   }, [fetchClientsData]);

//   // Filter and search clients
//   useEffect(() => {
//     let filtered = clients;
    
//     // Apply status filter
//     if (selectedFilter !== 'all') {
//       filtered = filtered.filter(client => client.status === selectedFilter);
//     }
    
//     // Apply search filter
//     if (searchQuery.trim()) {
//       filtered = filtered.filter(client =>
//         client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         client.email.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }
    
//     setFilteredClients(filtered);
//   }, [clients, selectedFilter, searchQuery]);

//   const formatCurrency = (amount) => {
//     return `$${amount.toFixed(2)}`;
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Never';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//     });
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'active':
//         return appColors.success;
//       case 'new':
//         return appColors.primary;
//       case 'inactive':
//         return appColors.gray;
//       default:
//         return appColors.gray;
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status) {
//       case 'active':
//         return 'Active';
//       case 'new':
//         return 'New';
//       case 'inactive':
//         return 'Inactive';
//       default:
//         return 'Unknown';
//     }
//   };

//   const handleClientPress = (client) => {
//     Alert.alert(
//       client.name,
//       `Total Sessions: ${client.completedSessions}\nTotal Spent: ${formatCurrency(client.totalSpent)}\nLast Session: ${formatDate(client.lastSession)}\nNext Session: ${formatDate(client.nextSession)}`,
//       [
//         {text: 'OK'},
//         {text: 'Contact', onPress: () => handleContact(client)},
//       ]
//     );
//   };

//   const handleContact = (client) => {
//     Alert.alert(
//       'Contact Client',
//       `How would you like to contact ${client.name}?`,
//       [
//         {text: 'Cancel', style: 'cancel'},
//         {text: 'Call', onPress: () => Alert.alert('Coming Soon', 'Call feature will be available soon')},
//         {text: 'Message', onPress: () => Alert.alert('Coming Soon', 'Messaging feature will be available soon')},
//       ]
//     );
//   };

//   const renderFilterOption = (filter, label) => (
//     <TouchableOpacity
//       key={filter}
//       style={[
//         styles.filterOption,
//         selectedFilter === filter && styles.filterOptionSelected,
//       ]}
//       onPress={() => {
//         setSelectedFilter(filter);
//         setShowFilters(false);
//       }}>
//       <Text
//         style={[
//           styles.filterOptionText,
//           selectedFilter === filter && styles.filterOptionTextSelected,
//         ]}>
//         {label}
//       </Text>
//     </TouchableOpacity>
//   );

//   const renderClientItem = ({item: client}) => (
//     <TouchableOpacity style={styles.clientItem} onPress={() => handleClientPress(client)}>
//       <View style={styles.clientHeader}>
//         <Image source={{uri: client.avatar}} style={styles.clientAvatar} />
//         <View style={styles.clientInfo}>
//           <View style={styles.clientNameRow}>
//             <Text style={styles.clientName}>{client.name}</Text>
//             <View style={[styles.statusBadge, {backgroundColor: getStatusColor(client.status)}]}>
//               <Text style={styles.statusText}>{getStatusText(client.status)}</Text>
//             </View>
//           </View>
//           <Text style={styles.clientEmail}>{client.email}</Text>
//           <View style={styles.clientRating}>
//             <Star size={12} color={appColors.warning} fill={appColors.warning} />
//             <Text style={styles.ratingText}>{client.rating}</Text>
//           </View>
//         </View>
//         <TouchableOpacity
//           style={styles.moreButton}
//           onPress={() => handleContact(client)}>
//           <MoreVertical size={20} color={appColors.gray} />
//         </TouchableOpacity>
//       </View>
      
//       <View style={styles.clientStats}>
//         <View style={styles.statItem}>
//           <Calendar size={16} color={appColors.primary} />
//           <Text style={styles.statText}>{client.completedSessions} sessions</Text>
//         </View>
//         <View style={styles.statItem}>
//           <DollarSign size={16} color={appColors.success} />
//           <Text style={styles.statText}>{formatCurrency(client.totalSpent)}</Text>
//         </View>
//         <View style={styles.statItem}>
//           <Clock size={16} color={appColors.info} />
//           <Text style={styles.statText}>Last: {formatDate(client.lastSession)}</Text>
//         </View>
//       </View>

//       {client.nextSession && (
//         <View style={styles.nextSessionContainer}>
//           <Text style={styles.nextSessionText}>
//             Next session: {formatDate(client.nextSession)}
//           </Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );

//   const renderHeader = () => (
//     <View style={styles.headerContainer}>
//       <Text style={styles.headerTitle}>My Clients</Text>
//       <Text style={styles.headerSubtitle}>
//         {filteredClients.length} {selectedFilter !== 'all' ? selectedFilter : ''} clients
//       </Text>
//     </View>
//   );

//   const renderQuickStats = () => {
//     const totalClients = clients.length;
//     const activeClients = clients.filter(c => c.status === 'active').length;
//     const newClients = clients.filter(c => c.status === 'new').length;
//     const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0);

//     return (
//       <View style={styles.quickStats}>
//         <View style={styles.quickStatItem}>
//           <Users size={20} color={appColors.primary} />
//           <Text style={styles.quickStatValue}>{totalClients}</Text>
//           <Text style={styles.quickStatLabel}>Total</Text>
//         </View>
//         <View style={styles.quickStatItem}>
//           <TrendingUp size={20} color={appColors.success} />
//           <Text style={styles.quickStatValue}>{activeClients}</Text>
//           <Text style={styles.quickStatLabel}>Active</Text>
//         </View>
//         <View style={styles.quickStatItem}>
//           <Star size={20} color={appColors.warning} />
//           <Text style={styles.quickStatValue}>{newClients}</Text>
//           <Text style={styles.quickStatLabel}>New</Text>
//         </View>
//         <View style={styles.quickStatItem}>
//           <DollarSign size={20} color={appColors.info} />
//           <Text style={styles.quickStatValue}>{formatCurrency(totalRevenue)}</Text>
//           <Text style={styles.quickStatLabel}>Revenue</Text>
//         </View>
//       </View>
//     );
//   };

//   if (loading && !refreshing) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <LoadingModal visible={true} />
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
        
//         {renderHeader()}
        
//         {/* Search and Filter */}
//         <View style={styles.searchContainer}>
//           <View style={styles.searchInputContainer}>
//             <Search size={20} color={appColors.gray} />
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Search clients..."
//               value={searchQuery}
//               onChangeText={setSearchQuery}
//               placeholderTextColor={appColors.gray}
//             />
//           </View>
//           <TouchableOpacity
//             style={styles.filterButton}
//             onPress={() => setShowFilters(!showFilters)}>
//             <Filter size={20} color={appColors.primary} />
//           </TouchableOpacity>
//         </View>

//         {/* Filter Options */}
//         {showFilters && (
//           <View style={styles.filterContainer}>
//             {renderFilterOption('all', 'All Clients')}
//             {renderFilterOption('active', 'Active')}
//             {renderFilterOption('new', 'New')}
//             {renderFilterOption('inactive', 'Inactive')}
//           </View>
//         )}

//         {renderQuickStats()}

//         {/* Clients List */}
//         <View style={styles.clientsContainer}>
//           {filteredClients.length > 0 ? (
//             <FlatList
//               data={filteredClients}
//               keyExtractor={(item) => item.id}
//               renderItem={renderClientItem}
//               scrollEnabled={false}
//               showsVerticalScrollIndicator={false}
//             />
//           ) : (
//             <View style={styles.emptyContainer}>
//               <Users size={48} color={appColors.gray} />
//               <Text style={styles.emptyTitle}>No clients found</Text>
//               <Text style={styles.emptySubtitle}>
//                 {searchQuery ? 'Try adjusting your search' : 'Your clients will appear here'}
//               </Text>
//             </View>
//           )}
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
//   headerContainer: {
//     backgroundColor: appColors.white,
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontFamily: fontFamilies.bold,
//     color: appColors.text,
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     fontFamily: fontFamilies.regular,
//     color: appColors.gray,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: appColors.white,
//   },
//   searchInputContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: appColors.gray5,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     marginRight: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     fontFamily: fontFamilies.regular,
//     color: appColors.text,
//     marginLeft: 8,
//   },
//   filterButton: {
//     padding: 12,
//     borderRadius: 12,
//     backgroundColor: appColors.gray5,
//   },
//   filterContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: 20,
//     paddingBottom: 16,
//     backgroundColor: appColors.white,
//     flexWrap: 'wrap',
//   },
//   filterOption: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: appColors.gray5,
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   filterOptionSelected: {
//     backgroundColor: appColors.primary,
//   },
//   filterOptionText: {
//     fontSize: 14,
//     fontFamily: fontFamilies.medium,
//     color: appColors.gray,
//   },
//   filterOptionTextSelected: {
//     color: appColors.white,
//   },
//   quickStats: {
//     flexDirection: 'row',
//     backgroundColor: appColors.white,
//     marginHorizontal: 20,
//     marginVertical: 16,
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   quickStatItem: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   quickStatValue: {
//     fontSize: 18,
//     fontFamily: fontFamilies.bold,
//     color: appColors.text,
//     marginVertical: 4,
//   },
//   quickStatLabel: {
//     fontSize: 12,
//     fontFamily: fontFamilies.medium,
//     color: appColors.gray,
//   },
//   clientsContainer: {
//     paddingHorizontal: 20,
//   },
//   clientItem: {
//     backgroundColor: appColors.white,
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   clientHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   clientAvatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: appColors.gray4,
//     marginRight: 12,
//   },
//   clientInfo: {
//     flex: 1,
//   },
//   clientNameRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 4,
//   },
//   clientName: {
//     fontSize: 16,
//     fontFamily: fontFamilies.bold,
//     color: appColors.text,
//     flex: 1,
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 10,
//     marginLeft: 8,
//   },
//   statusText: {
//     fontSize: 10,
//     fontFamily: fontFamilies.medium,
//     color: appColors.white,
//   },
//   clientEmail: {
//     fontSize: 14,
//     fontFamily: fontFamilies.regular,
//     color: appColors.gray,
//     marginBottom: 4,
//   },
//   clientRating: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   ratingText: {
//     fontSize: 12,
//     fontFamily: fontFamilies.medium,
//     color: appColors.gray,
//     marginLeft: 4,
//   },
//   moreButton: {
//     padding: 4,
//   },
//   clientStats: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   statItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   statText: {
//     fontSize: 12,
//     fontFamily: fontFamilies.medium,
//     color: appColors.gray,
//     marginLeft: 4,
//   },
//   nextSessionContainer: {
//     backgroundColor: appColors.gray5,
//     padding: 8,
//     borderRadius: 8,
//     marginTop: 4,
//   },
//   nextSessionText: {
//     fontSize: 12,
//     fontFamily: fontFamilies.medium,
//     color: appColors.primary,
//     textAlign: 'center',
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     paddingVertical: 60,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontFamily: fontFamilies.bold,
//     color: appColors.text,
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     fontFamily: fontFamilies.regular,
//     color: appColors.gray,
//     textAlign: 'center',
//   },
// });

// export default PTClientsScreen;

import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const PTClientsScreen = () => {
  return (
    <View>
      <Text>PTClientsScreen</Text>
    </View>
  )
}

export default PTClientsScreen

const styles = StyleSheet.create({})