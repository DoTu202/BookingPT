import React from 'react';
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet} from 'react-native';
import {spacing} from '../../constants/theme';

// Scrollable form body that stays above the keyboard. `footer` (e.g. a
// BottomBar) is rendered under the scroll view and moves with the keyboard.
const FormScrollView = ({children, footer, contentContainerStyle, ...props}) => (
  <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, contentContainerStyle]}
      {...props}>
      {children}
    </ScrollView>
    {footer}
  </KeyboardAvoidingView>
);

export default FormScrollView;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
});
