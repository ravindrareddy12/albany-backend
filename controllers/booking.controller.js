const Booking = require('../models/booking.model');
const User = require('../models/userModel');
const Car = require('../models/Car');
const mailerUtil = require('../utils/mailerSendUtil');
const GuestUser = require('../models/GuestUser');
const mongoose = require('mongoose');
const main = require('../utils/emailService');
// Create a new booking
exports.createBooking = async (req, res) => {
    const { name, email, phone, userId, carId, pickupLocation, dropLocation, status, fare, feedback,pickupDateTime,dropDateTime } = req.body;

    try {
        let bookingData = {
            carId,
            pickupLocation,
            dropLocation,
            status,
            fare,
            feedback,
            pickupDateTime,
            dropDateTime

        };

        // Check if guest user information is provided
        if (name && email && phone) {
            // Find or create guest user
            let guestUser = await GuestUser.findOne({ email });

            if (!guestUser) {
                guestUser = new GuestUser({ name, email, phone });
                await guestUser.save();
            }

            // Set guestUserId for the booking
            bookingData.guestUserId = guestUser._id;
        } else if (mongoose.Types.ObjectId.isValid(userId)) {
            // Use the provided userId for the booking
            bookingData.userId = userId;
        } else {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        
        

        // Create a new booking
        const booking = new Booking(bookingData);
         console.log(booking)
        // await sendBookingDetailsEmail(email,name,booking)

        // Save the booking to the database
        await booking.save();

        // Send the response with the created booking
        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            res.status(400).json({ error: 'Duplicate key error: A guest user with this phone number already exists.' });
        } else {
            res.status(400).json({ error: 'Failed to create booking' });
        }
    }
};


const sendBookingDetailsEmail = async (email, name, booking) => {
    console.log(booking)
    const subject = 'Your Booking on Progress';
    const text = `Dear ${name},

Thank you for your booking. Here are the details of your booking:

Booking ID: ${booking._id}
Car ID: ${booking.carId}
Pickup Location: ${booking.pickupLocation}
Drop Location: ${booking.dropLocation}
Pickup Time: ${booking.pickupDateTime}
Drop Time: ${booking.dropDateTime}
Status: ${booking.status}

We will notify you once your booking status is updated.

Best regards,
ZS Transist Inc`;

    const html = `<p>Dear ${name},</p>
                  <p>Thank you for your booking. Here are the details of your booking:</p>
                  <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Car ID:</strong> ${booking.carId}</li>
                    <li><strong>Pickup Location:</strong> ${booking.pickupLocation}</li>
                    <li><strong>Drop Location:</strong> ${booking.dropLocation}</li>
                    <li><strong>Pickup Time:</strong> ${booking.pickupDateTime}</li>
                    <li><strong>Drop Time:</strong> ${booking.dropDateTime}</li>
                    <li><strong>Status:</strong> ${booking.status}</li>
                  </ul>
                  <p>We will notify you once your booking status is updated.</p>
                  <p>Best regards,<br/>ZS Transist Inc</p>`;

    try {

        await main(email,subject,text,html);
        console.log('Email sent successfully.');
    } catch (error) {
        console.error('Failed to send email:', error.response ? error.response.body : error.message);
        throw new Error('Failed to send email');
    }
};


// Get booking details by booking ID
exports.getBookingDetails = async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Default values if not provided
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('guestUserId', 'name email phone')
            .populate('carId', 'name perKmPrice model')
            .exec();

        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        res.send(booking);
    } catch (error) {
        res.status(400).send(error);
    }
};

// Get bookings by user ID with pagination
exports.getBookingsByUserId = async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Default values if not provided

    try {
        const bookings = await Booking.find({ userId: req.params.userId })
            .populate('userId', 'name email')
            .populate('guestUserId', 'name email phone')
            .populate('carId', 'name perKmPrice perDayPrice model')
            .limit(limit * 1) // Limit the number of results per page
            .skip((page - 1) * limit) // Skip results based on the current page
            .exec(); // Execute the query

        const count = await Booking.countDocuments({ userId: req.params.userId });

        if (!bookings.length) {
            return res.status(404).send('No bookings found for this user');
        }

        res.send({
            bookings,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        res.status(400).send(error);
    }
};


// Get all bookings with pagination
exports.getAllBookings = async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query; // Default values if not provided

    try {
        // Parse and validate page and limit values
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        if (isNaN(pageNumber) || pageNumber <= 0) {
            return res.status(400).json({ error: 'Invalid page number' });
        }
        if (isNaN(limitNumber) || limitNumber <= 0) {
            return res.status(400).json({ error: 'Invalid limit number' });
        }

        // Validate sortBy and order values
        const validSortFields = ['createdAt'];
        const validOrderValues = ['asc', 'desc'];

        if (!validSortFields.includes(sortBy)) {
            return res.status(400).json({ error: 'Invalid sort field' });
        }
        if (!validOrderValues.includes(order)) {
            return res.status(400).json({ error: 'Invalid order value' });
        }

        // Retrieve bookings with pagination and sorting
        const bookings = await Booking.find()
            .populate('userId', 'name email')
            .populate('guestUserId', 'name email phone')
            .populate('carId', 'name perKmPrice perDayPrice model carImage')
            .sort({ [sortBy]: order === 'asc' ? 1 : -1 }) // Sort results
            .limit(limitNumber) // Limit the number of results per page
            .skip((pageNumber - 1) * limitNumber) // Skip results based on the current page
            .exec();

        // Count total bookings for pagination calculation
        const count = await Booking.countDocuments();

        res.send({
            bookings,
            totalPages: Math.ceil(count / limitNumber),
            currentPage: pageNumber,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to retrieve bookings' });
    }
};



// Update booking status by booking ID
exports.updateBookingStatus = async (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    try {
        // Find and update the booking by ID
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )
        .populate('userId', 'name email')
        .populate('guestUserId', 'name email phone')
        .populate('carId', 'name perKmPrice perDayPrice model carImage')
        .exec();

        if (!updatedBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Prepare email content
        

        // Send the updated booking as the response
        res.json(updatedBooking);

        const user = updatedBooking.userId || updatedBooking.guestUserId;
        const email = user.email;
        const subject = 'Booking Status Updated';
        const text = `Dear ${user.name},\n\nYour booking status has been updated to: ${status}.\n\nBest regards,\nYour Company Name`;

        await main(email,subject,text);
    } catch (error) {
        console.log(error)
        console.error('Error updating booking status:', error.message);
        
        // Only send the response once
        if (!res.headersSent) {
            res.status(400).json({ error: 'Failed to update booking status' });
        }
    }
};

// Get bookings by pickup date
exports.getBookingsByPickupDate = async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    try {
        // Create a start and end time for the specified date
        const startOfDay = new Date(date).setHours(0, 0, 0, 0);
        const endOfDay = new Date(date).setHours(23, 59, 59, 999);

        // Find bookings with pickupDateTime within the specified date range
        const bookings = await Booking.find({
            pickupDateTime: {
                $gte: new Date(startOfDay),
                $lte: new Date(endOfDay),
            },
        })
            .populate('userId', 'name email')
            .populate('guestUserId', 'name email phone')
            .populate('carId', 'name perKmPrice perDayPrice model carImage')
            .exec();

        if (!bookings.length) {
            return res.status(404).json({ message: 'No bookings found for the specified date' });
        }

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings by pickup date:', error.message);
        res.status(400).json({ error: 'Failed to retrieve bookings' });
    }
};

