import type { VercelRequest, VercelResponse } from '@vercel/node';
import webPush from 'web-push';
import { requireAdminToken } from './_lib/auth.js';
import { configureVapid } from './_lib/vapid.js';
import { getSubscriptions, withSubscriptionsLock } from './_lib/storage.js';

const MAX_TITLE = 80;
const MAX_MESSAGE = 240;
const BATCH_SIZE = 20;

/**
 * POST /api/broadcast — annonce libre envoyée à tous les abonnés (admin).
 *
 * Corps : { title: string, message: string, confirm?: boolean }
 * Sans `confirm: true`, rien n'est envoyé : la réponse indique seulement le
 * nombre de destinataires (« à blanc »). L'envoi réel est donc toujours un
 * second appel, volontaire.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdminToken(req, res)) return;

  const { title, message, confirm } = req.body || {};
  if (typeof title !== 'string' || typeof message !== 'string' || !title.trim() || !message.trim()) {
    return res.status(400).json({ error: 'title et message (texte non vide) sont requis.' });
  }
  if (title.length > MAX_TITLE || message.length > MAX_MESSAGE) {
    return res
      .status(400)
      .json({ error: `title ≤ ${MAX_TITLE} caractères, message ≤ ${MAX_MESSAGE} caractères.` });
  }

  const subs = await getSubscriptions();
  if (subs.length === 0) return res.status(404).json({ error: 'Aucun abonnement actif.' });

  if (confirm !== true) {
    return res.json({
      dryRun: true,
      recipients: subs.length,
      title: title.trim(),
      message: message.trim(),
      hint: 'Rien n\'a été envoyé. Rappelez avec "confirm": true pour envoyer.',
    });
  }

  configureVapid();
  const payload = JSON.stringify({
    title: title.trim(),
    message: message.trim(),
    intensity: 'announcement',
    city: '',
  });

  let successCount = 0;
  let failCount = 0;
  const deadIds = new Set<string>();

  for (let i = 0; i < subs.length; i += BATCH_SIZE) {
    const batch = subs.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (sub) => {
        try {
          await webPush.sendNotification(sub.subscription, payload, { urgency: 'normal', TTL: 86400 });
          successCount++;
        } catch (err: any) {
          failCount++;
          // Abonnement expiré ou révoqué : on le retire pour ne plus le retenter.
          if (err?.statusCode === 410 || err?.statusCode === 404) deadIds.add(sub.id);
        }
      })
    );
  }

  if (deadIds.size > 0) {
    await withSubscriptionsLock(async (current) => ({
      subs: current.filter((s) => !deadIds.has(s.id)),
      result: null,
    }));
  }

  return res.json({ success: true, successCount, failCount, removed: deadIds.size });
}
