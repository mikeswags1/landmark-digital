// /api/contact
// Logs contact-form submissions. Inspect via `vercel logs` or the Vercel dashboard.
// Hook up email / CRM later by extending this handler.

const { readJson, setCommonHeaders } = require('./_lib/stripe.js');

module.exports = async (req, res) => {
  setCommonHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = await readJson(req);
    const safe = {
      firstName: String(data.firstName || '').slice(0, 100),
      lastName: String(data.lastName || '').slice(0, 100),
      email: String(data.email || '').slice(0, 200),
      business: String(data.business || '').slice(0, 200),
      website: String(data.website || '').slice(0, 200),
      need: String(data.need || '').slice(0, 100),
      budget: String(data.budget || '').slice(0, 100),
      message: String(data.message || '').slice(0, 2000),
      received_at: new Date().toISOString(),
    };
    console.log('[contact]', JSON.stringify(safe));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
