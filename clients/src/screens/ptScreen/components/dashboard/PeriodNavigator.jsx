import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {ArrowLeft2, ArrowRight2} from 'iconsax-react-native';
import {IconButton, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {spacing} from '../../../../constants/theme';

// ‹ title / range › — steps back (older) and forward (newer) through periods.
const PeriodNavigator = ({title, subtitle, loading, canGoBack, canGoForward, onBack, onForward}) => (
  <View style={styles.row}>
    <IconButton
      tone="surface"
      round
      size={40}
      icon={<ArrowLeft2 size={18} color={appColors.text} />}
      onPress={onBack}
      disabled={!canGoBack}
      accessibilityLabel="Kỳ trước"
    />
    <View style={styles.title}>
      <View style={styles.titleRow}>
        <TextComponent text={title} size={16} font={fontFamilies.semiBold} />
        {loading ? <ActivityIndicator size="small" color={appColors.primary} /> : null}
      </View>
      {subtitle ? <TextComponent text={subtitle} size={12} color={appColors.textMuted} /> : null}
    </View>
    <IconButton
      tone="surface"
      round
      size={40}
      icon={<ArrowRight2 size={18} color={appColors.text} />}
      onPress={onForward}
      disabled={!canGoForward}
      accessibilityLabel="Kỳ sau"
    />
  </View>
);

export default PeriodNavigator;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
