import { Commune, WeatherData, CurrentWeather, HourlyForecastItem, DailyForecastItem } from '../types';
import { generateRainInTheHour, calculateVigilance, getWeatherUI } from './weatherUtils';

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
export async function fetchWeatherData(commune: Commune): Promise<WeatherData> {
  const [longitude, latitude] = commune.centre.coordinates;
  const urlMeteoFrance = `https://api.open-meteo.com/v1/meteofrance?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&timezone=Europe/Paris`;
  const urlStandard = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&timezone=Europe/Paris`;

  let data: any = null;
  let fallbackData: any = null;

  try {
    const [resMF, resStd] = await Promise.allSettled([
      fetch(urlMeteoFrance).then(r => { if (!r.ok) throw new Error(`MeteoFrance status ${r.status}`); return r.json(); }),
      fetch(urlStandard).then(r => { if (!r.ok) throw new Error(`Standard API status ${r.status}`); return r.json(); })
    ]);

    if (resMF.status === 'fulfilled') {
      data = resMF.value;
    }
    if (resStd.status === 'fulfilled') {
      fallbackData = resStd.value;
      if (!data) data = fallbackData; // If MeteoFrance failed completely
    }

    if (!data) {
      throw new Error('Échec de la connexion à l\'API météo. Veuillez vérifier votre connexion ou réessayer.');
    }

    // Blend missing (null, undefined, or truncated) future data from standard API into MeteoFrance data
    if (fallbackData && data !== fallbackData) {
      // Merge daily data
      if (fallbackData.daily) {
        if (!data.daily) data.daily = {};
        for (const key of Object.keys(fallbackData.daily)) {
          const fallbackArr = fallbackData.daily[key];
          if (Array.isArray(fallbackArr)) {
            const currentArr = data.daily[key];
            if (!currentArr || !Array.isArray(currentArr)) {
              data.daily[key] = [...fallbackArr];
            } else {
              const merged: any[] = [];
              const maxLength = Math.max(currentArr.length, fallbackArr.length);
              for (let i = 0; i < maxLength; i++) {
                const curVal = currentArr[i];
                if (i < currentArr.length && curVal !== null && curVal !== undefined) {
                  merged.push(curVal);
                } else if (i < fallbackArr.length) {
                  merged.push(fallbackArr[i]);
                } else {
                  merged.push(null);
                }
              }
              data.daily[key] = merged;
            }
          }
        }
      }
      // Merge hourly data
      if (fallbackData.hourly) {
        if (!data.hourly) data.hourly = {};
        for (const key of Object.keys(fallbackData.hourly)) {
          const fallbackArr = fallbackData.hourly[key];
          if (Array.isArray(fallbackArr)) {
            const currentArr = data.hourly[key];
            if (!currentArr || !Array.isArray(currentArr)) {
              data.hourly[key] = [...fallbackArr];
            } else {
              const merged: any[] = [];
              const maxLength = Math.max(currentArr.length, fallbackArr.length);
              for (let i = 0; i < maxLength; i++) {
                const curVal = currentArr[i];
                if (i < currentArr.length && curVal !== null && curVal !== undefined) {
                  merged.push(curVal);
                } else if (i < fallbackArr.length) {
                  merged.push(fallbackArr[i]);
                } else {
                  merged.push(null);
                }
              }
              data.hourly[key] = merged;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Échec de la connexion à l\'API météo.');
  }

  try {
    // Calculate start index first to align current time with hourly indices
    const nowHour = new Date().getHours();
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
      startIdx = Math.max(0, new Date().getHours());
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

    // 2. Fix false drizzle (Meteo-France bug where code is 51-69 but precipitation is 0.0)
    if ((currentCode >= 50 && currentCode <= 59) || (currentCode >= 60 && currentCode <= 69)) {
       const currentPrecip = rawCurrentMF.precipitation ?? rawCurrentStd.precipitation ?? 0;
       if (currentPrecip === 0) {
          currentCode = 3; 
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

    // 4. Overcast to dry sky refinement:
    // If the final code is overcast (3) but there's no actual rain, map to:
    // - "Peu nuageux" (1) if the precipitation probability is very low (<= 15%)
    // - "Éclaircies" (2) if the precipitation probability is low to moderate (<= 35%)
    const currentPrecipTotal = rawCurrentMF.precipitation ?? rawCurrentStd.precipitation ?? 0;
    if (currentCode === 3 && currentPrecipTotal === 0) {
      if (currentProb <= 15) {
        currentCode = 1;
      } else if (currentProb <= 35) {
        currentCode = 2;
      }
    }

    const ui = getWeatherUI(currentCode);
    
    let displayTemp = rawCurrentMF.temperature_2m ?? rawCurrentStd.temperature_2m ?? 15;
    const apparent = rawCurrentMF.apparent_temperature ?? rawCurrentStd.apparent_temperature ?? displayTemp;
    if (apparent > displayTemp && displayTemp > 20) {
        displayTemp = apparent;
    }

    const current: CurrentWeather = {
      temperature: displayTemp,
      feelsLike: apparent,
      humidity: rawCurrentMF.relative_humidity_2m ?? rawCurrentStd.relative_humidity_2m ?? 50,
      windSpeed: rawCurrentMF.wind_speed_10m ?? rawCurrentStd.wind_speed_10m ?? 0,
      weatherCode: currentCode,
      weatherDesc: ui.label,
      iconName: currentCode.toString(),
      precipitation: rawCurrentMF.precipitation ?? rawCurrentStd.precipitation ?? 0,
      time: rawCurrentMF.time ?? rawCurrentStd.time ?? ''
    };

    // Map Hourly forecasts (next 12 hours)
    const hourly: HourlyForecastItem[] = [];
    const hourlyTemps = data.hourly?.temperature_2m || [];
    const hourlyCodes = data.hourly?.weather_code || [];
    const hourlyProb = data.hourly?.precipitation_probability || [];
    const hourlyPrecip = data.hourly?.precipitation || [];

    for (let j = 0; j < 12; j++) {
      const idx = startIdx + j;
      if (idx < hourlyTimes.length) {
        const timeStr = hourlyTimes[idx];
        const hourLabel = timeStr ? timeStr.split('T')[1].substring(0, 5) : `${(nowHour + j) % 24}:00`;
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
        if ((code >= 50 && code <= 59) || (code >= 60 && code <= 69)) {
          if (precip === 0) {
            code = 3;
          }
        }

        // 3. Apply general smart overcast override globally to prevent false overcast/cloudy icons
        if (code === 3 && precip === 0) {
          if (prob <= 15) {
            code = 1;
          } else if (prob <= 35) {
            code = 2;
          }
        }
        
        hourly.push({
          time: hourLabel,
          temp: hourlyTemps[idx] ?? 15,
          weatherCode: code,
          iconName: code.toString(),
          precipitationProbability: hourlyProb[idx] ?? 0,
          precipitation: hourlyPrecip[idx] ?? 0
        });
      } else {
        hourly.push({
          time: `${(nowHour + j) % 24}:00`,
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
    const currentDayIdx = new Date().getDay();
    const dailyCodes = data.daily?.weather_code || [];
    const dailyMax = data.daily?.temperature_2m_max || [];
    const dailyMin = data.daily?.temperature_2m_min || [];
    const dailyUv = data.daily?.uv_index_max || [];

    for (let k = 0; k < 7; k++) {
      const dayName = daysArr[(currentDayIdx + k) % 7];
      const apiDailyCode = dailyCodes[k] ?? 0;
      
      // Grab 24 hours for this day (indices k*24 to k*24 + 23)
      const dailyHourly: HourlyForecastItem[] = [];
      const dayDateStr = data.daily?.time?.[k];
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
          if ((hCode >= 50 && hCode <= 59) || (hCode >= 60 && hCode <= 69)) {
            if (hPrecip === 0) {
              hCode = 3;
            }
          }

          // 3. Apply general smart overcast override
          if (hCode === 3 && hPrecip === 0) {
            if (hProb <= 15) {
              hCode = 1;
            } else if (hProb <= 35) {
              hCode = 2;
            }
          }

          dailyHourly.push({
            time: hourLabel,
            temp: hourlyTemps[idx] ?? 15,
            weatherCode: hCode,
            iconName: hCode.toString(),
            precipitationProbability: hourlyProb[idx] ?? 0,
            precipitation: hourlyPrecip[idx] ?? 0
          });
        }
      }

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
              // No rain/storm code in daily API and no hourly rain codes!
              // Respect the API daily code (0, 1, 2, 3), but refine it if needed to avoid wrong overcast/sunny extremes
              const clearHours = daytimeHours.filter(h => h.weatherCode === 0).length;
              const mainlyClearHours = daytimeHours.filter(h => h.weatherCode === 1).length;
              const partlyCloudyHours = daytimeHours.filter(h => h.weatherCode === 2).length;
              const overcastHours = daytimeHours.filter(h => h.weatherCode === 3).length;

              if (apiDailyCode === 3) {
                if (maxRainProb <= 15 && (clearHours + mainlyClearHours > partlyCloudyHours + overcastHours)) {
                  representativeCode = 1; // Peu nuageux
                } else if (maxRainProb <= 30 && overcastHours < daytimeHours.length * 0.4) {
                  representativeCode = 2; // Éclaircies
                }
              } else if (apiDailyCode === 0) {
                if (overcastHours > daytimeHours.length * 0.6) {
                  representativeCode = 3; // Couvert
                } else if (partlyCloudyHours > daytimeHours.length * 0.5) {
                  representativeCode = 2; // Éclaircies
                } else if (mainlyClearHours > daytimeHours.length * 0.4) {
                  representativeCode = 1; // Peu nuageux
                }
              }
            }
          }
        }
      }

      daily.push({
        date: k === 0 ? "Auj." : dayName,
        tempMax: dailyMax[k] ?? 20,
        tempMin: dailyMin[k] ?? 10,
        weatherCode: representativeCode,
        iconName: representativeCode.toString(),
        uvIndex: dailyUv[k] ? Math.round(dailyUv[k] ?? 3) : 3,
        hourly: dailyHourly
      });
    }

    // Use current hours probability to model realistic hourly precipitation timeline
    const prob = hourly.length > 0 ? hourly[0].precipitationProbability : 0;
    const tomorrowPrecip = daily.length > 1 ? daily[1].tempMax - daily[1].tempMin : 0;
    const rainInTheHour = generateRainInTheHour(prob, tomorrowPrecip);

    // Dynamic Vigilance Status calculation
    const vigilance = calculateVigilance(
      current.temperature,
      current.windSpeed,
      current.weatherCode,
      current.precipitation
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
