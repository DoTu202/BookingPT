import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User, MapPin, Clock, DollarSign, Save, ArrowLeft } from 'lucide-react-native';
import { InputComponent, ButtonComponent } from '../../components';
import { SectionComponent, RowComponent } from '../../components';
import LoadingModal from '../../modals/LoadingModal';
import appColors from '../../constants/appColors';
import { fontFamilies } from '../../constants/fontFamilies';
import ptApi from '../../apis/ptApi';
import { SafeAreaView } from 'react-native-safe-area-context';

const PTProfileScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    specialization: [],
    experience: '',
    description: '',
    hourlyRate: '',
    location: {
      city: '',
      district: '',
    },
    certifications: [],
    languages: ['English'],
  });


  const specializationOptions = [
    { label: 'Weight Loss', value: 'weight_loss' },
    { label: 'Muscle Building', value: 'muscle_building' },
    { label: 'Cardio Training', value: 'cardio' },
    { label: 'Yoga', value: 'yoga' },
    { label: 'Strength Training', value: 'strength' },
    { label: 'General Training', value: 'general' },
    { label: 'Functional Training', value: 'functional_training' },
    { label: 'Rehabilitation', value: 'rehabilitation' },
    { label: 'Nutrition Coaching', value: 'nutrition' },
    { label: 'Pilates', value: 'pilates' },
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await ptApi.getProfile();
      if (response.data?.success) {
        const profile = response.data.data;
        setIsNewProfile(false); 
        setFormData({
          specialization: profile.specializations || [], 
          experience: profile.experienceYears?.toString() || '',
          description: profile.bio || '', 
          hourlyRate: profile.hourlyRate?.toString() || '',
          location: profile.location || { city: '', district: '' },
          certifications: profile.certifications || [],
          languages: profile.languages || ['English'],
        });
      }
    } catch (error) {
      console.log('No existing profile, creating new one');
      setIsNewProfile(true); // New profile
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    if (field === 'location.city' || field === 'location.district') {
      const locationField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleSpecialization = (specValue) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(specValue)
        ? prev.specialization.filter(s => s !== specValue)
        : [...prev.specialization, specValue],
    }));
  };

  const validateForm = () => {
    if (formData.specialization.length === 0) {
      Alert.alert('Error', 'Please select at least one specialization');
      return false;
    }
    if (!formData.experience || parseInt(formData.experience) < 0) {
      Alert.alert('Error', 'Please enter valid experience in years');
      return false;
    }
    if (!formData.description || formData.description.trim().length < 50) {
      Alert.alert('Error', 'Please provide a description (at least 50 characters)');
      return false;
    }
    if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
      Alert.alert('Error', 'Please enter a valid hourly rate');
      return false;
    }
    if (!formData.location.city || !formData.location.district) {
      Alert.alert('Error', 'Please provide your city and district');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      const profileData = {
        specialization: formData.specialization, 
        experience: parseInt(formData.experience),
        description: formData.description,
        hourlyRate: parseFloat(formData.hourlyRate),
        location: formData.location,
        certifications: formData.certifications,
        languages: formData.languages,
      };

      console.log('=== FORM DATA DEBUG ===');
      console.log('formData.specialization:', formData.specialization);
      console.log('profileData being sent:', profileData);

      const response = await ptApi.updateProfile(profileData);
      
      if (response.data?.success) {
        const successMessage = isNewProfile 
          ? 'Profile created successfully! You can now receive bookings.'
          : 'Profile updated successfully!';
        
        Alert.alert(
          'Success',
          successMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                if (isNewProfile) {
                  // After creating profile, navigate back to tab navigator
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'PTTabNavigator' }],
                  });
                } else {
                  // If editing, just go back to ProfileView
                  navigation.goBack();
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingModal visible={loading} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={appColors.white} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isNewProfile ? 'Setup Your Profile' : 'Edit Profile'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {/* Specialization */}
        <SectionComponent>
          <Text style={styles.sectionTitle}>Specialization</Text>
          <Text style={styles.sectionSubtitle}>Select your areas of expertise</Text>
          <View style={styles.specializationGrid}>
            {specializationOptions.map((spec) => (
              <TouchableOpacity
                key={spec.value}
                style={[
                  styles.specializationChip,
                  formData.specialization.includes(spec.value) && styles.specializationChipSelected,
                ]}
                onPress={() => toggleSpecialization(spec.value)}
              >
                <Text
                  style={[
                    styles.specializationText,
                    formData.specialization.includes(spec.value) && styles.specializationTextSelected,
                  ]}
                >
                  {spec.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.sectionTitle}>Experience</Text>
          <InputComponent
            value={formData.experience}
            onChangeText={(text) => updateFormData('experience', text)}
            placeholder="Years of experience"
            keyboardType="numeric"
            prefix={<User size={20} color={appColors.gray} />}
          />
          <Text style={styles.sectionTitle}>Hourly Rate</Text>
          <InputComponent
            value={formData.hourlyRate}
            onChangeText={(text) => updateFormData('hourlyRate', text)}
            placeholder="Rate per hour (VND)"
            keyboardType="numeric"
            prefix={<DollarSign size={20} color={appColors.gray} />}
          />
          <Text style={styles.sectionTitle}>Location</Text>
          <InputComponent
            value={formData.location.city}
            onChangeText={(text) => updateFormData('location.city', text)}
            placeholder="City"
            prefix={<MapPin size={20} color={appColors.gray} />}
          />
          <View style={{ marginTop: 12 }} />
          <InputComponent
            value={formData.location.district}
            onChangeText={(text) => updateFormData('location.district', text)}
            placeholder="District"
            prefix={<MapPin size={20} color={appColors.gray} />}
          />
        </SectionComponent>

        {/* Description */}
        <SectionComponent>
          <Text style={styles.sectionTitle}>About You</Text>
          <Text style={styles.sectionSubtitle}>
            Describe your training philosophy and approach (min. 50 characters)
          </Text>
          <InputComponent
            value={formData.description}
            onChangeText={(text) => updateFormData('description', text)}
            placeholder="Tell clients about your training style, achievements, and what makes you unique..."
            multiline
            numberOfLines={1}
            style={styles.textArea}
          />
          <Text style={styles.characterCount}>
            {formData.description.length}/50 characters minimum
          </Text>
        </SectionComponent>

        {/* Save Button */}
        <SectionComponent>
          <ButtonComponent
            title
            onPress={handleSave}
            loading={saving}
            icon={<Save size={20} color={appColors.white} strokeWidth={2} />}
            type="primary"
            text={isNewProfile ? "Create Profile & Go Live" : "Save Changes"}
          />
          {isNewProfile && (
            <Text style={styles.createProfileHint}>
              Once you create your profile, you'll appear in client searches and can start receiving bookings!
            </Text>
          )}
        </SectionComponent>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PTProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.white,
  

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: appColors.primary,
    borderBottomWidth: 1,
    borderBottomColor: appColors.primary,
    height: 140,
    borderRadius: 20,

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
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.semiBold,
    color: appColors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    marginBottom: 16,
    lineHeight: 20,
  },
  specializationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appColors.gray4,
    backgroundColor: appColors.white,
    marginBottom: 8,
  },
  specializationChipSelected: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  specializationText: {
    fontSize: 14,
    fontFamily: fontFamilies.medium,
    color: appColors.text,
  },
  specializationTextSelected: {
    color: appColors.white,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  createProfileHint: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});