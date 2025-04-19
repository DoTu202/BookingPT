import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

const SpaceComponent = props => {
  const {width, height} = props;

  return (
    <View
      style={{
        width: width,
        height: height,
      }}></View>
  );
};

export default SpaceComponent;

const styles = StyleSheet.create({});
