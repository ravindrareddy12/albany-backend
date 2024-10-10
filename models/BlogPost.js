const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
    postTitle: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['Airport Announcements', 'Blog', 'Corporate Transportation Services', 'Employee General Messages', 'Uncategorised'],
        required: true,
    },
    postDescription: {
        type: String,
        required: true,
    },
    image: {
        type: String, // Store the URL or file path of the image
        required: true,
    },
    tags: {
        type: [String], // Array of tags for the blog
    },
    admin_fl: {
        type: Boolean,
        default: false, // Initially set to false, only true when approved by admin
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
