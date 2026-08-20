import webPush from 'web-push';
import { calculateVigilance } from '../../src/utils/weatherUtils.js';
import { getFunnyRainMessage, getSarcasticChristmasCountdownMessage, getMonthlyChristmasCountdown } from '../../src/utils/notificationService.js';
import { generateAiMorningBrief } from './gemini.js';
import { analyzeRainTiming, MorningAnchorInput } from '../../src/utils/morningAnchor.js';
import { getSubscriptions, withSubscriptionsLock } from './storage.js';
import { configureVapid } from './vapid.js';
import { decideTransition } from '../../src/utils/transitionDecision.js';

// Fields this cron run is allowed to overwrite when it saves. Everything
// else on a subscription (commune, humorLevel, notification prefs...) is
// re-read fresh at save time and left untouched, so a subscribe/unsubscribe
// that happened during this run's ~11-subscriber loop of weather fetches
// and pushes (which can take a while — this doesn't hold the write lock)
// never gets clobbered by this run's now-stale copy of those fields.
const CRON_OWNED_FIELDS = [
  'prevHot', 'prevRain', 'prevStorm', 'prevVigilance', 'updatedAt',
  'lastBriefDate', 'lastMonthlyXmasDate', 'lastChristmasDate',
  'lastTransitionPushAt', 'lastMsgIndexByIntensity',
] as const;

