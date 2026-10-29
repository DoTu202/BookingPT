import React from 'react';
import {ActivityIndicator, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Camera} from 'iconsax-react-native';
import Avatar from '../ui/Avatar';
import GradientView from '../ui/GradientView';
import TextComponent from '../ui/TextComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {header, spacing} from '../../constants/theme';

// Gradient profile header: avatar with change-photo button, name, subtitle,
// optional badge row (`children`) and a right-hand action. Sits at the top of
// a HeroScrollView, which owns the status bar area.
const ProfileHero = ({photoUrl, name, subtitle, onChangePhoto, uploading, right, children}) => {
  return (
    <GradientView style={styles.container}>
      <View style={styles.topRow}>{right}</View>
      <View style={styles.avatarWrap}>
        <Avatar uri={photoUrl} name={name} size={96} style={styles.avatar} />
        {onChangePhoto ? (
          <TouchableOpacity
            style={styles.camera}
            onPress={onChangePhoto}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel="Đổi ảnh đại diện">
            {uploading ? (
              <ActivityIndicator size="small" color={appColors.primary} />
            ) : (
              <Camera size={16} color={appColors.primary} variant="Bold" />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
      <TextComponent
        text={name}
        size={22}
        font={fontFamilies.bold}
        color={appColors.white}
        numberOfLines={1}
        styles={styles.center}
      />
      {subtitle ? (
        <TextComponent
          text={subtitle}
          size={13}
          color="rgba(255,255,255,0.85)"
          numberOfLines={1}
          styles={styles.center}
        />
      ) : null}
      {children ? <View style={styles.extra}>{children}</View> : null}
    </GradientView>
  );
};

export default ProfileHero;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + 8,
    borderBottomLeftRadius: header.radius,
    borderBottomRightRadius: header.radius,
  },
  topRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minHeight: header.iconButton,
  },
  avatarWrap: {
    marginBottom: spacing.md,
  },
  avatar: {
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  camera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: appColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
  extra: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
