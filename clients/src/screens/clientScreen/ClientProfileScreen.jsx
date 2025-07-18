import React, {useState, useEffect} from 'react';
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
import {SafeAreaView} from 'react-native-safe-area-context';
import appColors from '../../constants/appColors';
import {useDispatch, useSelector} from 'react-redux';
import {removeAuth, authSelector} from '../../redux/reducers/authReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import profileApi from '../../apis/profileApi';
import clientApi from '../../apis/clientApi';
import {fontFamilies} from '../../constants/fontFamilies';
import {LoadingModal} from '../../modals';
import {launchImageLibrary} from 'react-native-image-picker';

const {width} = Dimensions.get('window');

const ClientProfileScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    totalHours: 0,
    favoriteTrainers: 0,
    memberSince: 'December 2024',
  });

  useEffect(() => {
    loadUserProfile();
    loadUserStats();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await profileApi.getProfile();

      if (response.data?.success) {
        const userData = response.data.data || response.data;

        if (userData.photoUrl) {
          const timestamp = new Date().getTime();
          userData.photoUrl = `${userData.photoUrl}?t=${timestamp}`;

          if (userData.photoUrl.includes('your-api-domain.com')) {
            userData.photoUrl = userData.photoUrl.replace(
              'http://your-api-domain.com',
              'http://localhost:3001',
            );
          }
        }
        setProfile(userData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Determine member since date
      const memberSince = profile?.createdAt
        ? formatJoinDate(profile.createdAt)
        : 'June 2025';

      // Get bookings to calculate stats
      const bookingResponse = await clientApi.getMyBookings();
      const bookings = bookingResponse.data?.data || [];

      // Filter completed bookings
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalWorkouts = completedBookings.length;

      // Calculate total hours
      let totalHours = 0;
      completedBookings.forEach(booking => {
        totalHours += 1;
      });

      // Calculate streak (dummy example)
      const currentStreak = Math.min(completedBookings.length, 5);

      // Calculate favorite trainers (from unique PTs in bookings)
      const uniquePTs = new Set();
      bookings.forEach(booking => {
        if (booking.pt?._id) {
          uniquePTs.add(booking.pt._id);
        } else if (booking.ptId) {
          uniquePTs.add(booking.ptId);
        }
      });

      setStats({
        totalWorkouts,
        currentStreak,
        totalHours,
        favoriteTrainers: uniquePTs.size,
        memberSince,
      });
      console.log('ClientProfileScreen: Stats calculated:', {
        totalWorkouts,
        currentStreak,
        totalHours,
        favoriteTrainers: uniquePTs.size,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
      setStats({
        totalWorkouts: 0,
        currentStreak: 0,
        totalHours: 0,
        favoriteTrainers: 0,
        memberSince: 'June 2025',
      });
    }
  };

  const formatJoinDate = dateString => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
    } catch {
      return 'Recently';
    }
  };

  const handleUploadPhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true,
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', 'Could not select image. Please try again.');
        return;
      }

      const imageAsset = response.assets && response.assets[0];
      if (!imageAsset) {
        Alert.alert('Error', 'Could not retrieve image data.');
        return;
      }

      try {
        setLoading(true);
        console.log('ClientProfileScreen: Selected image details:', {
          uri: imageAsset.uri,
          type: imageAsset.type,
          fileName: imageAsset.fileName,
          fileSize: imageAsset.fileSize,
          width: imageAsset.width,
          height: imageAsset.height,
          hasBase64: !!imageAsset.base64,
        });

        const formData = new FormData();
        formData.append('photo', {
          uri: imageAsset.uri,
          type: imageAsset.type || 'image/jpeg',
          name: imageAsset.fileName || `photo_${Date.now()}.jpg`,
        });

        console.log('ClientProfileScreen: Uploading photo to server...');
        const result = await profileApi.uploadPhoto(formData);

        if (result.data?.success) {
          console.log(
            'ClientProfileScreen: Upload successful, response:',
            result.data,
          );

          const timestamp = new Date().getTime();
          const updatedPhotoUrl = `${result.data.data.photoUrl}?t=${timestamp}`;

          setProfile(prev => ({
            ...prev,
            photoUrl: updatedPhotoUrl,
          }));

          if (imageAsset.base64) {
            console.log(
              'ClientProfileScreen: Using base64 for immediate display',
            );
            setProfile(prev => ({
              ...prev,
              _tempImageBase64: `data:${
                imageAsset.type || 'image/jpeg'
              };base64,${imageAsset.base64}`,
            }));
          }

          Alert.alert('Success', 'Profile photo updated successfully');
        } else {
          throw new Error(result.data?.message || 'Upload failed');
        }
      } catch (error) {
        console.error('ClientProfileScreen: Error uploading photo:', error);
        Alert.alert('Error', error.message || 'Failed to upload photo.');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleLogout = async () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await AsyncStorage.removeItem('auth');
            dispatch(removeAuth({}));
          } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to log out. Please try again.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await profileApi.deleteAccount({
                confirmation: 'DELETE',
              });

              if (response.data?.success) {
                await AsyncStorage.removeItem('auth');
                dispatch(removeAuth({}));
                Alert.alert(
                  'Success',
                  'Your account has been successfully deleted',
                );
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              const message =
                error.response?.data?.message || 'Failed to delete account';
              Alert.alert('Error', message);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
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
      ],
    },
  ];

  const renderMenuItem = item => {
    const IconComponent = item.icon;
    const iconColor = item.color || appColors.primary;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={item.onPress}
        style={styles.menuItem}>
        <RowComponent justify="space-between">
          <RowComponent>
            <View
              style={[
                styles.iconContainer,
                {backgroundColor: `${iconColor}15`},
              ]}>
              <IconComponent size={22} color={iconColor} />
            </View>
            <View style={styles.menuTextContainer}>
              <TextComponent
                text={item.title}
                size={16}
                font={fontFamilies.medium}
                color={item.color || appColors.text}
              />
              {item.subtitle && (
                <TextComponent
                  text={item.subtitle}
                  size={12}
                  color={appColors.gray}
                />
              )}
            </View>
          </RowComponent>
          <ArrowRight2 size={20} color={appColors.gray2} />
        </RowComponent>
      </TouchableOpacity>
    );
  };

  const isPremium = false;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      <LoadingModal visible={loading} />

      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerContent}>
          <TextComponent
            text="My Profile"
            size={20}
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
        bounces={true}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {profile?._tempImageBase64 ? (
                  <Image
                    source={{uri: profile._tempImageBase64}}
                    style={styles.avatar}
                  />
                ) : profile?.photoUrl ? (
                  <Image
                    source={{uri: profile.photoUrl}}
                    style={styles.avatar}
                    onError={e =>
                      console.log('Error loading image:', e.nativeEvent.error)
                    }
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <TextComponent
                      text={(profile?.username || auth.username || 'A')
                        .charAt(0)
                        .toUpperCase()}
                      size={40}
                      color={appColors.primary}
                      font={fontFamilies.bold}
                    />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={handleUploadPhoto}>
                  <Camera size={16} color={appColors.white} />
                </TouchableOpacity>
              </View>

              <TextComponent
                text={profile?.username || auth.username || 'User'}
                size={26}
                font={fontFamilies.bold}
                styles={styles.profileName}
              />

              {isPremium && (
                <View style={styles.membershipBadge}>
                  <Crown size={18} color={appColors.yellow} />
                  <TextComponent
                    text="Premium Member"
                    size={14}
                    color={appColors.yellow}
                    font={fontFamilies.semiBold}
                    styles={{marginLeft: 8}}
                  />
                </View>
              )}

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
                <TextComponent
                  text="Email Address"
                  size={12}
                  color={appColors.text2}
                  font={fontFamilies.medium}
                />
                <TextComponent
                  text={profile?.email || auth.email || 'Not provided'}
                  size={16}
                  font={fontFamilies.medium}
                  color={appColors.text}
                  styles={{marginTop: 4}}
                />
              </View>
            </View>

            {profile?.phoneNumber && (
              <View style={[styles.infoRow, {marginTop: 12}]}>
                <View style={styles.infoContent}>
                  <TextComponent
                    text="Phone Number"
                    size={12}
                    color={appColors.text2}
                    font={fontFamilies.medium}
                  />
                  <TextComponent
                    text={profile.phoneNumber}
                    size={16}
                    font={fontFamilies.medium}
                    color={appColors.text}
                    styles={{marginTop: 4}}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <TextComponent
            text="Your Fitness Journey"
            font={fontFamilies.semiBold}
            size={18}
            styles={styles.sectionTitle}
          />
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  {backgroundColor: `${appColors.primary}15`},
                ]}>
                <Chart size={24} color={appColors.primary} />
              </View>
              <TextComponent
                text={stats.totalWorkouts.toString()}
                size={24}
                font={fontFamilies.bold}
                color={appColors.text}
              />
              <TextComponent
                text="Workouts"
                size={14}
                color={appColors.text2}
              />
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  {backgroundColor: `${appColors.success}15`},
                ]}>
                <Star1 size={24} color={appColors.success} />
              </View>
              <TextComponent
                text={`${stats.currentStreak} days`}
                size={24}
                font={fontFamilies.bold}
                color={appColors.text}
              />
              <TextComponent
                text="Current Streak"
                size={14}
                color={appColors.text2}
              />
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  {backgroundColor: `${appColors.warning}15`},
                ]}>
                <Calendar size={24} color={appColors.warning} />
              </View>
              <TextComponent
                text={`${stats.totalHours}h`}
                size={24}
                font={fontFamilies.bold}
                color={appColors.text}
              />
              <TextComponent
                text="Training Hours"
                size={14}
                color={appColors.text2}
              />
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  {backgroundColor: `${appColors.info}15`},
                ]}>
                <Crown size={24} color={appColors.info} />
              </View>
              <TextComponent
                text={stats.favoriteTrainers.toString()}
                size={24}
                font={fontFamilies.bold}
                color={appColors.text}
              />
              <TextComponent
                text="Favorite PTs"
                size={14}
                color={appColors.text2}
              />
            </View>
          </View>
        </View>

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
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
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
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },

  profileCard: {
    backgroundColor: appColors.white,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: appColors.black,
    shadowOffset: {width: 0, height: 8},
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
    shadowOffset: {width: 0, height: 8},
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
    shadowOffset: {width: 0, height: 4},
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
    shadowOffset: {width: 0, height: 6},
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
    shadowOffset: {width: 0, height: 6},
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
