const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { isAuthenticated, isAdmin, isUser } = require('../middleware/authChecker'); 
const router = express.Router();

router.post('/bookings',  bookingController.createBooking);
router.put('/bookings/:id',  bookingController.updateBooking);
router.get('/bookings', isAdmin, bookingController.getAllBookings);
router.get('/getUserBookings/:userId',isAuthenticated,  bookingController.getBookingsByUserId);
router.put('/bookings/status/:id',isAdmin,  bookingController.updateBookingStatus);
router.get('/by-pickup-date', bookingController.getBookingsByPickupDate);
router.put('/bookings/delete/:bookingId', bookingController.adminDeleteBooking);
router.delete('/booking/permanent-delete/:id', bookingController.permanentlyDeleteBooking);
module.exports = router;