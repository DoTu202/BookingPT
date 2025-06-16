import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  SectionComponent,
  RowComponent,
  TextComponent,
  ButtonComponent,
  InputComponent,
  SpaceComponent,
} from '../../components';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeSlash,
} from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import profileApi from '../../apis/profileApi';

const ChangePasswordScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      await profileApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      Alert.alert(
        'Success', 
        'Password changed successfully. Please login again.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('LoginScreen')
          }
        ]
      );
    } catch (error) {
      console.error('Error changing password:', error);
      
      let message = 'Failed to change password';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Custom Header */}
      <View style={styles.header}>
        <RowComponent justify="space-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={appColors.white} />
          </TouchableOpacity>
          <TextComponent
            text="Change Password"
            size={20}
            font="Poppins-Bold"
            color={appColors.white}
          />
          <View style={{ width: 24 }} />
        </RowComponent>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <SectionComponent>
          <View style={styles.formContainer}>
            <View style={styles.infoContainer}>
              <TextComponent
                text="Security Notice"
                size={16}
                font="Poppins-SemiBold"
                color={appColors.black}
              />
              <SpaceComponent height={8} />
              <TextComponent
                text="Make sure your new password is strong and unique. It should contain at least 6 characters."
                size={14}
                color={appColors.gray}
                styles={{ lineHeight: 20 }}
              />
            </View>

            <SpaceComponent height={24} />

            {/* Current Password */}
            <View style={styles.inputContainer}>
              <TextComponent
                text="Current Password"
                size={14}
                font="Poppins-Medium"
                color={appColors.black}
              />
              <SpaceComponent height={8} />
              <InputComponent
                value={formData.currentPassword}
                onChangeText={(value) => handleInputChange('currentPassword', value)}
                placeholder="Enter your current password"
                secureTextEntry={!showPasswords.current}
                prefix={<Lock size={20} color={appColors.gray} />}
                suffix={
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <EyeSlash size={20} color={appColors.gray} />
                    ) : (
                      <Eye size={20} color={appColors.gray} />
                    )}
                  </TouchableOpacity>
                }
              />
              {errors.currentPassword && (
                <TextComponent
                  text={errors.currentPassword}
                  size={12}
                  color={appColors.danger}
                  styles={{ marginTop: 4 }}
                />
              )}
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <TextComponent
                text="New Password"
                size={14}
                font="Poppins-Medium"
                color={appColors.black}
              />
              <SpaceComponent height={8} />
              <InputComponent
                value={formData.newPassword}
                onChangeText={(value) => handleInputChange('newPassword', value)}
                placeholder="Enter your new password"
                secureTextEntry={!showPasswords.new}
                prefix={<Lock size={20} color={appColors.gray} />}
                suffix={
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <EyeSlash size={20} color={appColors.gray} />
                    ) : (
                      <Eye size={20} color={appColors.gray} />
                    )}
                  </TouchableOpacity>
                }
              />
              {errors.newPassword && (
                <TextComponent
                  text={errors.newPassword}
                  size={12}
                  color={appColors.danger}
                  styles={{ marginTop: 4 }}
                />
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <TextComponent
                text="Confirm New Password"
                size={14}
                font="Poppins-Medium"
                color={appColors.black}
              />
              <SpaceComponent height={8} />
              <InputComponent
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                placeholder="Confirm your new password"
                secureTextEntry={!showPasswords.confirm}
                prefix={<Lock size={20} color={appColors.gray} />}
                suffix={
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <EyeSlash size={20} color={appColors.gray} />
                    ) : (
                      <Eye size={20} color={appColors.gray} />
                    )}
                  </TouchableOpacity>
                }
              />
              {errors.confirmPassword && (
                <TextComponent
                  text={errors.confirmPassword}
                  size={12}
                  color={appColors.danger}
                  styles={{ marginTop: 4 }}
                />
              )}
            </View>

            <SpaceComponent height={32} />

            {/* Change Password Button */}
            <ButtonComponent
              text="Change Password"
              type="primary"
              onPress={handleChangePassword}
              isLoading={loading}
            />
          </View>
        </SectionComponent>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  header: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formContainer: {
    backgroundColor: appColors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoContainer: {
    backgroundColor: `${appColors.primary}10`,
    padding: 16,
    borderRadius: 12,
    borderLeft: `4px solid ${appColors.primary}`,
  },
  inputContainer: {
    marginBottom: 20,
  },
});
