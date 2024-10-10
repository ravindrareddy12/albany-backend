const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const driverSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profile:{type:String},
    drivingLicense: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' }
});

module.exports = mongoose.model('Driver', driverSchema);
