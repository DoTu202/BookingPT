import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import {
  RowComponent,
  TextComponent,
  SpaceComponent,
  SectionComponent,
} from '../../components';
import {
  Edit, 
  Lock,
  Notification,
  Setting2,
  InfoCircle,
  LogoutCurve, 
  ArrowRight2,
  Camera,
  Trash,
  Star1,
  Crown,
  Chart,
  Calendar,
} from 'iconsax-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import appColors from '../../constants/appColors';
import { useDispatch, useSelector } from 'react-redux';
import { removeAuth, authSelector } from '../../redux/reducers/authReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import profileApi from '../../apis/profileApi';
import { fontFamilies } from '../../constants/fontFamilies';
import LoadingModal from '../../modals/LoadingModal';

const { width } = Dimensions.get('window');

const ClientProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    totalHours: 0,
    favoriteTrainers: 0,
    memberSince: 'December 2024',
  });

  // Load user stats when component mounts
  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      // Mock stats for now - in real app, you'd call an API
      // const response = await clientApi.getStats();
      setStats({
        totalWorkouts: 28,
        currentStreak: 5,
        totalHours: 42,
        favoriteTrainers: 3,
        memberSince: 'December 2024',
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Giữ nguyên các hàm xử lý logic
  const handleLogout = async () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('auth');
            dispatch(removeAuth({}));
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {},
        },
      ]
    );
  };
  
  const menuSections = [
    {
      title: 'Account Settings',
      items: [
        {
          id: 'editProfile',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          icon: Edit,
          onPress: () => navigation.navigate('EditProfileScreen'),
        },
        {
          id: 'changePassword',
          title: 'Change Password',
          subtitle: 'Update your security credentials',
          icon: Lock,
          onPress: () => navigation.navigate('ChangePasswordScreen'),
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Manage your notification preferences',
          icon: Notification,
          onPress: () => {},
        },
        {
          id: 'settings',
          title: 'App Settings',
          subtitle: 'Language, theme, and other preferences',
          icon: Setting2,
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          icon: InfoCircle,
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          id: 'logout',
          title: 'Logout',
          icon: LogoutCurve,
          color: appColors.danger, 
          onPress: handleLogout,
        },
        {
          id: 'deleteAccount',
          title: 'Delete Account',
          icon: Trash,
          color: appColors.danger,
          onPress: handleDeleteAccount,
        },
      ]
    }
  ];


  const renderMenuItem = (item) => {
    const IconComponent = item.icon; 
    const iconColor = item.color || appColors.primary;

    return (
      <TouchableOpacity key={item.id} onPress={item.onPress} style={styles.menuItem}>
        <RowComponent justify="space-between">
          <RowComponent>
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
              <IconComponent size={22} color={iconColor} />
            </View>
            <View style={styles.menuTextContainer}>
              <TextComponent text={item.title} size={16} font={fontFamilies.medium} color={item.color || appColors.text}/>
              {item.subtitle && ( // Chỉ render subtitle nếu có
                <TextComponent text={item.subtitle} size={12} color={appColors.gray} />
              )}
            </View>
          </RowComponent>
          <ArrowRight2 size={20} color={appColors.gray2} />
        </RowComponent>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      <LoadingModal visible={loading} />
      
      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerContent}>
          <TextComponent 
            text="My Profile" 
            size={24} 
            font={fontFamilies.bold} 
            color={appColors.white}
          />
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Background gradient effect */}
          <View style={styles.profileHeader}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {auth.photo ? (
                  <Image source={{ uri: auth.photo }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <TextComponent
                      text={(auth.username || 'A').charAt(0).toUpperCase()}
                      size={40}
                      color={appColors.primary}
                      font={fontFamilies.bold}
                    />
                  </View>
                )}
                <TouchableOpacity style={styles.cameraButton}>
                  <Camera size={16} color={appColors.white} />
                </TouchableOpacity>
              </View>
              
              <TextComponent 
                text={auth.username || 'User'} 
                size={26} 
                font={fontFamilies.bold} 
                styles={styles.profileName}
              />
              
              {/* Membership Badge */}
              <View style={styles.membershipBadge}>
                <Crown size={18} color={appColors.yellow} />
                <TextComponent 
                  text="Premium Member" 
                  size={14} 
                  color={appColors.yellow}
                  font={fontFamilies.semiBold}
                  styles={{ marginLeft: 8 }}
                />
              </View>
              
              <TextComponent 
                text={`Member since ${stats.memberSince}`} 
                size={14} 
                color={appColors.text2}
                styles={styles.memberSince}
              />
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.contactSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoContent}>
                <TextComponent text="Email Address" size={12} color={appColors.text2} font={fontFamilies.medium} />
                <TextComponent 
                  text={auth.email || 'Not provided'} 
                  size={16} 
                  font={fontFamilies.medium}
                  color={appColors.text}
                  styles={{ marginTop: 4 }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TextComponent
            text="Your Fitness Journey"
            font={fontFamilies.semiBold}
            size={18}
            styles={styles.sectionTitle}
          />
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${appColors.primary}15` }]}>
                <Chart size={24} color={appColors.primary} />
              </View>
              <TextComponent text={stats.totalWorkouts.toString()} size={24} font={fontFamilies.bold} color={appColors.text} />
              <TextComponent text="Workouts" size={14} color={appColors.text2} />
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${appColors.success}15` }]}>
                <Star1 size={24} color={appColors.success} />
              </View>
              <TextComponent text={`${stats.currentStreak} days`} size={24} font={fontFamilies.bold} color={appColors.text} />
              <TextComponent text="Current Streak" size={14} color={appColors.text2} />
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${appColors.warning}15` }]}>
                <Calendar size={24} color={appColors.warning} />
              </View>
              <TextComponent text={`${stats.totalHours}h`} size={24} font={fontFamilies.bold} color={appColors.text} />
              <TextComponent text="Training Hours" size={14} color={appColors.text2} />
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${appColors.info}15` }]}>
                <Crown size={24} color={appColors.info} />
              </View>
              <TextComponent text={stats.favoriteTrainers.toString()} size={24} font={fontFamilies.bold} color={appColors.text} />
              <TextComponent text="Favorite PTs" size={14} color={appColors.text2} />
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <SectionComponent key={sectionIndex}>
            <TextComponent
              text={section.title}
              font={fontFamilies.semiBold}
              size={18}
              styles={styles.sectionTitle}
            />
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderMenuItem(item)}
                  {itemIndex < section.items.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </View>
          </SectionComponent>
        ))}

        <SpaceComponent height={100} />
      </ScrollView>
    </View>
  );
};

export default ClientProfileScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.gray5,
  },
  header: {
    backgroundColor: appColors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: appColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  
  // Profile Card Styles
  profileCard: {
    backgroundColor: appColors.white,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: appColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  profileHeader: {
    backgroundColor: `${appColors.primary}08`,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
    shadowColor: appColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: appColors.white,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${appColors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: appColors.white,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: appColors.white,
    shadowColor: appColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  profileName: {
    textAlign: 'center',
    marginBottom: 12,
    color: appColors.text,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${appColors.yellow}15`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${appColors.yellow}25`,
  },
  memberSince: {
    textAlign: 'center',
  },
  contactSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: appColors.gray4,
  },
  infoRow: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: appColors.gray6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.gray4,
  },
  infoContent: {
    flex: 1,
  },
  
  // Stats Section
  statsContainer: {
    marginBottom: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: appColors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: appColors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: appColors.gray6,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  // Section Styles
  sectionTitle: {
    marginBottom: 20,
    color: appColors.text,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: appColors.white,
    borderRadius: 20,
    shadowColor: appColors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: appColors.gray6,
  },
  menuItem: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: appColors.white,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: appColors.gray5,
    marginLeft: 84,
  },
});