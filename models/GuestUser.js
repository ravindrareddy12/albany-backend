const mongoose = require('mongoose');

const guestUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true, 
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
  },
  phone: {
    type: String,
    required: true,
    match: [/^\d{10}$/, 'Please use a valid phone number.'],
  },
  name: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const GuestUser = mongoose.model('GuestUser', guestUserSchema);

module.exports = GuestUser;
