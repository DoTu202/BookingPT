import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {Danger, DocumentText} from 'iconsax-react-native';
import TextComponent from '../ui/TextComponent';
import ButtonComponent from '../ui/ButtonComponent';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {spacing} from '../../constants/theme';

// One component for the three non-content states of a screen or list:
//   <StateView type="loading" title="Đang tải..." />
//   <StateView type="empty" title="Chưa có lịch" message="..." actionText="Tìm PT" onAction={...} />
//   <StateView type="error" message={error} onAction={reload} />
const StateView = ({type = 'empty', icon, title, message, actionText, onAction, compact}) => {
  const isError = type === 'error';

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {type === 'loading' ? (
        <ActivityIndicator size="large" color={appColors.primary} />
      ) : (
        <View style={[styles.iconCircle, isError && styles.iconCircleError]}>
          {icon ||
            (isError ? (
              <Danger size={30} color={appColors.danger} />
            ) : (
              <DocumentText size={30} color={appColors.primary} />
            ))}
        </View>
      )}
      {title || isError ? (
        <TextComponent
          text={title || 'Không tải được dữ liệu'}
          size={16}
          font={fontFamilies.semiBold}
          styles={styles.title}
        />
      ) : null}
      {message ? (
        <TextComponent text={message} size={14} color={appColors.textMuted} styles={styles.message} />
      ) : null}
      {onAction && type !== 'loading' ? (
        <ButtonComponent
          text={actionText || (isError ? 'Thử lại' : 'OK')}
          type={isError ? 'outline' : 'primary'}
          onPress={onAction}
          styles={styles.action}
        />
      ) : null}
    </View>
  );
};

export default StateView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl * 2,
  },
  compact: {
    flex: 0,
    paddingVertical: spacing.xl,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleError: {
    backgroundColor: appColors.dangerSoft,
  },
  title: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: spacing.lg,
    minWidth: 160,
  },
});
