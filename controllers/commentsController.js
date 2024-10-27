const Comment = require('../models/Comment'); // Adjust the path as necessary

// Create a comment
const createComment = async (req, res) => {
  const { blogId, text } = req.body;

  try {
    const newComment = new Comment({ blogId, text });
    await newComment.save();
    res.status(201).json(newComment); // Return the newly created comment
  } catch (error) {
    console.error("Error saving comment:", error);
    res.status(500).json({ message: "Error saving comment" });
  }
};

// Get comments for a specific blog post
const getCommentsByBlogId = async (req, res) => {
  const { blogId } = req.params;

  try {
    const comments = await Comment.find({ blogId }).sort({ createdAt: -1 }); // Fetch comments for the blogId and sort by createdAt
    res.status(200).json(comments); // Return the comments as a response
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
};

module.exports = {
  createComment,
  getCommentsByBlogId,
};
