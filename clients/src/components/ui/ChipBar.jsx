import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import ChipComponent from './ChipComponent';
import {spacing} from '../../constants/theme';

// Single-choice row of chips (tabs, filters): options [{key, label}].
// Scrolls horizontally by default; `stretch` splits the width evenly instead.
const ChipBar = ({options, value, onChange, stretch}) => {
  const chips = options.map(option => (
    <ChipComponent
      key={option.key}
      label={option.label}
      selected={value === option.key}
      onPress={() => onChange(option.key)}
      styles={stretch ? styles.stretch : null}
    />
  ));

  if (stretch) {
    return <View style={[styles.row, styles.padded]}>{chips}</View>;
  }
  // The wrapping View stops the horizontal ScrollView from growing vertically.
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, styles.padded]}>
        {chips}
      </ScrollView>
    </View>
  );
};

export default ChipBar;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  stretch: {
    flex: 1,
  },
});
