const dotenv = require('dotenv');
dotenv.config();
const { MailerSend } = require('mailersend');

// Initialize MailerSend
const mailerSend = new MailerSend({
    api_key: 'mlsn.e60918fd3cb21fc7bbdf347fe5d2694412e203f8006e102d8582c5e8504d9adcs' // Ensure this is correctly set in your .env file
});

// Function to send an email
const sendEmail = async ({ from, to, subject, text, html }) => {
    
    try {
        const emailContent = {
            from,
            to,
            subject,
            text,
            html,
        };
        console.log('Sending email with content:', emailContent);

        // Send the email
        await mailerSend.email.send(emailContent);

        console.log('Email sent successfully.');
    } catch (error) {
        console.log(error)
        console.error('Failed to send email:', error.response ? error.response.body : error.message);
        throw new Error('Failed to send email');
    }
}; 

module.exports = {
    sendEmail
};
