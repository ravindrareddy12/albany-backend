// routes/guestUserRoutes.js
const express = require('express');
const router = express.Router();
const guestUserController = require('../controllers/guestUserController');

// Route to create a new guest user
router.post('/guest-user-creation', guestUserController.createGuestUser);

module.exports = router;
