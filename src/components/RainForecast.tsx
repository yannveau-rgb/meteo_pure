import React, { useState } from 'react';
import { RainInTheHour } from '../types';
import { motion } from 'motion/react';

interface RainForecastProps {
  rainData: RainInTheHour[];
  // Kept in the props contract even though this component doesn't read it —
  // the parent computes it for a sibling component and passing it here too
  // costs nothing to keep the call site simple.
  precipitationProbability: number;
  /** Ouvre le radar (onglet Carte). */
  onOpenRadar?: () => void;
}

export default function RainForecast({ rainData, onOpenRadar }: RainForecastProps) {
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

  const unavailable = rainData.length === 0;

  const getSummaryMessage = () => {
    if (unavailable) return 'Prévision indisponible';
    if (maxIntensity === 'none') return 'Aucune pluie prévue';
    if (maxIntensity === 'light') return 'Faibles bruines bientôt';
    if (maxIntensity === 'moderate') return 'Averses modérées attendues';
    return 'Fortes averses attendues';
  };

  return (
    <div 
      id="rain-forecast-widget"
      className="card flex flex-col justify-between transition-all duration-300 hover:brightness-105 min-h-40 gap-2"
    >
      <div className="flex justify-between items-start gap-1 select-none">
        <span className="text-[11px] font-medium text-white/75 uppercase tracking-wide leading-tight">
          Pluie dans l'heure
        </span>
        {onOpenRadar && (
          <button
            type="button"
            onClick={onOpenRadar}
            className="icon-btn icon-btn--sm !w-6 !h-6 shrink-0 text-[12px] font-bold cursor-pointer"
            aria-label="Voir le radar de pluie"
          >
            ↗
          </button>
        )}
      </div>

      {/* Rain Graphique with beautiful vertical tube styled cylinders and water drop icons */}
      <div className="flex items-end justify-between h-14 mt-1 gap-1 select-none">
        {rainData.slice(0, 7).map((item, index) => ( // Show first 7 intervals beautifully in the grid
          <button
            type="button"
            key={index}
            className="flex-1 flex flex-col items-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/60 rounded-lg"
            aria-pressed={selectedBar === index}
            aria-label={`+${item.minutes} min : ${getIntensityLabel(item.intensity)}`}
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
              <span className="text-[11px] text-white/65 font-bold leading-none tracking-tighter">
                +{item.minutes}m
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Dynamic inline stats view inside Pluie panel */}
      <div className="mt-2 text-center min-h-[16px] flex items-center justify-center transition-all duration-200">
        <p className="text-[11px] text-white/75 font-semibold leading-normal">
          {selectedBar !== null && rainData[selectedBar] ? (
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
