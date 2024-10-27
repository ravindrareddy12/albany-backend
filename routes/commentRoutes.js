const express = require('express');
const router = express.Router();
const { createComment, getCommentsByBlogId } = require('../controllers/commentsController'); // Adjust the path as necessary

// Route to create a comment
router.post('/', createComment);

// Route to get comments for a specific blog post
router.get('/:blogId', getCommentsByBlogId);

module.exports = router;
