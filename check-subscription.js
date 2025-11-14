// api/check-subscription.js
// Verifica se un utente ha un abbonamento attivo

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Abilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        isPremium: false, 
        error: 'Email richiesta' 
      });
    }

    // Cerca il cliente su Stripe tramite email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customers.data.length === 0) {
      // Utente non trovato = non premium
      return res.status(200).json({ 
        isPremium: false,
        message: 'Nessun abbonamento trovato'
      });
    }

    const customer = customers.data[0];

    // Cerca abbonamenti attivi per questo cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      
      return res.status(200).json({
        isPremium: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          plan: subscription.items.data[0].price.id
        }
      });
    }

    // Nessun abbonamento attivo
    return res.status(200).json({ 
      isPremium: false,
      message: 'Nessun abbonamento attivo'
    });

  } catch (error) {
    console.error('Errore verifica abbonamento:', error);
    return res.status(500).json({ 
      isPremium: false,
      error: 'Errore del server' 
    });
  }
};
