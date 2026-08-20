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
