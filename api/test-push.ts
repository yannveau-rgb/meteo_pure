import type { VercelRequest, VercelResponse } from '@vercel/node';
import webPush from 'web-push';
import { requireAdminToken } from './_lib/auth.js';
import { configureVapid } from './_lib/vapid.js';
import { getSubscriptions, saveSubscriptions } from './_lib/storage.js';
import { generateAiMorningBrief } from './_lib/gemini.js';
import { getFunnyRainMessage, getSarcasticChristmasCountdownMessage } from '../src/utils/notificationService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdminToken(req, res)) return;

  configureVapid();
  const { intensity, humorLevel } = req.body || {};
  const level = humorLevel || 'spicy';
  const type = intensity || 'moderate';

  const subs = await getSubscriptions();
  if (subs.length === 0) return res.status(404).json({ error: 'Aucun abonnement actif.' });

  let successCount = 0;
  let failCount = 0;

  for (const sub of subs) {
    try {
      let msg: any;
      if (type === 'morning_brief') {
        const brief = await generateAiMorningBrief(sub.birthDate || '1990-01-01', 61, level, sub.commune.nom);
        if (brief) msg = { title: brief.title, message: brief.body };
      } else if (type === 'christmas') {
        const christmasMsg = getSarcasticChristmasCountdownMessage(new Date(), level);
        if (christmasMsg) msg = { title: christmasMsg.title, message: christmasMsg.body };
      }
      if (!msg) msg = getFunnyRainMessage(type, level);

      await webPush.sendNotification(sub.subscription, JSON.stringify({
        title: msg.title,
        message: msg.message || msg.body || 'Test',
        intensity: type,
        city: sub.commune.nom
      }));
      successCount++;
    } catch (err: any) {
      failCount++;
      if (err.statusCode === 410 || err.statusCode === 404) {
        const fresh = await getSubscriptions();
        await saveSubscriptions(fresh.filter(s => s.id !== sub.id));
      }
    }
  }

  res.json({ success: true, successCount, failCount });
}
