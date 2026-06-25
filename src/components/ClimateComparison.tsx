import React from 'react';
import { getLocalClimatology } from '../utils/climatology';
import { Thermometer, TrendingUp, TrendingDown, Info, Calendar } from 'lucide-react';

interface ClimateComparisonProps {
  latitude: number;
  longitude: number;
  currentMin: number;
  currentMax: number;
}

export default function ClimateComparison({
  latitude,
  longitude,
  currentMin,
  currentMax
}: ClimateComparisonProps) {
  const stats = getLocalClimatology(latitude, longitude, currentMin, currentMax);

  // Styling based on season anomalies
  const statusConfig = {
    warmer: {
      color: "text-amber-300",
      bgColor: "bg-amber-500/15 border-amber-500/25",
      badgeColor: "bg-red-500/20 text-red-200 border-red-500/35",
      icon: <TrendingUp className="w-5 h-5 text-red-400 animate-pulse" />,
      label: "Anomalie chaude",
      gradient: "from-amber-400/20 to-red-500/10"
    },
    colder: {
      color: "text-sky-300",
      bgColor: "bg-sky-500/15 border-sky-500/25",
      badgeColor: "bg-blue-500/20 text-blue-200 border-blue-500/35",
      icon: <TrendingDown className="w-5 h-5 text-sky-400 animate-pulse" />,
      label: "Anomalie froide",
      gradient: "from-sky-400/20 to-blue-500/10"
    },
    normal: {
      color: "text-emerald-300",
      bgColor: "bg-emerald-500/15 border-emerald-500/25",
      badgeColor: "bg-emerald-500/20 text-emerald-200 border-emerald-500/35",
      icon: <Calendar className="w-5 h-5 text-emerald-400" />,
      label: "De saison",
      gradient: "from-emerald-400/20 to-teal-500/10"
    }
  };

  const currentStatus = statusConfig[stats.seasonStatus];

  // Helper safely format signed numbers
  const formatDiff = (diff: number) => {
    return diff > 0 ? `+${diff.toFixed(1)}°C` : `${diff.toFixed(1)}°C`;
  };

  return (
    <div 
      id="climatology-comparison-card"
      className="glass-premium rounded-3xl p-5 shadow-lg select-none text-white space-y-4"
    >
      {/* Card Header title */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-sky-300" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-200">
            Normales de Saison ({stats.monthName})
          </h3>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Box 1: Température Minimale */}
        <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-white/60 font-medium">Température de nuit (Min)</span>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-xl font-extrabold">{currentMin}°C</span>
            <span className="text-[10px] text-white/50">actuel</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
            <span className="text-white/60">Habituel : {stats.normalMin}°C</span>
            <span className={`font-bold ${stats.deviationMin > 1.2 ? 'text-rose-300' : stats.deviationMin < -1.2 ? 'text-sky-300' : 'text-emerald-300'}`}>
              {stats.deviationMin === 0 ? '±0' : formatDiff(stats.deviationMin)}
            </span>
          </div>
        </div>

        {/* Box 2: Température Maximale */}
        <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-white/60 font-medium">Température de jour (Max)</span>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-xl font-extrabold">{currentMax}°C</span>
            <span className="text-[10px] text-white/50">actuel</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
            <span className="text-white/60">Habituel : {stats.normalMax}°C</span>
            <span className={`font-bold ${stats.deviationMax > 1.2 ? 'text-rose-300' : stats.deviationMax < -1.2 ? 'text-sky-300' : 'text-emerald-300'}`}>
              {stats.deviationMax === 0 ? '±0' : formatDiff(stats.deviationMax)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Slide Gauge Comparative Scale */}
      <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5 space-y-2">
        <div className="flex justify-between items-center text-[9px] text-white/50 uppercase font-extrabold">
          <span>Inférieur</span>
          <span className={currentStatus.color}>Conforme</span>
          <span>Supérieur</span>
        </div>

        {/* The slider gutter */}
        <div className="relative h-2 rounded-full bg-white/10 overflow-visible mt-2">
          {/* Historical normal range backdrop */}
          <div className="absolute left-[30%] right-[30%] h-full bg-emerald-400/25 rounded-full" />
          
          {/* Target pointer indicating deviation */}
          <div 
            className={`absolute w-3.5 h-3.5 rounded-full -top-0.5 -translate-x-1/2 flex items-center justify-center transition-all duration-700 shadow-md ${
              stats.seasonStatus === 'warmer' ? 'bg-amber-400 ring-2 ring-white' :
              stats.seasonStatus === 'colder' ? 'bg-sky-400 ring-2 ring-white' :
              'bg-emerald-400 ring-2 ring-white'
            }`}
            style={{ 
              left: `${Math.min(95, Math.max(5, 50 + ((stats.deviationMin + stats.deviationMax) / 2) * 8))}%` 
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
          </div>
        </div>
        <div className="text-[8px] text-white/30 text-center select-none pt-0.5">
          Aide de lecture : le point marque le niveau d'écart moyen face aux normales de 1991-2020.
        </div>
      </div>

      {/* Summary textual alert box */}
      <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed flex items-start gap-2.5 ${currentStatus.bgColor}`}>
        <div className="mt-0.5">{currentStatus.icon}</div>
        <div className="space-y-0.5">
          <strong className={`block text-xs font-bold uppercase tracking-wider ${currentStatus.color}`}>
            {currentStatus.label}
          </strong>
          <span className="font-medium text-white/90">
            {stats.comparisonText}
          </span>
        </div>
      </div>
    </div>
  );
}
