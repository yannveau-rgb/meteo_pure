import { useState } from 'react';
import { getMorningBriefContent, HumorLevel } from '../utils/notificationService';
import { buildMorningAnchor, analyzeRainTiming, MorningAnchorInput } from '../utils/morningAnchor';
import { WeatherData } from '../types';

export interface MorningBriefView {
  title: string;
  anchor: string;
  punchline: string;
  ai?: boolean;
}

/**
 * Derives the factual anchor inputs from the weather already loaded in the app,
 * so the modal shows the same numbers the user can see on screen.
 */
function toAnchorInput(weather: WeatherData | null | undefined): MorningAnchorInput | undefined {
  if (!weather) return undefined;
  const today = weather.daily?.[0];
  const hours = (today?.hourly ?? weather.hourly ?? []).map(h => ({
    hour: parseInt(h.time.split(':')[0], 10),
    precip: h.precipitation ?? 0,
    precipProb: h.precipitationProbability ?? 0,
  }));
  const timing = analyzeRainTiming(hours);

  return {
    weatherCode: weather.current.weatherCode,
    tempMax: today?.tempMax,
    tempMin: today?.tempMin,
    uvMax: today?.uvIndex,
    windGustsMax: today?.windGusts ?? weather.current.windGusts,
    precipSum: today?.precipitationSum,
    rainStartsAtHour: timing.startsAtHour,
    rainAllDay: timing.allDay,
  };
}

export function useMorningBrief() {
  const [showMoonModal, setShowMoonModal] = useState<boolean>(false);
  const [showMorningBriefModal, setShowMorningBriefModal] = useState<boolean>(false);
  const [aiBrief, setAiBrief] = useState<MorningBriefView | null>(null);
  const [loadingBrief, setLoadingBrief] = useState<boolean>(false);

  async function openMorningBrief(
    birthDate: string,
    weatherCode: number,
    humorLevel: HumorLevel,
    cityName: string,
    weather?: WeatherData | null
  ) {
    setShowMorningBriefModal(true);
    if (!birthDate) {
      setAiBrief(null);
      return;
    }
    setLoadingBrief(true);
    setAiBrief(null);

    const anchorInput = toAnchorInput(weather);
    // Computed locally too, so a failed API call still shows correct facts.
    const localAnchor = buildMorningAnchor(anchorInput ?? { weatherCode });

    const fallback = (): MorningBriefView => {
      const fb = getMorningBriefContent(humorLevel, birthDate, weatherCode);
      return {
        title: fb?.title ?? '🔮 Brief matinal',
        anchor: localAnchor,
        punchline: fb?.body ?? 'Journée ordinaire en perspective.',
        ai: false,
      };
    };

    try {
      const res = await fetch('/api/morning-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate, weatherCode, humorLevel, cityName, anchorInput })
      });
      if (res.ok) {
        const data = await res.json();
        setAiBrief({
          title: data.title,
          // Prefer the locally computed anchor: the client always holds the
          // full forecast, so it can never be less accurate than the server's
          // — which only sees whatever anchorInput survived the round trip.
          anchor: anchorInput ? localAnchor : (data.anchor || localAnchor),
          punchline: data.punchline || data.body,
          ai: data.ai !== false,
        });
      } else {
        setAiBrief(fallback());
      }
    } catch (err) {
      console.error('[BRIEF]', err);
      setAiBrief(fallback());
    } finally {
      setLoadingBrief(false);
    }
  }

  return {
    showMoonModal, setShowMoonModal,
    showMorningBriefModal, setShowMorningBriefModal,
    aiBrief, setAiBrief,
    loadingBrief,
    openMorningBrief,
  };
}
