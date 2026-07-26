import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sun, Shirt, CloudRain } from 'lucide-react';
import { HourlyForecastItem } from '../types';
import { findDryWindow, formatDryWindow, getLaundryVerdict } from '../utils/opportunityWindows';

interface OpportunityCardProps {
  hourlyData: HourlyForecastItem[];
  humidity?: number;
  windSpeed?: number;
}

/**
 * Turns the hourly forecast into a decision the user can act on immediately.
 * Every other card here reports measurements; this one answers "when do I go
 * out" without making them read a table.
 */
export default function OpportunityCard({ hourlyData, humidity, windSpeed }: OpportunityCardProps) {
  const dryWindow = useMemo(() => findDryWindow(hourlyData), [hourlyData]);
  const laundry = useMemo(
    () => getLaundryVerdict(hourlyData, humidity, windSpeed),
    [hourlyData, humidity, windSpeed]
  );

  if (!hourlyData || hourlyData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="glass-premium rounded-3xl p-4 shadow-lg select-none text-white space-y-3"
    >
      <div className="flex items-center gap-2 text-[10px] font-bold text-sky-200 uppercase tracking-widest border-b border-white/10 pb-2">
        <Sun className="w-3.5 h-3.5 text-amber-300" />
        <span>Bon moment pour sortir</span>
      </div>

      {dryWindow ? (
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight">{formatDryWindow(dryWindow)}</span>
          <span className="text-[11px] text-white/60 font-medium">
            {dryWindow.length}h sans pluie
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-white/70">
          <CloudRain className="w-4 h-4 text-sky-300" />
          <span className="text-sm">Aucun créneau sec durable aujourd'hui</span>
        </div>
      )}

      {laundry && (
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <Shirt className={`w-3.5 h-3.5 ${laundry.ok ? 'text-emerald-300' : 'text-white/40'}`} />
          <span className={`text-[11px] font-medium ${laundry.ok ? 'text-emerald-200' : 'text-white/50'}`}>
            Linge dehors : {laundry.ok ? 'oui' : 'non'} — {laundry.label}
          </span>
        </div>
      )}
    </motion.div>
  );
}
