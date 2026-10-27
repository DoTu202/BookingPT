import {getErrorMessage, translateServerMessage} from '../src/utils/errorMessage';

describe('translateServerMessage', () => {
  it('translates known server messages', () => {
    expect(translateServerMessage('Invalid email or password')).toBe(
      'Email hoặc mật khẩu không đúng.',
    );
    expect(translateServerMessage('Time slot is no longer available.')).toMatch(/vừa có người đặt/);
  });

  it('translates templated messages', () => {
    expect(translateServerMessage('Password must be 8-72 characters long.')).toBe(
      'Mật khẩu phải dài 8–72 ký tự.',
    );
    expect(
      translateServerMessage(
        "Cannot cancel this booking because it's too close to the appointment time (must cancel at least 24 hours before).",
      ),
    ).toMatch(/ít nhất 24 giờ/);
  });

  it('passes unknown messages through unchanged', () => {
    expect(translateServerMessage('Something new')).toBe('Something new');
    expect(translateServerMessage(undefined)).toBeUndefined();
  });
});

describe('getErrorMessage', () => {
  it('hides raw server errors behind a friendly 5xx message', () => {
    expect(getErrorMessage({status: 500, message: 'boom'})).toMatch(/Máy chủ/);
  });

  it('uses the fallback when there is no message', () => {
    expect(getErrorMessage(null, 'Fallback')).toBe('Fallback');
  });
});
