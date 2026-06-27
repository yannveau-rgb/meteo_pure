import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSubscriptions, saveSubscriptions } from './_lib/storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'Endpoint is required' });

  const subs = await getSubscriptions();
  await saveSubscriptions(subs.filter(s => s.subscription.endpoint !== endpoint));
  res.json({ success: true });
}
