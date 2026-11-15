import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWeatherData } from '../weatherApi';
import { calculateVigilance } from '../weatherUtils';

/**
 * Chemins d'échec de fetchWeatherData : une donnée absente doit rester absente
 * (undefined / liste vide / erreur), jamais devenir un chiffre plausible
 * (15 °C, UV 3, humidité 50 %, courbe de pluie simulée…).
 */

const commune: any = {
  nom: 'Testville',
  code: '00000',
  codesPostaux: ['00000'],
  centre: { type: 'Point', coordinates: [2.35, 48.85] },
  codeDepartement: '00',
};

/** « YYYY-MM-DD » du jour Europe/Paris décalé de `offset` jours. */
function parisDate(offset: number): string {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const m: Record<string, string> = {};
  parts.forEach((p) => (m[p.type] = p.value));
  const d = new Date(Date.UTC(+m.year, +m.month - 1, +m.day + offset));
  return d.toISOString().slice(0, 10);
}

interface Opts {
  uv?: Array<number | null>;
  dayMax?: Array<number | null>;
  dayMin?: Array<number | null>;
  hourlyTemp?: Array<number | null> | null;
  currentTemp?: number | null;
  humidity?: number | null;
  wind?: number | null;
  minutely?: boolean;
  observation?: { distanceKm: number } | null;
}

function payload(o: Opts = {}) {
  const days = 7;
  const time: string[] = [];
  for (let d = 0; d < days; d++) {
    for (let h = 0; h < 24; h++) time.push(`${parisDate(d)}T${String(h).padStart(2, '0')}:00`);
  }
  const n = time.length;
  const fill = (v: number) => Array(n).fill(v);
  const base: any = {
    current: {
      time: time[0],
      temperature_2m: o.currentTemp === undefined ? 18 : o.currentTemp,
      relative_humidity_2m: o.humidity === undefined ? 60 : o.humidity,
      apparent_temperature: 17,
      precipitation: 0,
      weather_code: 1,
      wind_speed_10m: o.wind === undefined ? 12 : o.wind,
      wind_gusts_10m: o.wind === undefined ? 20 : o.wind,
      wind_direction_10m: 90,
      cloud_cover: 20,
      pressure_msl: 1018,
      surface_pressure: 990,
      visibility: 20000,
    },
    hourly: {
      time,
      temperature_2m: o.hourlyTemp === null ? Array(n).fill(null) : o.hourlyTemp ?? fill(18),
      relative_humidity_2m: fill(60),
      precipitation_probability: fill(5),
      precipitation: fill(0),
      weather_code: fill(1),
      wind_speed_10m: fill(12),
      wind_direction_10m: fill(90),
      cloud_cover: fill(20),
      cape: fill(0),
    },
    daily: {
      time: Array.from({ length: days }, (_, d) => parisDate(d)),
      weather_code: Array(days).fill(1),
      temperature_2m_max: o.dayMax ?? Array(days).fill(22),
      temperature_2m_min: o.dayMin ?? Array(days).fill(11),
      uv_index_max: o.uv ?? Array(days).fill(4),
      sunrise: Array.from({ length: days }, (_, d) => `${parisDate(d)}T07:30`),
      sunset: Array.from({ length: days }, (_, d) => `${parisDate(d)}T19:30`),
      precipitation_sum: Array(days).fill(0),
      wind_speed_10m_max: Array(days).fill(15),
      wind_gusts_10m_max: Array(days).fill(25),
      precipitation_probability_max: Array(days).fill(10),
    },
  };
  if (o.minutely) {
    const mt: string[] = [];
    for (let i = 0; i < 8; i++) mt.push(`${parisDate(0)}T00:${String((i % 4) * 15).padStart(2, '0')}`);
    base.minutely_15 = { time: mt, precipitation: Array(8).fill(0), weather_code: Array(8).fill(1) };
  }
  return base;
}

