const Otp = require('../models/OtpModel');
const crypto = require('crypto');
const User = require('../models/userModel');
const main = require('../utils/emailService');

// Generate OTP and send email
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).json({ errmessage: 'Email already exists. Please login.' });
    }
    // Check if an OTP already exists
    const existingOtp = await Otp.findOne({ email, expiresAt: { $gt: Date.now() } });

    if (existingOtp) {
      return res.status(200).json({ otpvalid: 'An OTP is already active for this email.' });
    }

    // Generate new OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save OTP in the database
    await new Otp({ email, otpCode, expiresAt }).save();

    // Send OTP email
    const subject = 'Your OTP Code';
    const text = `Your OTP code is ${otpCode}. It will expire in 15 minutes.`;
    const html = `<p>Your OTP code is <strong>${otpCode}</strong>. It will expire in 15 minutes.</p>`;
    
    await main(email, subject, text, html);

    res.status(200).json({ success: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, otpCode } = req.body;
  try {
    // console.log(email,otp)
    const otpCodeVerify = await Otp.findOne({ email,otpCode,expiresAt: { $gt: Date.now() }  });
    console.log(otpCodeVerify)

    if (otpCodeVerify) {
      await Otp.deleteMany({ email }); // Remove used OTPs
      res.status(200).json({ success: 'OTP verified successfully!' });
    } else {
      res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
