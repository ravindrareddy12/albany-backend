const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment variables from .env file
require('dotenv').config();


const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Utility function to upload a file to S3
exports.uploadFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(filePath);
        const fileName = uuidv4() + path.extname(filePath);

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: fileContent
        };

        s3.upload(params, (err, data) => {
            if (err) {
                console.log(err)
                reject(err);
            }
            fs.unlinkSync(filePath); // Delete the file locally after upload
            resolve(data);
        });
    });
};

// Utility function to delete a file from S3
exports.deleteFile = (fileUrl) => {
    return new Promise((resolve, reject) => {
        const fileName = fileUrl.split('/').pop();
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName
        };

        s3.deleteObject(params, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
};
