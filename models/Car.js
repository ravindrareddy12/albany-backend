// models/Car.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const carSchema = new Schema({
    carName: { type: String, required: true },
    carImage: { type: String, required: true },
    model: { type: String, required: true },
    numberPlate: { type: String, required: true, unique: true },
    perKmPrice: { type: Number, required: true },
    perKmPrice: { type: Number, required: true },
    passengers: { type: Number },
    status: { type: String, enum: ['Available', 'Unavailable'], default: 'Available' },
    Deliveryfee:{ type: Number },
    Priceperhour:{ type: Number },
    Priceperextratime:{ type: Number },
    Priceperwaypointduration:{ type: Number },
    Stripeflatfee:{ type: Number },
    freeDeliveryUnder : {type:Number},
    Stripepercentagefee:{ type: Number },
    bagCount:{type:String},
    createdAt: { type: Date, default: Date.now },

});

module.exports = mongoose.model('Car', carSchema);
