const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminsController');
const { isAuthenticated, isAdmin, isUser } = require('../middleware/authChecker'); 

// Route to create a blog post (for users)
router.post('/admin/create',isAdmin, AdminController.createAdmin);

// Route to get all blog posts (for admin)
router.get('/all/admins',isAdmin, AdminController.getAllAdmins);

// Route to approve a blog post (for admin)
router.put('/update/admin/:id', AdminController.updateAdmin);

// Route to delete a blog post
router.delete('/delete/admin/:id',isAdmin, AdminController.deleteAdmin);



module.exports = router;
