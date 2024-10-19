const Booking = require("../models/booking.model");
const User = require("../models/userModel");
const Car = require("../models/Car");
const mailerUtil = require("../utils/mailerSendUtil");
const GuestUser = require("../models/GuestUser");
const mongoose = require("mongoose");
const main = require("../utils/emailService");

// Create a new booking
exports.createBooking = async (req, res) => {
  const {
    name,
    email,
    phone,
    userId,
    carId,
    pickupLocation,
    dropLocation,
    status,
    fare,
    feedback,
    pickupDateTime,
    dropDateTime,
    paymentStatus,
  } = req.body;

  try {
    console.log(req.body)
    let bookingData = {
      carId,
      pickupLocation,
      dropLocation,
      status,
      fare,
      feedback,
      pickupDateTime,
      dropDateTime,
      paymentStatus,
    };

    // Check if guest user information is provided
    if (name && email && phone) {
      console.log(req.body)
      console.log(req.body.guestUserId)
      // Find or create guest user
      if(req.body.guestUserId){
        let guestUser = await GuestUser.findOne({ email });

        if (!guestUser) {
          guestUser = new GuestUser({ name, email, phone });
          await guestUser.save();
        }
  
        // Set guestUserId for the booking
        bookingData.guestUserId = guestUser._id;
      }else{
        bookingData.guestUserId = req.body.guestUserId
      }
     
    } else if (mongoose.Types.ObjectId.isValid(userId)) {
      // Use the provided userId for the booking
      bookingData.userId = userId;
    } else {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Fetch car details
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }
    const carName = car.carName;

    // Create a new booking
    const booking = new Booking(bookingData);
    await sendBookingDetailsEmail(email, name, booking, carName);

    // Send booking details to admin users
    await sendAdminBookingNotification(booking, carName);

    // Save the booking to the database
    await booking.save();

    // Send the response with the created booking
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({
        error:
          "Duplicate key error: A guest user with this phone number already exists.",
      });
    } else {

      res.status(400).json({ error: "Failed to create booking" });
    }
  }
};

// Function to send booking details email to the user
const sendBookingDetailsEmail = async (email, name, booking, carName) => {
  const subject = "Your Booking in Progress";
  const text = `Dear ${name},

Thank you for your booking. Here are the details of your booking:

Booking ID: ${booking._id}
Car: ${carName}
Pickup Location: ${booking.pickupLocation}
Drop Location: ${booking.dropLocation}
Pickup Time: ${booking.pickupDateTime} 
Drop Time: ${booking.dropDateTime}
Status: ${booking.status}
Payment Status: ${booking.paymentStatus}

We will notify you once your booking status is updated.

Best regards,
Express Transportation`;

  const html = `<p>Dear ${name},</p>
                  <p>Thank you for your booking. Here are the details of your booking:</p>
                  <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Car:</strong> ${carName}</li>
                    <li><strong>Pickup Location:</strong> ${booking.pickupLocation}</li>
                    <li><strong>Drop Location:</strong> ${booking.dropLocation}</li>
                    <li><strong>Pickup Time:</strong> ${booking.pickupDateTime}</li>
                    <li><strong>Drop Time:</strong> ${booking.dropDateTime}</li>
                    <li><strong>Status:</strong> ${booking.status}</li>
                    <li><strong>Status:</strong>Payment Status: ${booking.paymentStatus}</li>
                  </ul>
                  <p>We will notify you once your booking status is updated.</p>
                  <p>Best regards,<br/>Express Transportation Inc</p>`;

  try {
    await main(email, subject, text, html);
    console.log("Email sent successfully to the user.");
  } catch (error) {
    console.error(
      "Failed to send email:",
      error.response ? error.response.body : error.message
    );
    throw new Error("Failed to send email");
  }
};

