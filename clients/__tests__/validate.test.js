import {Validate, MIN_PASSWORD_LENGTH} from '../src/utils/validate';

describe('Validate', () => {
  it.each(['user@example.com', 'first.last+tag@sub.domain.vn'])(
    'accepts %s',
    email => expect(Validate.email(email)).toBe(true),
  );

  it.each(['', 'no-at-sign', 'a@b', 'a b@example.com'])('rejects "%s"', email =>
    expect(Validate.email(email)).toBe(false),
  );

  it('requires the same minimum password length as the server', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(Validate.password('1234567')).toBe(false);
    expect(Validate.password('12345678')).toBe(true);
  });
});
