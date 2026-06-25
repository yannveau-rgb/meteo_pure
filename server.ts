import express from 'express';
import path from 'path';
import fs from 'fs';
import webPush from 'web-push';
import { createServer as createViteServer } from 'vite';
import { getFunnyRainMessage, getMorningBriefContent, getSarcasticChristmasCountdownMessage } from './src/utils/notificationService';
import { calculateVigilance } from './src/utils/weatherUtils';

// Initialize VAPID Keys
const VAPID_FILE = path.join(process.cwd(), 'vapid.json');
let vapidKeys: { publicKey: string; privateKey: string };

if (fs.existsSync(VAPID_FILE)) {
  vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
} else {
  vapidKeys = webPush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
}

// Configure WebPush
webPush.setVapidDetails(
  'mailto:Yann.Veau@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'subscriptions.json');

// Helper to load/save subscriptions
function getSubscriptions(): any[] {
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveSubscriptions(subs: any[]): void {
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Route: Get VAPID public key
  app.get('/api/vapid-public-key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  // API Route: Subscribe to background notifications
  app.post('/api/subscribe', (req, res) => {
    const { subscription, commune, humorLevel, currentConditions, birthDate } = req.body;
    if (!subscription || !commune) {
      return res.status(400).json({ error: 'Subscription and Commune are required' });
    }

    const subs = getSubscriptions();
    // Check if endpoint already exists
    const idx = subs.findIndex(s => s.subscription.endpoint === subscription.endpoint);
    
    const newSub = {
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
      updatedAt: new Date().toISOString()
    };

    if (idx >= 0) {
      subs[idx] = newSub;
    } else {
      subs.push(newSub);
    }

    saveSubscriptions(subs);
    res.status(201).json({ success: true, id: newSub.id });
  });

  // API Route: Unsubscribe
  app.post('/api/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    const subs = getSubscriptions();
    const updated = subs.filter(s => s.subscription.endpoint !== endpoint);
    saveSubscriptions(updated);
    res.json({ success: true });
  });

  // API Route: Healthcheck/Status
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', subscriptionsCount: getSubscriptions().length });
  });

  // API Route: Trigger background weather checking manually (ideal for Cloud Scheduler cron tasks)
  app.get('/api/cron/check-weather', async (req, res) => {
    console.log('[CRON] Manual or Cloud Scheduler trigger received.');
    try {
      await checkAllSubscriptions();
      res.json({ success: true, message: 'Surveillance météo terminée avec succès.' });
    } catch (err: any) {
      console.error('[CRON ERROR] Failed to run weather check:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Send a test Web Push notification to all active subscribers or a specific subscription endpoint
  app.post('/api/test-push', async (req, res) => {
    const { intensity, humorLevel } = req.body;
    const level = humorLevel || 'spicy';
    const type = intensity || 'moderate';
    
    const subs = getSubscriptions();
    if (subs.length === 0) {
      return res.status(404).json({ error: 'Aucun abonnement actif enregistré sur le serveur.' });
    }

    console.log(`[PUSH TEST] Sending test notification of type: ${type}, humor: ${level} to ${subs.length} subscriber(s).`);
    let successCount = 0;
    let failCount = 0;

    for (const sub of subs) {
      try {
        let msg;
        if (type === 'morning_brief') {
          const birth = sub.birthDate || '1990-01-01';
          const brief = getMorningBriefContent(level, birth, 61); // code 61 is moderate rain
          if (brief) {
            msg = { title: brief.title, message: brief.body };
          }
        } else if (type === 'christmas') {
          const christmasMsg = getSarcasticChristmasCountdownMessage(new Date(), level);
          if (christmasMsg) {
            msg = { title: christmasMsg.title, message: christmasMsg.body };
          }
        }

        if (!msg) {
          msg = getFunnyRainMessage(type, level);
        }

        await webPush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title: msg.title,
            message: msg.message || msg.body || "Ceci est un test de notification !",
            intensity: type,
            city: sub.commune.nom
          })
        );
        successCount++;
      } catch (err: any) {
        failCount++;
        console.error('[PUSH TEST ERROR] Failed to send push to subscription:', sub.id, err.statusCode);
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Clean up old subscriptions
          const currentSubs = getSubscriptions();
          saveSubscriptions(currentSubs.filter(s => s.id !== sub.id));
        }
      }
    }

    res.json({ success: true, successCount, failCount });
  });

  // Background weather checking logic
  async function checkAllSubscriptions() {
    console.log('[PUSH SERVICE] Periodically checking weather for subscriptions...');
    const subs = getSubscriptions();
    if (subs.length === 0) return;

    for (const sub of subs) {
      try {
        const [longitude, latitude] = sub.commune.centre.coordinates;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=Europe/Paris`;
        
        const response = await fetch(url);
        if (!response.ok) continue;
        const weather = await response.json();
        if (!weather || !weather.current) continue;

        const currentTemp = weather.current.temperature_2m;
        const currentWind = weather.current.wind_speed_10m || 0;
        const isRainingNow = weather.current.precipitation > 0;
        const isStormingNow = [95, 96, 99].includes(weather.current.weather_code);
        const isHotNow = currentTemp >= 30;

        // Calculate vigilance
        const vigilanceStatus = calculateVigilance(
          currentTemp,
          currentWind,
          weather.current.weather_code || 0,
          weather.current.precipitation || 0
        );
        const currentVigilance = vigilanceStatus.globalLevel || 'green';

        // Horoscope & Morning brief push at 8:00 AM (Europe/Paris timezone)
        if (sub.birthDate) {
          const now = new Date();
          const pStr = now.toLocaleTimeString('en-US', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false });
          const parisHour = parseInt(pStr, 10);
          const dateStrParis = now.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }); // style "YYYY-MM-DD"

          if (parisHour === 8 && sub.lastBriefDate !== dateStrParis) {
            console.log(`[PUSH SERVICE] Generating 8 AM horoscope/morning brief for sub ${sub.id} (${sub.commune.nom})`);
            const brief = getMorningBriefContent(sub.humorLevel, sub.birthDate, weather.current.weather_code || 0);
            if (brief) {
              await webPush.sendNotification(
                sub.subscription,
                JSON.stringify({
                  title: brief.title,
                  message: brief.body,
                  intensity: 'morning_brief',
                  city: sub.commune.nom
                })
              ).then(() => {
                sub.lastBriefDate = dateStrParis;
                console.log(`[PUSH SERVICE] Morning brief pushed successfully for sub ${sub.id}`);
              }).catch((err) => {
                console.error('[PUSH SERVICE] Failed to push morning brief to sub:', sub.id, err.statusCode);
              });
            }
          }
        }

        // Sarcastic Christmas countdown push on the 25th of every month at 8:00 AM (Europe/Paris timezone)
        {
          const now = new Date();
          const pStr = now.toLocaleTimeString('en-US', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false });
          const parisHour = parseInt(pStr, 10);
          const parisDayStr = now.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit' });
          const parisDay = parseInt(parisDayStr, 10);
          const dateStrParis = now.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }); // style "YYYY-MM-DD"

          if (parisHour === 8 && parisDay === 25 && sub.lastChristmasDate !== dateStrParis) {
            console.log(`[PUSH SERVICE] Generating 25th-of-the-month Christmas countdown for sub ${sub.id}`);
            
            const parisDateStrObj = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
            const parisNowObj = new Date(parisDateStrObj);
            
            const christmasMsg = getSarcasticChristmasCountdownMessage(parisNowObj, sub.humorLevel);
            if (christmasMsg) {
              await webPush.sendNotification(
                sub.subscription,
                JSON.stringify({
                  title: christmasMsg.title,
                  message: christmasMsg.body,
                  intensity: 'alert_orange',
                  city: sub.commune.nom
                })
              ).then(() => {
                sub.lastChristmasDate = dateStrParis;
                console.log(`[PUSH SERVICE] Christmas countdown pushed successfully for sub ${sub.id}`);
              }).catch((err) => {
                console.error('[PUSH SERVICE] Failed to push Christmas countdown to sub:', sub.id, err.statusCode);
              });
            }
          }
        }

        let shouldTrigger = false;
        let transitionType: 'light' | 'moderate' | 'heavy' | 'thunderstorm' | 'end_rain' | 'end_storm' | 'heatwave' | 'alert_yellow' | 'alert_orange' | 'alert_red' | null = null;

        // 1. Vigilance alert (checked first)
        const prevVigilance = sub.prevVigilance || 'green';
        if (currentVigilance !== prevVigilance) {
          if (currentVigilance !== 'green') {
            transitionType = currentVigilance === 'red' ? 'alert_red' : currentVigilance === 'orange' ? 'alert_orange' : 'alert_yellow';
            shouldTrigger = true;
          }
        }

        // 2. Standard meteorological alerts (only if vigilance alert didn't fire to avoid spam)
        if (!shouldTrigger) {
          // Storm start
          if (isStormingNow && !sub.prevStorm) {
            transitionType = 'thunderstorm';
            shouldTrigger = true;
          }
          // Rain start (only if not storming to avoid duplication)
          else if (isRainingNow && !sub.prevRain && !isStormingNow) {
            transitionType = 'moderate';
            shouldTrigger = true;
          }
          // Heatwave (Strong heat) start
          else if (isHotNow && !sub.prevHot) {
            transitionType = 'heatwave';
            shouldTrigger = true;
          }
          // End rain
          else if (!isRainingNow && sub.prevRain) {
            transitionType = 'end_rain';
            shouldTrigger = true;
          }
          // End storm
          else if (!isStormingNow && sub.prevStorm) {
            transitionType = 'end_storm';
            shouldTrigger = true;
          }
        }

        // Update stored states
        sub.prevHot = isHotNow;
        sub.prevRain = isRainingNow;
        sub.prevStorm = isStormingNow;
        sub.prevVigilance = currentVigilance;
        sub.updatedAt = new Date().toISOString();

        if (shouldTrigger && transitionType) {
          console.log(`[PUSH SERVICE] Sending ${transitionType} alert for ${sub.commune.nom}`);
          const msg = getFunnyRainMessage(transitionType, sub.humorLevel);
          
          await webPush.sendNotification(
            sub.subscription,
            JSON.stringify({
              title: msg.title,
              message: msg.message,
              intensity: transitionType,
              city: sub.commune.nom
            })
          ).catch((err) => {
            console.error('[PUSH SERVICE] Failed to send push to sub:', sub.id, err.statusCode);
            if (err.statusCode === 410 || err.statusCode === 404) {
              // Endpoint no longer active, clean up
              console.log('[PUSH SERVICE] Subscription gone (410/404), removing...');
              const currentSubs = getSubscriptions();
              saveSubscriptions(currentSubs.filter(s => s.id !== sub.id));
            }
          });
        }
      } catch (err) {
        console.error('[PUSH SERVICE] Error checking subscription:', sub.id, err);
      }
    }
    saveSubscriptions(subs);
  }

  // Periodic loop: Run check every 15 minutes
  setInterval(checkAllSubscriptions, 15 * 60 * 1000);
  
  // Also run 30 seconds after server starts to trigger initial alerts
  setTimeout(checkAllSubscriptions, 30000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
