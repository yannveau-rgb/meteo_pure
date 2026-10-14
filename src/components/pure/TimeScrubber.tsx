import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { HourlyForecastItem } from '../../types';

interface TimeScrubberProps {
  hourly: HourlyForecastItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isDaytime?: boolean;
}

export default function TimeScrubber({
  hourly,
  selectedIndex,
  onSelectIndex,
  isDaytime = false,
}: TimeScrubberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const lastVibratedIndex = useRef<number>(selectedIndex);

  // On verrouille la règle sur 24 heures pour que les graduations et le curseur soient 100% alignés
  const displayHourly = useMemo(() => hourly.slice(0, 24), [hourly]);
  const maxIdx = Math.max(1, displayHourly.length - 1);

  const triggerHaptic = useCallback((newIdx: number) => {
    if (newIdx !== lastVibratedIndex.current) {
      lastVibratedIndex.current = newIdx;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(4);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const updateIndexFromPointer = useCallback((clientX: number) => {
    if (!containerRef.current || displayHourly.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const progress = Math.max(0, Math.min(1, relativeX / rect.width));
    const targetIdx = Math.round(progress * maxIdx);
    if (targetIdx !== selectedIndex) {
      triggerHaptic(targetIdx);
      onSelectIndex(targetIdx);
    }
  }, [displayHourly.length, maxIdx, onSelectIndex, selectedIndex, triggerHaptic]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setIsPlaying(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateIndexFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateIndexFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Cadence de 450ms synchronisée avec la transition linéaire du soleil/ciel
  useEffect(() => {
    if (!isPlaying || displayHourly.length === 0) return;
    const interval = setInterval(() => {
      const next = (selectedIndex + 1) % displayHourly.length;
      triggerHaptic(next);
      onSelectIndex(next);
    }, 450);
    return () => clearInterval(interval);
  }, [isPlaying, displayHourly.length, onSelectIndex, selectedIndex, triggerHaptic]);

  const handleReset = () => {
    setIsPlaying(false);
    triggerHaptic(0);
    onSelectIndex(0);
  };

  const currentItem = displayHourly[selectedIndex] || displayHourly[0];
  const progressRatio = Math.max(0, Math.min(1, selectedIndex / maxIdx));
  const progressPercent = progressRatio * 100;

  const formattedTimeLabel = (() => {
    if (selectedIndex === 0) return 'Maintenant';
    if (!currentItem) return '';
    const rawTime = currentItem.time || '';
    const hourNum = parseInt(rawTime.split(':')[0], 10);
    const isTomorrow = selectedIndex >= (24 - new Date().getHours());
    const prefix = isTomorrow ? 'Dem. ' : '';
    return `${prefix}${hourNum}h`;
  })();

  return (
    <div className="relative w-full select-none px-4 py-2 flex items-center gap-2.5">
      {/* Bouton Lecture / Pause permanent */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer shadow-md ${
          isPlaying
            ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300/60 scale-105'
            : 'bg-black/35 hover:bg-black/50 text-white/90 border border-white/20 active:scale-95'
        }`}
        title={isPlaying ? 'Mettre en pause' : 'Lire l’évolution sur 24h'}
        aria-label={isPlaying ? 'Pause' : 'Lire'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Bouton Reset vers "Maintenant" (affiché uniquement quand on a décalé l'heure) */}
      {selectedIndex > 0 && (
        <button
          onClick={handleReset}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all shrink-0 cursor-pointer active:scale-95"
          title="Revenir à maintenant"
          aria-label="Revenir à maintenant"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Main Ruler & Draggable Track Area */}
      <div className="relative flex-1 py-6 touch-none">
        {/* Floating Time Pill Badge */}
        <div
          className={`absolute -top-1 pointer-events-none z-20 ${
            isDragging ? 'transition-none' : 'transition-all duration-300 ease-linear'
          }`}
          style={{
            left: `${progressPercent}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className={`px-3.5 py-1 rounded-full text-[12px] font-semibold tracking-tight shadow-xl whitespace-nowrap border transition-colors duration-300 tabular-figures ${
              isDaytime
                ? 'bg-slate-900/90 text-white border-white/25 shadow-black/30'
                : 'bg-white text-slate-900 border-white/90 shadow-black/40'
            }`}
          >
            {formattedTimeLabel}
          </div>
        </div>

        {/* Ruler Track Container */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative h-9 flex items-center cursor-pointer group"
        >
          <div className="absolute inset-x-0 h-[1.5px] bg-white/15 rounded-full" />

          {/* Vertical Ticks Grid (24 graduations exactes) */}
          <div className="absolute inset-0 flex justify-between items-center pointer-events-none">
            {displayHourly.map((_, idx) => {
              const isMajor = idx % 6 === 0;
              const isMedium = idx % 3 === 0;
              const isCurrent = idx === selectedIndex;

              return (
                <div
                  key={idx}
                  className="relative flex flex-col items-center justify-center h-full"
                >
                  <div
                    className={`rounded-full transition-all duration-150 ${
                      isCurrent
                        ? 'w-[2px] h-6 bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]'
                        : isMajor
                        ? 'w-[1.5px] h-5 bg-white/70'
                        : isMedium
                        ? 'w-[1px] h-3.5 bg-white/45'
                        : 'w-[1px] h-2 bg-white/25'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Active Red Cursor Line & Thumb */}
          <div
            className={`absolute top-0 bottom-0 pointer-events-none flex flex-col items-center justify-center z-10 ${
              isDragging ? 'transition-none' : 'transition-all duration-300 ease-linear'
            }`}
            style={{
              left: `${progressPercent}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="w-[2px] h-7 bg-red-400 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.9)]" />
            <div className="w-5 h-5 -mt-1 rounded-full border-[2.5px] border-white/80 bg-white/20 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.35)] ring-2 ring-red-400/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
