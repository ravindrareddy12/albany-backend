const express = require('express');
const router = express.Router();
const NewsletterController = require('../controllers/NewsletterController');

// POST - Subscribe to newsletter
router.post('/newsletter/subscribe', NewsletterController.subscribe);

module.exports = router;
