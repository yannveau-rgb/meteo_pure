import { StationObservation } from '../types';

/**
 * Latest measured conditions near a point, via our own /api/observation proxy.
 *
 * Deliberately silent on failure. The observation upgrades the forecast; it is
 * never load-bearing. A missing API key, an unsubscribed portal application, a
 * commune with no station in range and an offline user must all end the same
 * way: the model forecast, unchanged, with no error shown.
 */
export async function fetchObservation(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<StationObservation | null> {
  try {
    const res = await fetch(`/api/observation?lat=${latitude}&lon=${longitude}`, { signal });
    // 204 = no trustworthy station here, which is a normal answer.
    if (res.status === 204 || !res.ok) return null;
    const data = await res.json();
    return typeof data?.temperature === 'number' ? data : null;
  } catch {
    return null;
  }
}
