import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';

let redis: Redis | null = null;

function hasUpstashCredentials(): boolean {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL ||
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ||
    process.env.KV_REST_API_TOKEN;
  return Boolean(url && token);
}

export function getRedis(): Redis {
  if (!redis) {
    const url =
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.UPSTASH_REDIS_REST_KV_REST_API_URL ||
      process.env.KV_REST_API_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ||
      process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error('Upstash Redis credentials missing (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN or KV_REST_API_* variants).');
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

const SUBS_KEY = 'meteo:subscriptions';

// server.ts (local dev) never has Upstash credentials, and used to keep its
// own hand-rolled subscribe/unsubscribe/cron logic to avoid depending on
// Redis — which is exactly how it drifted from api/_lib/weatherCheck.ts
// (no quiet hours, no cooldown, no category filters, still fires
// end_rain/end_storm...). Falling back to a local JSON file here instead
// lets server.ts reuse the *same* getSubscriptions/saveSubscriptions —
// and therefore the same checkAllSubscriptions — as production.
const LOCAL_FILE = path.join(process.cwd(), 'subscriptions.json');

function readLocalFile(): StoredSubscription[] {
  if (!fs.existsSync(LOCAL_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeLocalFile(subs: StoredSubscription[]): void {
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(subs, null, 2));
}

export interface StoredSubscription {
  id: string;
  subscription: any;
  commune: any;
  humorLevel: string;
  birthDate: string;
  prevHot: boolean;
  prevRain: boolean;
  prevStorm: boolean;
  prevVigilance: string;
  lastBriefDate: string;
  lastChristmasDate: string;
  lastMonthlyXmasDate?: string;
  updatedAt: string;
  rainNotificationsEnabled?: boolean;
  stormNotificationsEnabled?: boolean;
  alertNotificationsEnabled?: boolean;
  minMinutesBetweenAlerts?: number;
  lastTransitionPushAt?: string;
  // Last message index sent per notification category, so the next pick for
  // that same category can skip it and avoid an immediate repeat.
  lastMsgIndexByIntensity?: Record<string, number>;
}

export async function getSubscriptions(): Promise<StoredSubscription[]> {
  if (!hasUpstashCredentials()) return readLocalFile();
  const raw = await getRedis().get<StoredSubscription[]>(SUBS_KEY);
  return raw || [];
}

export async function saveSubscriptions(subs: StoredSubscription[]): Promise<void> {
  if (!hasUpstashCredentials()) return writeLocalFile(subs);
  await getRedis().set(SUBS_KEY, subs);
}

const LOCK_KEY = 'meteo:subscriptions:lock';

async function acquireLock(token: string, maxWaitMs = 4000): Promise<boolean> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const acquired = await getRedis().set(LOCK_KEY, token, { nx: true, ex: 15 });
    if (acquired) return true;
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 150));
  }
  return false;
}

async function releaseLock(token: string): Promise<void> {
  // Only clear the lock if it's still the one we set — otherwise we'd delete
  // a lock some other writer acquired after ours expired (15s TTL).
  const current = await getRedis().get<string>(LOCK_KEY);
  if (current === token) await getRedis().del(LOCK_KEY);
}

/**
 * Every writer of the subscriptions list (subscribe, unsubscribe, the cron's
 * checkAllSubscriptions) used to do its own unguarded GET-modify-SET on the
 * single meteo:subscriptions key. Three writers running concurrently — which
 * happens routinely, since 3 independent schedulers all hit the same cron
 * endpoint every 10 minutes while users can subscribe/unsubscribe any time —
 * could interleave: whichever SET lands last wins and silently discards the
 * other writer's changes (a lastBriefDate reset causing a duplicate morning
 * brief, a cooldown timestamp reverted so a rate-limited alert fires again).
 *
 * This wraps the whole read-modify-write cycle in a short-lived Redis lock
 * (SET NX EX) so concurrent writers queue instead of clobbering each other.
 * Local dev (file storage, single process) has no concurrent writers worth
 * locking, so it skips straight to the read-modify-write.
 */
export async function withSubscriptionsLock<T>(
  fn: (subs: StoredSubscription[]) => Promise<{ subs: StoredSubscription[]; result: T }>
): Promise<T> {
  if (!hasUpstashCredentials()) {
    const subs = await getSubscriptions();
    const { subs: newSubs, result } = await fn(subs);
    await saveSubscriptions(newSubs);
    return result;
  }

  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const locked = await acquireLock(token);
  if (!locked) {
    console.warn('[STORAGE] Could not acquire subscriptions lock in time, proceeding unlocked');
  }
  try {
    const subs = await getSubscriptions();
    const { subs: newSubs, result } = await fn(subs);
    await saveSubscriptions(newSubs);
    return result;
  } finally {
    if (locked) await releaseLock(token);
  }
}
