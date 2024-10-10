const express = require('express');
const { verifyOtpPassword,registerUser, authUser,googleAuthUser,updateUser, verifyRegisterUser, googleResterationUser,sendPasswordResetOtp, resetPassword } = require('../controllers/userController');
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const router = express.Router();
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

router.post('/register', registerUser);
router.post('/verify-register', verifyRegisterUser);
router.post('/login', authUser);
router.post('/google-login', googleAuthUser);
router.post('/google-Registration', googleResterationUser);
router.post('/google-register', registerUser);
router.post('/update', updateUser);
router.post('/password-reset/verify-otp', verifyOtpPassword);

router.post('/forgot-password/send-otp', sendPasswordResetOtp);

// Route to verify OTP and reset password
router.post('/reset-password', resetPassword);

router.get('/me', async (req, res) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).select('-password');
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no session' });
  }
});

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ message: 'Logout successful' });
});



  
module.exports = router;
