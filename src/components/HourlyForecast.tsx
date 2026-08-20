import React from 'react';
import { motion } from 'motion/react';
import { HourlyForecastItem } from '../types';
import { getWeatherUI, isHourNight } from '../utils/weatherUtils';

interface HourlyForecastProps {
  hourlyData: HourlyForecastItem[];
  humidity: number;
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
      className="glass-premium rounded-3xl p-5 shadow-lg select-none space-y-4 text-white"
    >
      {/* Title area displaying the selected day */}
      <div className="flex justify-between items-center text-[10px] font-bold text-sky-200 uppercase tracking-widest pb-1 border-b border-white/10">
        <span>Heure par heure — {dayName}</span>
        {displayItems.length > 6 && <span className="text-[9px] text-white/60 normal-case">(Défilez ➔)</span>}
      </div>

      {/* Sliding Row of beautiful Pill items */}
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
              className={`relative flex flex-col items-center justify-between h-24 min-w-[54px] py-1.5 rounded-2xl border shadow-sm transition-colors hover:bg-white/20 ${
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
              <span className="text-[9px] text-white/50 font-bold">
                {hour.time}
              </span>

              {/* Climate Icon inside slot */}
              <div>
                <WeatherIcon className={`w-5 h-5 ${weatherUI.colorClass}`} />
              </div>

              {/* Hour Temp */}
              <span className="text-[11px] text-white font-bold">
                {Math.round(hour.temp)}°
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Humidity progress slider line exactly matching mockup placement at bottom of hourly section */}
      <div className="space-y-2 pt-1 border-t border-white/10">
        <div className="flex justify-between items-center text-[10px] font-bold text-white/50 tracking-wider">
          <span className="uppercase">Modèle AROME</span>
          <span className="text-white/80">Humidité: {humidity}%</span>
        </div>
        <div className="relative w-full h-[3px] bg-white/15 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-white/65 rounded-full" 
            style={{ width: `${humidity}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(HourlyForecast);
