// emailService.js
const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require("nodemailer");

async function main(email,subject,text,html) {
  
    try{
        console.log(email,subject,text,html)
        // First, define send settings by creating a new transporter: 
        // let transporter = nodemailer.createTransport({
        //   host: "smtp.hostinger.com", // SMTP server address (usually mail.your-domain.com)
        //   port: 465, // Port for SMTP (usually 465)
        //   secure: true, // Usually true if connecting to port 465
        //   auth: {
        //     user: "info@albanynytaxiservice.com", // Your email address
        //     pass: "Express@123", // Password (for gmail, your app password)
        //     // ⚠️ For better security, use environment variables set on the server for these values when deploying
        //   },
        //   tls: {
        //     rejectUnauthorized: false,
        //   },
        // });
        let transporter = nodemailer.createTransport({
          host: "smtp-relay.brevo.com",
          port: 587,
          secure: false,
          auth: {
            user: "7e3581001@smtp-brevo.com",
            pass: "BLrsAW3PVzGUNqa7",
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: 10000, // Timeout in milliseconds (10 seconds)
        });
        
        // Define and send message inside transporter.sendEmail() and await info about send from promise:
        let info = await transporter.sendMail({
          from: '"Express Transportation" <info@albanynytaxiservice.com>',
          to: email,
          subject: subject,
          text:text,

          html: html,
        });
        console.log(info);
      
    }catch(e){

        console.log("node",e)
    }
    // Async function enables allows handling of promises with await
   
     // Random ID generated after successful send (optional)
    }

module.exports = main;
