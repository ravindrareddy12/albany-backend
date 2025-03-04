const mongoose = require('mongoose');

const ContactFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  subject: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('ContactForm', ContactFormSchema);
