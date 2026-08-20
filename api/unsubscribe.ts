import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSubscriptionsLock } from './_lib/storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'Endpoint is required' });

  await withSubscriptionsLock(async (subs) => ({
    subs: subs.filter(s => s.subscription.endpoint !== endpoint),
    result: undefined,
  }));
  res.json({ success: true });
}
