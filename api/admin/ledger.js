// /api/admin/ledger
//   GET (x-admin-password header) → the Landmark Digital client ledger.
//
// Data lives server-side so revenue numbers never appear in public HTML.
// Claude updates this file whenever a deal closes or money lands
// (mirror of the client-ledger memory).

const { requireAdmin, setCommonHeaders } = require('../_lib/stripe.js');

const LEDGER = {
  updated: '2026-08-15',
  clients: [
    {
      name: 'Psychic Ashley',
      where: 'Rockaway, NJ',
      site: 'psychicashleynj.com',
      url: 'https://psychicashleynj.com',
      deal: 100, paid: 111, owed: 0,
      month: '2026-08',
      status: 'paid',
      note: 'Navy/gold one-pager, her own domain. Paid $111 via Square Aug 15 (receipt confirmed).',
    },
    {
      name: 'Sabrina Adams — Fairfield Psychic + The Village Psychic',
      where: 'Fairfield NJ · New Paltz NY',
      site: 'fairfieldnjpsychic.com · thevillagepsychic.com',
      url: 'https://fairfieldnjpsychic.com',
      deal: 275, paid: 275, owed: 0,
      month: '2026-06',
      status: 'paid',
      note: 'Two sites, Cal.com booking, domains migrated Wix→Namecheap→Vercel.',
    },
    {
      name: 'Psychic Dainze',
      where: '—',
      site: 'Boardwalk Mystique',
      url: 'https://boardwalk-mystique.vercel.app',
      deal: 150, paid: 100, owed: 50,
      month: '2026-07',
      status: 'owes',
      note: 'Paid $100 of $150 — $50 outstanding.',
    },
    {
      name: 'Hazel Gaetani',
      where: 'PA / NJ / NY (mobile)',
      site: 'hazelfaithgaetani-sarkisian.com',
      url: 'https://hazelfaithgaetani-sarkisian.com',
      deal: 150, paid: 0, owed: 150,
      month: '',
      status: 'owes',
      note: 'Pays per task. $75 checkout + $75 Google work agreed, not yet paid/built. Original build price untracked.',
    },
    {
      name: 'Jake — Select Surplus',
      where: 'Indiana + 4 states',
      site: 'selectsurplususa.com + Meta/Google ads',
      url: 'https://selectsurplususa.com',
      deal: null, paid: null, owed: 0,
      month: '',
      status: 'retainer',
      note: "Paid plenty so far (untracked). $750/mo retainer starting soon — log first payment when it lands.",
    },
  ],
  monthly: [
    { month: 'Jun 2026', amount: 275, note: 'Sabrina (approx timing)' },
    { month: 'Jul 2026', amount: 100, note: 'Dainze partial (approx timing)' },
    { month: 'Aug 2026', amount: 100, note: 'Ashley' },
  ],
  incomingMrr: 750,
  prospects: [
    { name: 'Psychic Stephanie', site: 'readingsbystephanie.landmarkdigital.agency', note: 'Hot lead — two design variants live for her to pick' },
    { name: 'Psychic Olivia (Psychic of Maryland)', site: 'psychicofmaryland.landmarkdigital.agency', note: 'Site live; booking form wires up when she pays' },
  ],
  demos: [
    { name: 'Psychic of Matthews (Savanna)', site: 'psychicofmatthews.landmarkdigital.agency' },
    { name: 'G-Cuts Barbershop — Anaheim CA (flagship, ~$100 target)', site: 'gcuts.landmarkdigital.agency' },
    { name: 'Peak Barber — Centennial CO', site: 'peakbarber.landmarkdigital.agency' },
    { name: 'Cut City — Danbury CT', site: 'cutcity.landmarkdigital.agency' },
    { name: "Sal's Barbershop — Phoenix AZ", site: 'salsbarbershop.landmarkdigital.agency' },
    { name: 'Greatest Cuts — West Palm Beach FL', site: 'greatestcuts.landmarkdigital.agency' },
  ],
  unknown: [
    'psychic-sophia', 'psychic-visions', 'psychic-michael', 'psychic-tracy',
    'lodi-psychic-glow', 'fontana-clairvoyance-craft', 'polished-cuts-digital', 'velazquez-auto-site',
  ],
};

module.exports = async (req, res) => {
  setCommonHeaders(res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!requireAdmin(req, res)) return;

  return res.status(200).json(LEDGER);
};
