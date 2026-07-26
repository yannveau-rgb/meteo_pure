import { useEffect, useState } from 'react';
import { AirQualitySnapshot, fetchAirQuality } from '../utils/airQuality';

/**
 * Deliberately separate from useWeatherFetch: air quality is supplementary,
 * so a failure or slow response here must never delay or break the forecast.
 * It fails silently and the card simply doesn't render.
 */
export function useAirQuality(latitude?: number, longitude?: number) {
  const [data, setData] = useState<AirQualitySnapshot | null>(null);

  useEffect(() => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
    const controller = new AbortController();

    fetchAirQuality(latitude, longitude, controller.signal)
      .then(snapshot => {
        if (!controller.signal.aborted) setData(snapshot);
      })
      .catch(err => {
        if (err?.name !== 'AbortError') {
          console.warn('[AIR QUALITY] unavailable:', err?.message || err);
        }
      });

    return () => controller.abort();
  }, [latitude, longitude]);

  return data;
}
