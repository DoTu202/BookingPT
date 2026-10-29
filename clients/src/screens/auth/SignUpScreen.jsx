import React, {useRef, useState} from 'react';
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from '../../utils/dayjs';
import {Calendar, Call, Lock, Profile, Sms, TickCircle} from 'iconsax-react-native';
import {Banner, ButtonComponent, InputComponent, RowComponent, TextComponent} from '../../components';
import AuthLayout from './components/AuthLayout';
import authApi from '../../apis/authApi';
import {MIN_PASSWORD_LENGTH, Validate} from '../../utils/validate';
import appColors from '../../constants/appColors';
import {fontFamilies} from '../../constants/fontFamilies';
import {radius, spacing} from '../../constants/theme';

const ROLES = [
  {value: 'client', title: 'Học viên', description: 'Tìm và đặt lịch với huấn luyện viên'},
  {value: 'pt', title: 'Huấn luyện viên', description: 'Nhận học viên và quản lý lịch dạy'},
];

const initValue = {
  username: '',
  email: '',
  phoneNumber: '',
  dob: null,
  password: '',
  confirmPassword: '',
  role: 'client',
};

// Returns a Vietnamese error message per field ('' when valid).
const validateField = (key, values) => {
  const value = values[key];
  switch (key) {
    case 'username':
      return value.trim().length < 2 ? 'Tên cần ít nhất 2 ký tự' : '';
    case 'email':
      return !value.trim()
        ? 'Vui lòng nhập email'
        : !Validate.email(value.trim())
        ? 'Email không hợp lệ'
        : '';
    case 'phoneNumber':
      return !Validate.phone(value) ? 'Số điện thoại gồm 9–12 chữ số' : '';
    case 'dob':
      return !value ? 'Vui lòng chọn ngày sinh' : '';
    case 'password':
      return !Validate.password(value) ? `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự` : '';
    case 'confirmPassword':
      return !value
        ? 'Vui lòng nhập lại mật khẩu'
        : value !== values.password
        ? 'Mật khẩu xác nhận không khớp'
        : '';
    default:
      return '';
  }
};

const FIELDS = ['username', 'email', 'phoneNumber', 'dob', 'password', 'confirmPassword'];

