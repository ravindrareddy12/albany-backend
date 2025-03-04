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
    pickupDate,
    dropDateTime,
    paymentStatus,
    guestUserId,
    distance,
    duration,
    routes,
    extraHours,
    instructions,
    tripType,
    pickupCoords,
    dropoffCoords,
    stopsCoords
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
      pickupDate,
      dropDateTime,
      paymentStatus,
      distance,
      duration,
      routes,
      extraHours,
      instructions,
      tempName: name,
      tripType,
      pickupCoords,
      dropoffCoords,
      stopsCoords
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
      car.passengers,
      car,
      car.bagCount
    );

    // Send booking details to admin users
    await sendAdminBookingNotification(booking, carName, guestUser, name);

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

const sendBookingDetailsEmail = async (
  email,
  name,
  booking,
  carName,
  user,
  passengers,
  car,
  bagCount
) => {
  const subject = "Your Booking in Progress";
  const text = `Dear ${name},

Thank you for your booking. Here are the details of your booking:

Booking ID: ${booking._id}
Vehicle: ${carName}
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
 <div style="text-align: center; margin-bottom: 20px;">
<img src="https://albanynytaxiservice.com/backendlogo.png" alt="albanynytaxiservice Logo" style="" />
</div>  
    <h2 style="font-size: 18px; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">General</h2>
    <div style="padding: 10px 0;">
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;"> RESERVATION NUMBER </span>
            <span><a href="#" style="color: #007bff; text-decoration: none;">${booking._id
              .toString()
              .slice(-5)
              .toUpperCase()}</a></span>
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
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Extra Hour(s)</span>
            <span>${booking.extraHours} Hour(s)</span>
        </div>
         <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Any instructions to driver </span>
            <span> ${
              booking?.instructions?.length > 0 ? booking.instructions : "NA"
            } </span>
        </div>
         <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Duration</span>
            <span>${booking.duration}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Transfer type</span>
            <span>${booking.tripType ? booking.tripType === 'roundTrip' ? 'Round Trip' : 'One Way' : ''}</span>
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
    ${booking.routes
      ?.map(
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
            <span>${bagCount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Passengers count</span>
            <span>${passengers}</span>
        </div>
    </div>

    <h2 style="font-size: 18px; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Client Details</h2>
    <div style="padding: 10px 0;">
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Client ID</span>
            <span>${user._id.toString().slice(-5)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Name</span>
            <span>${name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Email Adress  </span>
            <span><a href="mailto:${user.email}" style="color: #007bff;">${
    user.email
  }</a></span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
            <span style="color: #666; font-weight: bold; min-width: 150px; margin-right: 20px;">Contact Number</span>
            <span><a href="tel:${user.phone}" style="color: #007bff;">${
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
{
  /* <div style="text-align: center; margin-bottom: 20px;">
<img src="https://albanynytaxiservice.com/backendlogo.png" alt="albanynytaxiservice Logo" style="" />
</div>  */
}
// Function to send booking details to admin users
const sendAdminBookingNotification = async (
  booking,
  carName,
  guestUser,
  name
) => {
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
        Vehicle: ${carName}
        Pickup Location: ${booking.pickupLocation}
        Drop Location: ${booking.dropLocation}
        Pickup Time: ${booking.pickupDateTime} 
        Status: ${booking.status}
        Payment Status: ${booking.paymentStatus}

        Guest Details:
        Name: ${name}
        Email: ${guestUser.email}
        Phone: ${guestUser.phone}

        Please review the booking details in the admin panel.`;

    const html = `
    <div style="text-align: center; margin-bottom: 20px;">
<img src="https://albanynytaxiservice.com/backendlogo.png" alt="albanynytaxiservice Logo" style="" />
</div> 
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #DC143C;">New Booking Notification</h2>
        <p>A new booking has been created. Here are the details:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td colspan="2" style="border-bottom: 2px solid #ddd; padding-bottom: 8px;"><strong>Booking Details</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px; width: 30%; color: #555;">RESERVATION NUMBER:</td>
            <td style="padding: 8px;">${booking._id
              ?.toString()
              ?.slice(-5)
              .toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Vehicle:</td>
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
            <td style="padding: 8px; color: #555;">Transfer Type:</td>
            <td style="padding: 8px;">${booking.tripType ? booking.tripType === 'roundTrip' ? 'Round Trip' : 'One Way' : ''}</td>
          </tr>
           <tr>
            <td style="padding: 8px; color: #555;">Duration: </td>
            <td style="padding: 8px;">${booking.duration}</td>
          </tr>
           <tr>
            <td style="padding: 8px; color: #555;">Distance : </td>
            <td style="padding: 8px;">${booking.distance} Miles</td>
          </tr>
           <tr>
            <td style="padding: 8px; color: #555;">Extra Hour(s): </td>
            <td style="padding: 8px;">${booking.extraHours} Hour(s)</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Any instructions to driver: </td>
            <td style="padding: 8px;">${
              booking?.instructions?.length > 0 ? booking.instructions : "NA"
            }</td>
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
          <tr>
            <td style="padding: 8px; color: #555;">Order total amount:</td>
            <td style="padding: 8px;">${booking.fare}</td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td colspan="2" style="border-bottom: 2px solid #ddd; padding-bottom: 8px;"><strong> User Details</strong></td>
          </tr>
            <tr>
            <td style="padding: 8px; color: #555;">Client ID:</td>
            <td style="padding: 8px;">${guestUser._id}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #555;">Name:</td>
            <td style="padding: 8px;">${name}</td>
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

{
  /* <div style="text-align: center; margin-bottom: 20px;">
<img src="https://albanynytaxiservice.com/Express-01.webp" alt="albanynytaxiservice Logo" style="max-width:auto; height: auto;">
</div> */
}
// Get booking details by booking ID
exports.getBookingDetails = async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default values if not provided
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name email")
      .populate("guestUserId", "name email phone")
      .populate("carId", "name perKmPrice model freeDeliveryUnder Priceperhour")
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
      .populate("carId", "name perKmPrice perDayPrice model freeDeliveryUnder Priceperhour")
      .exec();

    // Get total count of bookings
    const count = await Booking.countDocuments({ guestUserId: guestUser._id });
    console.log(bookings);
    // Return bookings and pagination info
    res.status(200).send({
      bookings,
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
  const { sortBy = "createdAt", order = "asc" } = req.query; // Default values if not provided

  try {
    // Validate sortBy and order values
    const validSortFields = ["createdAt"];
    const validOrderValues = ["asc", "desc"];

    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({ error: "Invalid sort field" });
    }
    if (!validOrderValues.includes(order)) {
      return res.status(400).json({ error: "Invalid order value" });
    }

    // Retrieve all bookings with sorting
    const bookings = await Booking.find()
      .populate("userId", "name email")
      .populate("guestUserId", "name email phone")
      .populate("carId", "name perKmPrice perDayPrice model carImage freeDeliveryUnder Deliveryfee Priceperhour")
      .sort({ [sortBy]: order === "asc" ? 1 : -1 }) // Sort results
      .exec();

    // Send the results without pagination
    res.send({ bookings });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to retrieve bookings" });
  }
};

// Update booking status by booking ID
exports.updateBookingStatus = async (req, res) => {
  const { status, comment ,isAdminDeleted} = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    // Find and update the booking by ID
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, comment: comment ? comment : "" ,isAdminDeleted},
      { new: true }
    )
      .populate("userId", "name email")
      .populate("guestUserId", "name email phone")
      .populate("carId", "name perKmPrice perDayPrice model carImage Deliveryfee")
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
    const text = `Dear ${
      updatedBooking.tempName
    },\n\nYour booking status has been updated to: ${status} comment : ${
      comment ? comment : ""
    }.\n\nBest regards,\n Express Transportation`;
    const statusText =
      status === "accepted"
        ? "Confirmed"
        : status === "completed"
        ? "Completed"
        : "Rejected";

    const bgColor =
      status === "accepted"
        ? "#2babbf" // teal for accepted
        : status === "completed"
        ? "#4CAF50" // green for completed
        : "#f44336"; // red for rejected
    const progressSteps = {
      pending: 1,
      accepted: 2,
      completed: 3,
      rejected: 0,
    };

    const currentStep = progressSteps[status] || 0;
    const html = `
    <div style="max-width: 600px; margin: auto; font-family: 'Times New Roman', Times, serif;">
    <div style="text-align: center; margin-bottom: 20px;">
<img src="https://albanynytaxiservice.com/backendlogo.png" alt="albanynytaxiservice Logo" style="" />
</div> 
      <div style="background-color: ${bgColor}; padding: 20px; text-align: center; color: white; border-top-left-radius: 10px; border-top-right-radius: 10px;">
        <h2 style="margin: 0;">Your Ride has been ${statusText}</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; background-color: #f5f5f5;">
        <p style="font-size: 16px;">Hi ${updatedBooking.tempName},</p>
        <p style="font-size: 16px;">Your booking status has been updated:</p>
  
        <!-- Progress Bar -->
        <div style="display: flex; justify-content: space-between; margin: 20px 0;">
          <div style="flex: 1; padding: 5px;">
            <div style="text-align: center; color: ${
              currentStep >= 1 ? "#4CAF50" : "#ddd"
            };">Pending</div>
            <div style="height: 5px; background-color: ${
              currentStep >= 1 ? "#4CAF50" : "#ddd"
            }; margin-top: 5px;"></div>
          </div>
          <div style="flex: 1; padding: 5px;">
            <div style="text-align: center; color: ${
              currentStep >= 2 ? "#4CAF50" : "#ddd"
            };">Accepted</div>
            <div style="height: 5px; background-color: ${
              currentStep >= 2 ? "#4CAF50" : "#ddd"
            }; margin-top: 5px;"></div>
          </div>
          <div style="flex: 1; padding: 5px;">
            <div style="text-align: center; color: ${
              currentStep >= 3 ? "#4CAF50" : "#ddd"
            };">Completed</div>
            <div style="height: 5px; background-color: ${
              currentStep >= 3 ? "#4CAF50" : "#ddd"
            }; margin-top: 5px;"></div>
          </div>
        </div>
  
        <div style="border: 1px solid #ddd; padding: 15px; background-color: #ffffff; border-radius: 8px;">
          <h3 style="margin-top: 0; font-size: 18px; color: #333;">Booking Details:</h3>
          <p style="margin: 5px 0;color: #333"><strong>RESERVATION NUMBER:</strong> ${updatedBooking._id
            .toString()
            .slice(-5)
            .toUpperCase()}</p>
          <p style="margin: 5px 0;color: #333;"><strong>Status:</strong> ${status}</p>
          <p style="margin: 5px 0;color: #333;"><strong>Pickup Date Time:</strong> ${
            updatedBooking.pickupDateTime
          }</p>
          <p style="margin: 5px 0;">
            <strong style="color: #333">Pickup Location:</strong>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              updatedBooking.pickupLocation
            )}" 
               target="_blank" style="color: #333; text-decoration: none;">${
                 updatedBooking.pickupLocation
               }</a>
          </p>
          <p style="margin: 5px 0;">
            <strong style="color: #333">Drop Location:</strong>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              updatedBooking.dropLocation
            )}" 
               target="_blank" style="color: #333; text-decoration: none;">${
                 updatedBooking.dropLocation
               }</a>
          </p>
          <p style="margin: 5px 0;color: #333"><strong>Distance:</strong> ${
            updatedBooking.distance
          } Miles</p>
          <p style="margin: 5px 0;color: #333"><strong>Duration:</strong> ${
            updatedBooking.duration
          }</p>
          <p style="margin: 5px 0;color: #333"><strong>Comment:</strong> ${
            comment ? comment : "None"
          }</p>
          <p style="margin: 5px 0;color: #333"><strong>Total Fare:</strong> $${
            updatedBooking.fare
          }</p>
          <p style="margin: 5px 0;color: #333"><strong>Extra Hour(s):</strong> ${
            updatedBooking.extraHours
          } Hour(s)</p>
           <p style="margin: 5px 0;color: #333"><strong>Transfer Type:</strong> ${
            updatedBooking.tripType ? updatedBooking.tripType === 'roundTrip' ? 'Round Trip' : 'One Way' : ''
          }</p>
          <p style="margin: 5px 0;color: #333"><strong>Any instructions to driver: </strong> ${
            updatedBooking?.instructions?.length > 0
              ? updatedBooking.instructions
              : "NA"
          }</p>
          <p style="margin: 5px 0;color: #333"><strong>Payment Status:</strong> ${
            updatedBooking.paymentStatus
              ? updatedBooking.paymentStatus
              : "Pending"
          }</p>
        </div>
        <p style="font-size: 14px; color: #555; margin-top: 15px;">Thank you for booking with Express Transportation, where every ride is an opportunity to elevate your journey.</p>
        <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">Please note that this is an automated email, and replies to this address are not monitored.For assistance or inquiries, kindly contact our team through our official channels. We are here to support you.</p>
      </div>
    </div>
  `;

    await main(email, subject, text, html);
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
      .populate("carId", "name perKmPrice perDayPrice model carImage Deliveryfee")
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

function formatDateTimeTo12Hour(dateTimeString) {
  const date = new Date(dateTimeString);

  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  return date.toLocaleString("en-US", options);
}


exports.adminDeleteBooking = async (req, res) => {
  const { bookingId } = req.params;
  const { isAdminDeleted } = req.body;

  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { isAdminDeleted },
      { new: true } // Return the updated document
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({ message: 'Booking updated successfully', updatedBooking });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error });
  }
};

exports.permanentlyDeleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.status(200).json({ message: 'Booking permanently deleted.' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find and update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate("carId", "name perKmPrice model carImage freeDeliveryUnder Deliveryfee Priceperhour passengers bagCount")
    .populate("guestUserId", "name email phone")
    .exec();

    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Get car and guest user details
    const car = updatedBooking.carId;
    const guestUser = updatedBooking.guestUserId;

    // Send email notification about the update
    const subject = "Booking Update Confirmation";
    const text = `Dear ${updatedBooking.tempName},

