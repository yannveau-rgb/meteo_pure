import React from 'react';
import { HourlyForecastItem } from '../types';
import { getWeatherUI, isHourNight } from '../utils/weatherUtils';

interface HourlyForecastProps {
  hourlyData: HourlyForecastItem[];
  humidity: number;
  dayName?: string;
  sunrise?: string;
  sunset?: string;
}

export default function HourlyForecast({ hourlyData, humidity, dayName = "Aujourd'hui", sunrise, sunset }: HourlyForecastProps) {
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
        {displayItems.length > 6 && <span className="text-[8px] text-white/40 normal-case">(Défilez ➔)</span>}
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
            <div 
              key={index} 
              className="flex flex-col items-center justify-between h-24 min-w-[54px] py-1.5 rounded-2xl bg-white/10 border border-white/15 shadow-sm transition-all hover:bg-white/20"
            >
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
            </div>
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
