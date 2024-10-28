const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const jwtDecode = require('jwt-decode')
const Otp = require('../models/OtpModel');
const crypto = require('crypto');
const main = require('../utils/emailService');

const registerUser = async (req, res) => {
  const {  email } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(202).json({ errmessage: 'User already exists. Please login' });
    }

    const existingOtp = await Otp.findOne({ email, expiresAt: { $gt: Date.now() } });

    if (existingOtp) {
      return res.status(200).json({ otpvalid: 'An OTP is already active for this email.' });
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await new Otp({ email, otpCode, expiresAt }).save();

    const subject = 'Your OTP Code';
    const text = `Your OTP code is ${otpCode}. It will expire in 15 minutes.`;
    const html = `<p>Your OTP code is <strong>${otpCode}</strong>. It will expire in 15 minutes.</p>`;
    
    await main(email, subject, text, html);
    return res.status(200).json({ message: 'Otp Sent Sucessfully' });
   
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const verifyRegisterUser = async (req, res) => {
  const { name, email, password, phoneNumber, profilePicture, role,otpCode } = req.body;

  try {
    const otpCodeVerify = await Otp.findOne({ email,otpCode,expiresAt: { $gt: Date.now() }  });

    if (otpCodeVerify) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        profilePicture,
        role,
      });
  
      await user.save();
  
  
      const token = generateToken(user);
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'Strict', // Adjust based on your needs (Lax, Strict, None)
        maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
      });
  
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
      });
    }
    else {
      res.status(200).json({errmessage: 'Invalid or expired OTP.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const googleResterationUser = async (req, res) => {
  const { name, email, password, phoneNumber, profilePicture, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(202).json({ message: 'User already exists. Please login' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      profilePicture,
      role,
    });

    await user.save();


    const token = generateToken(user);
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'Strict', // Adjust based on your needs (Lax, Strict, None)
      maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




const googleRegisterUser = async (req, res) => {
  const { name, email, password, phoneNumber, profilePicture,role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      profilePicture,
      role
    });

    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Authenticate a user and get token
const googleAuthUser = async (req, res) => {
  const { authKey } = req.body;

  try {
    const decoded = jwtDecode.jwtDecode(authKey);
    console.log(decoded)
    let email = decoded.email

    const user = await User.findOne({ email });

    const token = generateToken(user);
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'Strict', // Adjust based on your needs (Lax, Strict, None)
      maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
    });

    if(user){
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        role:user.role
      })
    }else{
      res.status(500).json({ message: 'User NOT Registered. Please Register to proceed' });
    }
      
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const authUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = generateToken(user);
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Set secure flag in production
      sameSite: 'Strict',
    });
    res.json({ user });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

const updateUser = async (req, res) => {
  const { name, email, phoneNumber, profilePicture, role } = req.body;
  const userId = req.body._id; // Assuming user ID is available in req.user from authentication middleware

  try {
    // Find the user by ID and update the fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, phoneNumber, profilePicture, role },
      { new: true, runValidators: true } // Return the updated document and run validators
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      profilePicture: updatedUser.profilePicture,
      role: updatedUser.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const sendPasswordResetOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ otpvalid: 'User not found' });
    }

    const existingOtp = await Otp.findOne({ email, expiresAt: { $gt: Date.now() } });

    if (existingOtp) {
      return res.status(200).json({ otpvalid: 'An OTP is already active for this email.' });
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await new Otp({ email, otpCode, expiresAt }).save();

    const subject = 'Your Password Reset OTP';
    const text = `Your OTP code is ${otpCode}. It will expire in 15 minutes.`;
    const html = `<p>Your OTP code is <strong>${otpCode}</strong>. It will expire in 15 minutes.</p>`;
    
    await main(email, subject, text, html);
    return res.status(200).json({ message: 'OTP sent successfully' });
   
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.updateOne({ email }, { password: hashedPassword });

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const verifyOtpPassword = async (req, res) => {
  const { email, otpCode } = req.body;

  try {
    const otpCodeVerify = await Otp.findOne({ email, otpCode, expiresAt: { $gt: Date.now() } });

    if (!otpCodeVerify) {
      return res.status(200).json({ errmessage: 'Invalid or expired OTP' });
    }

    // Optionally, flag the OTP as verified or delete it if you want to restrict OTP usage to just one attempt
    await Otp.deleteOne({ email, otpCode }); // Optionally remove OTP after verification

    return res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



module.exports = { verifyOtpPassword,registerUser, authUser ,googleAuthUser,updateUser,verifyRegisterUser,googleResterationUser,sendPasswordResetOtp, resetPassword};
