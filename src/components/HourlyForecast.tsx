import React from 'react';
import { motion } from 'motion/react';
import { HourlyForecastItem } from '../types';
import { getWeatherUI, isHourNight } from '../utils/weatherUtils';

interface HourlyForecastProps {
  hourlyData: HourlyForecastItem[];
  humidity?: number;
  dayName?: string;
  sunrise?: string;
  sunset?: string;
}

function HourlyForecast({ hourlyData, humidity, dayName = "Aujourd'hui", sunrise, sunset }: HourlyForecastProps) {
  // Allow full horizontal scrolling for the given data
  const displayItems = hourlyData;

  return (
    <div 
      id="hourly-forecast-container"
      className="card select-none space-y-4"
    >
      {/* Title area displaying the selected day */}
      <div className="flex justify-between items-center pb-2 border-b border-white/10 gap-2">
        <span className="kicker text-sky-200">Heure par heure — {dayName}</span>
        {displayItems.length > 6 && <span className="meta whitespace-nowrap">(Défilez →)</span>}
      </div>

      {/* Sliding row of hourly slots */}
      <div 
        className="flex justify-start items-center gap-2.5 overflow-x-auto no-scrollbar py-1" 
        id="hourly-forecast-scroll"
      >
        {displayItems.map((hour, index) => {
          const hourStr = hour.time.split(':')[0];
          const h = parseInt(hourStr, 10);
          const isNight = isHourNight(h, sunrise, sunset);
          const weatherUI = getWeatherUI(hour.weatherCode, isNight);
          const WeatherIcon = weatherUI.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.035, 0.5), ease: 'easeOut' }}
              whileTap={{ scale: 0.93 }}
              className={`relative flex flex-col items-center justify-between h-24 min-w-[56px] py-1.5 rounded-2xl border shadow-sm transition-colors hover:bg-white/20 ${
                hour.stormRisk
                  ? 'bg-amber-500/15 border-amber-400/40'
                  : 'bg-white/10 border-white/15'
              }`}
            >
              {/* Storm risk badge */}
              {hour.stormRisk && (
                <span className="absolute -top-1.5 -right-1 text-[11px] animate-pulse" title="Risque orageux">⚡</span>
              )}

              {/* Hour time */}
              <span className="text-[11px] text-white/60 font-bold tabular-figures">
                {hour.time}
              </span>

              {/* Climate Icon inside slot */}
              <div>
                <WeatherIcon className={`w-5 h-5 ${weatherUI.colorClass}`} />
              </div>

              {/* Hour Temp */}
              <span className="text-[12px] text-white font-bold tabular-figures">
                {Math.round(hour.temp)}°
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Humidity progress slider line (masquée si aucune source ne la donne) */}
      {humidity !== undefined && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex justify-between items-center text-[11px] font-bold text-white/50 tracking-wider">
            <span className="uppercase">Modèle AROME</span>
            <span className="text-white/80">Humidité {dayName === "Aujourd'hui" || dayName === "Prochaines heures" ? 'actuelle' : 'moyenne'} : {humidity}%</span>
          </div>
          <div className="relative w-full h-[3px] bg-white/15 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-white/65 rounded-full" 
              style={{ width: `${humidity}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(HourlyForecast);
