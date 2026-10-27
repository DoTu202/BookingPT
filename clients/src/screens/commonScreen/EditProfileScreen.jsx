import React, {useEffect, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from '../../utils/dayjs';
import {Calendar, Call, Camera, Profile, Sms} from 'iconsax-react-native';
import {
  Avatar,
  ButtonComponent,
  InputComponent,
  ScreenHeader,
  StateView,
  TextComponent,
} from '../../components';
import profileApi from '../../apis/profileApi';
import {authSelector} from '../../redux/reducers/authReducer';
import {updateSession} from '../../utils/session';
import {pickAndUploadProfilePhoto} from '../../utils/photoUpload';
import {Validate} from '../../utils/validate';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, shadow, spacing} from '../../constants/theme';

const EditProfileScreen = ({navigation}) => {
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();

  const [status, setStatus] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({username: '', email: '', phoneNumber: '', dob: null, photoUrl: ''});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setStatus('loading');
    try {
      const response = await profileApi.getProfile();
      const user = response.data.data;
      setForm({
        username: user.username || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        dob: user.dob ? new Date(user.dob) : null,
        photoUrl: user.photoUrl || '',
      });
      setStatus('ready');
    } catch (err) {
      setLoadError(err.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (key, value) => setForm(prev => ({...prev, [key]: value}));

  const usernameError = form.username.trim().length < 2 ? 'Tên cần ít nhất 2 ký tự' : '';
  const phoneError = form.phoneNumber && !Validate.phone(form.phoneNumber) ? 'Số điện thoại gồm 9–12 chữ số' : '';

  const changePhoto = async () => {
    setUploading(true);
    try {
      const photoUrl = await pickAndUploadProfilePhoto();
      if (photoUrl) {
        setField('photoUrl', photoUrl);
        await updateSession(dispatch, auth, {photoUrl});
      }
    } catch (err) {
      Alert.alert('Không đổi được ảnh', err.message);
    } finally {
      setUploading(false);
    }
  };

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

  const onDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && date) {
      setField('dob', date);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Chỉnh sửa hồ sơ" onBack={() => navigation.goBack()} />
      {status === 'loading' ? (
        <StateView type="loading" />
      ) : status === 'error' ? (
        <StateView type="error" message={loadError} onAction={load} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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

            <View style={styles.card}>
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
              <View>
                <TextComponent text="Ngày sinh" size={13} font={fontFamilies.medium} styles={styles.label} />
                <TouchableOpacity
                  style={styles.dateField}
                  onPress={() => setShowDatePicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Chọn ngày sinh">
                  <Calendar size={20} color={appColors.textMuted} />
                  <TextComponent
                    text={form.dob ? dayjs(form.dob).format('DD/MM/YYYY') : 'Chọn ngày sinh'}
                    size={15}
                    color={form.dob ? appColors.text : appColors.placeholder}
                  />
                </TouchableOpacity>
                {showDatePicker ? (
                  <View>
                    <DateTimePicker
                      value={form.dob || new Date(2000, 0, 1)}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={new Date()}
                      minimumDate={new Date(1940, 0, 1)}
                      onChange={onDateChange}
                      locale="vi-VN"
                    />
                    {Platform.OS === 'ios' ? (
                      <ButtonComponent text="Xong" type="secondary" size="sm" onPress={() => setShowDatePicker(false)} />
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <TextComponent text={error} size={13} color={appColors.danger} />
              </View>
            ) : null}

            <ButtonComponent
              text="Lưu thay đổi"
              type="primary"
              size="lg"
              onPress={save}
              isLoading={saving}
              disable={Boolean(usernameError || phoneError)}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.md,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadow.sm,
  },
  label: {
    marginBottom: 6,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: appColors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  errorBox: {
    backgroundColor: appColors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
});
