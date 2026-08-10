/**
 * Météo-France station observations (DPObs).
 *
 * Everything the app displays is model output — a forecast valid for right now,
 * not a measurement. That is what let it announce 30°C over the Aisne while the
 * station at Chauny, 7.6 km away, measured 23.8°C. No amount of blending between
 * models fixes that: on that afternoon the three of them spanned 24.8 to 31.8°C
 * and every one of them was wrong. DPObs is the only free source of actual French
 * station readings, so it is the one thing that can anchor the display to reality.
 *
 * Two facts about the portal shape this module:
 *  - it issues OAuth2 access tokens valid one hour, minted from a permanent
 *    client_id/client_secret pair, so tokens are cached and renewed here;
 *  - the secret must never reach the browser, hence this lives behind /api.
 *
 * Every failure path returns null rather than throwing: an observation is a
 * bonus on top of the forecast, and losing it must never cost the user their
 * weather.
 */

const TOKEN_URL = 'https://portail-api.meteofrance.fr/token';
// v2 is what the portal actually subscribes you to; v1 answers 403 on the very
// same token, which reads exactly like a missing subscription and is not.
const API_BASE = 'https://public-api.meteofrance.fr/public/DPObs/v2';
const ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';

/** Stations further than this are not describing the user's sky any more. */
const MAX_STATION_DISTANCE_KM = 35;
/** RADOME publishes hourly; past this the reading is stale enough to mislead. */
const MAX_OBSERVATION_AGE_MIN = 90;

/**
 * Altitude is the trap, not distance.
 *
 * Measured over a 400-commune sample: in the plains 92% of communes sit within
 * 150 m of their nearest station, but in the mountains 13.5% are more than 400 m
 * off. Épierre (Savoie) has a station 5.5 km away and 1193 m below it — using
 * that reading raw would introduce a 7.8°C error, the very bug this module
 * exists to fix, only upside down.
 *
 * So: small gaps are used as-is, moderate ones get the standard atmospheric
 * lapse rate, and large ones are refused outright in favour of the model, which
 * at least knows what altitude it is forecasting for.
 */
const ALT_RAW_MAX_M = 150;
const ALT_CORRECTABLE_MAX_M = 400;
const LAPSE_RATE_C_PER_M = 0.0065;
/** In ranking, 50 m of altitude gap costs as much as 1 km of distance. */
const ALT_PENALTY_M_PER_KM = 50;

const STATIONS_TTL_MS = 24 * 60 * 60 * 1000;
const ELEVATION_TTL_MS = 24 * 60 * 60 * 1000;
const OBSERVATION_TTL_MS = 10 * 60 * 1000;
/**
 * Failures are remembered far more briefly than successes. Caching "no
 * observation" for the full ten minutes turns a one-second network hiccup into
 * ten minutes of degraded display — observed exactly once during testing, on a
 * cold start, and worth never seeing again.
 */
const OBSERVATION_MISS_TTL_MS = 45 * 1000;

export interface StationObservation {
  station: string;
  stationId: string;
  distanceKm: number;
  /** ISO timestamp of the measurement itself, not of our request. */
  observedAt: string;
  temperature?: number;      // °C
  humidity?: number;         // %
  windSpeed?: number;        // km/h
  windGusts?: number;        // km/h
  precipitation1h?: number;  // mm over the past hour
  /** Metres between the station and the commune; drives the two flags below. */
  altitudeDeltaM?: number;
  /** True when `temperature` had the lapse rate applied rather than being raw. */
  lapseCorrected?: boolean;
}

interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  altitude: number;
}

// Module-level caches. On Vercel these live for the lifetime of a warm lambda
// instance — a cold start simply re-fetches, which is correct if not optimal.
let tokenCache: { value: string; expiresAt: number } | null = null;
let stationsCache: { value: Station[]; at: number } | null = null;
const elevationCache = new Map<string, { value: number | null; at: number }>();
const observationCache = new Map<string, { value: StationObservation | null; at: number }>();

/**
 * Exchanges the permanent client credentials for a one-hour access token.
 * Renewed a minute early so a request never races the expiry.
 */
async function getAccessToken(): Promise<string | null> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value;

  // The portal's "Générer Token" button hands out a ready-made one-hour token.
  // Honouring it lets the integration be exercised before a permanent credential
  // is in place; it expires on its own, so it cannot linger in production.
  const manualToken = process.env.METEOFRANCE_ACCESS_TOKEN;
  if (manualToken) return manualToken;

  const clientId = process.env.METEOFRANCE_CLIENT_ID;
  const clientSecret = process.env.METEOFRANCE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    console.error('[DPObs] token request failed:', res.status);
    return null;
  }

  const json: any = await res.json();
  const token = json?.access_token;
  if (!token) return null;

  const ttlSec = Number(json.expires_in) || 3600;
  tokenCache = { value: token, expiresAt: Date.now() + (ttlSec - 60) * 1000 };
  return token;
}

