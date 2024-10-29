const Booking = require("../models/booking.model");
const User = require("../models/userModel");
const Car = require("../models/Car");
const mailerUtil = require("../utils/mailerSendUtil");
const GuestUser = require("../models/GuestUser");
const mongoose = require("mongoose");
const main = require("../utils/emailService");

// Create a new booking
exports.createBooking = async (req, res) => {
  console.log("enterd");
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
    guestUserId,
    distance,
    duration
  } = req.body;

  let guestUser;
  try {
    console.log(req.body);
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
      distance,
      duration
    };

    // Check if guest user information is provided
    if (name && email && phone) {
      if (guestUserId) {
        // If guestUserId is provided, find the guest user
        guestUser = await GuestUser.findById(guestUserId);
        if (!guestUser) {
          return res.status(404).json({ error: "Guest user not found" });
        }
      } else {
        // Otherwise, find or create a guest user by email
        guestUser = await GuestUser.findOne({ email });
        if (!guestUser) {
          guestUser = new GuestUser({ name, email, phone });
          await guestUser.save();
        }
      }

      // Set guestUserId for the booking
      bookingData.guestUserId = guestUser._id;
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

    // Send booking details to the guest user (if email exists)

    await sendBookingDetailsEmail(
      guestUser.email,
      name,
      booking,
      carName,
      guestUser,
      car.passengers
    );

    // Send booking details to admin users
    await sendAdminBookingNotification(booking, carName, guestUser);

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
// const sendBookingDetailsEmail = async (email, name, booking, carName, user) => {
//   const subject = "Your Booking in Progress";
//   const text = `Dear ${name},

// Thank you for your booking. Here are the details of your booking:

// Booking ID: ${booking._id}
// Car: ${carName}
// Pickup Location: ${booking.pickupLocation}
// Drop Location: ${booking.dropLocation}
// Pickup Time: ${booking.pickupDateTime}
// Drop Time: ${booking.dropDateTime}
// Status: ${booking.status}
// Payment Status: ${booking.paymentStatus}

// We will notify you once your booking status is updated.

// Best regards,
// Express Transportation`;

//   const html = `
//     <div style="font-family: Arial, sans-serif; color: #333;">
//       <h2 style="color: #1E90FF;">Booking Confirmation</h2>
//       <p>Dear ${name},</p>
//       <p>Thank you for your booking. Here are the details:</p>

//       <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
//         <tr>
//           <td colspan="2" style="border-bottom: 2px solid #ddd; padding-bottom: 8px;"><strong>General</strong></td>
//         </tr>
//         <tr>
//           <td style="padding: 8px; width: 30%; color: #555;">Booking ID:</td>
//           <td style="padding: 8px;">${booking._id}</td>
//         </tr>
//         <tr>
//           <td style="padding: 8px; color: #555;">Status:</td>
//           <td style="padding: 8px;">${booking.status}</td>
//         </tr>
//         <tr>
//           <td style="padding: 8px; color: #555;">Order Total Amount:</td>
//           <td style="padding: 8px;">$${booking.fare}</td>
//         </tr>
//       </table>

//       <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
//         <tr>
//           <td colspan="2" style="border-bottom: 2px solid #ddd; padding-bottom: 8px;"><strong>Route Locations</strong></td>
//         </tr>
//         <tr>
//           <td style="padding: 8px; color: #555;">Pickup Location:</td>
//           <td style="padding: 8px;">${booking.pickupLocation}</td>
//         </tr>
//         <tr>
//           <td style="padding: 8px; color: #555;">Drop Location:</td>
//           <td style="padding: 8px;">${booking.dropLocation}</td>
//         </tr>
//       </table>

//       <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
//         <tr>
//           <td colspan="2" style="border-bottom: 2px solid #ddd; padding-bottom: 8px;"><strong>Vehicle</strong></td>
//         </tr>
//         <tr>
//           <td style="padding: 8px; color: #555;">Car:</td>
//           <td style="padding: 8px;">${carName}</td>
//         </tr>
//         <tr>

//       </table>

//       <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
//         <tr>
//           <td colspan="2" style="border-bottom: 2px solid #ddd; padding-bottom: 8px;"><strong>Client Details</strong></td>
//         </tr>
//         <tr>
//           <td style="padding: 8px; color: #555;">Name:</td>
//           <td style="padding: 8px;">${name}</td>
//         </tr>
//         <tr>
//           <td style="padding: 8px; color: #555;">Email:</td>
//           <td style="padding: 8px;">${user.email}</td>
//         </tr>
//         <tr>
//           <td style="padding: 8px; color: #555;">Phone:</td>
//           <td style="padding: 8px;">${user.phone}</td>
//         </tr>
//       </table>

//       <p>We will notify you once your booking status is updated.</p>
//       <p>Best regards,<br/>Express Transportation Inc</p>
//     </div>`;

//   try {
//     await main(email, subject, text, html);
//     console.log("Email sent successfully to the user.");
//   } catch (error) {
//     console.error(
//       "Failed to send email:",
//       error.response ? error.response.body : error.message
//     );
//     throw new Error("Failed to send email");
//   }
// };

const sendBookingDetailsEmail = async (
  email,
  name,
  booking,
  carName,
  user,
  passengers
) => {
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

const html = `
<div style="width: 100%; max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border: 1px solid #e0e0e0; font-family: Times New Roman, Times, serif; color: #333;">
    <h2 style="font-size: 18px; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">General</h2>
    <div style="padding: 10px 0;">
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;"> Reservation Number </span>
            <span><a href="#" style="color: #007bff; text-decoration: none;">${
              booking._id.toString().slice(-5)
            }</a></span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Booking form name</span>
            <span>Booking form</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Status</span>
            <span>${booking.status}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Service type</span>
            <span>Distance</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Distance</span>
            <span>${booking.distance} Miles</span>
        </div>
         <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Duration</span>
            <span>${booking.duration}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Transfer type</span>
            <span>One Way</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Pickup date and time</span>
            <span>${booking.pickupDateTime}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Order total amount</span>
            <span>$${booking.fare}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Comment</span>
            <span>NA</span>
        </div>
    </div>

    <h2 style="font-size: 18px; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Route Locations</h2>
    <div style="padding: 10px 0;">
    ${[booking.pickupLocation, booking.dropLocation]
      .map(
        (location, index) => `
      <div style="display: flex; font-size: 14px;">
          <span style="color: #666; font-weight: bold;">
            ${
              index + 1
            }. <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          location
        )}" 
            target="_blank" style="color: #007bff;margin-left: 5px;">
              ${location}
            </a>
          </span>
      </div>
  `
      )
      .join("")}
</div>

    <h2 style="font-size: 18px; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Vehicle</h2>
    <div style="padding: 10px 0;">
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Vehicle name</span>
            <span>${carName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Bag count</span>
            <span>1</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Passengers count</span>
            <span>${passengers}</span>
        </div>
    </div>

    <h2 style="font-size: 18px; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Client Details</h2>
    <div style="padding: 10px 0;">
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Name</span>
            <span>${user.name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Email ID  </span>
            <span><a href="mailto:${
              user.email
            }" style="color: #007bff;">${
    user.email
  }</a></span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Contact Number</span>
            <span><a href="tel:${
              user.phone
            }" style="color: #007bff;">${
    user.phone
  }</a></span>
        </div>
    </div>

    <h2 style="font-size: 18px; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Payment</h2>
    <div style="padding: 10px 0;">
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Payment</span>
            <span>${booking.paymentStatus}</span>
        </div>
    </div>
</div>
`;


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
const sendAdminBookingNotification = async (booking, carName, guestUser) => {
  console.log(guestUser);
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
        Status: ${booking.status}
        Payment Status: ${booking.paymentStatus}

        Guest Details:
        Name: ${guestUser.name}
        Email: ${guestUser.email}
        Phone: ${guestUser.phone}

        Please review the booking details in the admin panel.`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #DC143C;">New Booking Notification</h2>
        <p>A new booking has been created. Here are the details:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td colspan="2" style="border-bottom: 2px solid #ddd; padding-bottom: 8px;"><strong>Booking Details</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px; width: 30%; color: #555;">Booking ID:</td>
            <td style="padding: 8px;">${booking._id}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Car:</td>
            <td style="padding: 8px;">${carName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Pickup Location:</td>
            <td style="padding: 8px;">${booking.pickupLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Drop Location:</td>
            <td style="padding: 8px;">${booking.dropLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Pickup Time:</td>
            <td style="padding: 8px;">${booking.pickupDateTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Status:</td>
            <td style="padding: 8px;">${booking.status}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Payment Status:</td>
            <td style="padding: 8px;">${booking.paymentStatus}</td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td colspan="2" style="border-bottom: 2px solid #ddd; padding-bottom: 8px;"><strong> User Details</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Name:</td>
            <td style="padding: 8px;">${guestUser.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Email:</td>
            <td style="padding: 8px;">${guestUser.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Phone:</td>
            <td style="padding: 8px;">${guestUser.phone}</td>
          </tr>
        </table>

        <p>Please review the booking details in the <a href="https://albanynytaxiservice.com/admin">admin</a> panel.</p>
      </div>`;

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
  const { userId } = req.params; // Destructure userId from req.params

  try {
    // Validate page and limit
    const pageNumber = Math.max(1, Number(page)); // Ensure page is at least 1
    const limitNumber = Math.max(1, Number(limit)); // Ensure limit is at least 1

    // Find guest user by ID
    const normalUser = await User.findById(userId);
    if (!normalUser) {
      return res.status(404).send({ message: "User not found." });
    }

    const guestUser = await GuestUser.findOne({ email: normalUser.email });
    if (!guestUser) {
      return res.status(404).send({ message: "Guest user not found." });
    }

    // Fetch bookings for the guest user
    const bookings = await Booking.find({ guestUserId: guestUser._id })
      .populate("userId", "name email")
      .populate("guestUserId", "name email phone")
      .populate("carId", "name perKmPrice perDayPrice model")
      .limit(limitNumber)
      .skip((pageNumber - 1) * limitNumber)
      .exec();

    // Get total count of bookings
    const count = await Booking.countDocuments({ guestUserId: guestUser._id });

    // Return bookings and pagination info
    res.status(200).send({
      bookings,
      totalPages: Math.ceil(count / limitNumber),
      currentPage: pageNumber,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).send({
      message: "An error occurred while fetching bookings.",
      error: error.message,
    });
  }
};

// Get all bookings with pagination
exports.getAllBookings = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "asc",
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
  const { status, comment } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    // Find and update the booking by ID
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, comment: comment ? comment : "" },
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
    const text = `Dear ${user.name},\n\nYour booking status has been updated to: ${status} comment : ${comment}.\n\nBest regards,\n Express Transportation`;

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
