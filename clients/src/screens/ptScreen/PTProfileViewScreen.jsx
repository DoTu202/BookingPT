import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { 
  User, 
  MapPin, 
  Clock, 
  DollarSign, 
  Edit, 
  ArrowLeft,
  Star,
  Award,
  Users,
  Calendar,
  Camera,
  Settings,
  LogOut
} from 'lucide-react-native';
import { SectionComponent, RowComponent } from '../../components';
import LoadingModal from '../../modals/LoadingModal';
import appColors from '../../constants/appColors';
import { fontFamilies } from '../../constants/fontFamilies';
import ptApi from '../../apis/ptApi';
import { useDispatch } from 'react-redux';
import { removeAuth } from '../../redux/reducers/authReducer'

const { width } = Dimensions.get('window');

const PTProfileViewScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalBookings: 0,
    avgRating: 0,
    joinedDate: '',
  });

  const specializationLabels = {
    weight_loss: 'Weight Loss',
    muscle_building: 'Muscle Building',
    cardio: 'Cardio Training',
    yoga: 'Yoga',
    strength: 'Strength Training',
    general: 'General Training',
    functional_training: 'Functional Training',
    rehabilitation: 'Rehabilitation',
    nutrition: 'Nutrition Coaching',
    pilates: 'Pilates',
  };

  // Load data when screen comes into focus (including first mount)
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
      loadStats();
    }, [])
  );

  const loadUser = async () => {
    const response = await ptApi.getUser();
    if (response.data?.success) {
      console.log('User loaded successfully:', response.data.data);
      return response.data.data;te
    } else {
      throw new Error('Failed to load user data');
    }
  }

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await ptApi.getProfile();
      if (response.data?.success) {
        setProfile(response.data.data);
        console.log('Profile loaded successfully:', response.data.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load dashboard stats for profile stats section
      const response = await ptApi.getDashboardStats();
      if (response.data?.success) {
        const dashboardData = response.data.data;
        setStats({
          totalClients: dashboardData.clientsCount || 0,
          totalBookings: dashboardData.totalBookings || 0,
          avgRating: dashboardData.averageRating || 0,
          joinedDate: dashboardData.joinedDate || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('PTProfileScreen');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(removeAuth());
  
          },
        },
      ]
    );
  };

  const formatJoinDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    } catch {
      return 'Recently';
    }
  };

  const renderSpecializations = () => {
    if (!profile?.specializations || profile.specializations.length === 0) {
      return <Text style={styles.noDataText}>No specializations added</Text>;
    }

    return (
      <View style={styles.specializationContainer}>
        {profile.specializations.map((spec, index) => (
          <View key={index} style={styles.specializationChip}>
            <Text style={styles.specializationText}>
              {specializationLabels[spec] || spec}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStatsCard = (icon, value, label, color = appColors.primary) => (
    <View style={styles.statsCard}>
      <View style={[styles.statsIconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </View>
  );

  if (loading) {
    return <LoadingModal visible={loading} />;
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={appColors.white} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centeredContainer}>
          <Text style={styles.noProfileText}>
            You haven't created your profile yet.
          </Text>
          <TouchableOpacity 
            style={styles.createProfileButton}
            onPress={() => navigation.navigate('PTProfileScreen')}
          >
            <Text style={styles.createProfileButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={appColors.white} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={handleEditProfile}
        >
          <Edit size={20} color={appColors.white} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: profile.avatar || 
                    'https://ui-avatars.com/api/?name=' + 
                    encodeURIComponent(profile.name || 'PT') + 
                    '&background=0066CC&color=fff&size=120'
                }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={16} color={appColors.white} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileName}>{profile.name || 'Personal Trainer'}</Text>
            <Text style={styles.profileRole}>Personal Trainer</Text>
            
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <Star size={16} color={appColors.warning} fill={appColors.warning} />
              <Text style={styles.ratingText}>
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'New'}
              </Text>
              <Text style={styles.ratingCount}>
                ({stats.totalBookings} sessions)
              </Text>
            </View>

            {/* Member Since */}
            <Text style={styles.memberSince}>
              Member since {formatJoinDate(stats.joinedDate)}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {renderStatsCard(
              <Users size={20} color={appColors.primary} strokeWidth={2} />,
              stats.totalClients,
              'Clients',
              appColors.primary
            )}
            {renderStatsCard(
              <Calendar size={20} color={appColors.success} strokeWidth={2} />,
              stats.totalBookings,
              'Sessions',
              appColors.success
            )}
            {renderStatsCard(
              <Award size={20} color={appColors.warning} strokeWidth={2} />,
              profile.experienceYears || 0,
              'Years Exp',
              appColors.warning
            )}
          </View>
        </View>

        {/* Profile Details */}
        <SectionComponent>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>
            {profile.bio || 'No description added yet.'}
          </Text>
        </SectionComponent>

        {/* Specializations */}
        <SectionComponent>
          <Text style={styles.sectionTitle}>Specializations</Text>
          {renderSpecializations()}
        </SectionComponent>

        {/* Professional Info */}
        <SectionComponent>
          <Text style={styles.sectionTitle}>Professional Info</Text>
          
          <View style={styles.infoRow}>
            <DollarSign size={20} color={appColors.gray} strokeWidth={2} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Hourly Rate</Text>
              <Text style={styles.infoValue}>
                {profile.hourlyRate ? `${profile.hourlyRate.toLocaleString()} VND/hour` : 'Not set'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={20} color={appColors.gray} strokeWidth={2} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {profile.location ? 
                  `${profile.location.district}, ${profile.location.city}` : 
                  'Not set'
                }
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Clock size={20} color={appColors.gray} strokeWidth={2} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Experience</Text>
              <Text style={styles.infoValue}>
                {profile.experienceYears ? 
                  `${profile.experienceYears} ${profile.experienceYears === 1 ? 'year' : 'years'}` : 
                  'Not specified'
                }
              </Text>
            </View>
          </View>
        </SectionComponent>

        {/* Languages */}
        {profile.languages && profile.languages.length > 0 && (
          <SectionComponent>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.languagesText}>
              {profile.languages.join(', ')}
            </Text>
          </SectionComponent>
        )}

        {/* Certifications */}
        {profile.certifications && profile.certifications.length > 0 && (
          <SectionComponent>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {profile.certifications.map((cert, index) => (
              <View key={index} style={styles.certificationItem}>
                <Award size={16} color={appColors.primary} strokeWidth={2} />
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
            ))}
          </SectionComponent>
        )}

        {/* Actions */}
        <SectionComponent>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <Edit size={20} color={appColors.primary} strokeWidth={2} />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Settings size={20} color={appColors.gray} strokeWidth={2} />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <LogOut size={20} color={appColors.danger} strokeWidth={2} />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Logout</Text>
          </TouchableOpacity>
        </SectionComponent>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

export default PTProfileViewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.gray6,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: appColors.primary,
    height: 140,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamilies.semiBold,
    color: appColors.white,
    marginTop: 20,
  },
  headerAction: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  profileCard: {
    backgroundColor: appColors.white,
    marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: appColors.gray4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: appColors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: appColors.white,
  },
  profileName: {
    fontSize: 20,
    fontFamily: fontFamilies.bold,
    color: appColors.text,
    textAlign: 'center',
  },
  profileRole: {
    fontSize: 14,
    fontFamily: fontFamilies.medium,
    color: appColors.gray,
    textAlign: 'center',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: fontFamilies.semiBold,
    color: appColors.text,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    marginLeft: 4,
  },
  memberSince: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  statsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 18,
    fontFamily: fontFamilies.bold,
    color: appColors.text,
  },
  statsLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.semiBold,
    color: appColors.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: appColors.text,
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    fontStyle: 'italic',
  },
  specializationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: `${appColors.primary}15`,
    borderWidth: 1,
    borderColor: `${appColors.primary}30`,
  },
  specializationText: {
    fontSize: 12,
    fontFamily: fontFamilies.medium,
    color: appColors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: appColors.gray5,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: fontFamilies.medium,
    color: appColors.text,
    marginTop: 2,
  },
  languagesText: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: appColors.text,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  certificationText: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: appColors.text,
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: appColors.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: appColors.gray5,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: fontFamilies.medium,
    color: appColors.text,
    marginLeft: 12,
  },
  logoutButton: {
    borderColor: `${appColors.danger}30`,
    backgroundColor: `${appColors.danger}05`,
  },
  logoutButtonText: {
    color: appColors.danger,
  },
  noProfileText: {
    fontSize: 16,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  createProfileButton: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createProfileButtonText: {
    fontSize: 14,
    fontFamily: fontFamilies.semiBold,
    color: appColors.white,
  },
});