/**
 * Authentication headers, in order of preference.
 *
 * The portal offers two credential types on the same screen, and they are not
 * equivalent for a server: an API key is permanent, whereas its OAuth2 tokens
 * last one hour *and* regenerating one silently kills the previous. So a plain
 * API key wins whenever it is configured, and the OAuth2 path stays as a
 * fallback for anyone who already set it up.
 */
async function authHeaders(): Promise<Record<string, string> | null> {
  const apiKey = process.env.METEOFRANCE_API_KEY;
  if (apiKey) return { apikey: apiKey };

  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

async function apiGetText(path: string): Promise<string | null> {
  const headers = await authHeaders();
  if (!headers) return null;

  let res = await fetch(`${API_BASE}${path}`, { headers });

  // Météo-France documents the `apikey` header, but its gateway has been known
  // to want the key as a bearer instead. Rather than bet on one spelling, retry
  // with the other on a straight authentication failure.
  if (res.status === 401 && headers.apikey) {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${headers.apikey}` },
    });
  }

  // 403 here means the application is not subscribed to *this version* of DPObs.
  // Worth spelling out: a v2 subscription answers 403 on v1, which looks like a
  // missing subscription and sent us down the wrong path once already.
  if (res.status === 403) {
    console.error('[DPObs] 403 — application not subscribed to DPObs v2.');
    return null;
  }
  if (!res.ok) {
    console.error('[DPObs] request failed:', path, res.status);
    return null;
  }
  return res.text().catch(() => null);
}

async function apiGetJson(path: string): Promise<any | null> {
  const text = await apiGetText(path);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    console.error('[DPObs] non-JSON response for', path);
    return null;
  }
}

function num(value: any): number | undefined {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && !Number.isNaN(n) ? n : undefined;
}

/**
 * Great-circle distance. The straight-line approximation is not good enough:
 * over France a naive lat/lon delta misjudges east-west distance by a third.
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * The 2151-station directory, refreshed daily.
 *
 * Semicolon-separated CSV, and `format=json` does not change that — only the
 * hourly bulletin honours it. Columns:
 * Id_station;Id_omm;Nom_usuel;Latitude;Longitude;Altitude;Date_ouverture;Pack
 */
async function getStations(): Promise<Station[]> {
  if (stationsCache && Date.now() - stationsCache.at < STATIONS_TTL_MS) {
    return stationsCache.value;
  }

  const csv = await apiGetText('/liste-stations?format=csv');
  if (!csv) return stationsCache?.value ?? [];

  const lines = csv.split('\n').filter(l => l.trim().length > 0);
  const header = lines.shift()?.split(';').map(h => h.trim()) ?? [];
  const iId = header.indexOf('Id_station');
  const iName = header.indexOf('Nom_usuel');
  const iLat = header.indexOf('Latitude');
  const iLon = header.indexOf('Longitude');
  const iAlt = header.indexOf('Altitude');
  if (iId < 0 || iLat < 0 || iLon < 0) {
    console.error('[DPObs] unexpected liste-stations columns:', header);
    return stationsCache?.value ?? [];
  }

  const stations: Station[] = [];
  for (const line of lines) {
    const cells = line.split(';');
    const id = cells[iId]?.trim();
    const lat = num(cells[iLat]);
    const lon = num(cells[iLon]);
    if (!id || lat === undefined || lon === undefined) continue;
    stations.push({
      id,
      name: (cells[iName] ?? id).trim(),
      lat,
      lon,
      altitude: num(cells[iAlt]) ?? 0,
    });
  }

  stationsCache = { value: stations, at: Date.now() };
  return stations;
}

/**
 * Ground elevation at the commune, needed to judge whether a station is
 * comparable. Resolved server-side rather than trusted from the client, so the
 * altitude guard cannot be bypassed by a malformed request.
 */
async function getElevation(lat: number, lon: number): Promise<number | null> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = elevationCache.get(key);
  if (cached && Date.now() - cached.at < ELEVATION_TTL_MS) return cached.value;

  let value: number | null = null;
  try {
    const res = await fetch(`${ELEVATION_URL}?latitude=${lat}&longitude=${lon}`);
    if (res.ok) {
      const json: any = await res.json();
      const e = Array.isArray(json?.elevation) ? json.elevation[0] : json?.elevation;
      value = num(e) ?? null;
    }
  } catch {
    value = null;
  }

  elevationCache.set(key, { value, at: Date.now() });
  return value;
}

/**
 * Reads one hourly bulletin.
 *
 * DPObs publishes temperature in kelvin and wind in m/s. The unit guards below
 * are deliberate: a silently mis-scaled temperature is far more damaging than a
 * missing one, since it looks perfectly plausible on screen.
 */
function parseObservation(
  record: any,
  station: Station,
  distanceKm: number,
  communeElevation: number | null,
): StationObservation | null {
  if (!record) return null;

  const observedAt = record.validity_time ?? record.reference_time;
  if (!observedAt) return null;

  const ageMin = (Date.now() - new Date(observedAt).getTime()) / 60000;
  if (!Number.isFinite(ageMin) || ageMin > MAX_OBSERVATION_AGE_MIN || ageMin < -15) return null;

  let temperature = num(record.t);
  // Kelvin above ~100; no French station has ever read 100°C or -173°C.
  if (temperature !== undefined && temperature > 100) temperature = temperature - 273.15;
  if (temperature !== undefined && (temperature < -50 || temperature > 60)) temperature = undefined;

  let altitudeDeltaM: number | undefined;
  let lapseCorrected = false;
  if (communeElevation !== null) {
    const delta = communeElevation - station.altitude;
    altitudeDeltaM = Math.round(delta);
    const gap = Math.abs(delta);
    if (gap > ALT_CORRECTABLE_MAX_M) {
      // Too far apart vertically to say anything about this commune's air.
      temperature = undefined;
    } else if (gap > ALT_RAW_MAX_M && temperature !== undefined) {
      temperature = temperature - delta * LAPSE_RATE_C_PER_M;
      lapseCorrected = true;
    }
  }

  const windMs = num(record.ff);
  const gustMs = num(record.raf);
  const humidity = num(record.u);
  const precipitation1h = num(record.rr1);

  return {
    station: station.name,
    stationId: station.id,
    distanceKm: Math.round(distanceKm * 10) / 10,
    observedAt: new Date(observedAt).toISOString(),
    temperature: temperature !== undefined ? Math.round(temperature * 10) / 10 : undefined,
    humidity: humidity !== undefined ? Math.round(humidity) : undefined,
    windSpeed: windMs !== undefined ? Math.round(windMs * 3.6) : undefined,
    windGusts: gustMs !== undefined ? Math.round(gustMs * 3.6) : undefined,
    // A negative rr1 is DPObs' "trace, below measurement threshold" marker.
    precipitation1h: precipitation1h !== undefined ? Math.max(0, precipitation1h) : undefined,
    altitudeDeltaM,
    lapseCorrected,
  };
}

/**
 * Latest reading from the most comparable station in range, or null when there
 * is nothing trustworthy — in which case the caller keeps the model forecast.
 *
 * "Most comparable" is not "nearest": a station 12 km away at the same altitude
 * describes a mountain commune far better than one 4 km away and 900 m below.
 */
export async function getNearestObservation(lat: number, lon: number): Promise<StationObservation | null> {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = observationCache.get(cacheKey);
  if (cached) {
    const ttl = cached.value ? OBSERVATION_TTL_MS : OBSERVATION_MISS_TTL_MS;
    if (Date.now() - cached.at < ttl) return cached.value;
  }

  let result: StationObservation | null = null;
  try {
    const [stations, communeElevation] = await Promise.all([getStations(), getElevation(lat, lon)]);

    const ranked = stations
      .map(station => {
        const distanceKm = haversineKm(lat, lon, station.lat, station.lon);
        const altGap = communeElevation === null ? 0 : Math.abs(communeElevation - station.altitude);
        return { station, distanceKm, score: distanceKm + altGap / ALT_PENALTY_M_PER_KM };
      })
      .filter(c => c.distanceKm <= MAX_STATION_DISTANCE_KM)
      .sort((a, b) => a.score - b.score);

    // The best station is not always reporting — walk outwards a little rather
    // than giving up on the first gap.
    for (const candidate of ranked.slice(0, 4)) {
      const raw = await apiGetJson(
        `/station/horaire?id_station=${encodeURIComponent(candidate.station.id)}&format=json`,
      );
      const record = Array.isArray(raw) ? raw[0] : raw;
      const parsed = parseObservation(record, candidate.station, candidate.distanceKm, communeElevation);
      if (parsed?.temperature !== undefined) {
        result = parsed;
        break;
      }
    }
  } catch (err) {
    console.error('[DPObs] observation lookup failed:', err);
    result = null;
  }

  observationCache.set(cacheKey, { value: result, at: Date.now() });
  return result;
}
