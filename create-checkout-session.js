// api/create-checkout-session.js
// API Vercel Function per creare sessione Stripe Checkout

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Abilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID mancante' });
    }

    // Crea la sessione di checkout Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'https://onewordbeam.com'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://onewordbeam.com'}/subscribe`,
      customer_email: req.body.email || undefined,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Errore creazione sessione:', error);
    res.status(500).json({ error: 'Errore server', message: error.message });
  }
};
