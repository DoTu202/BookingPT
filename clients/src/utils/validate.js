// Keep in sync with the server rules in server/src/controllers/authController.js
export const MIN_PASSWORD_LENGTH = 8;

export class Validate {
  static email(mail) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail);
  }

  static password = val => val.length >= MIN_PASSWORD_LENGTH;
}
