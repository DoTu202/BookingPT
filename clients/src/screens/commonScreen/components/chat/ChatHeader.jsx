import React from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'iconsax-react-native';
import {Avatar, GradientView, HeaderIconButton, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {header, spacing} from '../../../../constants/theme';

// Gradient header with the other member's photo, name and role / typing hint.
const ChatHeader = ({user, typing, onBack}) => {
  const insets = useSafeAreaInsets();
  return (
    <GradientView style={[styles.header, {paddingTop: insets.top + spacing.sm}]}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.gradientPrimary[1]} />
      <HeaderIconButton
        icon={<ArrowLeft size={header.iconSize} color={appColors.white} />}
        onPress={onBack}
        accessibilityLabel="Quay lại"
      />
      <Avatar uri={user?.photoUrl} name={user?.username} size={42} style={styles.avatar} />
      <View style={styles.flex}>
        <TextComponent
          text={user?.username || 'Cuộc trò chuyện'}
          size={16}
          font={fontFamilies.semiBold}
          color={appColors.white}
          numberOfLines={1}
        />
        <TextComponent
          text={typing ? 'Đang nhập...' : user?.role === 'pt' ? 'Huấn luyện viên' : 'Học viên'}
          size={12}
          color="rgba(255,255,255,0.85)"
        />
      </View>
    </GradientView>
  );
};

export default ChatHeader;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md + 2,
    borderBottomLeftRadius: header.radius,
    borderBottomRightRadius: header.radius,
  },
  avatar: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
