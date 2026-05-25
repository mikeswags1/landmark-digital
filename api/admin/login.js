// /api/admin/login
//   POST { password } → { ok: true } if it matches ADMIN_PASSWORD.
//
// Used by /admin to verify the password once before storing it
// in sessionStorage and including it on subsequent requests.

const { requireAdmin, setCommonHeaders } = require('../_lib/stripe.js');

module.exports = async (req, res) => {
  setCommonHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Reuse requireAdmin by injecting the password from the body into the header.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Build a tiny shim req so requireAdmin reads from the body.
  const shim = { headers: { 'x-admin-password': body.password || '' } };
  if (!requireAdmin(shim, res)) return;

  return res.status(200).json({ ok: true });
};
