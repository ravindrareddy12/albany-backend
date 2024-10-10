const express = require('express');
const router = express.Router();
const { submitContactForm, getAllContactForms } = require('../controllers/contactFormController');

// POST route for submitting the contact form
router.post('/contact', submitContactForm);

// GET route for fetching all contact forms
router.get('/contact', getAllContactForms);

module.exports = router;
