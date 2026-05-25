// /api/checkout-info?slug=acme-plumbing
// Public — returns the display name + amount for a client subscription.
// The pay page hits this so the customer sees what they're signing up for
// before being redirected to Stripe Checkout.

const { getStripe, setCommonHeaders, TAG_KEY, TAG_VALUE } = require('./_lib/stripe.js');

module.exports = async (req, res) => {
  setCommonHeaders(res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const slug = String(req.query?.slug || '').trim().toLowerCase();
  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  try {
    const stripe = getStripe();
    const result = await stripe.products.search({
      query: `active:'true' AND metadata['${TAG_KEY}']:'${TAG_VALUE}' AND metadata['slug']:'${slug}'`,
      limit: 1,
      expand: ['data.default_price'],
    });

    if (result.data.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const p = result.data[0];
    const price = p.default_price && typeof p.default_price === 'object' ? p.default_price : null;

    return res.status(200).json({
      slug,
      name: p.name,
      description: p.description || '',
      amount_cents: price?.unit_amount ?? null,
      currency: price?.currency || 'usd',
      interval: price?.recurring?.interval || 'month',
    });
  } catch (err) {
    console.error('checkout-info error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
