import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Save, User, Sms, Call, Calendar} from 'iconsax-react-native';
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
import {fontFamilies} from '../../constants/fontFamilies';
import profileApi from '../../apis/profileApi';
import {useSelector, useDispatch} from 'react-redux';
import {authSelector, addAuth} from '../../redux/reducers/authReducer';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    dob: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('Loading profile data...');
      const response = await profileApi.getProfile();

      if (response.data?.success) {
        const userData = response.data.data || response.data;
        console.log('Profile data loaded:', userData);
        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          dob: userData.dob
            ? new Date(userData.dob).toISOString().split('T')[0]
            : '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    // Enhanced validation
    if (!formData.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    if (!validateEmail(formData.email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (
      formData.phoneNumber &&
      !/^\d{9,12}$/.test(formData.phoneNumber.trim())
    ) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (formData.dob && !/^\d{4}-\d{2}-\d{2}$/.test(formData.dob)) {
      Alert.alert('Error', 'Date of birth should be in YYYY-MM-DD format');
      return;
    }

    try {
      setSaving(true);
      console.log('Saving profile data...');

      const updateData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        dob: formData.dob || undefined,
      };

      const response = await profileApi.updateProfile(updateData);

      if (response.data?.success) {
        console.log('Profile updated successfully:', response.data.data);

        dispatch(
          addAuth({
            ...auth,
            username: response.data.data.username,
            email: response.data.data.email,
          }),
        );

        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const message =
        error.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = text => {
    let formatted = text.replace(/\D/g, '');
    if (formatted.length > 4) {
      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
    }
    if (formatted.length > 7) {
      formatted = formatted.slice(0, 7) + '-' + formatted.slice(7, 9);
    }
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }
    return formatted;
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      <LoadingModal visible={loading || saving} />

      {/* Header */}
      <View style={styles.header}>
        <RowComponent justify="space-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={appColors.white} />
          </TouchableOpacity>
          <TextComponent
            text="Edit Profile"
            size={18}
            font={fontFamilies.semiBold}
            color={appColors.white}
          />
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Save size={24} color={appColors.white} />
          </TouchableOpacity>
        </RowComponent>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1}}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <SectionComponent>
            <TextComponent
              text="Basic Information"
              size={16}
              font={fontFamilies.semiBold}
              color={appColors.text}
            />
            <SpaceComponent height={16} />

            <InputComponent
              value={formData.username}
              onChangeText={text => updateFormData('username', text)}
              placeholder="Username"
              prefix={<User size={20} color={appColors.gray} />}
              allowClear
            />
            <SpaceComponent height={16} />

            <InputComponent
              value={formData.email}
              onChangeText={text => updateFormData('email', text)}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              prefix={<Sms size={20} color={appColors.gray} />}
              allowClear
            />
            <SpaceComponent height={16} />

            <InputComponent
              value={formData.phoneNumber}
              onChangeText={text =>
                updateFormData('phoneNumber', text.replace(/[^0-9]/g, ''))
              }
              placeholder="Phone number (optional)"
              keyboardType="phone-pad"
              prefix={<Call size={20} color={appColors.gray} />}
              allowClear
            />
            <SpaceComponent height={16} />

            <InputComponent
              value={formData.dob}
              onChangeText={text => updateFormData('dob', formatDate(text))}
              placeholder="Date of birth (YYYY-MM-DD)"
              prefix={<Calendar size={20} color={appColors.gray} />}
              allowClear
            />
          </SectionComponent>

          <SectionComponent>
            <ButtonComponent
              text="Save Changes"
              type="primary"
              onPress={handleSave}
              loading={saving}
              icon={<Save size={20} color={appColors.white} />}
            />
          </SectionComponent>

          <SpaceComponent height={100} />
        </ScrollView>
      </KeyboardAvoidingView>
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
});

export default EditProfileScreen;
