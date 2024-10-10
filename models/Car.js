// models/Car.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const carSchema = new Schema({
    carName: { type: String, required: true },
    model: { type: String, required: true },
    numberPlate: { type: String, required: true, unique: true },
    perKmPrice: { type: Number, required: true },
    carImage: { type: String },
    status: { type: String, enum: ['Available', 'Unavailable'], default: 'Available' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Car', carSchema);
