# Landmark Digital — Setup

This site is a static landing page plus three Vercel serverless functions that handle
custom monthly subscriptions through Stripe. Here's everything you need to get it live.

## 1. What's in the project

```
/                      static homepage (index.html + styles.css + script.js)
/admin.html            password-protected admin panel — create client subscriptions
/pay.html              customer-facing payment page (/pay?client=slug)
/success.html          post-checkout confirmation
/api/
  contact.js           logs contact-form submissions
  checkout-info.js     public — looks up a client's plan by slug
  create-checkout.js   public — creates a Stripe Checkout session
  stripe-webhook.js    receives Stripe events
  admin/
    login.js           verifies the admin password
    clients.js         GET (list) / POST (create) client subscriptions
    client.js          DELETE archives a client subscription
  _lib/stripe.js       shared helpers (auth, Stripe client)
package.json           declares the stripe SDK dependency
vercel.json            Vercel config (clean URLs)
.env.example           list of required env vars
```

## 2. One-time Stripe setup

You'll need three things from Stripe:

1. **Secret key** — Stripe Dashboard → Developers → API keys → copy your secret key
   (`sk_test_...` for testing, `sk_live_...` for production).
2. **Webhook signing secret** — Stripe Dashboard → Developers → Webhooks → Add endpoint.
   - Endpoint URL: `https://landmarkdigital.agency/api/stripe-webhook`
   - Events to send (at minimum):
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - After creating, click into the endpoint → "Signing secret" → copy (`whsec_...`).
3. **Admin password** — pick a strong password for the /admin panel.

## 3. Add environment variables in Vercel

Vercel Dashboard → your `landmark-digital` project → Settings → Environment Variables.

Add these three (Production + Preview + Development):

| Key                       | Value                                |
| ------------------------- | ------------------------------------ |
| `STRIPE_SECRET_KEY`       | `sk_live_...` (or `sk_test_...`)     |
| `STRIPE_WEBHOOK_SECRET`   | `whsec_...`                          |
| `ADMIN_PASSWORD`          | a strong password you choose         |
| `PUBLIC_SITE_URL`         | `https://landmarkdigital.agency` *(optional — used for success/cancel URLs)* |

After adding them, redeploy (Vercel does this automatically when you next push).

## 4. Push to GitHub → auto-deploy

```bash
cd landmark-digital
git add .
git commit -m "Premium redesign + custom Stripe subscriptions"
git push
```

Vercel watches the `master` branch and ships automatically.

The first build will install the `stripe` package and deploy the serverless functions.

## 5. How to use the admin panel

1. Go to `https://landmarkdigital.agency/admin`
2. Enter your `ADMIN_PASSWORD`
3. **Create a new client subscription:**
   - Client/business name → "Acme Plumbing"
   - URL slug auto-fills → "acme-plumbing" (override if you want)
   - $ / month → "497"
   - Internal note (optional, for your reference)
   - Click **Create subscription**
4. You'll get back a shareable URL: `https://landmarkdigital.agency/pay?client=acme-plumbing`
5. Send that URL to the client. They land on a branded page showing their plan,
   click Subscribe, and pay through Stripe's hosted checkout.

## 6. How clients pay

When a client visits `/pay?client=acme-plumbing`:

1. The page calls `/api/checkout-info` to fetch the plan name + price from Stripe.
2. Client clicks "Subscribe — pay monthly".
3. `/api/create-checkout` creates a Stripe Checkout Session and redirects them.
4. Stripe handles card entry, 3-D Secure, etc.
5. On success, they land on `/success.html`. Stripe also emails a receipt.
6. The `/api/stripe-webhook` endpoint logs the subscription event.

All subscription management (card updates, cancellations, refunds) lives in your Stripe
Dashboard. The admin panel is only for *creating* and *archiving* client plans.

## 7. Archiving vs. canceling

- **Archive (in /admin)**: marks the Stripe Product inactive so the `/pay?client=...`
  link returns "not found". Does NOT cancel existing subscriptions.
- **Cancel a subscription**: do it in Stripe Dashboard → Customers → the customer →
  Subscriptions → Cancel.

## 8. Local development (optional)

If you ever want to develop locally instead of pushing to Vercel each time:

```bash
npm install
npm install -g vercel
vercel link            # link to your Vercel project
vercel env pull .env.local   # pull env vars from Vercel
vercel dev             # runs locally on http://localhost:3000
```

For local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

(Stripe CLI: https://stripe.com/docs/stripe-cli)

## 9. Quick verification checklist after deploy

- [ ] `https://landmarkdigital.agency/` loads with the new design
- [ ] `/admin` asks for the password and accepts it
- [ ] Creating a test client in /admin returns a `/pay?client=...` URL
- [ ] That URL shows the correct name + price
- [ ] Clicking Subscribe redirects to a Stripe Checkout page (use test card `4242 4242 4242 4242`, any future date, any CVC, any ZIP)
- [ ] After paying, you land on `/success.html`
- [ ] In Stripe Dashboard → Customers, the new subscription appears
- [ ] In Vercel Logs, the webhook event is logged

If anything 500s, check Vercel → Deployments → latest → Functions → Logs.
