import React from 'react';
import {RefreshControl} from 'react-native';
import appColors from '../../constants/appColors';

// Pull-to-refresh in the brand colour. `onGradient` uses a white spinner for
// scroll views that start on a gradient hero (HeroScrollView). Other props
// (refreshing, onRefresh, plus what ScrollView injects) pass through.
const AppRefreshControl = ({onGradient, ...props}) => (
  <RefreshControl
    colors={[appColors.primary]}
    tintColor={onGradient ? appColors.white : appColors.primary}
    {...props}
  />
);

export default AppRefreshControl;
