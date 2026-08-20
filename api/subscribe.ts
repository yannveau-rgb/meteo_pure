import type { VercelRequest, VercelResponse } from '@vercel/node';
import { StoredSubscription, withSubscriptionsLock } from './_lib/storage.js';

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

  const newSubId = await withSubscriptionsLock(async (subs) => {
    const idx = subs.findIndex(s => s.subscription.endpoint === subscription.endpoint);

    const newSub: StoredSubscription = {
      id: idx >= 0 ? subs[idx].id : String(Date.now()),
      subscription,
      commune,
      humorLevel: humorLevel || 'spicy',
      birthDate: birthDate || '',
      // currentConditions is only sent on first subscribe (App.tsx's silent
      // refresh omits it). Falling back to `false` here used to wipe the
      // tracked state on every resync, making the next cron pass think rain/
      // storm/heat had just *started* and re-fire a push for an episode
      // already announced. Preserve the previous value instead.
      prevHot: currentConditions ? currentConditions.temperature >= 30 : (idx >= 0 ? subs[idx].prevHot : false),
      prevRain: currentConditions ? currentConditions.precipitation > 0 : (idx >= 0 ? subs[idx].prevRain : false),
      prevStorm: currentConditions ? [95, 96, 99].includes(currentConditions.weatherCode) : (idx >= 0 ? subs[idx].prevStorm : false),
      prevVigilance: idx >= 0 ? (subs[idx].prevVigilance || 'green') : 'green',
      lastBriefDate: idx >= 0 ? (subs[idx].lastBriefDate || '') : '',
      lastChristmasDate: idx >= 0 ? (subs[idx].lastChristmasDate || '') : '',
      lastMonthlyXmasDate: idx >= 0 ? subs[idx].lastMonthlyXmasDate : undefined,
      lastTransitionPushAt: idx >= 0 ? subs[idx].lastTransitionPushAt : undefined,
      lastMsgIndexByIntensity: idx >= 0 ? subs[idx].lastMsgIndexByIntensity : undefined,
      rainNotificationsEnabled: rainNotificationsEnabled !== false,
      stormNotificationsEnabled: stormNotificationsEnabled !== false,
      alertNotificationsEnabled: alertNotificationsEnabled !== false,
      minMinutesBetweenAlerts: typeof minMinutesBetweenAlerts === 'number' ? minMinutesBetweenAlerts : 30,
      updatedAt: new Date().toISOString()
    };

    const newSubs = [...subs];
    if (idx >= 0) newSubs[idx] = newSub; else newSubs.push(newSub);
    return { subs: newSubs, result: newSub.id };
  });

  res.status(201).json({ success: true, id: newSubId });
}
