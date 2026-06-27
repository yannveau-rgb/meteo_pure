import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSubscriptions } from './_lib/storage.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const subs = await getSubscriptions();
    res.json({ status: 'ok', subscriptionsCount: subs.length });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
}
