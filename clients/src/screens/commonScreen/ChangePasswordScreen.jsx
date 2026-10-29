import React, {useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Lock, ShieldTick} from 'iconsax-react-native';
import {
  Banner,
  ButtonComponent,
  Card,
  FormScrollView,
  IconBox,
  InputComponent,
  Screen,
  ScreenHeader,
  TextComponent,
} from '../../components';
import PasswordRule from './components/PasswordRule';
import profileApi from '../../apis/profileApi';
import {authSelector} from '../../redux/reducers/authReducer';
import {updateSession} from '../../utils/session';
import {MIN_PASSWORD_LENGTH} from '../../utils/validate';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';

const ChangePasswordScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const [form, setForm] = useState({currentPassword: '', newPassword: '', confirmPassword: ''});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (key, value) => setForm(prev => ({...prev, [key]: value}));

  const longEnough = form.newPassword.length >= MIN_PASSWORD_LENGTH;
  const differs = form.newPassword.length > 0 && form.newPassword !== form.currentPassword;
  const matches = form.confirmPassword.length > 0 && form.confirmPassword === form.newPassword;
  const canSubmit = form.currentPassword && longEnough && differs && matches;

  const submit = async () => {
    setError('');
    setSaving(true);
    try {
      const response = await profileApi.changePassword(form);
      // Changing the password revokes older tokens; keep this device signed
      // in with the fresh token returned by the server.
      if (response.data?.data?.accesstoken) {
        await updateSession(dispatch, auth, response.data.data);
      }
      Alert.alert('Đổi mật khẩu thành công', 'Các thiết bị khác sẽ phải đăng nhập lại.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Đổi mật khẩu" onBack={() => navigation.goBack()} />
      <FormScrollView>
        <View style={styles.intro}>
          <IconBox size={52}>
            <ShieldTick size={26} color={appColors.primary} variant="Bold" />
          </IconBox>
          <TextComponent
            text="Mật khẩu mạnh giúp bảo vệ tài khoản và lịch tập của bạn."
            size={14}
            color={appColors.textMuted}
            styles={styles.flex}
          />
        </View>

        <Card gap={spacing.lg}>
          <InputComponent
            label="Mật khẩu hiện tại"
            value={form.currentPassword}
            onChange={val => setField('currentPassword', val)}
            textContentType="password"
            prefix={<Lock size={20} color={appColors.textMuted} />}
            isPassword
          />
          <InputComponent
            label="Mật khẩu mới"
            value={form.newPassword}
            onChange={val => setField('newPassword', val)}
            textContentType="newPassword"
            prefix={<Lock size={20} color={appColors.textMuted} />}
            isPassword
          />
          <InputComponent
            label="Nhập lại mật khẩu mới"
            value={form.confirmPassword}
            onChange={val => setField('confirmPassword', val)}
            textContentType="newPassword"
            error={form.confirmPassword && !matches ? 'Mật khẩu xác nhận không khớp' : ''}
            prefix={<Lock size={20} color={appColors.textMuted} />}
            isPassword
          />
          <View style={styles.rules}>
            <PasswordRule ok={longEnough} text={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`} />
            <PasswordRule ok={differs} text="Khác mật khẩu hiện tại" />
            <PasswordRule ok={matches} text="Hai lần nhập trùng khớp" />
          </View>
        </Card>

        <Banner message={error} />

        <ButtonComponent
          text="Đổi mật khẩu"
          type="primary"
          size="lg"
          onPress={submit}
          disable={!canSubmit}
          isLoading={saving}
        />
      </FormScrollView>
    </Screen>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rules: {
    gap: spacing.sm,
  },
});
