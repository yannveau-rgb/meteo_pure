import { WeatherData } from '../types';

/**
 * Last-known-good weather, per city.
 *
 * Without this the app is simply unusable offline: the Service Worker
 * deliberately skips `/api/`, and Open-Meteo lives on another origin whose
 * responses were never cached — so the SW's network-first fallback always
 * missed and the user got an error screen in a metro/lift/plane.
 *
 * Strategy is stale-while-revalidate: paint the cached forecast instantly,
 * refresh in the background, and *always* tell the user when what they're
 * looking at isn't live (see STALE_AFTER_MS).
 */

const PREFIX = 'meteo_cache_';
const MAX_AGE_MS = 3 * 60 * 60 * 1000;   // beyond 3h, showing nothing beats showing fiction
export const STALE_AFTER_MS = 20 * 60 * 1000; // past 20 min, badge it as not-live

export interface CachedWeather {
  data: WeatherData;
  at: number;
}

const keyFor = (cityKey: string) => `${PREFIX}${cityKey}`;

export function readWeatherCache(cityKey: string): CachedWeather | null {
  try {
    const raw = localStorage.getItem(keyFor(cityKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedWeather;
    if (!parsed?.data?.current || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > MAX_AGE_MS) {
      localStorage.removeItem(keyFor(cityKey));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeWeatherCache(cityKey: string, data: WeatherData): void {
  const payload = JSON.stringify({ data, at: Date.now() } satisfies CachedWeather);
  try {
    localStorage.setItem(keyFor(cityKey), payload);
  } catch {
    // Almost certainly a quota error — a full 7-day forecast is sizeable and
    // users with many favourites accumulate entries. Drop every cached city
    // and keep only the one being viewed.
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
      localStorage.setItem(keyFor(cityKey), payload);
    } catch {
      // Storage unavailable (private mode, disabled) — caching is optional.
    }
  }
}

export function isStale(at: number): boolean {
  return Date.now() - at > STALE_AFTER_MS;
}

export function formatCacheTime(at: number): string {
  return new Date(at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
