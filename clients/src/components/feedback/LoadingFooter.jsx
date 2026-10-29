import React from 'react';
import {ActivityIndicator, StyleSheet} from 'react-native';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';

// Spinner under a FlatList while the next page loads.
const LoadingFooter = ({visible}) =>
  visible ? <ActivityIndicator color={appColors.primary} style={styles.footer} /> : null;

export default LoadingFooter;

const styles = StyleSheet.create({
  footer: {
    paddingVertical: spacing.lg,
  },
});
