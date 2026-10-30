// /api/contact
// Emails contact-form submissions to CONTACT_TO (via FormSubmit.co) and logs them.

const { readJson, setCommonHeaders } = require('./_lib/stripe.js');

// FormSubmit hash for msawaged12@gmail.com (delivery verified working;
// mikeswags1@gmail.com was spam-filtering the submissions).
const CONTACT_TO = '67925153a16662adff841be3175bb7ce';

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
    // NOTE: email delivery happens client-side in script.js (FormSubmit's
    // Cloudflare 403s server-to-server calls from Vercel). This endpoint is
    // the backup log so no lead is ever lost.
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
