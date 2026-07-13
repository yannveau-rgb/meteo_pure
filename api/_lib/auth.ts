import type { VercelRequest, VercelResponse } from '@vercel/node';

export function requireAdminToken(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    res.status(503).json({ error: 'ADMIN_TOKEN not configured on server' });
    return false;
  }
  const provided = req.headers['x-admin-token'] as string;
  if (provided !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
