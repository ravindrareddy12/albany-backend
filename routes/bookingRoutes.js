const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { isAuthenticated, isAdmin, isUser } = require('../middleware/authChecker'); 
const router = express.Router();

router.post('/bookings',  bookingController.createBooking);
router.get('/bookings', isAdmin, bookingController.getAllBookings);
router.get('/getUserBookings/:userId',isAuthenticated,  bookingController.getBookingsByUserId);
router.put('/bookings/status/:id',isAdmin,  bookingController.updateBookingStatus);
router.get('/by-pickup-date', bookingController.getBookingsByPickupDate);
 
module.exports = router;