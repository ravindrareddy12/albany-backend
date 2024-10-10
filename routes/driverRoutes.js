const express = require('express');
const driverController = require('../controllers/driverController');
const router = express.Router();
const { isAdmin } = require('../middleware/adminChecker'); // Assuming you have an auth middleware

router.post('/drivers', isAdmin, driverController.createDriver);
router.get('/drivers', driverController.getDrivers);
router.get('/drivers/:id',isAdmin, driverController.getDriverById);
router.put('/drivers/:id', isAdmin, driverController.updateDriver);
router.delete('/drivers/:id', isAdmin, driverController.deleteDriver);

module.exports = router;