import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, MessageSquareQuote, Bed } from 'lucide-react';
import { WeatherData } from '../types';
import { HumorLevel } from '../utils/notificationService';
import { calculateFlemmeScore, FlemmeResult } from '../utils/flemmeScore';

interface FlemmeScoreProps {
  weather: WeatherData;
  humorLevel: HumorLevel;
}

export default function FlemmeScore({ weather, humorLevel }: FlemmeScoreProps) {
  const [result, setResult] = useState<FlemmeResult>(() => calculateFlemmeScore(weather, humorLevel));
  const [showExcuse, setShowExcuse] = useState(false);

  useEffect(() => {
    setResult(calculateFlemmeScore(weather, humorLevel));
  }, [weather, humorLevel]);

  const regenerate = () => {
    setResult(calculateFlemmeScore(weather, humorLevel));
  };

  const scoreColor = result.score >= 75
    ? 'text-rose-400'
    : result.score >= 50
    ? 'text-amber-400'
    : result.score >= 25
    ? 'text-sky-300'
    : 'text-emerald-400';

  const barColor = result.score >= 75
    ? 'from-rose-500 to-red-600'
    : result.score >= 50
    ? 'from-amber-400 to-orange-500'
    : result.score >= 25
    ? 'from-sky-400 to-blue-500'
    : 'from-emerald-400 to-green-500';

  const bgGlow = result.score >= 75
    ? 'from-rose-500/10 to-red-600/5'
    : result.score >= 50
    ? 'from-amber-400/10 to-orange-500/5'
    : result.score >= 25
    ? 'from-sky-400/10 to-blue-500/5'
    : 'from-emerald-400/10 to-green-500/5';

  return (
    <div className="glass-premium rounded-3xl p-4 shadow-lg relative overflow-hidden select-none">
      <div className={`absolute -inset-10 bg-gradient-to-br ${bgGlow} blur-xl pointer-events-none opacity-60`} />

      <div className="relative z-10 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4 text-indigo-300" />
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
              Score de Flemme
            </span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider ${scoreColor}`}>
            {result.label}
          </span>
        </div>

        {/* Score display */}
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1">
            <span className={`text-[42px] font-extralight leading-none ${scoreColor}`}>
              {result.score}
            </span>
            <span className="text-lg text-white/40 font-light">%</span>
          </div>
          <span className="text-3xl">{result.emoji}</span>
          {/* Gauge bar */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${barColor}`}
              />
            </div>
            <div className="flex justify-between text-[7px] text-white/30 font-bold uppercase tracking-wider px-0.5">
              <span>Motivé</span>
              <span>Comateux</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={result.message}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[11px] font-light italic text-white/70 leading-relaxed"
          >
            "{result.message}"
          </motion.p>
        </AnimatePresence>

        {/* Excuse toggle */}
        <AnimatePresence>
          {showExcuse && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1">
                <span className="text-[9px] font-bold text-amber-300/80 uppercase tracking-widest">
                  Excuse prête à l'emploi
                </span>
                <p className="text-[11px] text-white/80 italic leading-relaxed">
                  {result.excuse}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <button
            onClick={() => setShowExcuse(!showExcuse)}
            aria-label={showExcuse ? "Masquer l'excuse" : "Générer une excuse"}
            className="flex items-center gap-1.5 text-[9px] font-bold text-white/50 hover:text-amber-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
          >
            <MessageSquareQuote className="w-3 h-3" />
            {showExcuse ? 'Masquer' : 'Excuse toute faite'}
          </button>
          <button
            onClick={regenerate}
            aria-label="Recalculer le score"
            className="flex items-center gap-1.5 text-[9px] font-bold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
          >
            <RefreshCw className="w-3 h-3" />
            Recalculer
          </button>
        </div>
      </div>
    </div>
  );
}
