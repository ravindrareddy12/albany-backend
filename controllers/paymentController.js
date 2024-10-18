const express = require('express');
const Stripe = require('stripe');
const router = express.Router();
const stripe = new Stripe('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');  // Replace with your secret key
const Payment = require('../models/Payment');

// Create payment intent and store payment
router.post('/create-payment-intent', async (req, res) => {
  const { amount, currency, userId } = req.body;

  try {
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
    });

    // Save payment to MongoDB
    const payment = new Payment({
      userId: userId,
      amount: amount,
      currency: currency,
      paymentIntentId: paymentIntent.id,
      status: 'pending',
    });

    await payment.save();

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.post('/confirm-payment', async (req, res) => {
    const { paymentIntentId } = req.body;
  
    try {
      // Retrieve the payment intent status from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
      if (paymentIntent.status === 'succeeded') {
        // Update payment status in MongoDB
        await Payment.findOneAndUpdate(
          { paymentIntentId: paymentIntentId },
          { status: 'completed' }
        );
  
        res.status(200).send({ message: 'Payment confirmed and updated' });
      } else {
        res.status(400).send({ error: 'Payment not successful' });
      }
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
  router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const payments = await Payment.find({ userId: userId });
  
      if (!payments) {
        return res.status(404).send({ message: 'No payments found for this user' });
      }
  
      res.status(200).send(payments);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
    
module.exports = router;
