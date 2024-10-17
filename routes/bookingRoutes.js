const express = require('express');
const bookingController = require('../controllers/booking.controller');
const router = express.Router();

router.post('/bookings',  bookingController.createBooking);
router.get('/bookings',  bookingController.getAllBookings);
router.get('/getUserBookings',  bookingController.getBookingsByUserId);
router.put('/bookings/status/:id',  bookingController.updateBookingStatus);
router.get('/by-pickup-date', bookingController.getBookingsByPickupDate);

module.exports = router;