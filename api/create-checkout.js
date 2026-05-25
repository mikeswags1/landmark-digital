// /api/create-checkout
//   POST { slug, email? } → { url } — a Stripe-hosted Checkout Session URL.
// The pay page calls this when the customer clicks "Subscribe".

const {
  getStripe,
  readJson,
  setCommonHeaders,
  TAG_KEY,
  TAG_VALUE,
} = require('./_lib/stripe.js');

module.exports = async (req, res) => {
  setCommonHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = await readJson(req);
    const slug = String(body.slug || '').trim().toLowerCase();
    const email = body.email ? String(body.email).trim() : undefined;

    if (!slug) return res.status(400).json({ error: 'Missing slug' });

    const stripe = getStripe();

    // Look up the product + its recurring price for this client slug.
    const result = await stripe.products.search({
      query: `active:'true' AND metadata['${TAG_KEY}']:'${TAG_VALUE}' AND metadata['slug']:'${slug}'`,
      limit: 1,
      expand: ['data.default_price'],
    });
    if (result.data.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    const product = result.data[0];
    const price = product.default_price && typeof product.default_price === 'object'
      ? product.default_price : null;
    if (!price) return res.status(500).json({ error: 'Subscription has no price configured' });

    // Build absolute success/cancel URLs from the request origin (or env override).
    const origin =
      process.env.PUBLIC_SITE_URL ||
      `https://${req.headers['x-forwarded-host'] || req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${origin}/success?slug=${encodeURIComponent(slug)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pay?client=${encodeURIComponent(slug)}&canceled=1`,
      metadata: { slug, product_id: product.id },
      subscription_data: {
        metadata: { slug, product_id: product.id, [TAG_KEY]: TAG_VALUE },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