Your booking has been updated. Here are the updated details:

Booking ID: ${updatedBooking._id}
Vehicle: ${car.name}
Pickup Location: ${updatedBooking.pickupLocation}
Drop Location: ${updatedBooking.dropLocation}
Pickup Time: ${updatedBooking.pickupDateTime}
Status: ${updatedBooking.status}
Distance: ${updatedBooking.distance} miles
Duration: ${updatedBooking.duration}
Total Fare: $${updatedBooking.fare}

Thank you for choosing our service.

Best regards,
Express Transportation`;

    const html = `
    <div style="width: 100%; max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border: 1px solid #e0e0e0; font-family: Times New Roman, Times, serif; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://albanynytaxiservice.com/backendlogo.png" alt="albanynytaxiservice Logo" style="" />
      </div>
      <h2 style="font-size: 18px; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Booking Update Confirmation</h2>
      <div style="padding: 10px 0;">
        <div style="border: 1px solid #ddd; padding: 15px; background-color: #ffffff; border-radius: 8px;">
          <p style="margin: 5px 0;color: #333"><strong>RESERVATION NUMBER:</strong> ${updatedBooking._id.toString().slice(-5).toUpperCase()}</p>
          <p style="margin: 5px 0;color: #333;"><strong>Status:</strong> ${updatedBooking.status}</p>

          <p style="margin: 5px 0;color: #333;"><strong>Pickup Location:</strong> ${updatedBooking.pickupLocation}</p>
          <p style="margin: 5px 0;color: #333;"><strong>Drop Location:</strong> ${updatedBooking.dropLocation}</p>
          <p style="margin: 5px 0;color: #333;"><strong>Pickup Time:</strong> ${updatedBooking.pickupDateTime}</p>
          <p style="margin: 5px 0;color: #333;"><strong>Distance:</strong> ${updatedBooking.distance} Miles</p>
          <p style="margin: 5px 0;color: #333;"><strong>Duration:</strong> ${updatedBooking.duration}</p>
          <p style="margin: 5px 0;color: #333;"><strong>Extra Hours:</strong> ${updatedBooking.extraHours} Hour(s)</p>
          <p style="margin: 5px 0;color: #333;"><strong>Transfer Type:</strong> ${updatedBooking.tripType ? updatedBooking.tripType === 'roundTrip' ? 'Round Trip'  : 'One Way' : ''}</p>
          <p style="margin: 5px 0;color: #333;"><strong>Total Fare:</strong> $${updatedBooking.fare}</p>
          <p style="margin: 5px 0;color: #333;"><strong>Payment Status:</strong> ${updatedBooking.paymentStatus}</p>
        </div>
      </div>
      <p style="font-size: 14px; color: #555; margin-top: 15px;">Thank you for choosing Express Transportation. If you have any questions, please don't hesitate to contact us.</p>
    </div>`;

    // Send email to guest user
    await main(guestUser.email, subject, text, html);

    // Send the response
    res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking
    });

  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(400).json({ error: "Failed to update booking" });
  }
};