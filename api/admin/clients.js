// /api/admin/clients
//   GET  → list all Landmark client subscriptions
//   POST → create a new client subscription (Stripe Product + recurring Price)
//
// All requests require the `x-admin-password` header.

const {
  getStripe,
  requireAdmin,
  readJson,
  slugify,
  setCommonHeaders,
  TAG_KEY,
  TAG_VALUE,
} = require('../_lib/stripe.js');

module.exports = async (req, res) => {
  setCommonHeaders(res);
  if (!requireAdmin(req, res)) return;
  const stripe = getStripe();

  try {
    if (req.method === 'GET') {
      // List active products tagged as landmark clients, with their default price.
      const products = await stripe.products.search({
        query: `active:'true' AND metadata['${TAG_KEY}']:'${TAG_VALUE}'`,
        limit: 100,
        expand: ['data.default_price'],
      });

      const clients = products.data.map((p) => {
        const price = p.default_price && typeof p.default_price === 'object'
          ? p.default_price : null;
        return {
          id: p.id,
          slug: p.metadata?.slug || '',
          name: p.name,
          description: p.description || '',
          created: p.created,
          price_id: price?.id || null,
          amount_cents: price?.unit_amount ?? null,
          currency: price?.currency || 'usd',
          interval: price?.recurring?.interval || 'month',
        };
      });

      // Newest first.
      clients.sort((a, b) => (b.created || 0) - (a.created || 0));
      return res.status(200).json({ clients });
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      const name = String(body.name || '').trim();
      const amountDollars = Number(body.amount);
      const slug = slugify(body.slug || name);
      const description = body.description ? String(body.description).trim() : undefined;

      if (!name) return res.status(400).json({ error: 'Name is required' });
      if (!slug) return res.status(400).json({ error: 'Could not derive a URL slug from that name' });
      if (!Number.isFinite(amountDollars) || amountDollars < 1)
        return res.status(400).json({ error: 'Amount must be at least $1' });

      const amount_cents = Math.round(amountDollars * 100);

      // Reject duplicate slugs so URLs stay unique.
      const existing = await stripe.products.search({
        query: `active:'true' AND metadata['${TAG_KEY}']:'${TAG_VALUE}' AND metadata['slug']:'${slug}'`,
        limit: 1,
      });
      if (existing.data.length > 0) {
        return res.status(409).json({ error: `A client with slug "${slug}" already exists` });
      }

      const product = await stripe.products.create({
        name,
        description,
        metadata: { [TAG_KEY]: TAG_VALUE, slug },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount_cents,
        currency: 'usd',
        recurring: { interval: 'month' },
      });

      await stripe.products.update(product.id, { default_price: price.id });

      return res.status(201).json({
        client: {
          id: product.id,
          slug,
          name,
          description: description || '',
          created: product.created,
          price_id: price.id,
          amount_cents,
          currency: 'usd',
          interval: 'month',
        },
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('admin/clients error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
