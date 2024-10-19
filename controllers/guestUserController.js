// controllers/guestUserController.js
const GuestUser = require('../models/GuestUser'); // Adjust the path as necessary

// Controller to create a new guest user
exports.createGuestUser = async (req, res) => {
  try {
    const { email, phone, name } = req.body;

    // Create a new guest user
    const guestUser = new GuestUser({ email, phone, name });
    
    // Save the guest user to the database
    await guestUser.save();

    return res.status(201).json({ message: 'Guest user created successfully', guestUser });
  } catch (error) {
    // Handle validation errors or other errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};
