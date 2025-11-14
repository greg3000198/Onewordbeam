// api/webhook.js
// Webhook Stripe per gestire eventi di pagamento

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Database semplice con Vercel KV o file JSON
// Per ora usiamo un approccio semplice con storage locale
const subscribers = new Map(); // userId -> subscription data

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verifica che l'evento venga da Stripe
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Gestisci gli eventi
  switch (event.type) {
    case 'checkout.session.completed':
      // Pagamento completato con successo
      const session = event.data.object;
      
      // Salva l'abbonamento
      const subscription = {
        userId: session.client_reference_id, // Email o ID utente
        subscriptionId: session.subscription,
        customerId: session.customer,
        priceId: session.line_items?.data[0]?.price?.id,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // In produzione, salvare in un database (Firebase, MongoDB, Supabase, ecc.)
      // Per ora lo logghiamo
      console.log('Nuovo abbonamento:', subscription);
      
      // TODO: Salvare in database reale
      // await saveToDatabase(subscription);

      break;

    case 'customer.subscription.updated':
      // Abbonamento modificato
      const updatedSubscription = event.data.object;
      console.log('Abbonamento aggiornato:', updatedSubscription.id);
      break;

    case 'customer.subscription.deleted':
      // Abbonamento cancellato
      const deletedSubscription = event.data.object;
      console.log('Abbonamento cancellato:', deletedSubscription.id);
      
      // TODO: Aggiornare database
      break;

    default:
      console.log(`Evento non gestito: ${event.type}`);
  }

  res.status(200).json({ received: true });
};
