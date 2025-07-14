import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
} from 'iconsax-react-native';
import {
  TextComponent,
  InputComponent,
  ButtonComponent,
  SectionComponent,
  RowComponent,
  SpaceComponent,
} from '../../components';
import LoadingModal from '../../modals/LoadingModal';
import appColors from '../../constants/appColors';
import { fontFamilies } from '../../constants/fontFamilies';
import profileApi from '../../apis/profileApi';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChangePassword = async () => {
    // Validation
    if (!formData.currentPassword) {
      Alert.alert('Error', 'Current password is required');
      return;
    }

    if (!formData.newPassword) {
      Alert.alert('Error', 'New password is required');
      return;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    try {
      setLoading(true);

      const response = await profileApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      if (response.data?.success) {
        Alert.alert('Success', 'Password changed successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const message = error.response?.data?.message || 'Failed to change password';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      <LoadingModal visible={loading} />

      {/* Header */}
      <View style={styles.header}>
        <RowComponent justify="space-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={appColors.white} />
          </TouchableOpacity>
          <TextComponent
            text="Change Password"
            size={18}
            font={fontFamilies.semiBold}
            color={appColors.white}
          />
          <View style={{ width: 24 }} />
        </RowComponent>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SectionComponent>
          <TextComponent
            text="Security"
            size={16}
            font={fontFamilies.semiBold}
            color={appColors.text}
          />
          <SpaceComponent height={8} />
          <TextComponent
            text="Enter your current password and choose a new one"
            size={14}
            color={appColors.gray}
          />
          <SpaceComponent height={20} />

          {/* Current Password */}
          <InputComponent
            value={formData.currentPassword}
            onChangeText={(text) => updateFormData('currentPassword', text)}
            placeholder="Current password"
            isPassword
            prefix={<Lock size={20} color={appColors.gray} />}
            suffix={
              <TouchableOpacity onPress={() => togglePasswordVisibility('current')}>
                {showPasswords.current ? (
                  <EyeOff size={20} color={appColors.gray} />
                ) : (
                  <Eye size={20} color={appColors.gray} />
                )}
              </TouchableOpacity>
            }
            secureTextEntry={!showPasswords.current}
          />
          <SpaceComponent height={16} />

          {/* New Password */}
          <InputComponent
            value={formData.newPassword}
            onChangeText={(text) => updateFormData('newPassword', text)}
            placeholder="New password"
            isPassword
            prefix={<Lock size={20} color={appColors.gray} />}
            suffix={
              <TouchableOpacity onPress={() => togglePasswordVisibility('new')}>
                {showPasswords.new ? (
                  <EyeOff size={20} color={appColors.gray} />
                ) : (
                  <Eye size={20} color={appColors.gray} />
                )}
              </TouchableOpacity>
            }
            secureTextEntry={!showPasswords.new}
          />
          <SpaceComponent height={16} />

          {/* Confirm Password */}
          <InputComponent
            value={formData.confirmPassword}
            onChangeText={(text) => updateFormData('confirmPassword', text)}
            placeholder="Confirm new password"
            isPassword
            prefix={<Lock size={20} color={appColors.gray} />}
            suffix={
              <TouchableOpacity onPress={() => togglePasswordVisibility('confirm')}>
                {showPasswords.confirm ? (
                  <EyeOff size={20} color={appColors.gray} />
                ) : (
                  <Eye size={20} color={appColors.gray} />
                )}
              </TouchableOpacity>
            }
            secureTextEntry={!showPasswords.confirm}
          />

          <SpaceComponent height={20} />

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <TextComponent
              text="Password requirements:"
              size={14}
              font={fontFamilies.medium}
              color={appColors.text}
            />
            <SpaceComponent height={8} />
            <TextComponent
              text="• At least 6 characters long"
              size={12}
              color={appColors.gray}
            />
            <TextComponent
              text="• Should contain letters and numbers"
              size={12}
              color={appColors.gray}
            />
          </View>
        </SectionComponent>

        <SectionComponent>
          <ButtonComponent
            text="Change Password"
            type="primary"
            onPress={handleChangePassword}
            loading={loading}
            icon={<Lock size={20} color={appColors.white} />}
          />
        </SectionComponent>

        <SpaceComponent height={100} />
      </ScrollView>
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
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  requirementsContainer: {
    backgroundColor: appColors.gray6,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: appColors.primary,
  },
});

export default ChangePasswordScreen;