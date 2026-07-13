import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkAllSubscriptions } from '../_lib/weatherCheck.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron sends an `Authorization: Bearer <CRON_SECRET>` header.
  // We accept either CRON_SECRET (for Vercel Cron) or ADMIN_TOKEN (for manual triggers).
  const cronSecret = process.env.CRON_SECRET;
  const adminToken = process.env.ADMIN_TOKEN;
  const authHeader = req.headers['authorization'] || '';
  const adminHeader = req.headers['x-admin-token'] as string;

  const cronOK = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const adminOK = adminToken && adminHeader === adminToken;

  if (!cronOK && !adminOK) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await checkAllSubscriptions();
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[CRON] error:', err);
    res.status(500).json({ error: err.message });
  }
}
