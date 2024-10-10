const NewsletterSubscription = require('../models/NewsletterSubscription');
const main = require('../utils/emailService');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  try {
    // Check if email is already subscribed
    const existingSubscription = await NewsletterSubscription.findOne({ email });
    if (existingSubscription) {
      return res.status(400).json({ message: 'Email is already subscribed' });
    }

    // Create a new subscription
    const newSubscription = new NewsletterSubscription({ email });
    await newSubscription.save();

    // Prepare the email content
    const subject = 'Thank you for subscribing to our newsletter!';
    const text = 'You have successfully subscribed to our newsletter. Stay tuned for updates!';
    const html = `
      <h1>Welcome to Our Newsletter</h1>
      <p>Thank you for subscribing to our newsletter. You will receive the latest updates directly to your inbox.</p>
      <p>If you wish to unsubscribe at any time, you can do so by clicking <a href="#">here</a>.</p>
    `;

    // Send confirmation email to the subscriber
    await main(email, subject, text, html);

    res.status(200).json({ message: 'Subscription successful and confirmation email sent' });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
