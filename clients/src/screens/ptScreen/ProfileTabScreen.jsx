import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PTProfileViewScreen from './PTProfileViewScreen';
import PTProfileScreen from './PTProfileScreen';
import LoadingModal from '../../modals/LoadingModal';
import ptApi from '../../apis/ptApi';

const ProfileTabScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  // Check if PT has profile when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      checkProfile();
    }, [])
  );

  const checkProfile = async () => {
    try {
      setLoading(true);
      console.log('ProfileTabScreen: Checking if PT has profile...');
      const response = await ptApi.getProfile();
      if (response.data?.success && response.data.data) {
        console.log('ProfileTabScreen: PT has profile, showing PTProfileViewScreen');
        setHasProfile(true);
      } else {
        console.log('ProfileTabScreen: PT has no profile, showing PTProfileScreen');
        setHasProfile(false);
      }
    } catch (error) {
      // If 404 or profile not found, PT doesn't have profile
      if (error.response?.status === 404 || error.response?.data?.message?.includes('not found')) {
        console.log('ProfileTabScreen: PT has no profile (404), showing PTProfileScreen');
        setHasProfile(false);
      } else {
        console.error('ProfileTabScreen: Error checking profile:', error);
        setHasProfile(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingModal visible={loading} />;
  }

  // Conditionally render based on whether PT has profile or not
  if (hasProfile) {
    return <PTProfileViewScreen />;
  } else {
    return <PTProfileScreen />;
  }
};

export default ProfileTabScreen;
