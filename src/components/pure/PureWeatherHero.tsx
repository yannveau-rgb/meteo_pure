import React, { useMemo } from 'react';
import { Leaf, CloudSun, MapPin, Sparkles, Sunrise, Sunset, TrendingUp, TrendingDown } from 'lucide-react';
import { WeatherData, HourlyForecastItem, Commune } from '../../types';
import { getWeatherUI, isNightTime } from '../../utils/weatherUtils';
import { getDaylightInfo } from '../../utils/ephemeris';

interface PureWeatherHeroProps {
  weather: WeatherData;
  selectedHour?: HourlyForecastItem;
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
  selectedHour,
  cityName,
  mode,
  onToggleMode,
  airQualityIndex,
  airQualityLabel,
  onOpenBrief,
  favorites,
  onSelectFavorite,
}: PureWeatherHeroProps) {
  // Active temperature and condition (either from scrubbed hour or current weather)
  const temp = Math.round(selectedHour ? selectedHour.temp : weather.current.temperature);
  // Calcul exact en heures décimales (identique à CelestialSky) pour éviter tout décalage Soleil/Lune
  const isNight = selectedHour 
    ? (() => {
        const parts = selectedHour.time.split(':');
        const hourFloat = parseInt(parts[0], 10) + (parseInt(parts[1] || '0', 10) / 60);
        const srParts = (weather.sunrise || '07:00').split(':');
        const sunriseFloat = parseInt(srParts[0], 10) + (parseInt(srParts[1] || '0', 10) / 60);
        const ssParts = (weather.sunset || '20:00').split(':');
        const sunsetFloat = parseInt(ssParts[0], 10) + (parseInt(ssParts[1] || '0', 10) / 60);
        return hourFloat < sunriseFloat || hourFloat > sunsetFloat;
      })()
    : isNightTime(weather.sunrise, weather.sunset);

  const activeCode = selectedHour ? selectedHour.weatherCode : weather.current.weatherCode;
  const weatherUI = getWeatherUI(activeCode, isNight);
  const conditionDesc = selectedHour 
    ? weatherUI.label 
    : weather.current.weatherDesc;
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
    if (selectedHour) {
      if (temp >= 30) return "La chaleur s'installe, hydratez-vous bien";
      if (temp <= 5) return "Un air particulièrement frais s'annonce";
      if (selectedHour.precipitationProbability > 40) return `Risque d'averse (${selectedHour.precipitationProbability}%)`;
      if (selectedHour.weatherCode === 0) return isNight ? "Nuit claire et ciel étoilé" : "Ciel dégagé et franc soleil";
      if (selectedHour.weatherCode === 1) return isNight ? "Nuit calme avec quelques voiles" : "Ciel lumineux avec quelques voiles";
      if (selectedHour.weatherCode === 2) return isNight ? "Éclaircies nocturnes et ciel paisible" : "Belles éclaircies et ciel doux";
      if (selectedHour.weatherCode === 3) return isNight ? "Nuit couverte et atmosphère feutrée" : "Ciel couvert et atmosphère feutrée";
      if (selectedHour.weatherCode === 45 || selectedHour.weatherCode === 48) return "Brouillard et visibilité réduite";
      if ([51, 53, 55, 56, 57].includes(selectedHour.weatherCode)) return "Bruine fine et temps humide";
      if ([61, 63, 65, 80, 81, 82].includes(selectedHour.weatherCode)) return "Passages pluvieux au programme";
      if ([71, 73, 75, 77, 85, 86].includes(selectedHour.weatherCode)) return "Chutes de neige prévues";
      if ([95, 96, 99].includes(selectedHour.weatherCode)) return "Activité orageuse imminente";
      return conditionDesc || (isNight ? "Nuit paisible" : "Ciel dégagé et atmosphère paisible");
    }
    // When showing current live weather (not scrubbed):
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
    <div className="relative w-full flex flex-col justify-between pt-1 pb-1 px-1 z-10 pointer-events-auto">
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

        {/* Top Right: Morning Brief / Horoscope Trigger or Brand */}
        {onOpenBrief ? (
          <button
            onClick={onOpenBrief}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 backdrop-blur-md text-[11px] font-semibold text-amber-200 shadow-md transition-all cursor-pointer"
            title="Votre Horoscope & Brief Météo du Jour"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Brief</span>
          </button>
        ) : (
          <div className="text-[11px] font-medium text-white/60 tracking-wider uppercase">
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

          {/* Right: Prominent Daylight Minutes Gained/Lost & Lever/Coucher Badge */}
          <button
            type="button"
            onClick={handleScrollToDaylight}
            className="mb-1 px-3 py-2 rounded-2xl bg-black/30 hover:bg-black/40 active:scale-95 border border-white/25 backdrop-blur-md text-left shadow-lg transition-all cursor-pointer flex flex-col gap-1"
            title={`${daylight.headline} (${daylight.preciseDeltaLabel}) — Cliquez pour voir le détail`}
          >
            <div className="flex items-center gap-1.5">
              {daylight.isGaining ? (
                <TrendingUp className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-amber-300 shrink-0" />
              )}
              <span
                className={`text-xs sm:text-sm font-extrabold tracking-tight tabular-figures ${
                  daylight.isGaining ? 'text-emerald-200' : 'text-amber-200'
                }`}
              >
                {daylight.badgeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10.5px] font-semibold text-white/85 tabular-figures">
              <span className="flex items-center gap-0.5">
                <Sunrise className="w-3 h-3 text-amber-300" />
                {daylight.sunrise}
              </span>
              <span className="text-white/35">•</span>
              <span className="flex items-center gap-0.5">
                <Sunset className="w-3 h-3 text-indigo-300" />
                {daylight.sunset}
              </span>
            </div>
            <div className="text-[9.5px] text-white/65 font-medium tabular-figures">
              Durée du jour : <strong className="text-white/90">{daylight.dayLengthFormatted}</strong> ({daylight.preciseDeltaLabel})
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
          <span>{humidity}% Humidité</span>
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
