import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import {
  RowComponent,
  TextComponent,
  SpaceComponent,
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
} from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import { useDispatch, useSelector } from 'react-redux';
import { removeAuth, authSelector } from '../../redux/reducers/authReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import profileApi from '../../apis/profileApi';
import { fontFamilies } from '../../constants/fontFamilies';

const ClientProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const [loading, setLoading] = useState(false);

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
          onPress: () => { /* ... Logic to delete account ... */ },
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
          color: appColors.danger, // THAY ĐỔI: Thêm màu để định dạng mục nguy hiểm
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

  // THAY ĐỔI: Hàm render một item trong menu, được thiết kế lại hoàn toàn
  const renderMenuItem = (item) => {
    const IconComponent = item.icon; // Lấy component Icon từ item
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
      {/* THAY ĐỔI: Header đơn giản hơn */}
      <View style={styles.header}>
        <TextComponent text="Profile" size={22} font={fontFamilies.bold} color={appColors.white}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* THAY ĐỔI: Profile Card được thiết kế lại để nằm trên cùng */}
        <View style={styles.profileSection}>
            <View style={styles.profileCard}>
            <RowComponent>
                <TouchableOpacity style={styles.avatarContainer}>
                {auth.photo ? (
                    <Image source={{ uri: auth.photo }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                    <TextComponent
                        text={(auth.username || 'A').charAt(0).toUpperCase()}
                        size={32}
                        color={appColors.primary}
                        font={fontFamilies.bold}
                    />
                    </View>
                )}
                <View style={styles.cameraIconContainer}>
                    <Camera size={16} color={appColors.white} />
                </View>
                </TouchableOpacity>
                
                <View style={styles.profileInfo}>
                <TextComponent text={auth.username || 'User'} size={20} font={fontFamilies.bold} />
                <TextComponent text={auth.email} size={14} color={appColors.gray}/>
                <SpaceComponent height={8} />
                <View style={styles.roleBadge}>
                    <TextComponent text="Client" size={12} font={fontFamilies.medium} color={appColors.primary}/>
                </View>
                </View>
            </RowComponent>
            </View>
        </View>

        {/* THAY ĐỔI: Vòng lặp qua các section của menu */}
        {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSectionContainer}>
                <TextComponent
                    text={section.title}
                    font={fontFamilies.semiBold}
                    size={18}
                    styles={{ paddingHorizontal: 16, marginBottom: 8 }}
                />
                <View style={styles.menuItemsCard}>
                    {section.items.map((item, itemIndex) => (
                        <View key={item.id}>
                            {renderMenuItem(item)}
                            {itemIndex < section.items.length - 1 && <View style={styles.separator} />}
                        </View>
                    ))}
                </View>
            </View>
        ))}

        <SpaceComponent height={40} />
      </ScrollView>
    </View>
  );
};

export default ClientProfileScreen;

// THAY ĐỔI: Toàn bộ stylesheet được viết lại để phù hợp với thiết kế mới
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.lightGray, // Nền xám nhạt để làm nổi bật thẻ trắng
  },
  header: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: appColors.gray4,
    alignItems: 'center',
  },
  profileSection: {
    backgroundColor: appColors.white, // Phần profile có nền trắng liền với header
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: appColors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${appColors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: appColors.white,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${appColors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  menuSectionContainer: {
    marginTop: 24,
  },
  menuItemsCard: {
    backgroundColor: appColors.white,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22, // Hình tròn
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
    backgroundColor: appColors.gray4,
    marginLeft: 76, // = width(icon) + marginRight(icon)
  },
});