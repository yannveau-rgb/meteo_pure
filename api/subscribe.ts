import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSubscriptions, saveSubscriptions, StoredSubscription } from './_lib/storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const {
    subscription, commune, humorLevel, currentConditions, birthDate,
    rainNotificationsEnabled, stormNotificationsEnabled, alertNotificationsEnabled,
    minMinutesBetweenAlerts
  } = req.body || {};
  if (!subscription || !commune) {
    return res.status(400).json({ error: 'Subscription and Commune are required' });
  }

  const subs = await getSubscriptions();
  const idx = subs.findIndex(s => s.subscription.endpoint === subscription.endpoint);

  const newSub: StoredSubscription = {
    id: idx >= 0 ? subs[idx].id : String(Date.now()),
    subscription,
    commune,
    humorLevel: humorLevel || 'spicy',
    birthDate: birthDate || '',
    prevHot: currentConditions ? currentConditions.temperature >= 30 : false,
    prevRain: currentConditions ? currentConditions.precipitation > 0 : false,
    prevStorm: currentConditions ? [95, 96, 99].includes(currentConditions.weatherCode) : false,
    prevVigilance: idx >= 0 ? (subs[idx].prevVigilance || 'green') : 'green',
    lastBriefDate: idx >= 0 ? (subs[idx].lastBriefDate || '') : '',
    lastChristmasDate: idx >= 0 ? (subs[idx].lastChristmasDate || '') : '',
    lastMonthlyXmasDate: idx >= 0 ? subs[idx].lastMonthlyXmasDate : undefined,
    lastTransitionPushAt: idx >= 0 ? subs[idx].lastTransitionPushAt : undefined,
    rainNotificationsEnabled: rainNotificationsEnabled !== false,
    stormNotificationsEnabled: stormNotificationsEnabled !== false,
    alertNotificationsEnabled: alertNotificationsEnabled !== false,
    minMinutesBetweenAlerts: typeof minMinutesBetweenAlerts === 'number' ? minMinutesBetweenAlerts : 30,
    updatedAt: new Date().toISOString()
  };

  if (idx >= 0) subs[idx] = newSub; else subs.push(newSub);
  await saveSubscriptions(subs);
  res.status(201).json({ success: true, id: newSub.id });
}
