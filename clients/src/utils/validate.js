// Keep in sync with the server rules in server/src/utils/validators.js
export const MIN_PASSWORD_LENGTH = 8;

export class Validate {
  static email(mail) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail);
  }

  static password = val => val.length >= MIN_PASSWORD_LENGTH;

  static phone = val => /^\d{9,12}$/.test(val);
}

// Returns a Vietnamese error message for one sign-up field ('' when valid).
export const validateSignUpField = (key, values) => {
  const value = values[key];
  switch (key) {
    case 'username':
      return value.trim().length < 2 ? 'Tên cần ít nhất 2 ký tự' : '';
    case 'email':
      if (!value.trim()) {
        return 'Vui lòng nhập email';
      }
      return Validate.email(value.trim()) ? '' : 'Email không hợp lệ';
    case 'phoneNumber':
      return Validate.phone(value) ? '' : 'Số điện thoại gồm 9–12 chữ số';
    case 'dob':
      return value ? '' : 'Vui lòng chọn ngày sinh';
    case 'password':
      return Validate.password(value) ? '' : `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự`;
    case 'confirmPassword':
      if (!value) {
        return 'Vui lòng nhập lại mật khẩu';
      }
      return value === values.password ? '' : 'Mật khẩu xác nhận không khớp';
    default:
      return '';
  }
};
