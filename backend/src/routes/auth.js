const express = require('express');
const router = express.Router();
const {
  login, register, refresh, logout, getMe,
  setup2FA, verify2FA, disable2FA,
  changePassword, updateProfile,
  forgotPasswordEmail, forgotPasswordMobile, verifyOTP, resetPassword
} = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, login);
router.post('/register', register);
router.post('/refresh', refresh);
router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, getMe);
router.post('/2fa/setup', authenticateJWT, setup2FA);
router.post('/2fa/verify', authenticateJWT, verify2FA);
router.post('/2fa/disable', authenticateJWT, disable2FA);
router.post('/change-password', authenticateJWT, changePassword);
router.put('/profile', authenticateJWT, updateProfile);

router.post('/forgot-password/email', otpLimiter, forgotPasswordEmail);
router.post('/forgot-password/mobile', otpLimiter, forgotPasswordMobile);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
