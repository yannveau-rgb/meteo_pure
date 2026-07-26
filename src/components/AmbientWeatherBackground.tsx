import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface AmbientWeatherBackgroundProps {
  weatherCode: number;
}

type AmbientType = 'rain' | 'snow' | 'storm' | 'clouds' | 'sunny';

interface Particle {
  left: number;
  delay: number;
  duration: number;
  size: number;
}

function categorize(weatherCode: number): AmbientType {
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'snow';
  if ([95, 96, 99].includes(weatherCode)) return 'storm';
  if ([1, 2, 3, 45, 48].includes(weatherCode)) return 'clouds';
  return 'sunny';
}

function makeParticles(count: number, spread: number, cfg: {
  delayMax: number; durMin: number; durSpread: number; sizeMin: number; sizeSpread: number;
}): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    left: i * spread + Math.random() * 5,
    delay: Math.random() * cfg.delayMax,
    duration: cfg.durMin + Math.random() * cfg.durSpread,
    size: cfg.sizeMin + Math.random() * cfg.sizeSpread,
  }));
}

/**
 * Weather-reactive ambient layer.
 *
 * Two deliberate design constraints here, both learned the hard way:
 *
 * 1. Particle randomness is memoized on `type`, never computed during render.
 *    It used to be inline `Math.random()` calls, which meant every parent
 *    re-render (the clock ticks every 10s) handed Framer Motion brand-new
 *    delays/positions — restarting all 18 raindrops mid-flight, every 10
 *    seconds, visibly.
 *
 * 2. High-count loops (rain/snow) run on CSS keyframes rather than Framer
 *    Motion. Framer drives values from the main thread, which is the right
 *    trade for UI gestures but wasteful for decorative particles that only
 *    ever translate. CSS transforms composite on the GPU instead.
 */
function AmbientWeatherBackground({ weatherCode }: AmbientWeatherBackgroundProps) {
  const type = useMemo(() => categorize(weatherCode), [weatherCode]);
  const prefersReducedMotion = useReducedMotion();

  const rainDrops = useMemo(
    () => makeParticles(18, 7, { delayMax: 2.5, durMin: 1.2, durSpread: 0.8, sizeMin: 20, sizeSpread: 20 }),
    [type]
  );
  const snowFlakes = useMemo(
    () => makeParticles(15, 8, { delayMax: 4, durMin: 4.5, durSpread: 3, sizeMin: 3, sizeSpread: 4 }),
    [type]
  );
  const stormDrops = useMemo(
    () => makeParticles(12, 10, { delayMax: 2, durMin: 1.0, durSpread: 0.5, sizeMin: 35, sizeSpread: 0 }),
    [type]
  );

  // Motion-sensitive users get the mood (tint, haze) without anything that moves.
  if (prefersReducedMotion) {
    if (type === 'storm') {
      return <div className="absolute inset-0 pointer-events-none z-0 bg-slate-950/20 mix-blend-multiply" />;
    }
    if (type === 'sunny') {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-400/10 filter blur-3xl" />
        </div>
      );
    }
    return null;
  }

  switch (type) {
    case 'rain':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
          {rainDrops.map((p, i) => (
            <span
              key={`rain-${i}`}
              className="ambient-rain absolute w-[1.5px] bg-gradient-to-b from-sky-300/40 to-sky-100/10 rounded-full"
              style={{
                left: `${p.left}%`,
                height: `${p.size}px`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      );

    case 'snow':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-55">
          {snowFlakes.map((p, i) => (
            <span
              key={`snow-${i}`}
              className="ambient-snow absolute bg-white rounded-full filter blur-[0.3px]"
              style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      );

    case 'storm':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-slate-950/20 mix-blend-multiply" />

          {/* Lightning flash keeps Framer Motion: single element, irregular
              keyframe rhythm that CSS would express far less readably. */}
          <motion.div
            animate={{ opacity: [0, 0, 0.08, 0, 0.25, 0, 0, 0.05, 0, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-amber-200/30 mix-blend-color-dodge filter blur-md"
          />

          {stormDrops.map((p, i) => (
            <span
              key={`storm-rain-${i}`}
              className="ambient-storm-rain absolute w-[1px] bg-slate-400/20"
              style={{
                left: `${p.left}%`,
                height: `${p.size}px`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      );

    case 'clouds':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
          {[0, 1, 2].map(i => {
            const size = 120 + i * 60;
            return (
              <motion.div
                key={`cloud-${i}`}
                initial={{ x: -size - 20 }}
                animate={{ x: 450 + size }}
                transition={{ duration: 35 + i * 15, repeat: Infinity, ease: 'linear', delay: i * 8 }}
                className="absolute bg-white/10 rounded-full filter blur-2xl"
                style={{ top: `${30 + i * 45}px`, width: `${size}px`, height: `${size * 0.6}px` }}
              />
            );
          })}
        </div>
      );

    case 'sunny':
    default:
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-45">
          <motion.div
            animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-400/10 filter blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 left-10 w-48 h-48 rounded-full bg-sky-200/10 filter blur-3xl"
          />
        </div>
      );
  }
}

// Memoized so the 10-second clock tick in App can't restart the ambience.
export default React.memo(AmbientWeatherBackground);
