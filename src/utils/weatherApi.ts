import { Commune, WeatherData, CurrentWeather, HourlyForecastItem, DailyForecastItem } from '../types';
import { generateRainInTheHour, parseRealMinutelyRain, calculateVigilance, getWeatherUI } from './weatherUtils';
import { assessConfidence } from './forecastConfidence';
import { fetchObservation } from './observationApi';

/**
 * Consensus value across the models that supplied one.
 *
 * The median, not the mean: on a convective afternoon a single run can sit 5°C
 * above the other two (AROME read 29.7°C over the Aisne while ECMWF said 26.0
 * and the blend 24.8), and an average would carry that outlier into the number
 * shown to the user. The median simply ignores it.
 */
function consensus(values: Array<number | null | undefined>): number | null {
  const usable = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (usable.length === 0) return null;
  usable.sort((a, b) => a - b);
  const mid = usable.length >> 1;
  return usable.length % 2 ? usable[mid] : (usable[mid - 1] + usable[mid]) / 2;
}

/**
 * Sky code derived from actual cloud cover.
 *
 * Replaces the rule that promoted "Couvert" to "Peu nuageux" whenever rain
 * probability was low — cloudiness and rain probability are different physical
 * quantities, and that rule painted a near-clear sky over a 100%-overcast
 * afternoon. Thresholds follow the okta convention (clear / few / broken /
 * overcast). Falls back to the model's own code when cloud cover is missing.
 */
function skyCodeFromCloudCover(cloudCover: number | null | undefined, fallback: number): number {
  if (typeof cloudCover !== 'number' || Number.isNaN(cloudCover)) return fallback;
  if (cloudCover < 20) return 0; // Soleil
  if (cloudCover < 50) return 1; // Peu nuageux
  if (cloudCover < 85) return 2; // Éclaircies
  return 3;                      // Couvert
}

/**
 * Search French communes by name via the official geo.api.gouv.fr.
 */
export async function searchFrenchCommunes(query: string): Promise<Commune[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const formattedQuery = encodeURIComponent(query.trim());
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${formattedQuery}&fields=nom,code,codesPostaux,centre,codeDepartement&limit=8`
    );
    if (!response.ok) throw new Error('Search failed');
    return await response.json();
  } catch (error) {
    console.error('Error searching communes:', error);
    return [];
  }
}

/**
 * Reverse-geocode coordinates to get the nearest French commune.
 */
export async function getCommuneByCoords(lat: number, lon: number): Promise<Commune | null> {
  try {
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=nom,code,codesPostaux,centre,codeDepartement&limit=1`
    );
    if (!response.ok) throw new Error('Reverse geocoding failed');
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Fetch Weather Data for selected French commune via Open-Meteo using Météo-France high-resolution model.
 */
