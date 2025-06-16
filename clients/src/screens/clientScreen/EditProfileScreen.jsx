import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  Edit2,
  Save2,
} from 'iconsax-react-native';
import appColors from '../../constants/appColors';
import { useDispatch, useSelector } from 'react-redux';
import { authSelector, addAuth } from '../../redux/reducers/authReducer';
import profileApi from '../../apis/profileApi';
import { TouchableOpacity } from 'react-native';

const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    dob: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Initialize form with current user data
    setFormData({
      username: auth.username || '',
      email: auth.email || '',
      phoneNumber: auth.phoneNumber || '',
      dob: auth.dob ? new Date(auth.dob).toISOString().split('T')[0] : ''
    });
  }, [auth]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (formData.phoneNumber && !/^\d{10,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const updateData = {
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        dob: formData.dob || null
      };
      
      const response = await profileApi.updateProfile(updateData);
      
      if (response.data && response.data.data) {
        // Update Redux store with new user data
        dispatch(addAuth({
          ...auth,
          ...response.data.data
        }));
        
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let message = 'Failed to update profile';
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
            text="Edit Profile"
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
            {/* Username */}
            <View style={styles.inputContainer}>
              <TextComponent
                text="Username"
                size={14}
                font="Poppins-Medium"
                color={appColors.black}
              />
              <SpaceComponent height={8} />
              <InputComponent
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                placeholder="Enter your username"
                prefix={<Edit2 size={20} color={appColors.gray} />}
              />
              {errors.username && (
                <TextComponent
                  text={errors.username}
                  size={12}
                  color={appColors.danger}
                  styles={{ marginTop: 4 }}
                />
              )}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <TextComponent
                text="Email"
                size={14}
                font="Poppins-Medium"
                color={appColors.black}
              />
              <SpaceComponent height={8} />
              <InputComponent
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <TextComponent
                  text={errors.email}
                  size={12}
                  color={appColors.danger}
                  styles={{ marginTop: 4 }}
                />
              )}
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <TextComponent
                text="Phone Number"
                size={14}
                font="Poppins-Medium"
                color={appColors.black}
              />
              <SpaceComponent height={8} />
              <InputComponent
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
              {errors.phoneNumber && (
                <TextComponent
                  text={errors.phoneNumber}
                  size={12}
                  color={appColors.danger}
                  styles={{ marginTop: 4 }}
                />
              )}
            </View>

            {/* Date of Birth */}
            <View style={styles.inputContainer}>
              <TextComponent
                text="Date of Birth"
                size={14}
                font="Poppins-Medium"
                color={appColors.black}
              />
              <SpaceComponent height={8} />
              <InputComponent
                value={formData.dob}
                onChangeText={(value) => handleInputChange('dob', value)}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <SpaceComponent height={32} />

            {/* Save Button */}
            <ButtonComponent
              text="Save Changes"
              type="primary"
              onPress={handleSave}
              isLoading={loading}
              icon={<Save2 size={20} color={appColors.white} />}
              iconFlex="left"
            />
          </View>
        </SectionComponent>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

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
  inputContainer: {
    marginBottom: 20,
  },
});
