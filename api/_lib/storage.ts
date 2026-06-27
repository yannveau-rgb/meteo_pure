import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

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
  updatedAt: string;
}

export async function getSubscriptions(): Promise<StoredSubscription[]> {
  const raw = await getRedis().get<StoredSubscription[]>(SUBS_KEY);
  return raw || [];
}

export async function saveSubscriptions(subs: StoredSubscription[]): Promise<void> {
  await getRedis().set(SUBS_KEY, subs);
}
