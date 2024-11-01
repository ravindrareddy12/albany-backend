
const express = require('express');
const carController = require('../controllers/carController');
const router = express.Router();
const { isAuthenticated, isAdmin, isUser } = require('../middleware/authChecker'); 

router.post('/cars',isAdmin, carController.createCar);
router.get('/cars', carController.getCars);
router.get('/cars/:id',isAdmin ,carController.getCarById);
router.put('/cars/:id', isAdmin,carController.updateCar);
router.delete('/cars/:id',isAdmin, carController.deleteCar);
router.get('/allcars', carController.getAllCars);
module.exports = router;


