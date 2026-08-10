import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNearestObservation } from './_lib/meteofrance.js';
import { rateLimit } from './_lib/rateLimit.js';

/**
 * Latest measured conditions near a point, from the nearest Météo-France station.
 *
 * Returns 204 rather than an error when no station is in range or the portal is
 * unreachable: "no observation available here" is a normal answer, and the
 * frontend simply keeps the model forecast in that case.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await rateLimit(req, res, 'observation', 30))) return;

  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  try {
    const observation = await getNearestObservation(lat, lon);
    if (!observation) return res.status(204).end();
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(observation);
  } catch (err: any) {
    console.error('[API OBSERVATION ERROR]', err);
    res.status(500).json({ error: err.message });
  }
}
