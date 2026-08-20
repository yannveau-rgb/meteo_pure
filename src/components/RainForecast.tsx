import React, { useState } from 'react';
import { RainInTheHour } from '../types';
import { motion } from 'motion/react';

interface RainForecastProps {
  rainData: RainInTheHour[];
  // Kept in the props contract even though this component doesn't read it —
  // the parent computes it for a sibling component and passing it here too
  // costs nothing to keep the call site simple.
  precipitationProbability: number;
}

export default function RainForecast({ rainData }: RainForecastProps) {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'heavy': return 'Forte pluie';
      case 'moderate': return 'Pluie modérée';
      case 'light': return 'Pluie faible / Bruine';
      default: return 'Pas de pluie';
    }
  };

  // Determine an overall status text
  const maxIntensity = rainData.reduce((acc, curr) => {
    if (curr.intensity === 'heavy') return 'heavy';
    if (curr.intensity === 'moderate' && acc !== 'heavy') return 'moderate';
    if (curr.intensity === 'light' && acc === 'none') return 'light';
    return acc;
  }, 'none' as 'none' | 'light' | 'moderate' | 'heavy');

  const getSummaryMessage = () => {
    if (maxIntensity === 'none') return 'Aucune pluie prévue';
    if (maxIntensity === 'light') return 'Faibles bruines bientôt';
    if (maxIntensity === 'moderate') return 'Averses modérées attendues';
    return 'Fortes averses attendues';
  };

  return (
    <div 
      id="rain-forecast-widget"
      className="glass-premium rounded-3xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-300 hover:brightness-105 h-40"
    >
      <div className="flex justify-between items-center select-none">
        <span className="text-[10px] sm:text-[11px] font-medium text-white/70 uppercase tracking-wider md:tracking-widest flex items-center gap-1 whitespace-nowrap">
          Pluie dans l'heure
        </span>
      </div>

      {/* Rain Graphique with beautiful vertical tube styled cylinders and water drop icons */}
      <div className="flex items-end justify-between h-14 mt-3 px-1 gap-2 select-none">
        {rainData.slice(0, 7).map((item, index) => ( // Show first 7 intervals beautifully in the grid
          <div 
            key={index} 
            className="flex-1 flex flex-col items-center group cursor-pointer"
            onClick={() => setSelectedBar(selectedBar === index ? null : index)}
            onMouseEnter={() => setSelectedBar(index)}
            onMouseLeave={() => setSelectedBar(null)}
          >
            {/* 3D Glass Tube containing animating liquid status */}
            <div className="w-2.5 h-[52px] rain-glass-tube flex items-end">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(10, item.percentage)}%` }} // minimum water line for glassy volume
                transition={{ duration: 0.7, delay: index * 0.04 }}
                className="w-full rain-liquid-fill"
              />
            </div>
            
            {/* Drops & Labels below cylinders mimicking screenshot */}
            <div className="flex flex-col items-center mt-1 space-y-0.5">
              <svg 
                className={`w-1.5 h-1.5 transition-colors ${item.percentage > 10 ? 'text-sky-300' : 'text-white/60'}`} 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
              <span className="text-[9px] text-white/50 font-bold leading-none">
                +{item.minutes}m
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic inline stats view inside Pluie panel */}
      <div className="mt-2 text-center min-h-[16px] flex items-center justify-center transition-all duration-200">
        <p className="text-[10px] text-white/75 font-semibold leading-normal">
          {selectedBar !== null ? (
            <span>
              +{rainData[selectedBar].minutes} min : {getIntensityLabel(rainData[selectedBar].intensity)}
            </span>
          ) : (
            <span>{getSummaryMessage()}</span>
          )}
        </p>
      </div>
    </div>
  );
}