export async function checkAllSubscriptions(): Promise<{ checked: number; sent: number }> {
  configureVapid();
  const subs = await getSubscriptions();
  if (subs.length === 0) return { checked: 0, sent: 0 };

  let sent = 0;
  // Collected here instead of saved immediately: the loop's final
  // `saveSubscriptions(subs)` (below) used to overwrite an in-place removal
  // with the original, still-including-the-dead-entry `subs` array, so the
  // cleanup never actually stuck.
  const deadIds = new Set<string>();

  for (const sub of subs) {
    try {
      const [longitude, latitude] = sub.commune.centre.coordinates;
      // Use Météo-France AROME model (1.3 km) for server-side alerts with full parameters
      const url = `https://api.open-meteo.com/v1/meteofrance?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover&hourly=precipitation,precipitation_probability&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,uv_index_max,wind_gusts_10m_max&timezone=Europe/Paris`;
      const response = await fetch(url);
      if (!response.ok) continue;
      const weather: any = await response.json();
      if (!weather?.current) continue;

      const currentTemp = weather.current.temperature_2m;
      const currentWind = Math.max(weather.current.wind_speed_10m || 0, weather.current.wind_gusts_10m || 0);
      const isRainingNow = weather.current.precipitation > 0;
      const isStormingNow = [95, 96, 99].includes(weather.current.weather_code);
      const isHotNow = (weather.current.apparent_temperature ?? currentTemp) >= 30;

      const vigilanceStatus = calculateVigilance(
        currentTemp,
        currentWind,
        weather.current.weather_code || 0,
        weather.current.precipitation || 0,
        weather.daily?.precipitation_sum?.[0]
      );
      const currentVigilance = vigilanceStatus.globalLevel || 'green';

      // 8 AM morning brief (Europe/Paris)
      if (sub.birthDate) {
        const now = new Date();
        const pStr = now.toLocaleTimeString('en-US', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false });
        const parisHour = parseInt(pStr, 10);
        const dateStrParis = now.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });

        // Window 6-10 AM Paris so a once-daily Vercel Hobby cron still hits reliably
        if (parisHour >= 6 && parisHour <= 10 && sub.lastBriefDate !== dateStrParis) {
          // Today's hours, used to say *when* rain starts rather than just "il pleuvra".
          const todaysHours = (weather.hourly?.time || [])
            .map((t: string, i: number) => ({
              hour: parseInt(t.substring(11, 13), 10),
              precip: weather.hourly?.precipitation?.[i] ?? 0,
              precipProb: weather.hourly?.precipitation_probability?.[i] ?? 0,
              isToday: t.startsWith(dateStrParis),
            }))
            .filter((h: any) => h.isToday);

          const rainTiming = analyzeRainTiming(todaysHours);
          const anchorInput: MorningAnchorInput = {
            weatherCode: weather.current.weather_code || 0,
            tempMax: weather.daily?.temperature_2m_max?.[0],
            tempMin: weather.daily?.temperature_2m_min?.[0],
            uvMax: weather.daily?.uv_index_max?.[0],
            windGustsMax: weather.daily?.wind_gusts_10m_max?.[0],
            precipSum: weather.daily?.precipitation_sum?.[0],
            rainStartsAtHour: rainTiming.startsAtHour,
            rainAllDay: rainTiming.allDay,
          };

          const brief = await generateAiMorningBrief(
            sub.birthDate, weather.current.weather_code || 0, sub.humorLevel, sub.commune.nom, anchorInput
          );
          if (brief) {
            try {
              // Title carries the facts so it's readable on a locked screen
              // without expanding the notification; the joke goes in the body.
              await webPush.sendNotification(sub.subscription, JSON.stringify({
                title: brief.anchor,
                message: brief.punchline,
                intensity: 'morning_brief',
                city: sub.commune.nom
              }), { urgency: 'high', TTL: 3600 });
              sub.lastBriefDate = dateStrParis;
              sent++;
            } catch (err: any) {
              console.error('[PUSH] morning brief failed:', sub.id, err.statusCode);
            }
          }
        }
      }

      // 1st of month: monthly Christmas countdown (all year long)
      {
        const now1 = new Date();
        const pHour1 = parseInt(now1.toLocaleTimeString('en-US', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false }), 10);
        const pDay1 = parseInt(now1.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit' }), 10);
        const monthKey = now1.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }).substring(0, 7); // "YYYY-MM"

        if (pDay1 === 1 && pHour1 >= 7 && pHour1 <= 10 && (sub as any).lastMonthlyXmasDate !== monthKey) {
          const parisNow1 = new Date(now1.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
          const msg = getMonthlyChristmasCountdown(parisNow1, sub.humorLevel as any);
          try {
            await webPush.sendNotification(sub.subscription, JSON.stringify({
              title: msg.title,
              message: msg.body,
              intensity: 'alert_yellow',
              city: sub.commune.nom
            }), { urgency: 'high', TTL: 7200 });
            (sub as any).lastMonthlyXmasDate = monthKey;
            sent++;
          } catch (err: any) {
            console.error('[PUSH] monthly xmas failed:', sub.id, err.statusCode);
          }
        }
      }

      // 25th of month Christmas countdown
      const now2 = new Date();
      const pHourStr = now2.toLocaleTimeString('en-US', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false });
      const parisHour2 = parseInt(pHourStr, 10);
      const parisDayStr = now2.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit' });
      const parisDay = parseInt(parisDayStr, 10);
      const dateStrParis2 = now2.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });

      if (parisHour2 >= 6 && parisHour2 <= 10 && parisDay === 25 && sub.lastChristmasDate !== dateStrParis2) {
        const parisDateStrObj = now2.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
        const parisNowObj = new Date(parisDateStrObj);
        const christmasMsg = getSarcasticChristmasCountdownMessage(parisNowObj, sub.humorLevel as any);
        if (christmasMsg) {
          try {
            await webPush.sendNotification(sub.subscription, JSON.stringify({
              title: christmasMsg.title,
              message: christmasMsg.body,
              intensity: 'alert_orange',
              city: sub.commune.nom
            }), { urgency: 'high', TTL: 3600 });
            sub.lastChristmasDate = dateStrParis2;
            sent++;
          } catch (err: any) {
            console.error('[PUSH] christmas failed:', sub.id, err.statusCode);
          }
        }
      }

      // Transition alerts — decision logic lives in the pure, unit-tested
      // decideTransition() (vigilance priority, per-category opt-out, quiet
      // hours, cooldown) so it's testable without mocking Open-Meteo/web-push/Redis.
      const prevVigilance = sub.prevVigilance || 'green';
      const { shouldTrigger, transitionType } = decideTransition({
        currentVigilance,
        prevVigilance,
        isRainingNow,
        isStormingNow,
        isHotNow,
        prevRain: !!sub.prevRain,
        prevStorm: !!sub.prevStorm,
        prevHot: !!sub.prevHot,
        rainNotificationsEnabled: sub.rainNotificationsEnabled,
        stormNotificationsEnabled: sub.stormNotificationsEnabled,
        alertNotificationsEnabled: sub.alertNotificationsEnabled,
        minMinutesBetweenAlerts: sub.minMinutesBetweenAlerts,
        lastTransitionPushAt: sub.lastTransitionPushAt,
      }, new Date());

      sub.prevHot = isHotNow;
      sub.prevRain = isRainingNow;
      sub.prevStorm = isStormingNow;
      sub.prevVigilance = currentVigilance;
      sub.updatedAt = new Date().toISOString();

      if (shouldTrigger && transitionType) {
        const prevMsgIndex = sub.lastMsgIndexByIntensity?.[transitionType];
        const msg = getFunnyRainMessage(transitionType, sub.humorLevel as any, prevMsgIndex);
        try {
          await webPush.sendNotification(sub.subscription, JSON.stringify({
            title: msg.title,
            message: msg.message,
            intensity: transitionType,
            city: sub.commune.nom
          }), { urgency: 'high', TTL: 3600 });
          sub.lastTransitionPushAt = new Date().toISOString();
          sub.lastMsgIndexByIntensity = { ...(sub.lastMsgIndexByIntensity || {}), [transitionType]: msg.messageIndex };
          sent++;
        } catch (err: any) {
          console.error('[PUSH] alert failed:', sub.id, err.statusCode);
          if (err.statusCode === 410 || err.statusCode === 404) {
            deadIds.add(sub.id);
          }
        }
      }
    } catch (err) {
      console.error('[PUSH] check error:', sub.id, err);
    }
  }

  // Merge our processed fields onto a freshly-read copy rather than saving
  // this run's now-stale `subs` wholesale — see CRON_OWNED_FIELDS above.
  await withSubscriptionsLock(async (freshSubs) => {
    const byId = new Map(freshSubs.map((s) => [s.id, s]));
    for (const processed of subs) {
      if (deadIds.has(processed.id)) continue;
      const current = byId.get(processed.id);
      if (!current) continue; // unsubscribed while this run was in flight
      for (const field of CRON_OWNED_FIELDS) {
        (current as any)[field] = (processed as any)[field];
      }
    }
    return { subs: freshSubs.filter((s) => !deadIds.has(s.id)), result: undefined };
  });

  return { checked: subs.length, sent };
}
