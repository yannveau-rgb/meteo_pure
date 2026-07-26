import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateAiMorningBrief } from './_lib/gemini.js';
import { rateLimit } from './_lib/rateLimit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await rateLimit(req, res, 'morning-brief', 10))) return;

  const { birthDate, weatherCode, humorLevel, cityName, anchorInput } = req.body || {};
  if (!birthDate) return res.status(400).json({ error: 'birthDate is required' });

  try {
    const brief = await generateAiMorningBrief(
      birthDate,
      Number(weatherCode) || 0,
      humorLevel || 'spicy',
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
