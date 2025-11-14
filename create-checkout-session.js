// api/create-checkout-session.js
// API Vercel Function per creare sessione Stripe Checkout

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Abilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userEmail } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID richiesto' });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Email richiesta' });
    }

    // Crea sessione Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail, // Email dell'utente
      client_reference_id: userEmail, // Per identificare l'utente nel webhook
      success_url: 'https://onewordbeam.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://onewordbeam.com/subscribe.html',
      allow_promotion_codes: true, // Permette codici sconto
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Errore creazione sessione:', error);
    res.status(500).json({ error: error.message });
  }
};
