// controllers/userController.js
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to hash passwords
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// Create a new user (Admin access only)
exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password, phone, address, role } = req.body;

        // Check if the user making the request is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized action" });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create a new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            role
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Error creating Admin', error });
    }
};


// Get all users (Admin access only)
exports.getAllAdmins = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving users', error });
    }
};

// Update a user by ID (Admin access only)

exports.updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // Assign the fields to update from req.body

        // Hash the password if it is being updated
        if (updates.password) {
            updates.password = await hashPassword(updates.password);
        }

        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating user', error });
    }
};


// Delete a user by ID (Admin access only)
exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized action" });
        }

        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};
