const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost', // Reference to the BlogPost model
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true, // Trims whitespace from both ends of the string
  },
  createdAt: {
    type: Date,
    default: Date.now, // Sets the default value to the current date
  },
  updatedAt: {
    type: Date,
    default: Date.now, // Initial timestamp
  },
});

// Optional: Add a pre-save hook to update the updatedAt field
commentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Comment', commentSchema);