const SignUpScreen = ({navigation}) => {
  const [values, setValues] = useState(initValue);
  const [touched, setTouched] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const refs = {
    email: useRef(null),
    phoneNumber: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  const errors = Object.fromEntries(FIELDS.map(key => [key, validateField(key, values)]));
  const isValid = FIELDS.every(key => !errors[key]);
  const errorFor = key => (touched[key] ? errors[key] : '');

  const setValue = (key, value) => setValues(prev => ({...prev, [key]: value}));
  const touch = key => setTouched(prev => ({...prev, [key]: true}));

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setValue('dob', selectedDate);
    }
    if (event.type !== 'set' || Platform.OS === 'android') {
      touch('dob');
    }
  };

  const handleRegister = async () => {
    if (!isValid) {
      setTouched(Object.fromEntries(FIELDS.map(key => [key, true])));
      return;
    }
    setFormError('');
    setIsLoading(true);
    try {
      const email = values.email.trim();
      await authApi.HandleAuthentication('/verification', {email}, 'post');
      navigation.navigate('VerifyCodeScreen', {
        username: values.username.trim(),
        email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        role: values.role,
        dob: values.dob.toISOString(),
      });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Chỉ mất một phút. Chúng tôi sẽ gửi mã xác minh tới email của bạn."
      onBack={() => navigation.goBack()}
      footer={
        <RowComponent>
          <TextComponent text="Đã có tài khoản? " color={appColors.white} />
          <ButtonComponent
            type="link"
            text="Đăng nhập"
            textColor={appColors.primaryLight}
            onPress={() => navigation.navigate('LoginScreen')}
          />
        </RowComponent>
      }>
      <View>
        <TextComponent text="Bạn là" size={13} font={fontFamilies.medium} styles={styles.label} />
        <View style={styles.roles}>
          {ROLES.map(role => {
            const selected = values.role === role.value;
            return (
              <TouchableOpacity
                key={role.value}
                style={[styles.roleCard, selected && styles.roleCardSelected]}
                onPress={() => setValue('role', role.value)}
                accessibilityRole="radio"
                accessibilityState={{selected}}>
                <RowComponent justify="space-between">
                  <TextComponent
                    text={role.title}
                    font={fontFamilies.semiBold}
                    color={selected ? appColors.primaryDark : appColors.text}
                  />
                  {selected ? (
                    <TickCircle size={18} color={appColors.primary} variant="Bold" />
                  ) : null}
                </RowComponent>
                <TextComponent
                  text={role.description}
                  size={12}
                  color={appColors.textMuted}
                  styles={styles.roleDescription}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <InputComponent
        label="Họ và tên"
        value={values.username}
        onChange={val => setValue('username', val)}
        onBlur={() => touch('username')}
        placeholder="Nguyễn Văn A"
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        onSubmitEditing={() => refs.email.current?.focus()}
        error={errorFor('username')}
        prefix={<Profile size={20} color={appColors.textMuted} />}
      />
      <InputComponent
        ref={refs.email}
        label="Email"
        value={values.email}
        onChange={val => setValue('email', val)}
        onBlur={() => touch('email')}
        placeholder="ban@email.com"
        type="email-address"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => refs.phoneNumber.current?.focus()}
        error={errorFor('email')}
        prefix={<Sms size={20} color={appColors.textMuted} />}
      />
      <InputComponent
        ref={refs.phoneNumber}
        label="Số điện thoại"
        value={values.phoneNumber}
        onChange={val => setValue('phoneNumber', val.replace(/[^0-9]/g, ''))}
        onBlur={() => touch('phoneNumber')}
        placeholder="0901234567"
        type="phone-pad"
        autoComplete="tel"
        maxLength={12}
        error={errorFor('phoneNumber')}
        prefix={<Call size={20} color={appColors.textMuted} />}
      />

      <View>
        <TextComponent text="Ngày sinh" size={13} font={fontFamilies.medium} styles={styles.label} />
        <TouchableOpacity
          style={[styles.dateField, errorFor('dob') && styles.dateFieldError]}
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Chọn ngày sinh">
          <Calendar size={20} color={appColors.textMuted} />
          <TextComponent
            text={values.dob ? dayjs(values.dob).format('DD/MM/YYYY') : 'Chọn ngày sinh'}
            size={15}
            color={values.dob ? appColors.text : appColors.placeholder}
            styles={styles.dateText}
          />
        </TouchableOpacity>
        {errorFor('dob') ? (
          <TextComponent text={errors.dob} size={12} color={appColors.danger} styles={styles.helper} />
        ) : null}
        {showDatePicker && (
          <View>
            <DateTimePicker
              value={values.dob || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1940, 0, 1)}
              locale="vi-VN"
            />
            {Platform.OS === 'ios' ? (
              <ButtonComponent
                text="Xong"
                type="secondary"
                size="sm"
                onPress={() => {
                  if (!values.dob) {
                    setValue('dob', new Date(2000, 0, 1));
                  }
                  setShowDatePicker(false);
                  touch('dob');
                }}
              />
            ) : null}
          </View>
        )}
      </View>

      <InputComponent
        ref={refs.password}
        label="Mật khẩu"
        value={values.password}
        onChange={val => setValue('password', val)}
        onBlur={() => touch('password')}
        placeholder="Tạo mật khẩu"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => refs.confirmPassword.current?.focus()}
        helperText={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
        error={errorFor('password')}
        prefix={<Lock size={20} color={appColors.textMuted} />}
        isPassword
      />
      <InputComponent
        ref={refs.confirmPassword}
        label="Nhập lại mật khẩu"
        value={values.confirmPassword}
        onChange={val => setValue('confirmPassword', val)}
        onBlur={() => touch('confirmPassword')}
        placeholder="Nhập lại mật khẩu"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleRegister}
        error={errorFor('confirmPassword')}
        prefix={<Lock size={20} color={appColors.textMuted} />}
        isPassword
      />

      <Banner message={formError} />

      <ButtonComponent
        text="Tiếp tục"
        type="primary"
        size="lg"
        onPress={handleRegister}
        isLoading={isLoading}
      />
    </AuthLayout>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  roles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: appColors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  roleCardSelected: {
    borderColor: appColors.primary,
    backgroundColor: appColors.primarySoft,
  },
  roleDescription: {
    marginTop: 4,
    lineHeight: 17,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: appColors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  dateFieldError: {
    borderColor: appColors.danger,
  },
  dateText: {
    marginLeft: spacing.sm,
  },
  helper: {
    marginTop: 4,
  },
});
