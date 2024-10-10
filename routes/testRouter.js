
const express = require('express');
const carController = require('../controllers/testConntroller');
const router = express.Router();
const { isAdmin } = require('../middleware/adminChecker'); // Assuming you have an auth middleware

router.post('/cars', carController.createCar);
router.get('/cars', carController.getCars);
router.get('/cars/:id',isAdmin ,carController.getCarById);
router.put('/cars/:id', carController.updateCar);
router.delete('/cars/:id', carController.deleteCar);

module.exports = router;


