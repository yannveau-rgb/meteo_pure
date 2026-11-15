import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateAiMorningBrief } from './_lib/gemini.js';
import { rateLimit } from './_lib/rateLimit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await rateLimit(req, res, 'morning-brief', 10))) return;

  const { weatherCode, humorLevel, cityName, anchorInput } = req.body || {};

  try {
    const brief = await generateAiMorningBrief(
      Number(weatherCode) || 0,
      humorLevel || 'safe',
      cityName || 'Inconnu',
      anchorInput && typeof anchorInput === 'object'
        ? { ...anchorInput, weatherCode: Number(weatherCode) || 0 }
        : undefined
    );

    res.json(brief);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
