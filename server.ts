// dotenv was already a dependency but nothing ever imported it, so .env was
// silently ignored in development and every secret had to come from the shell.
import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import webPush from 'web-push';
import { createServer as createViteServer } from 'vite';
import { checkAllSubscriptions } from './api/_lib/weatherCheck.js';
import vapidPublicKeyHandler from './api/vapid-public-key.js';
import subscribeHandler from './api/subscribe.js';
import unsubscribeHandler from './api/unsubscribe.js';
import healthHandler from './api/health.js';
import observationHandler from './api/observation.js';
import morningBriefHandler from './api/morning-brief.js';
import testPushHandler from './api/test-push.js';
import cronCheckWeatherHandler from './api/cron/check-weather.js';

// This file used to carry its own copies of /api/subscribe, /api/unsubscribe,
// checkAllSubscriptions, etc. — hand-rolled so local dev could run without
// Redis/VAPID env vars. That duplicate logic quietly drifted from
// api/_lib/weatherCheck.ts (still fired end_rain/end_storm, no quiet hours,
// no cooldown, no per-category filters, 15 min instead of 10...), so testing
// a notification locally validated a behavior that didn't exist in
// production. It now mounts the same handler modules Vercel runs, with
// api/_lib/storage.ts falling back to a local JSON file when Upstash
// credentials are absent (see storage.ts) so those handlers work unchanged.

// Initialize VAPID keys for local dev (generated once, then reused) and
// export them as the env vars api/_lib/vapid.ts expects, so the real
// handlers work without any manual setup.
const VAPID_FILE = path.join(process.cwd(), 'vapid.json');
let vapidKeys: { publicKey: string; privateKey: string };

if (fs.existsSync(VAPID_FILE)) {
  vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
} else {
  vapidKeys = webPush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
}
process.env.VAPID_PUBLIC_KEY ||= vapidKeys.publicKey;
process.env.VAPID_PRIVATE_KEY ||= vapidKeys.privateKey;
// The cron/check-weather and test-push routes require ADMIN_TOKEN; generate
// a throwaway one for local dev if the developer hasn't set one, and log it
// so manual triggers via curl/Postman are still possible.
if (!process.env.ADMIN_TOKEN) {
  process.env.ADMIN_TOKEN = 'dev-' + Math.random().toString(36).slice(2, 10);
  console.log(`[DEV] ADMIN_TOKEN not set — generated for this run: ${process.env.ADMIN_TOKEN}`);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // The Vercel handlers are typed for VercelRequest/VercelResponse, which
  // Express's req/res satisfy structurally (headers, query, body, status().json()) —
  // hence the cast rather than a rewrite.
  const mount = (handler: (req: any, res: any) => any) =>
    (req: express.Request, res: express.Response) => handler(req, res);

  app.get('/api/vapid-public-key', mount(vapidPublicKeyHandler));
  app.post('/api/subscribe', mount(subscribeHandler));
  app.post('/api/unsubscribe', mount(unsubscribeHandler));
  app.get('/api/health', mount(healthHandler));
  app.get('/api/observation', mount(observationHandler));
  app.post('/api/morning-brief', mount(morningBriefHandler));
  app.post('/api/test-push', mount(testPushHandler));
  app.get('/api/cron/check-weather', mount(cronCheckWeatherHandler));

  // Periodic loop: same check the production cron runs, every 10 min to
  // match the external schedulers (see .github/workflows/weather-check.yml).
  setInterval(() => { checkAllSubscriptions().catch(err => console.error('[CRON] periodic check failed:', err)); }, 10 * 60 * 1000);
  // Also run 30 seconds after server starts, for quick local iteration.
  setTimeout(() => { checkAllSubscriptions().catch(err => console.error('[CRON] initial check failed:', err)); }, 30000);

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
