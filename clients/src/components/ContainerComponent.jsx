import React from 'react';
import {View} from 'react-native';
import {ImageBackground, ScrollView, SafeAreaView} from 'react-native';
import {globalStyles} from '../styles/globalStyles';

const ContainerComponent = props => {
  const {isImageBackground, children, isScroll, title} = props;

  const returnContainer = isScroll ? (
    <ScrollView>{children}</ScrollView>
  ) : (
    <View>{children}</View>
  );

  return isImageBackground ? (
    <ImageBackground
      source={require('../../assets/images/Main.png')}
      style={{flex: 1}}
      imageStyle={{flex: 1}}>
      {returnContainer}
    </ImageBackground>
  ) : (
    <SafeAreaView style={[globalStyles.container, {flex: 1}]}>
      <View>{returnContainer}</View>
    </SafeAreaView>
  );
};

export default ContainerComponent;
