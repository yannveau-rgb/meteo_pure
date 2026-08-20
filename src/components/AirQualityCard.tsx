import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Wind, Flower2 } from 'lucide-react';
import {
  AirQualitySnapshot, getAqiBand, getNotablePollens, POLLEN_LEVEL_LABELS, PollenLevel,
} from '../utils/airQuality';
import InfoBadge from './ui/InfoBadge';

interface AirQualityCardProps {
  data: AirQualitySnapshot | null;
}

const SEVERITY_STYLES: Record<string, string> = {
  good: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30',
  fair: 'text-lime-300 bg-lime-500/15 border-lime-400/30',
  moderate: 'text-amber-300 bg-amber-500/15 border-amber-400/30',
  poor: 'text-orange-300 bg-orange-500/15 border-orange-400/30',
  bad: 'text-red-300 bg-red-500/15 border-red-400/30',
};

const POLLEN_STYLES: Record<PollenLevel, string> = {
  none: 'text-white/60 bg-white/5 border-white/10',
  low: 'text-white/60 bg-white/5 border-white/10',
  moderate: 'text-amber-300 bg-amber-500/15 border-amber-400/30',
  high: 'text-orange-300 bg-orange-500/15 border-orange-400/30',
  veryHigh: 'text-red-300 bg-red-500/15 border-red-400/30',
};

export default function AirQualityCard({ data }: AirQualityCardProps) {
  const notable = useMemo(() => (data ? getNotablePollens(data.pollens) : []), [data]);

  // Nothing to say when the API is unreachable — stay silent rather than
  // render an empty shell.
  if (!data || (data.aqi === undefined && notable.length === 0)) return null;

  const band = data.aqi !== undefined ? getAqiBand(data.aqi) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="glass-premium rounded-3xl p-4 shadow-lg select-none text-white space-y-3"
    >
      <div className="flex items-center gap-2 text-[10px] font-bold text-sky-200 uppercase tracking-widest border-b border-white/10 pb-2">
        <Wind className="w-3.5 h-3.5 text-sky-300" />
        <span>Air &amp; pollens</span>
      </div>

      {band && (
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-figures">{Math.round(data.aqi!)}</span>
            <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">indice europ.</span>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${SEVERITY_STYLES[band.severity]}`}>
            {band.label}
          </span>
        </div>
      )}

      {notable.length > 0 ? (
        <div className="space-y-1.5 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-semibold uppercase tracking-wider">
            <Flower2 className="w-3 h-3 text-lime-300" />
            <span>Pollens actifs</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {notable.map(p => (
              <InfoBadge
                key={p.species}
                label={`${Math.round(p.value)} grains/m³`}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${POLLEN_STYLES[p.level]}`}
              >
                {p.label} · {POLLEN_LEVEL_LABELS[p.level]}
              </InfoBadge>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-white/50 pt-1 border-t border-white/5">
          Aucun pollen notable aujourd'hui
        </p>
      )}
    </motion.div>
  );
}
