import React, {useCallback, useEffect, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Call, Camera, Profile, Sms} from 'iconsax-react-native';
import {
  AsyncView,
  Avatar,
  Banner,
  ButtonComponent,
  Card,
  DatePickerField,
  FormScrollView,
  InputComponent,
  Screen,
  ScreenHeader,
} from '../../components';
import {useAsync, useProfilePhoto} from '../../hooks';
import profileApi from '../../apis/profileApi';
import {authSelector} from '../../redux/reducers/authReducer';
import {updateSession} from '../../utils/session';
import {Validate} from '../../utils/validate';
import appColors from '../../constants/appColors';
import {spacing} from '../../constants/theme';
import dayjs from '../../utils/dayjs';

const EMPTY_FORM = {username: '', email: '', phoneNumber: '', dob: null, photoUrl: ''};

const fetchForm = async () => {
  const response = await profileApi.getProfile();
  const user = response.data.data;
  return {
    username: user.username || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    dob: user.dob ? new Date(user.dob) : null,
    photoUrl: user.photoUrl || '',
  };
};

const EditProfileScreen = ({navigation}) => {
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const {data: loaded, status, error: loadError, reload} = useAsync(fetchForm);

  // The form starts from the loaded profile, then is edited locally.
  useEffect(() => {
    if (loaded) {
      setForm(loaded);
    }
  }, [loaded]);

  const setField = (key, value) => setForm(prev => ({...prev, [key]: value}));
  const {uploading, changePhoto} = useProfilePhoto(useCallback(photoUrl => setField('photoUrl', photoUrl), []));

  const usernameError = form.username.trim().length < 2 ? 'Tên cần ít nhất 2 ký tự' : '';
  const phoneError = form.phoneNumber && !Validate.phone(form.phoneNumber) ? 'Số điện thoại gồm 9–12 chữ số' : '';

  const save = async () => {
    if (usernameError || phoneError) {
      return;
    }
    setError('');
    setSaving(true);
    try {
      const response = await profileApi.updateProfile({
        username: form.username.trim(),
        phoneNumber: form.phoneNumber || undefined,
        // Calendar day picked by the user, not the UTC day of the Date.
        dob: form.dob ? dayjs(form.dob).format('YYYY-MM-DD') : undefined,
      });
      await updateSession(dispatch, auth, {username: response.data.data.username});
      Alert.alert('Đã lưu', 'Hồ sơ của bạn đã được cập nhật.', [
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
      <ScreenHeader title="Chỉnh sửa hồ sơ" onBack={() => navigation.goBack()} />
      <AsyncView status={status} error={loadError} onRetry={reload}>
        <FormScrollView>
          <View style={styles.avatarBlock}>
            <Avatar uri={form.photoUrl} name={form.username} size={92} />
            <ButtonComponent
              text={uploading ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}
              type="secondary"
              size="sm"
              icon={<Camera size={16} color={appColors.primaryDark} />}
              onPress={changePhoto}
              disable={uploading}
            />
          </View>

          <Card gap={spacing.lg}>
            <InputComponent
              label="Họ và tên"
              value={form.username}
              onChange={val => setField('username', val)}
              autoCapitalize="words"
              error={usernameError}
              prefix={<Profile size={20} color={appColors.textMuted} />}
            />
            <InputComponent
              label="Email"
              value={form.email}
              editable={false}
              helperText="Liên hệ hỗ trợ nếu bạn cần đổi email đăng nhập."
              prefix={<Sms size={20} color={appColors.textMuted} />}
            />
            <InputComponent
              label="Số điện thoại"
              value={form.phoneNumber}
              onChange={val => setField('phoneNumber', val.replace(/[^0-9]/g, ''))}
              type="phone-pad"
              maxLength={12}
              error={phoneError}
              prefix={<Call size={20} color={appColors.textMuted} />}
            />
            <DatePickerField
              label="Ngày sinh"
              placeholder="Chọn ngày sinh"
              value={form.dob}
              onChange={date => setField('dob', date)}
              minimumDate={new Date(1940, 0, 1)}
              maximumDate={new Date()}
            />
          </Card>

          <Banner message={error} />

          <ButtonComponent
            text="Lưu thay đổi"
            type="primary"
            size="lg"
            onPress={save}
            isLoading={saving}
            disable={Boolean(usernameError || phoneError)}
          />
        </FormScrollView>
      </AsyncView>
    </Screen>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.md,
  },
});
