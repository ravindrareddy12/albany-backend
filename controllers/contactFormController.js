const ContactForm = require('../models/ContactFormModel');
const main = require('../utils/emailService');
const User = require("../models/userModel");

// POST: Save contact form data and notify admin users
exports.submitContactForm = async (req, res) => {
  try {
    const { name, company, email, phone, message, subject } = req.body;

    const newContactForm = new ContactForm({
      name,
      company,
      email,
      phone,
      message,
      subject
    });

    await newContactForm.save();

    // Fetch all admin users
    const adminUsers = await User.find({ role: 'admin' });

    // Styled email content
    const text = `You have received a new inquiry:\n\nName: ${name}\nCompany: ${company}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="background-color: #4CAF50; color: #fff; padding: 10px; text-align: center;">
          New Inquiry Received
        </h2>
        <p style="font-size: 16px;">You have received a new inquiry with the following details:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #f2f2f2;">
            <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">Name:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">Company:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${company}</td>
          </tr>
          <tr style="background-color: #f2f2f2;">
            <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">Email:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">Phone:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${phone}</td>
          </tr>
          <tr style="background-color: #f2f2f2;">
            <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">Message:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${message}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 14px; color: #555;">Please reply to this email for further inquiries or follow-up.</p>
      </div>
    `;

    // Send an email to each admin
    for (const admin of adminUsers) {
      await main(admin.email, subject, text, html);
    }

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
