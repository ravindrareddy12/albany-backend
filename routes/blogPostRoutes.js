const express = require('express');
const router = express.Router();
const blogPostController = require('../controllers/blogPostController');

// Route to create a blog post (for users)
router.post('/create', blogPostController.createBlogPost);

// Route to get all blog posts (for admin)
router.get('/admin', blogPostController.getAllBlogPosts);

// Route to approve a blog post (for admin)
router.put('/approve/:id', blogPostController.approveBlogPost);

// Route to get approved blog posts (for users)
router.get('/approved', blogPostController.getApprovedBlogPosts);

// Route to update a blog post
router.put('/update/:id', blogPostController.updateBlogPost);

// Route to delete a blog post
router.delete('/delete/:id', blogPostController.deleteBlogPost);

router.get('/:id', blogPostController.getBlogPostById);


module.exports = router;
