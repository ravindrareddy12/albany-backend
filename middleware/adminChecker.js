const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Update the path if necessary

exports.isAdmin = async (req, res, next) => {
  try {
    if(!req.headers.authorization){
        return res.status(401).json({message:"Forbidden"})
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your_jwt_secret'); // Replace 'your_jwt_secret' with your actual secret
    req.user = decoded;

    const user = await User.findById(req.user.id);
    // console.log(user)
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token', error: error.message });
  }
};
