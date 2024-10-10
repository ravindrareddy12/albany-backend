const BlogPost = require('../models/BlogPost');
const NewsletterSubscription = require('../models/NewsletterSubscription');
const multer = require('multer');
const { uploadFile } = require('../utils/s3');
const main = require('../utils/emailService');

const upload = multer({ dest: 'uploads/' });

// Create a new blog post
exports.createBlogPost = async (req, res) => {
    const uploadSingle = upload.single('image');
    try {
        uploadSingle(req, res, async (err) => {
            if (err) {
                return res.status(500).json({ message: 'File upload failed', error: err.message });
            }

            const { postTitle, category, postDescription, tags, admin_fl } = req.body;

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const filePath = req.file.path;

            try {
                // Upload the file to S3 or any storage you use
                const result = await uploadFile(filePath);

                // Create a new blog post in the database
                const blog = new BlogPost({
                    postTitle,
                    category,
                    postDescription,
                    image: result.Location,
                    tags,
                    admin_fl
                });

                await blog.save();

                // Fetch all newsletter subscribers
                const subscribers = await NewsletterSubscription.find({});
                
                // Send emails to all subscribers
                const emailSubject = `New Blog Post: ${postTitle}`;
                const emailText = `Check out our new blog post titled "${postTitle}"! Here's a preview: ${postDescription}`;
                const emailHtml = `<h1>${postTitle}</h1><p>${postDescription}</p><a href="#">Read More</a>`;

                for (const subscriber of subscribers) {
                    await main(subscriber.email, emailSubject, emailText, emailHtml);
                }

                res.status(201).json({ message: 'Blog post created and emails sent successfully', blog });
            } catch (error) {
                res.status(500).json({ message: 'Image upload or blog creation failed', error: error.message });
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get all blog posts for admin review (admin view)
exports.getAllBlogPosts = async (req, res) => {
    try {
        const posts = await BlogPost.find();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve a blog post
exports.approveBlogPost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        post.admin_fl = true;
        await post.save();
        res.status(200).json({ message: 'Blog post approved', post });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all approved blog posts (user view)
exports.getApprovedBlogPosts = async (req, res) => {
    try {
        const posts = await BlogPost.find({ admin_fl: true });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a blog post
exports.updateBlogPost = async (req, res) => {
    try {
        const updatedPost = await BlogPost.findByIdAndUpdate(
            req.params.id,
            {
                postTitle: req.body.postTitle,
                category: req.body.category,
                postDescription: req.body.postDescription,
                image: req.body.image,
                tags: req.body.tags,
                updatedAt: Date.now(),
            },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        res.status(200).json({ message: 'Blog post updated successfully', updatedPost });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a blog post
exports.deleteBlogPost = async (req, res) => {
    try {
        const deletedPost = await BlogPost.findByIdAndDelete(req.params.id);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        res.status(200).json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
