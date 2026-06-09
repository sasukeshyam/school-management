const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    await transporter.sendMail({
      from: `School Management <${process.env.EMAIL_FROM}>`,
      to, subject, html, text,
    });
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error('Email send failed:', err);
    throw err;
  }
};

const welcomeEmail = (to, name, password) => sendEmail({
  to, subject: 'Welcome to School Management System',
  html: `<h2>Welcome, ${name}!</h2><p>Your account has been created.</p><p>Email: ${to}<br>Password: ${password}</p><p>Please change your password after login.</p>`,
});

const resetPasswordEmail = (to, resetUrl) => sendEmail({
  to, subject: 'Password Reset Request',
  html: `<h2>Password Reset</h2><p>Click the link below to reset your password. Valid for 10 minutes.</p><a href="${resetUrl}">${resetUrl}</a>`,
});

const admitCardEmail = (to, name, examTitle) => sendEmail({
  to, subject: `Admit Card Available - ${examTitle}`,
  html: `<h2>Dear ${name},</h2><p>Your admit card for <strong>${examTitle}</strong> is now available. Please login to download it.</p>`,
});

const feeReceiptEmail = (to, name, amount, receiptNo) => sendEmail({
  to, subject: 'Fee Payment Receipt',
  html: `<h2>Payment Confirmed</h2><p>Dear ${name},</p><p>Your payment of <strong>${amount}</strong> has been received.<br>Receipt No: <strong>${receiptNo}</strong></p>`,
});

module.exports = { sendEmail, welcomeEmail, resetPasswordEmail, admitCardEmail, feeReceiptEmail };
