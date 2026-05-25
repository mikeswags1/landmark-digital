// /api/admin/client?id=prod_xxx
//   DELETE → archive (deactivate) a client subscription product
//
// Requires `x-admin-password` header.

const { getStripe, requireAdmin, setCommonHeaders } = require('../_lib/stripe.js');

module.exports = async (req, res) => {
  setCommonHeaders(res);
  if (!requireAdmin(req, res)) return;

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const id = String(req.query?.id || '').trim();
  if (!id.startsWith('prod_')) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  try {
    const stripe = getStripe();
    // Archive rather than delete — Stripe forbids deleting products with prices.
    await stripe.products.update(id, { active: false });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('admin/client DELETE error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
