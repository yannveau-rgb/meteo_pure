import React from 'react';
import { ArrowRight, Leaf, CloudSun, MapPin } from 'lucide-react';
import { WeatherData, HourlyForecastItem } from '../../types';

interface PureWeatherHeroProps {
  weather: WeatherData;
  selectedHour?: HourlyForecastItem;
  cityName: string;
  onOpenDetails: () => void;
  mode: 'weather' | 'aqi';
  onToggleMode: (mode: 'weather' | 'aqi') => void;
  airQualityIndex?: number;
  airQualityLabel?: string;
}

/**
 * PureWeatherHero: Ultra-clean, modern minimalist weather hero view
 * strictly modeled after the iconic minimalist design.
 */
export default function PureWeatherHero({
  weather,
  selectedHour,
  cityName,
  onOpenDetails,
  mode,
  onToggleMode,
  airQualityIndex,
  airQualityLabel,
}: PureWeatherHeroProps) {
  // Active temperature (either from scrubbed hour or current weather)
  const temp = Math.round(selectedHour ? selectedHour.temp : weather.current.temperature);
  const conditionDesc = selectedHour ? selectedHour.iconName : weather.current.weatherDesc;
  
  // High and low for today
  const todayDaily = weather.daily[0];
  const maxTemp = todayDaily ? Math.round(todayDaily.tempMax) : Math.round(temp + 3);
  const minTemp = todayDaily ? Math.round(todayDaily.tempMin) : Math.round(temp - 4);
  const humidity = weather.current.humidity;
  const uvIndex = todayDaily ? todayDaily.uvIndex : 0;

  // Editorial natural summary text
  const editorialText = (() => {
    if (mode === 'aqi') {
      return `Indice qualité de l'air : ${airQualityLabel || 'Bon'} (${airQualityIndex ?? 25} AQI)`;
    }
    if (selectedHour) {
      if (temp >= 30) return "La chaleur s'installe, hydratez-vous bien";
      if (temp <= 5) return "Un air particulièrement frais s'annonce";
      if (selectedHour.precipitationProbability > 40) return `Risque d'averse (${selectedHour.precipitationProbability}%)`;
      return conditionDesc || "Ciel dégagé et atmosphère paisible";
    }
    // Default overview statement
    return `Ce soir autour de ${minTemp}°C, demain atteindra ${maxTemp}°C`;
  })();

  return (
    <div className="relative w-full flex-1 min-h-0 flex flex-col justify-between pt-2 pb-1 px-1 z-10 pointer-events-auto">
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

        {/* Ambient subtle badge or favorite indicator */}
        <div className="text-[11px] font-medium text-white/60 tracking-wider uppercase">
          Météo Pure
        </div>
      </div>

      {/* Editorial Contextual Summary Headline */}
      <div className="mt-3 sm:mt-5 min-h-[3.5rem] flex items-start">
        <h1
          key={editorialText}
          className="text-[24px] sm:text-[30px] font-normal tracking-tight text-white leading-snug drop-shadow-sm max-w-sm transition-opacity duration-300"
        >
          {editorialText}
        </h1>
      </div>

      {/* Flexible Spacer pushing Hero readout to bottom of hero zone */}
      <div className="flex-1 min-h-[16px]" />

      {/* Lower Section: Giant Temperature + Location & Metrics + Detail Button */}
      <div className="relative pb-1">
        <div className="flex items-end justify-between">
          {/* Left: Giant Temperature */}
          <div className="flex items-start">
            <span
              key={temp}
              className="text-[88px] sm:text-[108px] font-extralight tracking-tighter leading-none text-white select-none drop-shadow-md transition-all duration-200"
            >
              {temp}
            </span>
            <span className="text-[38px] sm:text-[44px] font-light text-white/70 ml-0.5 leading-tight select-none">
              °
            </span>
          </div>

          {/* Right: Circular Arrow Action Button to Open Full Details */}
          <button
            onClick={onOpenDetails}
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 border border-white/30 backdrop-blur-md text-white flex items-center justify-center shadow-xl transition-all cursor-pointer group mb-2"
            title="Voir toutes les prévisions et cartes détaillées"
            aria-label="Détails complets"
          >
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Location & Condition line */}
        <div className="flex items-center gap-2 text-white/95 text-[15px] font-medium tracking-tight mt-1">
          <MapPin className="w-4 h-4 text-white/80 shrink-0" />
          <span>{cityName}</span>
          <span className="text-white/40">•</span>
          <span className="capitalize">{conditionDesc}</span>
        </div>

        {/* Sub-metrics: High, Low, Humidity, UV */}
        <div className="flex items-center gap-3 text-white/70 text-[13px] font-normal mt-1 tracking-tight">
          <span>Max {maxTemp}°</span>
          <span>Min {minTemp}°</span>
          <span className="text-white/30">•</span>
          <span>{humidity}% Humidité</span>
          <span className="text-white/30">•</span>
          <span>UV {uvIndex}</span>
        </div>
      </div>
    </div>
  );
}
