import React, { useMemo } from 'react';
import { Leaf, CloudSun, MapPin, Sparkles, Sunrise, Sunset } from 'lucide-react';
import { WeatherData, Commune } from '../../types';
import { getWeatherUI, isNightTime } from '../../utils/weatherUtils';
import { getDaylightInfo } from '../../utils/ephemeris';

interface PureWeatherHeroProps {
  weather: WeatherData;
  cityName: string;
  onOpenDetails?: () => void;
  mode: 'weather' | 'aqi';
  onToggleMode: (mode: 'weather' | 'aqi') => void;
  airQualityIndex?: number;
  airQualityLabel?: string;
  onOpenBrief?: () => void;
  favorites?: Commune[];
  onSelectFavorite?: (c: Commune) => void;
}

/**
 * PureWeatherHero: Ultra-clean, modern minimalist weather hero view
 * integrated at the top of the unified single-page forecast.
 */
export default function PureWeatherHero({
  weather,
  cityName,
  mode,
  onToggleMode,
  airQualityIndex,
  airQualityLabel,
  onOpenBrief,
  favorites,
  onSelectFavorite,
}: PureWeatherHeroProps) {
  // Live current conditions.
  const temp = Math.round(weather.current.temperature);
  const isNight = isNightTime(weather.sunrise, weather.sunset);
  const activeCode = weather.current.weatherCode;
  const weatherUI = getWeatherUI(activeCode, isNight);
  const conditionDesc = weather.current.weatherDesc;
  const WeatherConditionIcon = weatherUI.icon;
  
  // High and low for today
  const todayDaily = weather.daily[0];
  const maxTemp = todayDaily ? Math.round(todayDaily.tempMax) : Math.round(temp + 3);
  const minTemp = todayDaily ? Math.round(todayDaily.tempMin) : Math.round(temp - 4);
  const humidity = todayDaily?.humidity ?? weather.current.humidity;
  const uvIndex = todayDaily ? todayDaily.uvIndex : 0;

  // Daylight duration & daily minutes gained/lost
  const daylight = useMemo(
    () => getDaylightInfo(weather.latitude, weather.longitude, 0, weather.sunrise, weather.sunset),
    [weather.latitude, weather.longitude, weather.sunrise, weather.sunset]
  );

  // Editorial natural summary text
  const editorialText = (() => {
    if (mode === 'aqi') {
      return `Indice qualité de l'air : ${airQualityLabel || 'Bon'} (${airQualityIndex ?? 25} AQI)`;
    }
    if (weather.current.weatherCode === 3) return "Ciel actuellement couvert et feutré";
    if (weather.current.weatherCode === 45 || weather.current.weatherCode === 48) return "Brouillard matinal et visibilité limitée";
    if ([61, 63, 65, 80, 81, 82].includes(weather.current.weatherCode)) return "Pluie en cours sur la commune";
    if ([95, 96, 99].includes(weather.current.weatherCode)) return "Risque d'orage et atmosphère électrique";
    return `Ce soir autour de ${minTemp}°C, demain atteindra ${maxTemp}°C`;
  })();

  const handleScrollToDaylight = () => {
    const el = document.getElementById('daylight-ephemeris-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="hero-root relative w-full flex flex-col justify-between pt-1 pb-1 px-1 z-10 pointer-events-auto">
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full">
        {/* Top Left Frosted Toggle Pill (AQI Leaf / Weather Sun) */}
        <div className="flex items-center bg-black/25 backdrop-blur-md border border-white/20 rounded-full p-1 shadow-lg">
          <button
            onClick={() => onToggleMode('aqi')}
            className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              mode === 'aqi'
                ? 'bg-white/25 text-emerald-300 shadow-sm scale-105'
                : 'text-white/60 hover:text-white/90'
            }`}
            title="Qualité de l'air"
            aria-label="Qualité de l'air"
          >
            <Leaf className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleMode('weather')}
            className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              mode === 'weather'
                ? 'bg-white/25 text-amber-300 shadow-sm scale-105'
                : 'text-white/60 hover:text-white/90'
            }`}
            title="Prévisions météo"
            aria-label="Météo"
          >
            <CloudSun className="w-4 h-4" />
          </button>
        </div>

        {/* Top Right: Morning Brief Trigger or Brand */}
        {onOpenBrief ? (
          <button
            onClick={onOpenBrief}
            className="pill !py-1.5 !px-3 !text-[11px] !bg-white/15 hover:!bg-white/25 active:scale-95 border-white/25 text-amber-200 shadow-md transition-all cursor-pointer"
            title="Lire votre brief météo du jour"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Brief</span>
          </button>
        ) : (
          <div className="kicker text-white/60">
            Météo Pure
          </div>
        )}
      </div>

      {/* Editorial Contextual Summary Headline */}
      <div className="mt-2.5 sm:mt-3 min-h-[2.75rem] flex items-start">
        <h2
          key={editorialText}
          className="text-[21px] sm:text-[25px] font-normal tracking-tight text-white leading-snug drop-shadow-sm max-w-sm transition-opacity duration-300"
        >
          {editorialText}
        </h2>
      </div>

      {/* Lower Section: Giant Temperature + Prominent Daylight Gain/Loss Pill */}
      <div className="relative mt-2">
        <div className="flex items-end justify-between gap-2">
          {/* Left: Giant Temperature */}
          <div className="flex items-start">
            <span
              id="main-temp"
              key={temp}
              className="text-[68px] sm:text-[84px] font-extralight tracking-tighter leading-none text-white select-none drop-shadow-md transition-all duration-200 tabular-figures"
            >
              {temp}
            </span>
            <span className="text-[30px] sm:text-[38px] font-light text-white/70 ml-0.5 leading-tight select-none">
              °
            </span>
          </div>

          {/* Right: daylight summary — sunrise/sunset and day length. The
              daily delta stays present but as quiet secondary text, not a
              headline: it matters, it shouldn't shout from the hero. */}
          <button
            type="button"
            onClick={handleScrollToDaylight}
            className="mb-1 px-2.5 py-1.5 rounded-2xl bg-black/20 hover:bg-black/30 active:scale-95 border border-white/15 backdrop-blur-md text-right shadow-sm transition-all cursor-pointer flex flex-col gap-1"
            title={`${daylight.headline} (${daylight.preciseDeltaLabel}) — Cliquez pour voir le détail`}
          >
            <div className="flex items-center justify-end gap-2 text-[11px] font-semibold text-white/80 tabular-figures">
              <span className="flex items-center gap-0.5">
                <Sunrise className="w-3 h-3 text-amber-300/90" />
                {daylight.sunrise}
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-0.5">
                <Sunset className="w-3 h-3 text-indigo-300/90" />
                {daylight.sunset}
              </span>
            </div>
            <div className="text-[11px] text-white/60 font-medium tabular-figures">
              Journée <strong className="text-white/85">{daylight.dayLengthFormatted}</strong>
              {' · '}
              <span className={daylight.isGaining ? 'text-emerald-300/80' : 'text-amber-300/80'}>
                {daylight.shortDeltaLabel}
              </span>
            </div>
          </button>
        </div>

        {/* Location & Condition line with elegant font-display italic */}
        <div className="flex items-center gap-2 text-white/95 text-[14px] font-medium tracking-tight mt-1">
          <MapPin className="w-4 h-4 text-white/80 shrink-0" />
          <span className="font-semibold">{cityName}</span>
          <span className="text-white/40">•</span>
          <WeatherConditionIcon className={`w-4 h-4 ${weatherUI.colorClass} shrink-0`} />
          <span className="capitalize font-display italic text-base sm:text-lg text-white/90">{conditionDesc}</span>
        </div>

        {/* Sub-metrics: High, Low, Humidity, UV */}
        <div className="flex items-center gap-2.5 text-white/75 text-[12px] font-normal mt-0.5 tracking-tight">
          <span>Max {maxTemp}°</span>
          <span>Min {minTemp}°</span>
          <span className="text-white/30">•</span>
          <span>Humidité moy. {humidity}%</span>
          <span className="text-white/30">•</span>
          <span>UV {uvIndex}</span>
        </div>

        {/* Quick horizontal favorite chips right on the main hero */}
        {favorites && favorites.length > 1 && (
          <div className="flex gap-1.5 items-center mt-2 overflow-x-auto no-scrollbar py-0.5 select-none" style={{ WebkitOverflowScrolling: 'touch' }}>
            {favorites.map((fav) => (
              <button
                key={fav.code}
                onClick={() => onSelectFavorite?.(fav)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all border shrink-0 cursor-pointer ${
                  fav.nom === cityName
                    ? 'bg-white/30 text-white border-white/40 shadow-sm'
                    : 'bg-black/20 text-white/70 hover:text-white border-white/10'
                }`}
              >
                {fav.nom}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
