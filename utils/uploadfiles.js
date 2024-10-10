
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure cloudinary
cloudinary.config({
    cloud_name: 'dbzammof6',
    api_key: '838726216125181',
    api_secret: '0XPBeynJHLv5Jj6ZVIFIe0L1yu0'
});

// Utility function to upload a file to cloudinary
exports.uploadfile = async (filePath) => {
    try {
        const res = await cloudinary.uploader.upload(filePath);
        console.log(res);
        return res;
    } catch (e) {
        console.log(e);
        throw e;
    } finally {
        fs.unlinkSync(filePath);
    }
};

// Create a new car
