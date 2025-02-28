const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'GuestUser' },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },
    pickupDateTime: { type: String, required: true },
    pickupDate: { type: String, required: true },
    dropDateTime: { type: String, required: true },
    status: { type: String, required: true },
    fare: { type: Number, required: true },
    feedback: { type: String },
    paymentStatus:{type:String},
    comment:{type:String},
    distance:{type:String},
    duration:{type:String},
    extraHours:{type:String},
    instructions:{type:String},
    tempName:{type:String},
    routes :{type:Array},
    tripType:{type:String},
    isAdminDeleted:{type:Boolean},
    pickupCoords:{type:Object},
    dropoffCoords:{type:Object},
    stopsCoords: { type: Array },    
},{ timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);  