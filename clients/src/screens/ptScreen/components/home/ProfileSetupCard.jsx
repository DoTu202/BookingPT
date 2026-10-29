import React from 'react';
import {StyleSheet} from 'react-native';
import {ProfileCircle} from 'iconsax-react-native';
import {ButtonComponent, Card, IconBox, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';

// Shown instead of the dashboard until the PT has created a profile.
const ProfileSetupCard = ({onCreate}) => (
  <Card variant="floating" style={styles.card}>
    <IconBox size={64}>
      <ProfileCircle size={32} color={appColors.primary} variant="Bold" />
    </IconBox>
    <TextComponent text="Hoàn thiện hồ sơ của bạn" size={18} font={fontFamilies.bold} styles={styles.center} />
    <TextComponent
      text="Thêm chuyên môn, giá và khu vực để xuất hiện trong kết quả tìm kiếm và bắt đầu nhận học viên."
      size={14}
      color={appColors.textMuted}
      styles={styles.center}
    />
    <ButtonComponent text="Tạo hồ sơ ngay" type="primary" onPress={onCreate} fullWidth />
  </Card>
);

export default ProfileSetupCard;

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
