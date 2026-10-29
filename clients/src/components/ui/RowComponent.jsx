import {View, TouchableOpacity} from 'react-native';
import React from 'react';

import {globalStyles} from '../../styles/globalStyles';

// Horizontal flex row. `wrap` lets children flow onto several lines (chips,
// tags); `gap` spaces them.
const RowComponent = props => {
  const {styles, justify, children, onPress, align = 'center', gap, wrap} = props;

  const localStyles = [
    globalStyles.row,
    {
      justifyContent: justify,
      alignItems: align,
      gap: gap,
      flexWrap: wrap ? 'wrap' : 'nowrap',
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