function mockFetch(o: Opts) {
  const body = payload(o);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).includes('/api/observation')) {
        if (!o.observation) return { ok: false, status: 204, json: async () => null };
        return {
          ok: true,
          status: 200,
          json: async () => ({
            station: 'Station test', stationId: '1', distanceKm: o.observation!.distanceKm,
            observedAt: new Date().toISOString(), sampling: '6min',
            temperature: 25, humidity: 33, windSpeed: 40, windGusts: 70, precipitation1h: 4,
          }),
        };
      }
      // Chaque appel reçoit sa propre copie : le code fusionne les séries en place.
      return { ok: true, status: 200, json: async () => structuredClone(body) };
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchWeatherData — pas de valeur inventée', () => {
  it('garde un UV réel de 0 (nuit polaire, hiver) au lieu de le remplacer par 3', async () => {
    mockFetch({ uv: [0, 0, 0, 0, 0, 0, 0] });
    const w = await fetchWeatherData(commune);
    expect(w.daily[0].uvIndex).toBe(0);
  });

  it("laisse l'UV indéfini quand la source ne le donne pas", async () => {
    mockFetch({ uv: [null, null, null, null, null, null, null] });
    const w = await fetchWeatherData(commune);
    expect(w.daily[0].uvIndex).toBeUndefined();
  });

  it('renvoie une pluie dans l\'heure vide, sans courbe simulée, quand minutely_15 manque', async () => {
    mockFetch({ minutely: false });
    const w = await fetchWeatherData(commune);
    expect(w.rainInTheHour).toEqual([]);
  });

  it("n'invente ni humidité ni vent quand aucune source ne les donne", async () => {
    mockFetch({ humidity: null, wind: null });
    const w = await fetchWeatherData(commune);
    expect(w.current.humidity).toBeUndefined();
    expect(w.current.windSpeed).toBeUndefined();
    // Un `null` de l'API (rafales comprises) est aussi inconnu qu'un champ absent :
    // le vent n'est alors « non évalué », pas vert.
    expect(w.current.windGusts).toBeUndefined();
    const wind = w.vigilance.categories.find((c) => c.name === 'Vent violent');
    expect(wind?.description).toMatch(/indisponible/i);
  });

  it("échoue plutôt que d'afficher 15 °C quand aucun modèle ne donne de température", async () => {
    mockFetch({ currentTemp: null, hourlyTemp: null });
    await expect(fetchWeatherData(commune)).rejects.toThrow();
  });

  it("s'arrête au premier jour sans températures au lieu de lui mettre 20/10", async () => {
    mockFetch({
      dayMax: [22, 22, 22, 22, 22, null, null],
      dayMin: [11, 11, 11, 11, 11, null, null],
    });
    const w = await fetchWeatherData(commune);
    expect(w.daily).toHaveLength(5);
    expect(w.daily.every((d) => d.tempMax === 22 && d.tempMin === 11)).toBe(true);
  });

  it("échoue si les températures d'aujourd'hui manquent", async () => {
    mockFetch({
      dayMax: [null, 22, 22, 22, 22, 22, 22],
      dayMin: [null, 11, 11, 11, 11, 11, 11],
    });
    await expect(fetchWeatherData(commune)).rejects.toThrow();
  });
});

describe('fetchWeatherData — observation de station', () => {
  it('une station proche (≤ 10 km) fournit température, humidité, vent et pluie', async () => {
    mockFetch({ observation: { distanceKm: 4 } });
    const w = await fetchWeatherData(commune);
    expect(w.current.temperature).toBe(25);
    expect(w.current.humidity).toBe(33);
    expect(w.current.windSpeed).toBe(40);
    expect(w.current.windGusts).toBe(70);
  });

  it("une station lointaine (> 10 km) ne donne que la température, pas le vent ni l'humidité", async () => {
    mockFetch({ observation: { distanceKm: 25 } });
    const w = await fetchWeatherData(commune);
    expect(w.current.temperature).toBe(25);
    expect(w.current.humidity).toBe(60); // modèle
    expect(w.current.windSpeed).toBe(12); // modèle
    expect(w.current.precipitation).toBe(0); // modèle, pas les 4 mm de la station
  });

  it('affiche la pression ramenée au niveau de la mer, pas la pression de surface', async () => {
    mockFetch({});
    const w = await fetchWeatherData(commune);
    expect(w.current.pressure).toBe(1018);
  });
});

describe('calculateVigilance — vent inconnu', () => {
  it('ne conclut pas « aucune vigilance » sur le vent sans mesure', () => {
    const v = calculateVigilance(18, undefined, 1, 0);
    const wind = v.categories.find((c) => c.name === 'Vent violent');
    expect(wind?.description).toMatch(/indisponible/i);
  });

  it('évalue toujours le vent quand seules les rafales sont connues', () => {
    const v = calculateVigilance(18, undefined, 1, 0, 0, 60);
    const wind = v.categories.find((c) => c.name === 'Vent violent');
    expect(wind?.level).toBe('orange');
  });
});
