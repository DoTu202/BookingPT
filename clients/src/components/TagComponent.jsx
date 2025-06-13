import {View, Text, TouchableOpacity} from 'react-native';
import React from 'react';
import {RowComponent, TextComponent} from './';
import appColors from '../constants/appColors';
import {globalStyles} from '../styles/globalStyles';

const TagComponent = (props) => {
  const {icon, color, isFill, title} = props;

  return <RowComponent>{icon && icon}</RowComponent>;
};

export default TagComponent;