// Function to send booking details to admin users
const sendAdminBookingNotification = async (booking, carName) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: "admin" });

    // Extract admin emails
    const adminEmails = admins.map((admin) => admin.email);

    // Email content
    const subject = "New Booking Created";
    const text = `A new booking has been created. Here are the details:

Booking ID: ${booking._id}
Car: ${carName}
Pickup Location: ${booking.pickupLocation}
Drop Location: ${booking.dropLocation}
Pickup Time: ${booking.pickupDateTime} 
Drop Time: ${booking.dropDateTime}
Status: ${booking.status}
Payment Status: ${booking.paymentStatus}

Please review the booking details in the admin panel.`;

    const html = `<p>A new booking has been created. Here are the details:</p>
                  <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Car:</strong> ${carName}</li>
                    <li><strong>Pickup Location:</strong> ${booking.pickupLocation}</li>
                    <li><strong>Drop Location:</strong> ${booking.dropLocation}</li>
                    <li><strong>Pickup Time:</strong> ${booking.pickupDateTime}</li>
                    <li><strong>Drop Time:</strong> ${booking.dropDateTime}</li>
                    <li><strong>Status:</strong> ${booking.status}</li>
                    <li><strong>Status:</strong>Payment Status: ${booking.paymentStatus}</li>
                  </ul>
                  <p>Please review the booking details in the admin panel.</p>`;

    // Send email to each admin
    for (const email of adminEmails) {
      await main(email, subject, text, html);
    }

    console.log("Notification emails sent to admins successfully.");
  } catch (error) {
    console.error("Failed to send booking notification to admins:", error);
    throw new Error("Failed to notify admins about the booking");
  }
};

// Get booking details by booking ID
exports.getBookingDetails = async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default values if not provided
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name email")
      .populate("guestUserId", "name email phone")
      .populate("carId", "name perKmPrice model")
      .exec();

    if (!booking) {
      return res.status(404).send("Booking not found");
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
      .populate("userId", "name email")
      .populate("guestUserId", "name email phone")
      .populate("carId", "name perKmPrice perDayPrice model")
      .limit(limit * 1) // Limit the number of results per page
      .skip((page - 1) * limit) // Skip results based on the current page
      .exec(); // Execute the query

    const count = await Booking.countDocuments({ userId: req.params.userId });

    if (!bookings.length) {
      return res.status(404).send("No bookings found for this user");
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
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
  } = req.query; // Default values if not provided

  try {
    // Parse and validate page and limit values
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber <= 0) {
      return res.status(400).json({ error: "Invalid page number" });
    }
    if (isNaN(limitNumber) || limitNumber <= 0) {
      return res.status(400).json({ error: "Invalid limit number" });
    }

    // Validate sortBy and order values
    const validSortFields = ["createdAt"];
    const validOrderValues = ["asc", "desc"];

    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({ error: "Invalid sort field" });
    }
    if (!validOrderValues.includes(order)) {
      return res.status(400).json({ error: "Invalid order value" });
    }

    // Retrieve bookings with pagination and sorting
    const bookings = await Booking.find()
      .populate("userId", "name email")
      .populate("guestUserId", "name email phone")
      .populate("carId", "name perKmPrice perDayPrice model carImage")
      .sort({ [sortBy]: order === "asc" ? 1 : -1 }) // Sort results
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
    res.status(400).json({ error: "Failed to retrieve bookings" });
  }
};

// Update booking status by booking ID
exports.updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    // Find and update the booking by ID
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("userId", "name email")
      .populate("guestUserId", "name email phone")
      .populate("carId", "name perKmPrice perDayPrice model carImage")
      .exec();

    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Prepare email content

    // Send the updated booking as the response
    res.json(updatedBooking);

    const user = updatedBooking.userId || updatedBooking.guestUserId;
    const email = user.email;
    const subject = "Booking Status Updated";
    const text = `Dear ${user.name},\n\nYour booking status has been updated to: ${status}.\n\nBest regards,\nYour Company Name`;

    await main(email, subject, text);
  } catch (error) {
    console.log(error);
    console.error("Error updating booking status:", error.message);

    // Only send the response once
    if (!res.headersSent) {
      res.status(400).json({ error: "Failed to update booking status" });
    }
  }
};

// Get bookings by pickup date
exports.getBookingsByPickupDate = async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Date is required" });
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
      .populate("userId", "name email")
      .populate("guestUserId", "name email phone")
      .populate("carId", "name perKmPrice perDayPrice model carImage")
      .exec();

    if (!bookings.length) {
      return res
        .status(404)
        .json({ message: "No bookings found for the specified date" });
    }

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings by pickup date:", error.message);
    res.status(400).json({ error: "Failed to retrieve bookings" });
  }
};
