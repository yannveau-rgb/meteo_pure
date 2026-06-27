import { useEffect, useRef, useState } from 'react';
import { Commune, WeatherData } from '../types';
import { fetchWeatherData } from '../utils/weatherApi';

const REFRESH_MS = 10 * 60 * 1000;

interface PrevWeatherState {
  wasRaining: boolean;
  wasStorming: boolean;
  vigilanceLevel: string;
  wasHot: boolean;
}

export function useWeatherFetch(commune: Commune, onBackgroundRefresh?: () => void) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const prevWeatherRef = useRef<PrevWeatherState | null>(null);

  useEffect(() => {
    prevWeatherRef.current = null;

    let cancelled = false;
    async function loadWeather(showSkeleton = true) {
      if (showSkeleton) setLoading(true);
      setErrorMsg(null);
      try {
        const data = await fetchWeatherData(commune);
        if (!cancelled) setWeather(data);
      } catch (err) {
        console.error(err);
        if (!cancelled && showSkeleton) {
          setErrorMsg('Impossible de charger les données météo. Veuillez réessayer.');
        }
      } finally {
        if (!cancelled && showSkeleton) setLoading(false);
      }
    }
    loadWeather(true);

    const interval = setInterval(() => {
      loadWeather(false);
      onBackgroundRefresh?.();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // onBackgroundRefresh intentionally omitted to avoid resetting interval on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commune]);

  return { weather, setWeather, loading, errorMsg, prevWeatherRef };
}
