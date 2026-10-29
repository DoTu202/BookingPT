import React from 'react';
import {StyleSheet, View} from 'react-native';
import GradientView from '../ui/GradientView';
import TextComponent from '../ui/TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {header, spacing} from '../../constants/theme';
import {timeUtils} from '../../utils/timeUtils';

// Gradient hero of the home screens: "Chào buổi sáng," + name + caption.
// `top` is a row above the greeting (menu / bell), `right` sits beside it,
// `children` go below (e.g. a search bar). `overlap` leaves room at the
// bottom for a card pulled up over the hero with a negative margin.
const GreetingHero = ({name, caption, top, right, children, overlap = 60}) => (
  <GradientView style={[styles.hero, {paddingBottom: overlap}]}>
    {top ? <View style={styles.top}>{top}</View> : null}
    <View style={styles.row}>
      <View style={styles.flex}>
        <TextComponent text={`${timeUtils.greeting()},`} size={15} color="rgba(255,255,255,0.85)" />
        <TextComponent text={name} size={26} font={fontFamilies.bold} color={appColors.white} numberOfLines={1} />
        {caption ? <TextComponent text={caption} size={14} color="rgba(255,255,255,0.85)" /> : null}
      </View>
      {right}
    </View>
    {children}
  </GradientView>
);

export default GreetingHero;

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg + 4,
    borderBottomLeftRadius: header.radius,
    borderBottomRightRadius: header.radius,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
