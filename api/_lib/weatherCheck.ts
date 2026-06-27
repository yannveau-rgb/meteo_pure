import webPush from 'web-push';
import { calculateVigilance } from '../../src/utils/weatherUtils';
import { getFunnyRainMessage, getSarcasticChristmasCountdownMessage } from '../../src/utils/notificationService';
import { generateAiMorningBrief } from './gemini';
import { getSubscriptions, saveSubscriptions } from './storage';
import { configureVapid } from './vapid';

export async function checkAllSubscriptions(): Promise<{ checked: number; sent: number }> {
  configureVapid();
  const subs = await getSubscriptions();
  if (subs.length === 0) return { checked: 0, sent: 0 };

  let sent = 0;

  for (const sub of subs) {
    try {
      const [longitude, latitude] = sub.commune.centre.coordinates;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=Europe/Paris`;
      const response = await fetch(url);
      if (!response.ok) continue;
      const weather: any = await response.json();
      if (!weather?.current) continue;

      const currentTemp = weather.current.temperature_2m;
      const currentWind = weather.current.wind_speed_10m || 0;
      const isRainingNow = weather.current.precipitation > 0;
      const isStormingNow = [95, 96, 99].includes(weather.current.weather_code);
      const isHotNow = currentTemp >= 30;

      const vigilanceStatus = calculateVigilance(
        currentTemp,
        currentWind,
        weather.current.weather_code || 0,
        weather.current.precipitation || 0
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
          const brief = await generateAiMorningBrief(sub.birthDate, weather.current.weather_code || 0, sub.humorLevel, sub.commune.nom);
          if (brief) {
            try {
              await webPush.sendNotification(sub.subscription, JSON.stringify({
                title: brief.title,
                message: brief.body,
                intensity: 'morning_brief',
                city: sub.commune.nom
              }));
              sub.lastBriefDate = dateStrParis;
              sent++;
            } catch (err: any) {
              console.error('[PUSH] morning brief failed:', sub.id, err.statusCode);
            }
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
            }));
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
        if (isStormingNow && !sub.prevStorm) { transitionType = 'thunderstorm'; shouldTrigger = true; }
        else if (isRainingNow && !sub.prevRain && !isStormingNow) { transitionType = 'moderate'; shouldTrigger = true; }
        else if (isHotNow && !sub.prevHot) { transitionType = 'heatwave'; shouldTrigger = true; }
        else if (!isRainingNow && sub.prevRain) { transitionType = 'end_rain'; shouldTrigger = true; }
        else if (!isStormingNow && sub.prevStorm) { transitionType = 'end_storm'; shouldTrigger = true; }
      }

      sub.prevHot = isHotNow;
      sub.prevRain = isRainingNow;
      sub.prevStorm = isStormingNow;
      sub.prevVigilance = currentVigilance;
      sub.updatedAt = new Date().toISOString();

      if (shouldTrigger && transitionType) {
        const msg = getFunnyRainMessage(transitionType, sub.humorLevel as any);
        try {
          await webPush.sendNotification(sub.subscription, JSON.stringify({
            title: msg.title,
            message: msg.message,
            intensity: transitionType,
            city: sub.commune.nom
          }));
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
