const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Adjust the path to your User model

// Middleware to verify authentication
const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res
      .status(401)
      .json({
        isAuthenticated: false,
        message: "Authentication token is missing",
      });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      return res
        .status(401)
        .json({ isAuthenticated: false, message: "Invalid token" });
    }

    try {
      const user = await User.findById(decodedToken.id).select("-password");
      if (!user) {
        return res
          .status(404)
          .json({ isAuthenticated: false, message: "User not found" });
      }
      req.user = user; // Attach user info to the request object for use in subsequent middlewares
      next();
    } catch (error) {
      res
        .status(500)
        .json({ isAuthenticated: false, message: "Internal Server Error" });
    }
  });
};

// Middleware to check if the user has an 'admin' role
// Middleware to check if the user has an 'admin' role
const isAdmin = async (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return res
      .status(401)
      .json({
        isAuthenticated: false,
        message: "Authentication token is missing",
      });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      return res
        .status(401)
        .json({ isAuthenticated: false, message: "Invalid token" });
    }

    try {
      const user = await User.findById(decodedToken.id).select("-password");
      if (!user) {
        return res
          .status(404)
          .json({ isAuthenticated: false, message: "User not found" });
      }
      
      if (user.role === "admin") {
        req.user = user; // Attach the user object to req for other middlewares
        return next(); // Exit to prevent additional responses
      }

      // Moved the non-admin response into an else block
      return res
        .status(403)
        .json({ isAuthenticated: false, message: "Admin privileges required" });
        
    } catch (error) {
      return res
        .status(500)
        .json({ isAuthenticated: false, message: "Internal Server Error" });
    }
  });
};


// Middleware to check if the user has a 'user' role
const isUser = (req, res, next) => {
  if (req.user && req.user.role === "user") {
    return next();
  }
  res
    .status(403)
    .json({ isAuthenticated: false, message: "User privileges required" });
};

// Usage in routes

module.exports = { isAuthenticated, isAdmin, isUser };
