// Shared Stripe client + auth + helpers.
// Files prefixed with `_` are not deployed as functions — used only for imports.

const Stripe = require('stripe');
const crypto = require('crypto');

let _stripe = null;
function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not set');
  _stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });
  return _stripe;
}

// Constant-time string compare so password checks don't leak via timing.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Admin password gate. Reads `x-admin-password` header.
// Returns true if valid, otherwise writes a 401 and returns false.
function requireAdmin(req, res) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    res.status(500).json({ error: 'ADMIN_PASSWORD not configured' });
    return false;
  }
  const provided = req.headers['x-admin-password'];
  if (!safeEqual(String(provided || ''), expected)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// Read a JSON body. Works for both Vercel Node functions (req.body parsed)
// and raw streams (e.g. when bodyParser is disabled for webhooks).
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// Read the raw body — used by Stripe webhook signature verification.
function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Slugify a client name. "Acme Plumbing & Co." -> "acme-plumbing-co"
function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Metadata tag we attach to every Stripe Product we create here.
// Lets us list/filter only our clients (Stripe accounts often hold other Products).
const TAG_KEY = 'landmark_client';
const TAG_VALUE = '1';

// CORS helpers — same-origin only, but safe for local dev with vercel dev.
function setCommonHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
}

module.exports = {
  getStripe,
  requireAdmin,
  readJson,
  readRaw,
  slugify,
  setCommonHeaders,
  TAG_KEY,
  TAG_VALUE,
};
