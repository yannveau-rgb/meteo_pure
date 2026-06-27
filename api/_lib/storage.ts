import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = Redis.fromEnv();
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
