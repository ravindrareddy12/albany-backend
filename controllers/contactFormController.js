const ContactForm = require('../models/ContactFormModel');
const main = require('../utils/emailService');
// POST: Save contact form data
exports.submitContactForm = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    const newContactForm = new ContactForm({
      firstName,
      lastName,
      email,
      phone,
      message,
    });

    await newContactForm.save();
    await main(email,subject,text,html);
    res.status(201).json({ message: 'Contact form submitted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while submitting the form.' });
  }
};

// GET: Fetch all contact form submissions
exports.getAllContactForms = async (req, res) => {
  try {
    const contactForms = await ContactForm.find();
    res.status(200).json(contactForms);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving contact forms.' });
  }
};
