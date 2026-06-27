import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis } from './storage.js';

export async function rateLimit(
  req: VercelRequest,
  res: VercelResponse,
  bucket: string,
  maxPerMinute: number
): Promise<boolean> {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 'unknown';
  const key = `ratelimit:${bucket}:${ip}`;
  try {
    const count = await getRedis().incr(key);
    if (count === 1) {
      await getRedis().expire(key, 60);
    }
    if (count > maxPerMinute) {
      res.status(429).json({ error: 'Too many requests' });
      return false;
    }
    return true;
  } catch {
    return true;
  }
}
