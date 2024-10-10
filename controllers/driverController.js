// controllers/driverController.js
const Driver = require('../models/Driver');
const { faker } = require('@faker-js/faker');
// Create a new driver
exports.createDriver = async (req, res) => {
    try {
        const driver = new Driver(req.body);
        await driver.save();
        res.status(201).json(driver);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all drivers
// Get all drivers with pagination
// exports.getDrivers = async (req, res) => {
//     const { page = 1, limit = 10 } = req.query;

//     try {
//         const drivers = await Driver.find()
//             .populate('car')
//             .skip((page - 1) * limit)
//             .limit(parseInt(limit));

//         // Get total number of drivers
//         const totalDrivers = await Driver.countDocuments();

//         res.status(200).json({
//             drivers,
//             totalPages: Math.ceil(totalDrivers / limit),
//             currentPage: parseInt(page),
//         });
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// };

// const { faker } = require('@faker-js/faker');

const generateDummyDrivers = (count) => {
    const drivers = [];
    for (let i = 0; i < count; i++) {
        drivers.push({
            name: faker.person.fullName(),
            title: faker.person.jobTitle(),
            role: 'Driver',
            email: faker.internet.email(),
            telephone: faker.phone.number(),
            imageUrl: faker.image.avatar(),
        });
    }
    return drivers;
};

exports.getDrivers = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Generate dummy data for 50 drivers
    const totalDrivers = 50;
    const drivers = generateDummyDrivers(totalDrivers);

    // Apply pagination
    const paginatedDrivers = drivers.slice((page - 1) * limit, page * limit);

    res.status(200).json({
        drivers: paginatedDrivers,
        totalPages: Math.ceil(totalDrivers / limit),
        currentPage: parseInt(page),
    });
};



// Get a driver by ID
exports.getDriverById = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id).populate('car');
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        res.status(200).json(driver);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a driver
exports.updateDriver = async (req, res) => {
    try {

        const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        res.status(200).json(driver);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a driver
exports.deleteDriver = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

        const driver = await Driver.findByIdAndDelete(req.params.id);
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        res.status(200).json({ message: 'Driver deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
