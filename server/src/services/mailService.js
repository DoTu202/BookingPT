const nodemailer = require('nodemailer');
const {isTest, MAIL_USER, MAIL_PASSWORD, MAIL_FROM} = require('../configs/env');

// In tests (or when SMTP is not configured) emails are rendered to JSON
// instead of being sent, so the app still runs end to end.
const transporter =
  isTest || !MAIL_USER || !MAIL_PASSWORD
    ? nodemailer.createTransport({jsonTransport: true})
    : nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {user: MAIL_USER, pass: MAIL_PASSWORD},
      });

const sendMail = ({to, subject, text, html}) =>
  transporter.sendMail({
    from: MAIL_FROM || `BookingPT Support <${MAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });

const sendOtpMail = (to, code, purpose) => {
  const action = {
    reset_password: 'reset your password',
    change_email: 'confirm your new email address',
  }[purpose] || 'verify your email';
  return sendMail({
    to,
    subject: `Your BookingPT code: ${code}`,
    text: `Use this code to ${action}: ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`,
    html: `<p>Use this code to ${action}:</p><h1>${code}</h1><p>It expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
  });
};

module.exports = {sendOtpMail};
