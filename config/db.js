require('dotenv').config();
const mongoose = require('mongoose');

// Use the updated connection URL format
mongoose.connect("mongodb+srv://reddy:1234@cluster0.gdf3qiw.mongodb.net/albanytaxservices?retryWrites=true&w=majority", { useUnifiedTopology: true });

const db = mongoose.connection;

db.on('error', console.error.bind(console, "Error connecting to MongoDB"));

db.once('open', function() {
    console.log('Connected to Database :: MongoDB');
});

module.exports = db;
