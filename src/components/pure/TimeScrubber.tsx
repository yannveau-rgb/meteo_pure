import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { HourlyForecastItem } from '../../types';

interface TimeScrubberProps {
  hourly: HourlyForecastItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isDaytime?: boolean;
}

/**
 * TimeScrubber: The signature interactive ruler slider.
 * - Horizontal ticks representing hours.
 * - Red active cursor with circular thumb.
 * - Floating high-contrast time pill following the thumb.
 * - Touch & drag scrubber with real-time haptic feedback (navigator.vibrate).
 * - Play / Loop simulation button to animate through the day.
 */
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

  // Trigger subtle haptic pulse on index change
  const triggerHaptic = useCallback((newIdx: number) => {
    if (newIdx !== lastVibratedIndex.current) {
      lastVibratedIndex.current = newIdx;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(4);
        } catch {
          // ignore vibrate errors if blocked by browser policy
        }
      }
    }
  }, []);

  // Calculate index from pointer clientX
  const updateIndexFromPointer = useCallback((clientX: number) => {
    if (!containerRef.current || hourly.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const progress = Math.max(0, Math.min(1, relativeX / rect.width));
    const targetIdx = Math.round(progress * (hourly.length - 1));
    if (targetIdx !== selectedIndex) {
      triggerHaptic(targetIdx);
      onSelectIndex(targetIdx);
    }
  }, [hourly.length, onSelectIndex, selectedIndex, triggerHaptic]);

  // Pointer event handlers
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

  // Play / auto-loop animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const next = (selectedIndex + 1) % Math.min(24, hourly.length);
      triggerHaptic(next);
      onSelectIndex(next);
    }, 280);
    return () => clearInterval(interval);
  }, [isPlaying, hourly.length, onSelectIndex, selectedIndex, triggerHaptic]);

  // Reset to now
  const handleReset = () => {
    setIsPlaying(false);
    triggerHaptic(0);
    onSelectIndex(0);
  };

  // Safe item and position calculations
  const maxIdx = Math.max(1, hourly.length - 1);
  const currentItem = hourly[selectedIndex] || hourly[0];
  const progressRatio = Math.max(0, Math.min(1, selectedIndex / maxIdx));
  const progressPercent = progressRatio * 100;

  // Format the floating badge text, e.g. "Now", "9 PM", "Tom 4 AM", or "Dem. 4h"
  const formattedTimeLabel = (() => {
    if (selectedIndex === 0) return 'Maintenant';
    if (!currentItem) return '';
    const rawTime = currentItem.time || '';
    // If rawTime is "14:00"
    const hourNum = parseInt(rawTime.split(':')[0], 10);
    const isTomorrow = selectedIndex >= (24 - (new Date().getHours()));

    // Format 12h/24h friendly label
    const prefix = isTomorrow ? 'Dem. ' : '';
    return `${prefix}${hourNum}h`;
  })();

  return (
    <div className="relative w-full select-none px-4 py-2 flex items-center gap-3">
      {/* Left Action Button (Reset / Loop Play) */}
      <button
        onClick={selectedIndex === 0 ? () => setIsPlaying(!isPlaying) : handleReset}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer shadow-md ${
          selectedIndex === 0
            ? isPlaying
              ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300'
              : 'bg-black/35 hover:bg-black/50 text-white/90 border border-white/20'
            : 'bg-black/35 hover:bg-black/50 text-white/90 border border-white/20 active:scale-95'
        }`}
        title={selectedIndex === 0 ? (isPlaying ? 'Pause' : 'Lire la journée') : 'Revenir à maintenant'}
        aria-label={selectedIndex === 0 ? (isPlaying ? 'Pause' : 'Lire') : 'Réinitialiser'}
      >
        {selectedIndex === 0 ? (
          isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />
        ) : (
          <RotateCcw className="w-4 h-4" />
        )}
      </button>

      {/* Main Ruler & Draggable Track Area */}
      <div className="relative flex-1 py-6 touch-none">
        {/* Floating Time Pill Badge */}
        <div
          className="absolute -top-1 pointer-events-none transition-transform duration-75 ease-out z-20"
          style={{
            left: `${progressPercent}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className={`px-3.5 py-1 rounded-full text-[12px] font-semibold tracking-tight shadow-xl whitespace-nowrap border transition-colors duration-200 ${
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
          {/* Subtle baseline track */}
          <div className="absolute inset-x-0 h-[1.5px] bg-white/15 rounded-full" />

          {/* Vertical Ticks Grid */}
          <div className="absolute inset-0 flex justify-between items-center pointer-events-none px-1">
            {hourly.slice(0, 36).map((item, idx) => {
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

          {/* Active Red Cursor Line & Draggable Circular Thumb Ring */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center justify-center transition-all duration-75 ease-out z-10"
            style={{
              left: `${progressPercent}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Red vertical needle */}
            <div className="w-[2px] h-7 bg-red-400 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.9)]" />

            {/* Translucent Frosted Ring Thumb */}
            <div className="w-5 h-5 -mt-1 rounded-full border-[2.5px] border-white/80 bg-white/20 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.35)] ring-2 ring-red-400/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
