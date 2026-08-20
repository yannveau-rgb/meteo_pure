import { useCallback, useEffect, useRef, useState } from 'react';
import { Commune, WeatherData } from '../types';
import { fetchWeatherData } from '../utils/weatherApi';
import { readWeatherCache, writeWeatherCache, isStale } from '../utils/weatherCache';

const REFRESH_MS = 10 * 60 * 1000;

export function useWeatherFetch(commune: Commune, onBackgroundRefresh?: () => void) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  /** Timestamp of the data currently displayed — null while it is live. */
  const [staleSince, setStaleSince] = useState<number | null>(null);
  /** True during a silent (no-skeleton) refetch — e.g. switching to a city
   *  whose cache we already painted. `loading` alone can't cover this: it
   *  stays false so the cached content keeps showing, which used to leave
   *  city changes with zero feedback that a fetch was even happening. */
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const lastFetchRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const onRefreshRef = useRef(onBackgroundRefresh);
  onRefreshRef.current = onBackgroundRefresh;

  const cacheKey = commune?.code || commune?.nom || 'unknown';

  const load = useCallback(async (showSkeleton: boolean) => {
    // Supersede any in-flight request: without this, switching cities quickly
    // let an older response land after a newer one and overwrite it.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (showSkeleton) setLoading(true);
    else setRefreshing(true);
    setErrorMsg(null);
    try {
      const data = await fetchWeatherData(commune, controller.signal);
      if (controller.signal.aborted) return;
      setWeather(data);
      setStaleSince(null);
      lastFetchRef.current = Date.now();
      writeWeatherCache(cacheKey, data);
    } catch (err) {
      if (controller.signal.aborted || (err as any)?.name === 'AbortError') return;
      console.error(err);
      // A cached forecast already on screen is far better than an error page;
      // only surface the error when we have nothing at all to show.
      const cached = readWeatherCache(cacheKey);
      if (cached) {
        setWeather(cached.data);
        setStaleSince(cached.at);
      } else if (showSkeleton) {
        setErrorMsg('Impossible de charger les données météo. Veuillez réessayer.');
      }
    } finally {
      if (!controller.signal.aborted) {
        if (showSkeleton) setLoading(false);
        else setRefreshing(false);
      }
    }
  }, [commune, cacheKey]);

  useEffect(() => {
    // Paint last-known-good instantly, then revalidate (stale-while-revalidate).
    const cached = readWeatherCache(cacheKey);
    if (cached) {
      setWeather(cached.data);
      setStaleSince(isStale(cached.at) ? cached.at : null);
      setLoading(false);
      load(false);
    } else {
      load(true);
    }

    const interval = setInterval(() => {
      // A backgrounded tab used to keep firing 3 API calls every 10 minutes
      // for hours on end. Refresh happens on return instead.
      if (document.hidden) return;
      load(false);
      onRefreshRef.current?.();
    }, REFRESH_MS);

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastFetchRef.current >= REFRESH_MS) {
        load(false);
        onRefreshRef.current?.();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      abortRef.current?.abort();
    };
  }, [cacheKey, load]);

  return { weather, setWeather, loading, refreshing, errorMsg, setErrorMsg, staleSince };
}
