import React from 'react';
import {StyleSheet, View} from 'react-native';
import TextComponent from './TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing} from '../../constants/theme';

// fg: title / icon colour, text: message colour when there is no title.
const TONES = {
  danger: {fg: appColors.danger, bg: appColors.dangerSoft, text: appColors.danger},
  warning: {fg: appColors.warning, bg: appColors.warningSoft, text: appColors.text},
  info: {fg: appColors.info, bg: appColors.infoSoft, text: appColors.text},
  primary: {fg: appColors.primaryDark, bg: appColors.primarySoft, text: appColors.primaryDark},
};

// Inline message box: form errors, notices, cancellation reasons.
//   <Banner message={error} />                       // danger by default
//   <Banner tone="warning" icon={<Warning2 .../>} message="..." />
//   <Banner icon={...} title="Lý do" message={reason} />
const Banner = ({tone = 'danger', icon, title, message, style}) => {
  const colors = TONES[tone] || TONES.danger;
  if (!message && !title) {
    return null;
  }
  return (
    <View
      style={[styles.box, {backgroundColor: colors.bg}, style]}
      accessibilityLiveRegion={tone === 'danger' ? 'polite' : 'none'}>
      {icon}
      <View style={styles.flex}>
        {title ? (
          <TextComponent text={title} size={12} font={fontFamilies.medium} color={colors.fg} />
        ) : null}
        {message ? (
          <TextComponent text={message} size={13} color={title ? appColors.text : colors.text} />
        ) : null}
      </View>
    </View>
  );
};

export default Banner;

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
