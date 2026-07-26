import webPush from 'web-push';
import { calculateVigilance } from '../../src/utils/weatherUtils.js';
import { getFunnyRainMessage, getSarcasticChristmasCountdownMessage, getMonthlyChristmasCountdown } from '../../src/utils/notificationService.js';
import { generateAiMorningBrief } from './gemini.js';
import { analyzeRainTiming, MorningAnchorInput } from '../../src/utils/morningAnchor.js';
import { getSubscriptions, saveSubscriptions } from './storage.js';
import { configureVapid } from './vapid.js';

export async function checkAllSubscriptions(): Promise<{ checked: number; sent: number }> {
  configureVapid();
  const subs = await getSubscriptions();
  if (subs.length === 0) return { checked: 0, sent: 0 };

  let sent = 0;

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

      // Transition alerts
      let shouldTrigger = false;
      let transitionType: any = null;
      const prevVigilance = sub.prevVigilance || 'green';
      if (currentVigilance !== prevVigilance && currentVigilance !== 'green') {
        transitionType = currentVigilance === 'red' ? 'alert_red' : currentVigilance === 'orange' ? 'alert_orange' : 'alert_yellow';
        shouldTrigger = true;
      }
      if (!shouldTrigger) {
        // "end_rain" / "end_storm" deliberately no longer notify. Telling
        // someone it stopped raining prompts no action — they can see out of a
        // window — while mechanically doubling the notification count of every
        // single rain episode. They remain tracked as state (below) so the
        // *start* of the next episode is still detected correctly.
        if (isStormingNow && !sub.prevStorm) { transitionType = 'thunderstorm'; shouldTrigger = true; }
        else if (isRainingNow && !sub.prevRain && !isStormingNow) { transitionType = 'moderate'; shouldTrigger = true; }
        else if (isHotNow && !sub.prevHot) { transitionType = 'heatwave'; shouldTrigger = true; }
      }

      sub.prevHot = isHotNow;
      sub.prevRain = isRainingNow;
      sub.prevStorm = isStormingNow;
      sub.prevVigilance = currentVigilance;
      sub.updatedAt = new Date().toISOString();

      // Respect the per-category toggles the user set in Réglages — these used
      // to only be enforced client-side, so the server pushed every category
      // to everyone regardless of their preferences. This was a major source
      // of "too many notifications" complaints once the cron started running
      // reliably every 10 min.
      if (shouldTrigger) {
        const isAlertType = ['alert_yellow', 'alert_orange', 'alert_red', 'heatwave'].includes(transitionType);
        const isStormType = ['thunderstorm', 'end_storm'].includes(transitionType);
        const isRainType = ['moderate', 'light', 'heavy', 'end_rain'].includes(transitionType);
        if (isAlertType && sub.alertNotificationsEnabled === false) shouldTrigger = false;
        else if (isStormType && sub.stormNotificationsEnabled === false) shouldTrigger = false;
        else if (isRainType && sub.rainNotificationsEnabled === false) shouldTrigger = false;
      }

      // Quiet hours: nothing routine wakes anyone between 22h and 7h Paris.
      // Orange/red vigilance is exempt — a violent storm at 3am is precisely
      // when a notification earns its keep.
      const isSafetyCritical = transitionType === 'alert_orange' || transitionType === 'alert_red';
      if (shouldTrigger && !isSafetyCritical) {
        const hourNow = parseInt(
          new Date().toLocaleTimeString('en-US', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false }),
          10
        );
        if (hourNow >= 22 || hourNow < 7) shouldTrigger = false;
      }

      // Cooldown between routine pushes to the same person, so a borderline
      // value flip-flopping across checks (e.g. precipitation hovering right
      // at 0mm) can't fire a burst of alerts. Orange/red vigilance bypasses
      // it — those are safety-relevant and should never be suppressed.
      if (shouldTrigger && transitionType !== 'alert_orange' && transitionType !== 'alert_red') {
        const cooldownMin = typeof sub.minMinutesBetweenAlerts === 'number' ? sub.minMinutesBetweenAlerts : 30;
        if (sub.lastTransitionPushAt) {
          const elapsedMin = (Date.now() - new Date(sub.lastTransitionPushAt).getTime()) / 60000;
          if (elapsedMin < cooldownMin) shouldTrigger = false;
        }
      }

      if (shouldTrigger && transitionType) {
        const msg = getFunnyRainMessage(transitionType, sub.humorLevel as any);
        try {
          await webPush.sendNotification(sub.subscription, JSON.stringify({
            title: msg.title,
            message: msg.message,
            intensity: transitionType,
            city: sub.commune.nom
          }), { urgency: 'high', TTL: 3600 });
          sub.lastTransitionPushAt = new Date().toISOString();
          sent++;
        } catch (err: any) {
          console.error('[PUSH] alert failed:', sub.id, err.statusCode);
          if (err.statusCode === 410 || err.statusCode === 404) {
            const fresh = await getSubscriptions();
            await saveSubscriptions(fresh.filter(s => s.id !== sub.id));
          }
        }
      }
    } catch (err) {
      console.error('[PUSH] check error:', sub.id, err);
    }
  }

  await saveSubscriptions(subs);
  return { checked: subs.length, sent };
}
