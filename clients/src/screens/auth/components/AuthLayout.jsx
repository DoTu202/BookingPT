import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'iconsax-react-native';
import {AppBackground, EvolveULogo, TextComponent} from '../../../components';
import appColors from '../../../constants/appColors';
import {fontFamilies} from '../../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../../constants/theme';

// Shared frame for the auth screens: the brand backdrop on top, the form on a
// white card (dark text on white reads far better than text on a busy
// background), and keyboard avoidance so fields are never hidden.
const AuthLayout = ({title, subtitle, onBack, children, footer}) => {
  const insets = useSafeAreaInsets();

  return (
    <AppBackground>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Quay lại">
              <ArrowLeft size={22} color={appColors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          <View style={styles.hero}>
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <EvolveULogo width={22} height={22} color={appColors.white} />
              </View>
              <TextComponent
                text="BookingPT"
                size={14}
                font={fontFamilies.semiBold}
                color={appColors.white}
                styles={styles.brand}
              />
            </View>
            <TextComponent
              text={title}
              size={28}
              font={fontFamilies.bold}
              color={appColors.white}
            />
            {subtitle ? (
              <TextComponent
                text={subtitle}
                size={15}
                color="rgba(255,255,255,0.85)"
                styles={styles.subtitle}
              />
            ) : null}
          </View>

          <View style={styles.card}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

export default AuthLayout;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg + 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  backPlaceholder: {
    height: 44,
  },
  hero: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: appColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  brand: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl - 4,
    gap: spacing.lg,
    ...shadow.md,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
