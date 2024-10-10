// mailer.js
const nodemailer = require('nodemailer');

async function create(){
    let testAcc =await nodemailer.createTestAccount();
    return testAcc
}

 
const transporter = nodemailer.createTransport({
  service: 'smtp.ethereal.email', // e.g., Gmail
  
  auth: {
    user: 'claudia.kris5@ethereal.email',
    pass: 'x4jt4aZRmv7yqnQ3DU'
  }
});



const sendErrorEmail = (error) => {
    console.log(error)
  const mailOptions = {
    from: 'reddysomula6789@gmail.com',
    to: 'ravindrasomula1@gmail.com',
    subject: 'Error Occurred in Your Application',
    text: `An error occurred: ${error.message}\n\nStack trace:\n${error.stack}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(`Error while sending email: ${err.message}`);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

module.exports = sendErrorEmail;
