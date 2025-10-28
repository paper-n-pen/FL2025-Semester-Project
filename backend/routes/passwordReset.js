const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { 
  sendPasswordResetEmail, 
  storeResetToken, 
  validateResetToken, 
  markTokenAsUsed, 
  getResetTokenUser,
  generateResetToken 
} = require('../emailService');
const { findUserByEmail, updateUserPasswordById } = require('../storage');

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    
    // Store token
    await storeResetToken(user.id, resetToken);
    
    // Send email
    const emailSent = await sendPasswordResetEmail(email, resetToken);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Validate token
    if (!(await validateResetToken(token))) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Get user from token
    const tokenUser = await getResetTokenUser(token);
    if (!tokenUser) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    const success = await updateUserPasswordById(tokenUser.id, hashedPassword);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    // Mark token as used
    await markTokenAsUsed(token);

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify reset token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const isValid = await validateResetToken(token);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    res.json({ valid: true, message: 'Token is valid' });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
