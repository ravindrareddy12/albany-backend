
const express = require('express');
const carController = require('../controllers/carController');
const router = express.Router();
const { isAdmin } = require('../middleware/adminChecker'); 

router.post('/cars', carController.createCar);
router.get('/cars', carController.getCars);
router.get('/cars/:id',isAdmin ,carController.getCarById);
router.put('/cars/:id', carController.updateCar);
router.delete('/cars/:id', carController.deleteCar);
router.get('/allcars', carController.getAllCars);
module.exports = router;


