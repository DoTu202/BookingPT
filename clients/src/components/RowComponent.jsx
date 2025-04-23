import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React from 'react';

import {globalStyles} from '../styles/globalStyles';

const RowComponent = props => {
  const {
    styles,
    justify = 'flex-start',
    children,
    onPress,
    align = 'center',
    gap
  } = props;

  const localStyles = [
    globalStyles.row,
    {
      justifyContent: justify,
      alignItems: align,
      gap: gap || 0,
    },
    styles,
  ];

  return onPress ? (
    <TouchableOpacity style={localStyles} onPress={onPress}>
      {children}
    </TouchableOpacity>
  ) : (
    <View style={localStyles}>{children}</View>
  );
};

export default RowComponent;
