import React, { useState } from 'react';
import { CurrentWeather, HourlyForecastItem, DailyForecastItem } from '../types';

interface WeatherStatsProps {
  current: CurrentWeather;
  uvIndex?: number;
  hourlyData?: HourlyForecastItem[];
  dailyData?: DailyForecastItem[];
}

function getWindDir(deg?: number): string {
  if (deg === undefined) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(deg / 45) % 8];
}

// Was duplicated verbatim further down for the 7-day UV row — one copy now.
function getUvRiskStyle(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: 'Faible', color: 'text-green-300 bg-green-500/20 border-green-500/30' };
  if (uv <= 5) return { label: 'Modéré', color: 'text-amber-300 bg-amber-500/20 border-amber-500/30' };
  if (uv <= 7) return { label: 'Élevé', color: 'text-orange-300 bg-orange-500/20 border-orange-500/30' };
  if (uv <= 10) return { label: 'Très élevé', color: 'text-red-300 bg-red-500/20 border-red-500/30' };
  return { label: 'Extrême', color: 'text-fuchsia-300 bg-fuchsia-500/20 border-fuchsia-500/30' };
}

function WeatherStats({ current, uvIndex = 3, hourlyData = [], dailyData = [] }: WeatherStatsProps) {
  const uvRisk = getUvRiskStyle(uvIndex);
  const [selectedUvDay, setSelectedUvDay] = useState<number | null>(null);

  // Calculate relative indicator representation
  const windPercentage = Math.min(95, Math.max(5, (current.windSpeed / 50) * 100));
  
  // Slice to the next 6 hours of forecasts
  const featuredHourly = hourlyData.slice(0, 6);
  
  // Function to calculate exact coordinate points for the SVG sparkline
  const drawSparkline = () => {
    if (featuredHourly.length < 2) return null;
    
    const temps = featuredHourly.map(h => h.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempRange = maxTemp - minTemp || 1;
    
    const width = 320;
    const height = 42;
    const paddingX = 14;
    const paddingY = 8;
    
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingY * 2;
    
    const points = featuredHourly.map((hour, idx) => {
      const x = paddingX + idx * (plotWidth / (featuredHourly.length - 1));
      // Inverse the Y axis for SVG (max temp is high, so low Y value)
      const y = paddingY + plotHeight - ((hour.temp - minTemp) / tempRange) * plotHeight;
      return { x, y, temp: hour.temp, time: hour.time };
    });
    
    // SVG line path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }
    
    // Closed region path for filled area graph gradient
    const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
    
    return { points, pathD, fillD, minTemp, maxTemp, width, height };
  };

  const spark = drawSparkline();

  // Same SVG sparkline technique as drawSparkline above, for the 7-day UV
  // row — this used to be a Recharts LineChart, 109 kB gzip pulled in
  // (preloaded in <head>, so it wasn't even lazy) for 7 data points.
  const drawUvChart = () => {
    const days = dailyData.filter(d => d.uvIndex !== undefined);
    if (days.length < 2) return null;

    const values = days.map(d => d.uvIndex as number);
    const maxUv = Math.max(...values, 1);

    const width = 320;
    const height = 90;
    const paddingX = 14;
    const paddingTop = 12;
    const paddingBottom = 20;

    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingTop - paddingBottom;

    const points = days.map((d, idx) => {
      const uv = d.uvIndex as number;
      const x = paddingX + idx * (plotWidth / (days.length - 1));
      const y = paddingTop + plotHeight - (uv / maxUv) * plotHeight;
      return { x, y, uv, label: d.date.split(' ')[0] };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    return { points, pathD, width, height };
  };

  const uvChart = drawUvChart();
  const selectedUv = uvChart && selectedUvDay !== null ? uvChart.points[selectedUvDay] : null;
  
  return (
    <div 
      id="weather-details-card"
      className="glass-premium rounded-3xl p-5 shadow-lg space-y-3.5 text-white/90 select-none"
    >
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs font-semibold text-white/85">
          <span>Vitesse du vent: {Math.round(current.windSpeed)} km/h</span>
          <span>Ressenti: {Math.round(current.feelsLike)}°C</span>
        </div>
        
        {/* Elite glowing glassmorphic custom slider track with mercury bead */}
        <div className="relative w-full h-1 bg-white/20 rounded-full">
          {/* Progress fill */}
          <div 
            className="absolute top-0 left-0 h-full bg-white/70 rounded-full"
            style={{ width: `${windPercentage}%` }}
          />
          {/* 3D Mercury shining bubble knob */}
          <div 
            className="absolute w-3.5 h-3.5 rounded-full slider-handle-mercury top-1/2 -translate-y-1/2"
            style={{ left: `calc(${windPercentage}% - 7px)` }}
          />
        </div>
      </div>

      {/* Grid for minor parameters */}
      <div className="flex justify-between items-center text-[11px] font-semibold text-white/70 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span>Index UV: {uvIndex}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${uvRisk.color}`}>{uvRisk.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {current.windDirection !== undefined && (
            <span className="text-white/50">{getWindDir(current.windDirection)}</span>
          )}
          <span>Précip: {current.precipitation.toFixed(1)} mm</span>
        </div>
      </div>

      {/* Extra precision fields */}
      {(current.pressure !== undefined || current.visibility !== undefined || current.cloudCover !== undefined) && (
        <div className="flex justify-between items-center text-[10px] text-white/50 pt-0.5">
          {current.pressure !== undefined && (
            <span>{Math.round(current.pressure)} hPa</span>
          )}
          {current.cloudCover !== undefined && (
            <span>Nuages {current.cloudCover}%</span>
          )}
          {current.visibility !== undefined && (
            <span>Visib. {current.visibility >= 1000 ? `${(current.visibility / 1000).toFixed(1)} km` : `${current.visibility} m`}</span>
          )}
        </div>
      )}

      {/* Exquisite inline SVG Sparkline to show the temperature curve for the next 6 hours */}
      {spark && (
        <div className="pt-3.5 border-t border-white/10 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-sky-200 uppercase tracking-widest">
            <span>Tendance Temp. (6h venir)</span>
            <span className="text-[9px] text-white/60 normal-case font-medium">Jusqu'à {featuredHourly[featuredHourly.length - 1].time}</span>
          </div>
          
          <div className="relative bg-white/5 rounded-2xl p-2.5 border border-white/10 overflow-hidden">
            {/* Sparkline canvas graph */}
            <svg viewBox={`0 0 ${spark.width} ${spark.height}`} className="w-full h-10 overflow-visible">
              <defs>
                <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              
              {/* Translucent background glow filled area chart */}
              <path d={spark.fillD} fill="url(#sparkline-grad)" />
              
              {/* Glowing trendline stroke path */}
              <path 
                d={spark.pathD} 
                fill="none" 
                stroke="url(#line-grad)" 
                strokeWidth={2} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              
              {/* Custom micro interaction point circles & text overlays for temperatures */}
              {spark.points.map((pt, idx) => (
                <g key={idx}>
                  {/* Subtle hover expand spot focus region */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r={6} 
                    className="fill-sky-400/10 stroke-sky-400/0 hover:stroke-sky-300 hover:fill-sky-400/30 transition-all duration-300 cursor-pointer" 
                  />
                  {/* Bright central mercury bead */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r={2.5} 
                    className="fill-white drop-shadow-[0_0_3px_rgba(255,255,255,0.9)] pointer-events-none" 
                  />
                  {/* Tiny clean floating temperature labels */}
                  <text 
                    x={pt.x} 
                    y={pt.y - 6} 
                    textAnchor="middle" 
                    className="text-[9px] font-bold fill-white/95 select-none"
                  >
                    {Math.round(pt.temp)}°
                  </text>
                </g>
              ))}
            </svg>
            
            {/* Highly legible and aligned hours array row */}
            <div className="flex justify-between px-1.5 text-[9px] font-bold text-white/60 pt-1.5 border-t border-white/5">
              {spark.points.map((pt, idx) => (
                <span key={idx} className="w-8 text-center">{pt.time}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {uvChart && (
        <div className="pt-3.5 border-t border-white/10 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-amber-200 uppercase tracking-widest">
            <span>Indice UV (7 jours à venir)</span>
            <span className="text-[9px] text-white/60 normal-case font-medium">
              {selectedUv ? `${selectedUv.label} · UV ${selectedUv.uv}` : 'Évolution prévue'}
            </span>
          </div>

          <div className="relative bg-white/5 rounded-2xl p-2 border border-white/10 overflow-hidden">
            <svg
              viewBox={`0 0 ${uvChart.width} ${uvChart.height}`}
              className="w-full h-20"
              onMouseLeave={() => setSelectedUvDay(null)}
            >
              <path d={uvChart.pathD} fill="none" stroke="#fbbf24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {uvChart.points.map((pt, idx) => (
                <g
                  key={idx}
                  onMouseEnter={() => setSelectedUvDay(idx)}
                  onClick={() => setSelectedUvDay(selectedUvDay === idx ? null : idx)}
                  className="cursor-pointer"
                >
                  {/* Generous invisible hit target — the visible dot alone is too small to tap reliably */}
                  <circle cx={pt.x} cy={pt.y} r={10} fill="transparent" />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={selectedUvDay === idx ? 4 : 3}
                    fill={selectedUvDay === idx ? '#fff' : '#1e293b'}
                    stroke="#fbbf24"
                    strokeWidth={selectedUvDay === idx ? 2 : 1.5}
                  />
                </g>
              ))}
            </svg>
            <div className="flex justify-between px-1.5 text-[8px] font-bold text-white/50 uppercase">
              {uvChart.points.map((pt, idx) => (
                <span key={idx} className={selectedUvDay === idx ? 'text-amber-200' : ''}>{pt.label}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default React.memo(WeatherStats);
