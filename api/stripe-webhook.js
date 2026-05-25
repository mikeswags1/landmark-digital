// /api/stripe-webhook
// Stripe POSTs subscription events here. We verify the signature and log
// the event — extend this if you want email notifications, Slack alerts, etc.

const { getStripe, readRaw } = require('./_lib/stripe.js');

async function webhook(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).end();
  }

  let event;
  try {
    const stripe = getStripe();
    const raw = await readRaw(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // React to subscription lifecycle events. Extend as needed.
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        console.log('[stripe] checkout completed', {
          slug: s.metadata?.slug,
          customer_email: s.customer_details?.email,
          amount_total: s.amount_total,
        });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log(`[stripe] ${event.type}`, {
          id: sub.id,
          slug: sub.metadata?.slug,
          status: sub.status,
          current_period_end: sub.current_period_end,
        });
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object;
        console.warn('[stripe] invoice.payment_failed', {
          customer_email: inv.customer_email,
          subscription: inv.subscription,
          amount_due: inv.amount_due,
        });
        break;
      }
      default:
        // no-op for events we don't care about
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  // Always 200 so Stripe doesn't retry on our internal errors.
  return res.status(200).json({ received: true });
}

// Disable Vercel's default body parser so we can verify the raw payload signature.
webhook.config = { api: { bodyParser: false } };
module.exports = webhook;
module.exports.config = webhook.config;