export async function fetchWeatherData(commune: Commune, signal?: AbortSignal): Promise<WeatherData> {
  const [longitude, latitude] = commune.centre.coordinates;

  // Primary: Météo-France AROME model (1.3 km resolution over France — highest precision available)
  const currentVars = 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,surface_pressure,visibility';
  const hourlyVars  = 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover,cape';
  const dailyVars   = 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max';
  const minuteVars  = 'precipitation,weather_code,lightning_potential';

  const urlMeteoFrance = `https://api.open-meteo.com/v1/meteofrance?latitude=${latitude}&longitude=${longitude}&current=${currentVars}&hourly=${hourlyVars}&daily=${dailyVars}&minutely_15=${minuteVars}&forecast_days=10&timezone=Europe/Paris`;

  // Secondary: standard endpoint (GFS/ECMWF-open-data/ICON "best_match" blend) — supports minutely_15 unlike /v1/ecmwf
  const urlStandard = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${currentVars}&hourly=${hourlyVars}&daily=${dailyVars}&minutely_15=${minuteVars}&forecast_days=10&timezone=Europe/Paris`;

  // Tertiary: ECMWF IFS — AROME covers only ~2 days and ARPEGE ~4 days (both return
  // null beyond that in the /v1/meteofrance response), so days 5-10 currently fell
  // back to the generic "best_match" blend above. ECMWF has stronger medium-range
  // skill than that generic blend, so it's used specifically to fill that gap.
  // No `current`/`minutely_15` needed — ECMWF is never used for today's precision.
  const urlEcmwf = `https://api.open-meteo.com/v1/ecmwf?latitude=${latitude}&longitude=${longitude}&hourly=${hourlyVars}&daily=${dailyVars}&forecast_days=10&timezone=Europe/Paris`;

  let data: any = null;
  let fallbackData: any = null;
  let ecmwfData: any = null;

  // Per-model series, captured pre-merge. Model agreement can only be measured
  // against un-blended values, and the consensus median needs each model's own
  // number rather than the coalesced one.
  type ModelSeries = { hourlyTemp: any[]; dailyMax: any[]; dailyMin: any[] };
  const empty = (): ModelSeries => ({ hourlyTemp: [], dailyMax: [], dailyMin: [] });
  const models: { meteoFrance: ModelSeries; ecmwf: ModelSeries; blend: ModelSeries } = {
    meteoFrance: empty(), ecmwf: empty(), blend: empty(),
  };

  // Météo-France returns precipitation_probability as null for all 240 hours on
  // /v1/meteofrance, so this field is always somebody else's. Take it from the
  // GFS/ICON blend, whose probability is calibrated, rather than from ECMWF —
  // its 0.25° grid is the coarsest of the three for showers.
  const PREFER_BLEND = new Set(['precipitation_probability', 'precipitation_probability_max']);

  // 3-way coalesce: prefer AROME/ARPEGE, then ECMWF (for the medium-range gap),
  // then the generic blend as last resort — except for the fields above.
  function mergeSeries(primary: any, secondary: any, tertiary: any) {
    const keys = new Set<string>([
      ...Object.keys(secondary ?? {}),
      ...Object.keys(tertiary ?? {}),
    ]);
    for (const key of keys) {
      const sources = PREFER_BLEND.has(key) ? [tertiary, secondary] : [secondary, tertiary];
      for (const source of sources) {
        const srcArr = source?.[key];
        if (!Array.isArray(srcArr)) continue;
        const curArr = primary[key];
        if (!curArr || !Array.isArray(curArr)) {
          primary[key] = [...srcArr];
          continue;
        }
        const maxLength = Math.max(curArr.length, srcArr.length);
        const merged: any[] = [];
        for (let i = 0; i < maxLength; i++) {
          const curVal = curArr[i];
          if (i < curArr.length && curVal !== null && curVal !== undefined) {
            merged.push(curVal);
          } else if (i < srcArr.length && srcArr[i] !== null && srcArr[i] !== undefined) {
            merged.push(srcArr[i]);
          } else {
            merged.push(i < curArr.length ? curArr[i] : null);
          }
        }
        primary[key] = merged;
      }
    }
  }

  // Requested alongside the models rather than after them — a measurement that
  // arrives half a second late is a measurement the user never sees.
  const observationPromise = fetchObservation(latitude, longitude, signal);

  try {
    const [resMF, resStd, resEcmwf] = await Promise.allSettled([
      fetch(urlMeteoFrance, { signal }).then(r => { if (!r.ok) throw new Error(`MeteoFrance status ${r.status}`); return r.json(); }),
      fetch(urlStandard, { signal }).then(r => { if (!r.ok) throw new Error(`Standard API status ${r.status}`); return r.json(); }),
      fetch(urlEcmwf, { signal }).then(r => { if (!r.ok) throw new Error(`ECMWF status ${r.status}`); return r.json(); })
    ]);

    if (resMF.status === 'fulfilled') {
      data = resMF.value;
    }
    if (resStd.status === 'fulfilled') {
      fallbackData = resStd.value;
      if (!data) data = fallbackData; // If MeteoFrance failed completely
    }
    if (resEcmwf.status === 'fulfilled') {
      ecmwfData = resEcmwf.value;
    }

    if (!data) {
      // A superseded request (city switched, component unmounted) is not a
      // failure and must not surface as one — otherwise React StrictMode's
      // double-mount in dev, or any fast city switch in production, logs a
      // bogus "connexion échouée" and can flash an error state.
      if (signal?.aborted) {
        const abortErr = new Error('Requête météo annulée');
        abortErr.name = 'AbortError';
        throw abortErr;
      }
      throw new Error('Échec de la connexion à l\'API météo. Veuillez vérifier votre connexion ou réessayer.');
    }

    // Snapshot each model's own temperatures before the merge overwrites them.
    const snapshot = (src: any): ModelSeries => ({
      hourlyTemp: Array.isArray(src?.hourly?.temperature_2m) ? [...src.hourly.temperature_2m] : [],
      dailyMax: Array.isArray(src?.daily?.temperature_2m_max) ? [...src.daily.temperature_2m_max] : [],
      dailyMin: Array.isArray(src?.daily?.temperature_2m_min) ? [...src.daily.temperature_2m_min] : [],
    });
    // When Météo-France failed outright, `data` *is* the blend — counting it
    // twice would fake a perfect agreement between two identical series.
    models.meteoFrance = data === fallbackData ? empty() : snapshot(data);
    models.ecmwf = snapshot(ecmwfData);
    models.blend = snapshot(fallbackData);

    // Blend missing (null, undefined, or truncated) future data into MeteoFrance data
    if (data !== fallbackData) {
      if (!data.daily) data.daily = {};
      mergeSeries(data.daily, ecmwfData?.daily, fallbackData?.daily);
      if (!data.hourly) data.hourly = {};
      mergeSeries(data.hourly, ecmwfData?.hourly, fallbackData?.hourly);
    }
  } catch (error: any) {
    if (error?.name === 'AbortError' || signal?.aborted) throw error;
    console.error('API Error:', error);
    throw new Error('Échec de la connexion à l\'API météo.');
  }

  try {
    // Calculate start index first to align current time with hourly indices
    const hourlyTimes = data.hourly?.time || [];
    
    // Formatter to accurately grab the current hour in Europe/Paris
    const parisFormatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false
    });
    const parts = parisFormatter.formatToParts(new Date());
    const tMap: Record<string, string> = {};
    parts.forEach(p => tMap[p.type] = p.value);
    
    // Construct the prefix formatted identically to OpenMeteo's API (YYYY-MM-DDTHH)
    let localHour = parseInt(tMap.hour, 10);
    if (localHour === 24) localHour = 0;
    const hourStr = localHour.toString().padStart(2, '0');
    const isoStringPrefix = `${tMap.year}-${tMap.month}-${tMap.day}T${hourStr}`;
    
    // Find closest hour index in data
    let startIdx = 0;
    for (let i = 0; i < hourlyTimes.length; i++) {
      if (hourlyTimes[i].startsWith(isoStringPrefix)) {
        startIdx = i;
        break;
      }
    }
    
    if (startIdx === 0) {
      // Fallback: use Paris hour to avoid offset with API data (always Europe/Paris)
      startIdx = Math.max(0, localHour);
    }

    // Map current parameters (safe fallback handling & intelligent multi-model blending)
    const rawCurrentMF = data.current || {};
    const rawCurrentStd = fallbackData?.current || {};
    
    let currentCode = rawCurrentMF.weather_code ?? 0;
    const fallbackCurrentCode = rawCurrentStd.weather_code ?? 0;

    // 1. Multi-model active weather (Rain/Storm) upgrade:
    // If MeteoFrance model shows dry sky but standard model (ECMWF/GFS) reports a storm (95, 96, 99) or rain (51-69, 80-84) currently,
    // and we have significant precipitation probability, prioritize the active weather!
    const isMFActive = currentCode >= 50;
    const isStdActive = (fallbackCurrentCode >= 50 && fallbackCurrentCode <= 69) || (fallbackCurrentCode >= 80 && fallbackCurrentCode <= 99);
    const currentProb = data.hourly?.precipitation_probability?.[startIdx] ?? fallbackData?.hourly?.precipitation_probability?.[startIdx] ?? 0;

    if (!isMFActive && isStdActive && (currentProb >= 30 || (rawCurrentStd.precipitation ?? 0) > 0)) {
      currentCode = fallbackCurrentCode;
    }

    // Cloud cover now drives every dry-sky code below, so resolve it once.
    const currentCloudCover = rawCurrentMF.cloud_cover ?? rawCurrentStd.cloud_cover;

    // 2. Fix false drizzle (Meteo-France bug where code is 51-69 but precipitation is 0.0)
    if ((currentCode >= 50 && currentCode <= 59) || (currentCode >= 60 && currentCode <= 69)) {
       const currentPrecip = rawCurrentMF.precipitation ?? rawCurrentStd.precipitation ?? 0;
       if (currentPrecip === 0) {
          currentCode = skyCodeFromCloudCover(currentCloudCover, 3);
       }
    }

    // 3. Imminent Nowcast Lookahead (within the next hour) to detect starting storms and rain
    // If either model's hourly forecast for the current hour (startIdx) or next hour (startIdx + 1)
    // predicts a thunderstorm (95, 96, 99) or rain and the probability is high, upgrade the current weather.
    const hourlyCodesMF = data.hourly?.weather_code || [];
    const hourlyCodesStd = fallbackData?.hourly?.weather_code || [];
    const hourlyProbMF = data.hourly?.precipitation_probability || [];
    const hourlyPrecipMF = data.hourly?.precipitation || [];

    const lookaheadIndices = [startIdx, startIdx + 1].filter(idx => idx < hourlyCodesMF.length);
    let imminentStorm = false;
    let imminentRainCode = 0;

    for (const idx of lookaheadIndices) {
      const codeMF = hourlyCodesMF[idx] ?? 0;
      const codeStd = hourlyCodesStd[idx] ?? 0;
      const prob = hourlyProbMF[idx] ?? 0;
      const precip = hourlyPrecipMF[idx] ?? 0;

      const isStormMF = codeMF === 95 || codeMF === 96 || codeMF === 99;
      const isStormStd = codeStd === 95 || codeStd === 96 || codeStd === 99;
      if ((isStormMF || isStormStd) && prob >= 35) {
        imminentStorm = true;
        break;
      }

      const isRainMF = (codeMF >= 50 && codeMF <= 69) || (codeMF >= 80 && codeMF <= 84);
      const isRainStd = (codeStd >= 50 && codeStd <= 69) || (codeStd >= 80 && codeStd <= 84);
      if ((isRainMF || isRainStd) && (prob >= 40 || precip > 0)) {
        imminentRainCode = isRainMF ? codeMF : codeStd;
      }
    }

    if (imminentStorm) {
      currentCode = 95; // Display Orageux
    } else if (imminentRainCode > 0 && currentCode < 50) {
      currentCode = imminentRainCode; // Display Rain
    }

    // 4. Dry-sky refinement from observed cloud cover.
    // This used to key off precipitation probability, which turned a 100%
    // overcast sky into "Peu nuageux" whenever rain was unlikely.
    if (currentCode < 50) {
      currentCode = skyCodeFromCloudCover(currentCloudCover, currentCode);
    }

    // A real measurement beats every model, and this is the whole point of the
    // DPObs proxy: on the afternoon that started all this, the three models
    // spanned 24.8 to 31.8°C over the Aisne and the station 7.6 km away simply
    // read 23.8°C. Null whenever no station is close and comparable enough — the
    // forecast then stands, exactly as before.
    const observed = await observationPromise;

    // Measured rain settles what the models were getting wrong. If the station
    // has collected water in the past hour while the sky code says dry, it is
    // the sky code that is wrong.
    if (observed?.precipitation1h !== undefined && observed.precipitation1h > 0 && currentCode < 50) {
      currentCode = observed.precipitation1h >= 2.5 ? 63 : 61;
    }

    const ui = getWeatherUI(currentCode);

    // Temperature: median of the three models rather than Météo-France alone.
    // AROME's 15-minute `current` is a single volatile run — it read 29.7°C then
    // 26.2°C for the *same* timestamp minutes apart, while the other models sat
    // 3-5°C lower. ECMWF has no `current` block, so its nearest hour stands in.
    const tempMF = typeof rawCurrentMF.temperature_2m === 'number' ? rawCurrentMF.temperature_2m : null;
    const tempStd = typeof rawCurrentStd.temperature_2m === 'number' ? rawCurrentStd.temperature_2m : null;
    const tempEcmwf = models.ecmwf.hourlyTemp[startIdx] ?? null;
    const currentSources = [tempMF, tempStd, tempEcmwf];
    const modelTemp = consensus(currentSources) ?? 15;
    const modelConfidence = assessConfidence(currentSources);

    const displayTemp = observed?.temperature ?? modelTemp;

    // Feels-like is only published by MF/std, and re-anchoring it on the value
    // actually displayed keeps the humidity- and wind-driven offset while staying
    // coherent with it — otherwise the two can contradict each other on screen.
    const rawApparent = rawCurrentMF.apparent_temperature ?? rawCurrentStd.apparent_temperature;
    const rawApparentBase = rawCurrentMF.apparent_temperature !== undefined ? tempMF : tempStd;
    const apparent = typeof rawApparent === 'number' && typeof rawApparentBase === 'number'
      ? Math.round((displayTemp + (rawApparent - rawApparentBase)) * 10) / 10
      : displayTemp;

    const current: CurrentWeather = {
      temperature: displayTemp,
      feelsLike: apparent,
      // Model spread is only meaningful while the models are what we are showing.
      confidence: observed ? undefined : modelConfidence?.level,
      modelSpread: observed ? undefined : modelConfidence?.spread,
      observed: observed ?? undefined,
      humidity: observed?.humidity ?? rawCurrentMF.relative_humidity_2m ?? rawCurrentStd.relative_humidity_2m ?? 50,
      windSpeed: observed?.windSpeed ?? rawCurrentMF.wind_speed_10m ?? rawCurrentStd.wind_speed_10m ?? 0,
      windGusts: observed?.windGusts ?? rawCurrentMF.wind_gusts_10m ?? rawCurrentStd.wind_gusts_10m,
      windDirection: rawCurrentMF.wind_direction_10m ?? rawCurrentStd.wind_direction_10m,
      cloudCover: rawCurrentMF.cloud_cover ?? rawCurrentStd.cloud_cover,
      pressure: rawCurrentMF.surface_pressure ?? rawCurrentStd.surface_pressure,
      visibility: rawCurrentMF.visibility ?? rawCurrentStd.visibility,
      weatherCode: currentCode,
      weatherDesc: ui.label,
      iconName: currentCode.toString(),
      precipitation: observed?.precipitation1h ?? rawCurrentMF.precipitation ?? rawCurrentStd.precipitation ?? 0,
      time: rawCurrentMF.time ?? rawCurrentStd.time ?? ''
    };

    // Build per-hour max lightning_potential from minutely_15 (4 slots per hour)
    const lightningByHour = new Map<string, number>();
    const m15 = data.minutely_15;
    if (m15?.lightning_potential && m15.time) {
      for (let i = 0; i < m15.time.length; i++) {
        const hKey = (m15.time[i] as string).substring(0, 13); // "YYYY-MM-DDTHH"
        const lp = (m15.lightning_potential[i] ?? 0) as number;
        if (lp > (lightningByHour.get(hKey) ?? 0)) lightningByHour.set(hKey, lp);
      }
    }

    // Map Hourly forecasts (next 12 hours)
    const hourly: HourlyForecastItem[] = [];
    const hourlyTemps = data.hourly?.temperature_2m || [];
    const hourlyCodes = data.hourly?.weather_code || [];
    const hourlyProb = data.hourly?.precipitation_probability || [];
    const hourlyPrecip = data.hourly?.precipitation || [];
    const hourlyWind = data.hourly?.wind_speed_10m || [];
    const hourlyCape = data.hourly?.cape || [];
    const hourlyCloud = data.hourly?.cloud_cover || [];

    /** Consensus temperature for one hourly index, across the three models. */
    const hourlyConsensusTemp = (idx: number): number =>
      consensus([
        models.meteoFrance.hourlyTemp[idx],
        models.ecmwf.hourlyTemp[idx],
        models.blend.hourlyTemp[idx],
      ]) ?? hourlyTemps[idx] ?? 15;

    for (let j = 0; j < 12; j++) {
      const idx = startIdx + j;
      if (idx < hourlyTimes.length) {
        const timeStr = hourlyTimes[idx];
        const hourLabel = timeStr ? timeStr.split('T')[1].substring(0, 5) : `${(localHour + j) % 24}:00`;
        let code = hourlyCodes[idx] ?? 0;
        const fallbackCode = fallbackData?.hourly?.weather_code?.[idx] ?? 0;

        // 1. Multi-model hourly blending:
        // If MeteoFrance hourly code is dry (or overcast) but the standard GFS/ECMWF model predicts a storm or rain,
        // and the precipitation probability is significant, prioritize the active weather code!
        const codeIsDry = code < 50 || code === 3;
        const fallbackIsActive = (fallbackCode >= 50 && fallbackCode <= 69) || (fallbackCode >= 80 && fallbackCode <= 99);
        const prob = hourlyProb[idx] ?? fallbackData?.hourly?.precipitation_probability?.[idx] ?? 0;

        if (codeIsDry && fallbackIsActive && prob >= 30) {
          code = fallbackCode;
        }
        
        // 2. Fix false drizzle
        const precip = hourlyPrecip[idx] ?? fallbackData?.hourly?.precipitation?.[idx] ?? 0;
        const cloud = hourlyCloud[idx] ?? fallbackData?.hourly?.cloud_cover?.[idx];
        if ((code >= 50 && code <= 59) || (code >= 60 && code <= 69)) {
          if (precip === 0) {
            code = skyCodeFromCloudCover(cloud, 3);
          }
        }

        // 3. Dry-sky codes come from cloud cover, not from rain probability
        if (code < 50) {
          code = skyCodeFromCloudCover(cloud, code);
        }

        const hourKey = hourlyTimes[idx]?.substring(0, 13) ?? '';
        const lpMax = lightningByHour.get(hourKey) ?? 0;
        const capeVal = (hourlyCape[idx] ?? 0) as number;
        // stormRisk: elevated instability but model hasn't coded it as active storm yet
        const stormRisk = (lpMax > 5 || capeVal > 300) && code < 95;

        hourly.push({
          time: hourLabel,
          temp: hourlyConsensusTemp(idx),
          weatherCode: code,
          iconName: code.toString(),
          precipitationProbability: hourlyProb[idx] ?? 0,
          precipitation: hourlyPrecip[idx] ?? 0,
          windSpeed: hourlyWind[idx] ?? undefined,
          stormRisk
        });
      } else {
        hourly.push({
          time: `${(localHour + j) % 24}:00`,
          temp: 15,
          weatherCode: 0,
          iconName: '0',
          precipitationProbability: 0,
          precipitation: 0
        });
      }
    }

    // Map Daily forecasts (next 7 days)
    const daily: DailyForecastItem[] = [];
    const daysArr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dailyCodes = data.daily?.weather_code || [];
    const dailyMax = data.daily?.temperature_2m_max || [];
    const dailyMin = data.daily?.temperature_2m_min || [];
    const dailyUv = data.daily?.uv_index_max || [];
    const dailyPrecipSum = data.daily?.precipitation_sum || [];
    const dailyPrecipProbMax = data.daily?.precipitation_probability_max || [];
    const dailyWindMax = data.daily?.wind_speed_10m_max || [];
    const dailyWindGusts = data.daily?.wind_gusts_10m_max || [];
    const dailySunrise = data.daily?.sunrise || [];
    const dailySunset = data.daily?.sunset || [];
    const hourlyHumidity = data.hourly?.relative_humidity_2m || [];

    for (let k = 0; k < 7; k++) {
      const apiDailyCode = dailyCodes[k] ?? 0;

      // Grab 24 hours for this day (indices k*24 to k*24 + 23)
      const dailyHourly: HourlyForecastItem[] = [];
      const dayDateStr = data.daily?.time?.[k];

      // Derive the weekday directly from the API's own date string (already
      // anchored to Europe/Paris via the ?timezone= param) instead of the
      // browser's local clock — avoids an off-by-one day when the device's
      // timezone differs from Paris (e.g. checking French weather while abroad).
      let dayName = '';
      if (dayDateStr) {
        const [y, m, d] = dayDateStr.split('-').map(Number);
        const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
        dayName = daysArr[weekday];
      }

      let startIdxDay = k * 24; // Fallback
      if (dayDateStr) {
        const foundIdx = hourlyTimes.findIndex((t: string) => t.startsWith(dayDateStr));
        if (foundIdx !== -1) {
          startIdxDay = foundIdx;
        }
      }
      for (let h = 0; h < 24; h++) {
        const idx = startIdxDay + h;
        if (idx < hourlyTimes.length) {
          const timeStr = hourlyTimes[idx];
          const hourLabel = timeStr ? timeStr.split('T')[1].substring(0, 5) : `${h.toString().padStart(2, '0')}:00`;
          let hCode = hourlyCodes[idx] ?? 0;
          const fallbackHCode = fallbackData?.hourly?.weather_code?.[idx] ?? 0;

          // 1. Multi-model hourly blending for daily forecast:
          // If MeteoFrance hourly code is dry (or overcast) but the standard model predicts storm/rain,
          // and the precipitation probability is significant, prioritize the active weather!
          const hCodeIsDry = hCode < 50 || hCode === 3;
          const fallbackHIsActive = (fallbackHCode >= 50 && fallbackHCode <= 69) || (fallbackHCode >= 80 && fallbackHCode <= 99);
          const hProb = hourlyProb[idx] ?? fallbackData?.hourly?.precipitation_probability?.[idx] ?? 0;

          if (hCodeIsDry && fallbackHIsActive && hProb >= 30) {
            hCode = fallbackHCode;
          }

          // 2. Fix false drizzle
          const hPrecip = hourlyPrecip[idx] ?? fallbackData?.hourly?.precipitation?.[idx] ?? 0;
          const hCloud = hourlyCloud[idx] ?? fallbackData?.hourly?.cloud_cover?.[idx];
          if ((hCode >= 50 && hCode <= 59) || (hCode >= 60 && hCode <= 69)) {
            if (hPrecip === 0) {
              hCode = skyCodeFromCloudCover(hCloud, 3);
            }
          }

          // 3. Dry-sky codes come from cloud cover, not from rain probability
          if (hCode < 50) {
            hCode = skyCodeFromCloudCover(hCloud, hCode);
          }

          dailyHourly.push({
            time: hourLabel,
            temp: hourlyConsensusTemp(idx),
            weatherCode: hCode,
            iconName: hCode.toString(),
            precipitationProbability: hourlyProb[idx] ?? 0,
            precipitation: hourlyPrecip[idx] ?? 0
          });
        }
      }

      // Average humidity over daytime hours (7h-21h) for this specific day —
      // replaces what used to be a hardcoded 55% placeholder for any non-today day.
      let dayAvgHumidity: number | undefined;
      {
        const daytimeHumidityVals: number[] = [];
        for (let h = 7; h <= 21; h++) {
          const idx = startIdxDay + h;
          const val = hourlyHumidity[idx];
          if (typeof val === 'number') daytimeHumidityVals.push(val);
        }
        if (daytimeHumidityVals.length > 0) {
          dayAvgHumidity = Math.round(daytimeHumidityVals.reduce((a, b) => a + b, 0) / daytimeHumidityVals.length);
        }
      }

      // How much do the three models disagree about this day's high?
      const dayMaxSources = [models.meteoFrance.dailyMax[k], models.ecmwf.dailyMax[k], models.blend.dailyMax[k]];
      const dayMinSources = [models.meteoFrance.dailyMin[k], models.ecmwf.dailyMin[k], models.blend.dailyMin[k]];
      const dayConfidence = assessConfidence(dayMaxSources);

      // Compute a representative weather code for the day based on daily and hourly parameters
      let representativeCode = apiDailyCode;
      if (dailyHourly.length > 0) {
        // Filter daytime hours (7:00 to 21:00) when weather is most visible and important to the user
        const daytimeHours = dailyHourly.filter(h => {
          const hr = parseInt(h.time.split(':')[0], 10);
          return hr >= 7 && hr <= 21;
        });

        if (daytimeHours.length > 0) {
          // Check for high-impact storm or rain events during daytime
          const stormHours = daytimeHours.filter(h => h.weatherCode === 95 || h.weatherCode === 96 || h.weatherCode === 99);
          const fallbackDailyCode = fallbackData?.daily?.weather_code?.[k] ?? 0;
          const isStormInAnyModel = (apiDailyCode === 95 || apiDailyCode === 96 || apiDailyCode === 99 ||
                                     fallbackDailyCode === 95 || fallbackDailyCode === 96 || fallbackDailyCode === 99);
          const maxRainProb = Math.max(...daytimeHours.map(h => h.precipitationProbability), 0);

          if (isStormInAnyModel && (stormHours.length > 0 || maxRainProb >= 35)) {
            // Priority 1: If daily code is storm in either model, and we have storm hours or significant probability, display Storm (Orageux)
            representativeCode = 95;
          } else {
            // Priority 2: If daily code is rain/drizzle or we have rain hours
            const hasDailyRainCode = (apiDailyCode >= 50 && apiDailyCode <= 69) || (apiDailyCode >= 80 && apiDailyCode <= 84);
            const heavyRainHours = daytimeHours.filter(h => 
              (h.weatherCode === 63 || h.weatherCode === 65 || h.weatherCode === 81 || h.weatherCode === 82)
            );
            const lightRainHours = daytimeHours.filter(h => 
              (h.weatherCode === 61 || h.weatherCode === 80 || h.weatherCode === 51 || h.weatherCode === 53 || h.weatherCode === 55)
            );

            // Calculate max precipitation probability and precipitation amount during the daytime
            const maxRainProb = Math.max(...daytimeHours.map(h => h.precipitationProbability), 0);
            const totalPrecip = daytimeHours.reduce((sum, h) => sum + h.precipitation, 0);

            if (hasDailyRainCode || heavyRainHours.length > 0 || lightRainHours.length > 0) {
              // But check if it's a false positive (no rain and very low probability)
              if (totalPrecip === 0 && maxRainProb <= 20) {
                // False positive rain! Demote to dry weather based on cloud cover
                const overcastHours = daytimeHours.filter(h => h.weatherCode === 3).length;
                const partlyCloudyHours = daytimeHours.filter(h => h.weatherCode === 2).length;
                const mainlyClearHours = daytimeHours.filter(h => h.weatherCode === 1).length;

                if (overcastHours > daytimeHours.length * 0.5) {
                  representativeCode = 3; // Couvert
                } else if (partlyCloudyHours > daytimeHours.length * 0.4) {
                  representativeCode = 2; // Éclaircies
                } else if (mainlyClearHours > daytimeHours.length * 0.3) {
                  representativeCode = 1; // Peu nuageux
                } else {
                  representativeCode = 0; // Soleil
                }
              } else {
                // Valid rain! Respect daily rain code or choose the heaviest rain code observed
                if (heavyRainHours.length > 0) {
                  representativeCode = heavyRainHours[0].weatherCode;
                } else if (lightRainHours.length > 0) {
                  representativeCode = lightRainHours[0].weatherCode;
                } else {
                  representativeCode = apiDailyCode;
                }
              }
            } else {
              // Dry day: the hourly codes are already derived from cloud cover,
              // so the day's icon is simply the dominant sky over daytime hours.
              // The previous version gated this on rain probability, which could
              // turn a fully overcast day into "Peu nuageux" just because no rain
              // was expected.
              const counts = [0, 1, 2, 3].map(c => daytimeHours.filter(h => h.weatherCode === c).length);
              representativeCode = counts.indexOf(Math.max(...counts));
            }
          }
        }
      }

      daily.push({
        date: k === 0 ? "Auj." : dayName,
        tempMax: consensus(dayMaxSources) ?? dailyMax[k] ?? 20,
        tempMin: consensus(dayMinSources) ?? dailyMin[k] ?? 10,
        weatherCode: representativeCode,
        iconName: representativeCode.toString(),
        uvIndex: dailyUv[k] ? Math.round(dailyUv[k] ?? 3) : 3,
        precipitationSum: dailyPrecipSum[k] ?? undefined,
        precipProbMax: dailyPrecipProbMax[k] ?? undefined,
        windMax: dailyWindMax[k] ?? undefined,
        windGusts: dailyWindGusts[k] ?? undefined,
        humidity: dayAvgHumidity,
        confidence: dayConfidence?.level,
        modelSpread: dayConfidence?.spread,
        sunrise: dailySunrise[k] ? dailySunrise[k].split('T')[1]?.substring(0, 5) : undefined,
        sunset: dailySunset[k] ? dailySunset[k].split('T')[1]?.substring(0, 5) : undefined,
        hourly: dailyHourly
      });
    }

    // Use real minutely_15 data for precise rain-in-the-hour nowcast; fall back to probability model
    const minutely15 = data.minutely_15 ?? null;
    const realRain = minutely15
      ? parseRealMinutelyRain({
          time: minutely15.time ?? [],
          precipitation: minutely15.precipitation ?? [],
          weather_code: minutely15.weather_code ?? [],
        })
      : null;
    const prob = hourly.length > 0 ? hourly[0].precipitationProbability : 0;
    const rainInTheHour = realRain ?? generateRainInTheHour(prob, 0);

    // Dynamic Vigilance Status calculation — includes today's accumulated
    // rain and current wind gusts for a more realistic risk assessment.
    const vigilance = calculateVigilance(
      current.temperature,
      current.windSpeed,
      current.weatherCode,
      current.precipitation,
      daily[0]?.precipitationSum,
      current.windGusts
    );

    // Extract sunrise & sunset times
    const sunriseRaw = data.daily?.sunrise?.[0] || '';
    const sunsetRaw = data.daily?.sunset?.[0] || '';
    const sunrise = sunriseRaw ? sunriseRaw.split('T')[1]?.substring(0, 5) : '06:00';
    const sunset = sunsetRaw ? sunsetRaw.split('T')[1]?.substring(0, 5) : '21:30';

    return {
      city: commune.nom,
      postalCode: commune.codesPostaux?.[0],
      departmentCode: commune.codeDepartement,
      latitude,
      longitude,
      current,
      hourly,
      daily,
      rainInTheHour,
      vigilance,
      sunrise,
      sunset
    };
  } catch (parseError) {
    console.error('Error parsing weather API data:', parseError);
    throw new Error('Erreur de traitement des données météo.');
  }
}
