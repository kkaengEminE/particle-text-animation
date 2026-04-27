import crypto from 'node:crypto';

/**
 * Vercel serverless function for Lemon Squeezy webhook verification.
 *
 * Environment variables (set in Vercel dashboard):
 *   LEMON_SQUEEZY_WEBHOOK_SECRET - Signing secret from Lemon Squeezy webhook config
 *
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Webhook] LEMON_SQUEEZY_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const rawBody = typeof req.body === 'string'
    ? req.body
    : JSON.stringify(req.body);

  const signature = req.headers['x-signature'];
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  // Verify HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const eventName = payload.meta?.event_name;

  switch (eventName) {
    case 'order_created':
      console.log('[Webhook] Order created:', payload.data?.id);
      break;

    case 'subscription_created':
      console.log('[Webhook] Subscription created:', payload.data?.id);
      break;

    case 'subscription_updated':
      console.log('[Webhook] Subscription updated:', payload.data?.id);
      break;

    case 'subscription_cancelled':
      console.log('[Webhook] Subscription cancelled:', payload.data?.id);
      break;

    default:
      console.log('[Webhook] Unhandled event:', eventName);
  }

  return res.status(200).json({ received: true });
}
