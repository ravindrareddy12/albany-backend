const express = require('express');
const listEndpoints = require('express-list-endpoints');
const bodyParser = require('body-parser');
const passport = require('./config/passport');
const { protect } = require('./middleware/authMiddleware');
const User = require('./models/userModel');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const contactFormRoutes = require('./routes/contactFormRoutes');
const blogFormRoutes = require('./routes/blogPostRoutes');
const carRoutes = require('./routes/carRoutes');
const driverRoutes = require('./routes/driverRoutes');
const testRoutes = require('./routes/testRouter');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const sendErrorEmail = require('./middleware/Errormailer');
const jwt = require('jsonwebtoken');
const newsletterRoutes = require('./routes/newsletterRoutes');
const paymentRoutes = require('./controllers/paymentController')
const adminRoutes = require('./routes/AdminRoutes')
const guestUserRoutes = require('./routes/guestUserRoutes')
const commentRoutes = require('./routes/commentRoutes');

dotenv.config();
const app = express();

app.use(cors({ credentials: true, origin: process.env.Client_URL }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use(express.static('public'));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions'
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: true
    }
  })
);
app.get('/api/protected', protect, (req, res) => {
  res.json({ message: 'This is a protected route!' });
});




app.get('/api/check-auth', async (req, res) => {
  const token = req.cookies.authToken;
  
  if (!token) {
    return res.status(401).json({ isAuthenticated: false });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ isAuthenticated: false });
    }
    
    try {
      const user = await User.findById(decodedToken.id).select('-password'); // Exclude the password field
      if (!user) {
        return res.status(404).json({ isAuthenticated: false });
      }
      res.json({ isAuthenticated: true, user });
    } catch (error) {
      res.status(500).json({ isAuthenticated: false, error: 'Internal Server Error' });
    }
  });
});



app.use('/api/users', userRoutes);
app.use('/api/', driverRoutes);
app.use('/api/', carRoutes);
app.use('/api/test', testRoutes);
app.use('/api', bookingRoutes);
app.use('/api/blog', blogFormRoutes);
app.use('/api', contactFormRoutes);
app.use('/api', newsletterRoutes);
app.use('/api', paymentRoutes);
app.use('/api', guestUserRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api',adminRoutes)
// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  // sendErrorEmail(err);
  res.status(500).send('Something went wrong! The admin has been notified.');
});

const PORT = process.env.PORT || 5000;

console.log(listEndpoints(app));
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
