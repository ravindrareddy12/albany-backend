const BlogPost = require("../models/BlogPost");
const NewsletterSubscription = require("../models/NewsletterSubscription");
const multer = require("multer");
const { uploadFile } = require("../utils/s3");
const main = require("../utils/emailService");
const jwt = require("jsonwebtoken");
const upload = multer({ dest: "uploads/" });
const User = require("../models/userModel");
// Create a new blog post
exports.createBlogPost = async (req, res) => {
  const uploadSingle = upload.single("image");
  try {
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "File upload failed", error: err.message });
      }

      const { postTitle, category, postDescription, tags, admin_fl,blogPostedEmail } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
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
          admin_fl,
          blogPostedEmail
        });

        await blog.save();

        // Fetch all newsletter subscribers
        if (admin_fl) {
          const subscribers = await NewsletterSubscription.find({});
          const emailSubject = `New Blog Post: ${postTitle}`;
          const emailText = `Check out our new blog post titled "${postTitle}"! Here's a preview: ${postDescription}`;
          const emailHtml = `<h1>${postTitle}</h1><p>${postDescription}</p><a href="">Read More</a>`;

          for (const subscriber of subscribers) {
            await main(subscriber.email, emailSubject, emailText, emailHtml);
          }
        }
        // Send emails to all subscribers

        res
          .status(201)
          .json({
            message: "Blog post created and emails sent successfully",
            blog,
          });
      } catch (error) {
        res
          .status(500)
          .json({
            message: "Image upload or blog creation failed",
            error: error.message,
          });
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
    // Find the blog post by ID
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // Mark the post as approved
    post.admin_fl = true;
    await post.save();

    // Notify subscribers about the new blog post
    if (post.admin_fl) {
      const subscribers = await NewsletterSubscription.find({});
      const emailSubject = `New Blog Post: ${post.postTitle}`;
      const emailText = `Check out our new blog post titled "${post.postTitle}"! Here's a preview: ${post.postDescription}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h1 style="color: #0275d8; text-align: center;">New Blog Post Alert</h1>
          <h2 style="color: #5bc0de;">${post.postTitle}</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            ${post.postDescription}
          </p>
          <a href="https://albanynytaxiservice.com/blog/${post._id}" 
             style="display: inline-block; padding: 10px 20px; color: white; background-color: #5cb85c; text-decoration: none; border-radius: 4px; font-size: 16px;">
            Read More
          </a>
          <hr style="border: 0; border-top: 1px solid #ddd; margin-top: 20px;">
          <p style="font-size: 14px; color: #999; text-align: center;">
            Thank you for subscribing to our newsletter!
          </p>
        </div>
      `;

      for (const subscriber of subscribers) {
        await main(subscriber.email, emailSubject, emailText, emailHtml);
      }
    }

    // Notify the blog poster about the approval
    if (post.blogPostedEmail) {
      const approvalEmailSubject = "Your Blog Approved";
      const approvalEmailText = `Your blog post titled "${post.postTitle}" has been approved! Here's a preview: ${post.postDescription}`;
      const approvalEmailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h1 style="color: #5cb85c; text-align: center;">Congratulations!</h1>
          <h2 style="color: #5bc0de;">${post.postTitle}</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            ${post.postDescription}
          </p>
          <a href="https://albanynytaxiservice.com/blog/${post._id}" 
             style="display: inline-block; padding: 10px 20px; color: white; background-color: #0275d8; text-decoration: none; border-radius: 4px; font-size: 16px;">
            Check Your Blog
          </a>
          <hr style="border: 0; border-top: 1px solid #ddd; margin-top: 20px;">
          <p style="font-size: 14px; color: #999; text-align: center;">
            Thank you for contributing to our blog. We appreciate your effort!
          </p>
        </div>
      `;
      await main(post.blogPostedEmail, approvalEmailSubject, approvalEmailText, approvalEmailHtml);
    }

    res.status(200).json({ message: "Blog post approved", post });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while approving the blog post", error: error.message });
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
      return res.status(404).json({ message: "Blog post not found" });
    }

    res
      .status(200)
      .json({ message: "Blog post updated successfully", updatedPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a blog post
exports.deleteBlogPost = async (req, res) => {
  try {
    const deletedPost = await BlogPost.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    if (deletedPost.blogPostedEmail) {
      const sub = "Your Blog Rejected";
      const text = `Your blog post titled "${deletedPost.postTitle}" has been Rejected! Here's a preview: ${deletedPost.postDescription}`;
      const html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h1 style="color: #d9534f; text-align: center;">Blog Rejected</h1>
          <h2 style="color: #5bc0de;">${deletedPost.postTitle}</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            ${deletedPost.postDescription}
          </p>
          <hr style="border: 0; border-top: 1px solid #ddd;">
         
        </div>
      `;
      await main(deletedPost.blogPostedEmail, sub, text, html);
    }

    res.status(200).json({ message: "Blog post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get a single blog post by ID
exports.getBlogPostById = async (req, res) => {
  console.log("called")
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Blog post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
