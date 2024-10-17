const Car = require('../models/Car');
const multer = require('multer');
const { uploadFile, deleteFile } = require('../utils/s3');

const upload = multer({ dest: 'uploads/' });

// Create a new car
exports.createCar = async (req, res) => {
    const uploadSingle = upload.single('carImage');

    uploadSingle(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ message: 'File upload failed', error: err.message });
        }

        const { carName, model, numberPlate, perKmPrice, perDayPrice, status , passengers} = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filePath = req.file.path;

        try {
            const result = await uploadFile(filePath);

            const car = new Car({
                carName,
                model,
                numberPlate,
                perDayPrice,
                perKmPrice,
                status,
                passengers,
                carImage: result.Location
            });
            console.log("cras",car)
            console.log(result,"result")
            await car.save();
            res.status(201).json(car);
        } catch (error) {
            res.status(500).json({ message: 'Image upload or car creation failed', error: error.message });
        }
    });
};

// Get all cars with pagination
exports.getCars = async (req, res) => {
    const { page = 1, limit = 10, name, minPrice, maxPrice } = req.query;

    const query = {};

    if (name) {
        query.carName = { $regex: name, $options: 'i' }; // Case-insensitive search
    }

    if (minPrice && maxPrice) {
        query.perKmPrice = { $gte: minPrice, $lte: maxPrice };
    } else if (minPrice) {
        query.perKmPrice = { $gte: minPrice };
    } else if (maxPrice) {
        query.perKmPrice = { $lte: maxPrice };
    }

    try {
        const cars = await Car.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalCars = await Car.countDocuments(query);
        // console.log(cars)
        res.status(200).json({
            cars,
            totalPages: Math.ceil(totalCars / limit),
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// Get a car by ID
exports.getCarById = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });
        res.status(200).json(car);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a car
exports.updateCar = async (req, res) => {
    const uploadSingle = upload.single('carImage');

    uploadSingle(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ message: 'File upload failed', error: err.message });
        }

        const { carName, model, numberPlate, perKmPrice, perDayPrice, status,passengers } = req.body;
        let updateData = { carName, model, numberPlate, perKmPrice, perDayPrice, status,     };

        if (req.file) {
            const filePath = req.file.path;
            try {
                // Delete previous image if exists
                const car = await Car.findById(req.params.id);
                if (car && car.carImage) {
                    await deleteFile(car.carImage);
                }

                // Upload new image
                const result = await uploadFile(filePath);
                updateData.carImage = result.Location;
            } catch (error) {
                return res.status(500).json({ message: 'Image upload or car update failed', error: error.message });
            }
        }

        try {
            const car = await Car.findByIdAndUpdate(req.params.id, updateData, { new: true });
            if (!car) return res.status(404).json({ message: 'Car not found' });
            res.status(200).json(car);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
};

// Delete a car
exports.deleteCar = async (req, res) => {
    try {
        const car = await Car.findByIdAndDelete(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        if (car.carImage) {
            await deleteFile(car.carImage);
        }

        res.status(200).json({ message: 'Car deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


exports.getAllCars = async (req, res) => {
    try {
      const cars = await Car.find({}); // Retrieves all cars
      res.status(200).json(cars);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cars", error: error.message });
    }
  };
