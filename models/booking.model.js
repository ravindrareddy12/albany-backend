const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'GuestUser' },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },
    pickupDateTime: { type: String, required: true },
    dropDateTime: { type: String, required: true },
    status: { type: String, required: true },
    fare: { type: Number, required: true },
    feedback: { type: String },
    paymentStatus:{type:String},
    comment:{type:String},
    distance:{type:String},
    duration:{type:String},
    routes :{type:Array}
},{ timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);  