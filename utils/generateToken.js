const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token expiration time
  });
};



module.exports = generateToken;
