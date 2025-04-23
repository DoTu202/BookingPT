import React from 'react';
import {View} from 'react-native';
import {globalStyles} from '../styles/globalStyles';
const SectionComponent = props => {
  const {children, styles} = props;
  return <View style={[globalStyles.section, styles]}>{children}</View>;
};

export default SectionComponent;
