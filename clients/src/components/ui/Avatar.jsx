import React, {useState} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';

// Round photo with an initial-letter fallback (also used when the image
// fails to load).
const Avatar = ({uri, name, size = 44, style}) => {
  const [failed, setFailed] = useState(false);
  const dimension = {width: size, height: size, borderRadius: size / 2};

  if (uri && !failed) {
    return (
      <Image
        source={{uri}}
        style={[dimension, styles.image, style]}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View style={[dimension, styles.fallback, style]}>
      <TextComponent
        text={(name || '?').trim().charAt(0).toUpperCase()}
        size={Math.round(size * 0.4)}
        font={fontFamilies.bold}
        color={appColors.primary}
      />
    </View>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  image: {
    backgroundColor: appColors.gray6,
  },
  fallback: {
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
