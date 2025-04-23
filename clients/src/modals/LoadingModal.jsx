import {StyleSheet, Text, View, Modal, ActivityIndicator} from 'react-native';
import React from 'react';
import {globalStyles} from '../styles/globalStyles';
import {TextComponent} from '../components';
import appColors from '../constants/appColors';

const LoadingModal = props => {
  const {visible, mess} = props;

  return (
    <Modal visible={visible} transparent statusBarTranslucent>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
  
        <TextComponent text="Loading..." flex={0} color={appColors.primary} />
        <ActivityIndicator color={appColors.primary} />
      </View>
    </Modal>
  );
};

export default LoadingModal;

const styles = StyleSheet.create({});
