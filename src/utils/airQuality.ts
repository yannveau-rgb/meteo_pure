/**
 * Air quality & pollen — Open-Meteo Air Quality API (free, no key, CAMS-backed).
 *
 * Roughly a quarter of the French population is allergic, and "graminées au max
 * demain matin" is far more actionable than another temperature. Thresholds are
 * per-species on purpose: 20 grains/m³ of ragweed is a serious day for a
 * sufferer, while 20 grains/m³ of grass is unremarkable. A single shared
 * threshold would be worse than useless — it would cry wolf on grass and stay
 * silent on ragweed.
 */

export type PollenLevel = 'none' | 'low' | 'moderate' | 'high' | 'veryHigh';

export type PollenSpecies =
  | 'alder_pollen' | 'birch_pollen' | 'grass_pollen'
  | 'mugwort_pollen' | 'olive_pollen' | 'ragweed_pollen';

export interface PollenReading {
  species: PollenSpecies;
  label: string;
  value: number;
  level: PollenLevel;
}

export interface AirQualitySnapshot {
  aqi?: number;
  pm25?: number;
  pollens: PollenReading[];
}

export const POLLEN_LABELS: Record<PollenSpecies, string> = {
  alder_pollen: 'Aulne',
  birch_pollen: 'Bouleau',
  grass_pollen: 'Graminées',
  mugwort_pollen: 'Armoise',
  olive_pollen: 'Olivier',
  ragweed_pollen: 'Ambroisie',
};

/** [moderate, high, veryHigh] cut-offs in grains/m³, per species. */
const POLLEN_THRESHOLDS: Record<PollenSpecies, [number, number, number]> = {
  alder_pollen: [10, 50, 500],
  birch_pollen: [10, 50, 500],
  grass_pollen: [20, 50, 200],
  mugwort_pollen: [10, 30, 50],
  olive_pollen: [10, 50, 200],
  // Ragweed is disproportionately allergenic — a handful of grains matters.
  ragweed_pollen: [5, 20, 50],
};

export function classifyPollen(species: PollenSpecies, value: number): PollenLevel {
  if (!(value > 0)) return 'none';
  const [mod, high, veryHigh] = POLLEN_THRESHOLDS[species];
  if (value >= veryHigh) return 'veryHigh';
  if (value >= high) return 'high';
  if (value >= mod) return 'moderate';
  return 'low';
}

export const POLLEN_LEVEL_LABELS: Record<PollenLevel, string> = {
  none: 'Absent',
  low: 'Faible',
  moderate: 'Modéré',
  high: 'Élevé',
  veryHigh: 'Très élevé',
};

/** Official European AQI bands (EAQI). */
export function getAqiBand(aqi: number): { label: string; severity: 'good' | 'fair' | 'moderate' | 'poor' | 'bad' } {
  if (aqi <= 20) return { label: 'Bon', severity: 'good' };
  if (aqi <= 40) return { label: 'Moyen', severity: 'fair' };
  if (aqi <= 60) return { label: 'Dégradé', severity: 'moderate' };
  if (aqi <= 80) return { label: 'Mauvais', severity: 'poor' };
  return { label: 'Très mauvais', severity: 'bad' };
}

/** Species worth surfacing, worst first. Below "moderate" nothing is shown. */
export function getNotablePollens(pollens: PollenReading[]): PollenReading[] {
  const rank: Record<PollenLevel, number> = { none: 0, low: 1, moderate: 2, high: 3, veryHigh: 4 };
  return pollens
    .filter(p => rank[p.level] >= 2)
    .sort((a, b) => rank[b.level] - rank[a.level] || b.value - a.value);
}

const SPECIES: PollenSpecies[] = [
  'alder_pollen', 'birch_pollen', 'grass_pollen',
  'mugwort_pollen', 'olive_pollen', 'ragweed_pollen',
];

export function parseAirQuality(json: any): AirQualitySnapshot | null {
  const cur = json?.current;
  if (!cur) return null;

  const pollens: PollenReading[] = SPECIES
    .map(species => {
      const value = cur[species];
      if (typeof value !== 'number') return null;
      return { species, label: POLLEN_LABELS[species], value, level: classifyPollen(species, value) };
    })
    .filter((p): p is PollenReading => p !== null);

  return {
    aqi: typeof cur.european_aqi === 'number' ? cur.european_aqi : undefined,
    pm25: typeof cur.pm2_5 === 'number' ? cur.pm2_5 : undefined,
    pollens,
  };
}

export async function fetchAirQuality(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<AirQualitySnapshot | null> {
  const vars = 'european_aqi,pm2_5,' + SPECIES.join(',');
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=${vars}&timezone=Europe/Paris`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Air quality API status ${res.status}`);
  return parseAirQuality(await res.json());
}
