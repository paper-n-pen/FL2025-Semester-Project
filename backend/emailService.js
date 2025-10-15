const nodemailer = require('nodemailer');

// Create transporter (using Gmail for demo - in production use proper SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Password reset tokens storage (in production, use Redis or database)
const resetTokens = new Map();

const generateResetToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: email,
    subject: 'MicroTutor - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a; text-align: center;">MicroTutor</h2>
        <h3 style="color: #374151;">Password Reset Request</h3>
        <p>You requested to reset your password for your MicroTutor account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in 1 hour for security reasons.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          If you didn't request this password reset, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const storeResetToken = (email, token) => {
  resetTokens.set(token, {
    email,
    timestamp: Date.now(),
    used: false
  });
};

const validateResetToken = (token) => {
  const tokenData = resetTokens.get(token);
  if (!tokenData) return false;
  
  // Check if token is expired (1 hour)
  const isExpired = Date.now() - tokenData.timestamp > 3600000; // 1 hour in milliseconds
  if (isExpired) {
    resetTokens.delete(token);
    return false;
  }
  
  return !tokenData.used;
};

const markTokenAsUsed = (token) => {
  const tokenData = resetTokens.get(token);
  if (tokenData) {
    tokenData.used = true;
  }
};

const getEmailFromToken = (token) => {
  const tokenData = resetTokens.get(token);
  return tokenData ? tokenData.email : null;
};

module.exports = {
  sendPasswordResetEmail,
  storeResetToken,
  validateResetToken,
  markTokenAsUsed,
  getEmailFromToken,
  generateResetToken
};
