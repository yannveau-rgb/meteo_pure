import React, { useMemo } from 'react';

interface CelestialSkyProps {
  /** Hour in float, e.g. 14.5 for 14:30 */
  hour: number;
  weatherCode?: number;
  sunriseHour?: number;
  sunsetHour?: number;
}

/**
 * CelestialSky renders an astronomical sky simulation dynamically calibrated
 * to both the 24-hour solar diurnal cycle AND real-time WMO weather conditions:
 * - Clear (0-1): Vibrant azure sky, radiant glowing sun with halo / starry night with crescent moon.
 * - Partly cloudy (2): Soft celestial blue, softened sun disc / gentle cloud wisps.
 * - Overcast (3): Elegant pearl-slate overcast gradient, layered stratus cloud waves, SUN HIDDEN.
 * - Fog (45, 48): Dense silvery-pearl horizon haze, SUN HIDDEN.
 * - Rain & Drizzle (51-67, 80-82): Moody stormy slate gradient, diagonal rain streaks, SUN HIDDEN.
 * - Snow (71-86): Crisp winter slate-white gradient, gentle falling snowflakes, SUN HIDDEN.
 * - Thunderstorm (95, 96, 99): Dramatic indigo-charcoal sky, sheet lightning flash pulse, SUN HIDDEN.
 */

// Helper : retourne la couleur exacte du sommet du ciel (0%) pour la barre système mobile
export function getSkyTopColor(
  hour: number,
  weatherCode = 0,
  sunriseHour = 7,
  sunsetHour = 19.5
): string {
  const isDay = hour >= sunriseHour && hour <= sunsetHour;
  const isDawn = hour >= sunriseHour - 1.5 && hour < sunriseHour + 1;
  const isDusk = hour > sunsetHour - 1 && hour <= sunsetHour + 1.5;

  if (weatherCode === 3) return isDay ? '#334155' : (isDawn || isDusk) ? '#1e2230' : '#070b12';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return isDay ? '#1e293b' : (isDawn || isDusk) ? '#111624' : '#04070e';
  }
  if ([95, 96, 99].includes(weatherCode)) return '#06070a';
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return isDay ? '#3b4858' : (isDawn || isDusk) ? '#16202c' : '#080e18';
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return isDay ? '#4b5563' : (isDawn || isDusk) ? '#262d38' : '#0b0f14';
  }
  if (weatherCode === 2) {
    if (hour < 4.5 || hour > 22.5) return '#080d1a';
    if (hour < 6.5) return '#0d1429';
    if (hour < 8.5) return '#37537e';
    if (hour < 16.5) return '#3b74b3';
    if (hour < 18.5) return '#3a68aa';
    if (hour < 20.5) return '#18203d';
    return '#0e162f';
  }
  // Ciel clair (0 & 1)
  if (hour < 4.5 || hour > 22.5) return '#050813';
  if (hour < 6.5) return '#090e1f';
  if (hour < 8.5) return '#324b77';
  if (hour < 11.5) return '#3d7fd6';
  if (hour < 16.5) return '#3878cf';
  if (hour < 18.5) return '#3c6db8';
  if (hour < 20.5) return '#161e38';
  return '#0b1022';
}

export default function CelestialSky({
  hour,
  weatherCode = 0,
  sunriseHour = 7,
  sunsetHour = 19.5,
}: CelestialSkyProps) {
  // Determine diurnal time frames
  const isDay = hour >= sunriseHour && hour <= sunsetHour;
  const isDawn = hour >= sunriseHour - 1.5 && hour < sunriseHour + 1;
  const isDusk = hour > sunsetHour - 1 && hour <= sunsetHour + 1.5;

  // Weather condition flags based on WMO standard codes
  const isClear = weatherCode === 0;
  const isMostlyClear = weatherCode === 1;
  const isPartlyCloudy = weatherCode === 2;
  const isOvercast = weatherCode === 3;
  const isFog = weatherCode === 45 || weatherCode === 48;
  const isDrizzle = [51, 53, 55, 56, 57].includes(weatherCode);
  const isRain = [61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode);
  const isSnow = [71, 73, 75, 77, 85, 86].includes(weatherCode);
  const isStorm = [95, 96, 99].includes(weatherCode);

  // When thick clouds, rain, fog, snow, or thunderstorms dominate, the direct sun/moon disc is obscured
  const isSunObscured = isOvercast || isFog || isDrizzle || isRain || isSnow || isStorm;

  // Sky gradient interpolation based on both 24h clock and active weather condition
  const skyBackground = useMemo(() => {
    // 1. OVERCAST / COUVERT (WMO 3)
    if (isOvercast) {
      if (isDay) {
        return 'linear-gradient(180deg, #334155 0%, #475569 35%, #64748b 70%, #94a3b8 100%)';
      }
      if (isDawn || isDusk) {
        return 'linear-gradient(180deg, #1e2230 0%, #2f3647 40%, #4a4552 75%, #615a63 100%)';
      }
      // Night Overcast
      return 'linear-gradient(180deg, #070b12 0%, #0f172a 45%, #1e293b 80%, #273549 100%)';
    }

    // 2. RAIN & DRIZZLE (WMO 51-67, 80-82)
    if (isRain || isDrizzle) {
      if (isDay) {
        return 'linear-gradient(180deg, #1e293b 0%, #29384d 40%, #374b66 75%, #4b6282 100%)';
      }
      if (isDawn || isDusk) {
        return 'linear-gradient(180deg, #111624 0%, #1d2536 50%, #2d374d 100%)';
      }
      return 'linear-gradient(180deg, #04070e 0%, #09101c 45%, #101c2e 85%, #18283f 100%)';
    }

    // 3. THUNDERSTORM / ORAGE (WMO 95, 96, 99)
    if (isStorm) {
      return 'linear-gradient(180deg, #06070a 0%, #121124 35%, #1b1b33 70%, #182238 100%)';
    }

    // 4. SNOW / NEIGE (WMO 71-86)
    if (isSnow) {
      if (isDay) {
        return 'linear-gradient(180deg, #3b4858 0%, #546477 35%, #7a8b9f 70%, #b8c6d6 100%)';
      }
      if (isDawn || isDusk) {
        return 'linear-gradient(180deg, #16202c 0%, #2b3848 50%, #4a5c70 100%)';
      }
      return 'linear-gradient(180deg, #080e18 0%, #121c2c 50%, #1e2c40 100%)';
    }

    // 5. FOG / BROUILLARD (WMO 45, 48)
    if (isFog) {
      if (isDay) {
        return 'linear-gradient(180deg, #4b5563 0%, #6b7280 35%, #9ca3af 70%, #d1d5db 100%)';
      }
      if (isDawn || isDusk) {
        return 'linear-gradient(180deg, #262d38 0%, #3a4452 45%, #596577 100%)';
      }
      return 'linear-gradient(180deg, #0b0f14 0%, #18202b 50%, #2b3542 100%)';
    }

    // 6. PARTLY CLOUDY / ÉCLAIRCIES (WMO 2)
    if (isPartlyCloudy) {
      if (hour < 4.5 || hour > 22.5) {
        return 'linear-gradient(180deg, #080d1a 0%, #0e172a 45%, #18243c 100%)';
      }
      if (hour < 6.5) {
        return 'linear-gradient(180deg, #0d1429 0%, #202744 40%, #4a3e57 75%, #7e5668 100%)';
      }
      if (hour < 8.5) {
        return 'linear-gradient(180deg, #37537e 0%, #607297 40%, #b58985 75%, #eec4a0 100%)';
      }
      if (hour < 16.5) {
        return 'linear-gradient(180deg, #3b74b3 0%, #5a8ec6 40%, #82abdb 75%, #b9d2ef 100%)';
      }
      if (hour < 18.5) {
        return 'linear-gradient(180deg, #3a68aa 0%, #6381ab 40%, #b08d88 75%, #e2b490 100%)';
      }
      if (hour < 20.5) {
        return 'linear-gradient(180deg, #18203d 0%, #3a3250 40%, #7b4c5d 75%, #c88164 100%)';
      }
      return 'linear-gradient(180deg, #0e162f 0%, #172343 45%, #1e2c4f 100%)';
    }

    // 7. CLEAR / ENSOLEILLÉ (WMO 0 & 1)
    if (hour < 4.5 || hour > 22.5) {
      return 'linear-gradient(180deg, #050813 0%, #0b1120 40%, #111a2e 75%, #18233c 100%)';
    }
    if (hour < 6.5) {
      return 'linear-gradient(180deg, #090e1f 0%, #1a1e38 35%, #3d2d48 70%, #754452 100%)';
    }
    if (hour < 8.5) {
      return 'linear-gradient(180deg, #324b77 0%, #5d688c 35%, #b87a74 70%, #f6b382 100%)';
    }
    if (hour < 11.5) {
      return 'linear-gradient(180deg, #3d7fd6 0%, #5f9eef 45%, #92c3fa 80%, #c4e0fd 100%)';
    }
    if (hour < 16.5) {
      return 'linear-gradient(180deg, #3878cf 0%, #5495e8 40%, #7eb8f7 75%, #b4daf9 100%)';
    }
    if (hour < 18.5) {
      return 'linear-gradient(180deg, #3c6db8 0%, #6885b5 40%, #bc8880 75%, #f2ae7a 100%)';
    }
    if (hour < 20.5) {
      return 'linear-gradient(180deg, #161e38 0%, #3a2e4e 35%, #884351 70%, #d8754b 100%)';
    }
    return 'linear-gradient(180deg, #0b1022 0%, #121932 40%, #1a2542 75%, #1f2c4b 100%)';
  }, [hour, isDay, isDawn, isDusk, isOvercast, isRain, isDrizzle, isStorm, isSnow, isFog, isPartlyCloudy]);

  // Position and intensity of the sun in daylight
  const sunData = useMemo(() => {
    // If night, or if obscured by thick clouds/rain/snow/fog/storm, hide sun completely!
    if ((!isDay && !isDawn && !isDusk) || isSunObscured) return null;

    const dayDuration = Math.max(1, sunsetHour - sunriseHour);
    const progress = Math.max(0, Math.min(1, (hour - sunriseHour) / dayDuration));
    
    // X position: moves from ~12% to ~88%
    const x = 12 + progress * 76;
    // Y position: parabolic arc
    const normalizedY = 4 * Math.pow(progress - 0.5, 2);
    const y = 28 + normalizedY * 36;

    let opacity = 1;
    if (progress < 0.08) opacity = Math.max(0.1, progress / 0.08);
    if (progress > 0.92) opacity = Math.max(0.1, (1 - progress) / 0.08);

    // Weather condition modulation
    if (isPartlyCloudy) {
      opacity *= 0.72;
    } else if (isMostlyClear) {
      opacity *= 0.95;
    }

    return { x, y, opacity, isPartlyCloudy };
  }, [hour, isDay, isDawn, isDusk, sunriseHour, sunsetHour, isSunObscured, isPartlyCloudy, isMostlyClear]);

  // Position of the moon in nighttime
  const moonData = useMemo(() => {
    const isNight = hour > sunsetHour || hour < sunriseHour;
    // Overcast/rain/fog/storm hides the moon completely
    if (!isNight || isSunObscured) return null;

    let nightProgress = 0;
    const nightDuration = (24 - sunsetHour) + sunriseHour;
    if (hour >= sunsetHour) {
      nightProgress = (hour - sunsetHour) / nightDuration;
    } else {
      nightProgress = ((24 - sunsetHour) + hour) / nightDuration;
    }

    const x = 55 + nightProgress * 30;
    const y = 30 + Math.sin(nightProgress * Math.PI) * -15;
    let opacity = Math.max(0.4, Math.sin(nightProgress * Math.PI));

    if (isPartlyCloudy) {
      opacity *= 0.55;
    }

    return { x, y, opacity };
  }, [hour, sunriseHour, sunsetHour, isSunObscured, isPartlyCloudy]);

  // Pre-generate static starfield (memoized)
  const stars = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => ({
      id: i,
      x: ((i * 37) % 96) + 2,
      y: ((i * 53) % 65) + 3,
      size: (i % 3 === 0 ? 2 : 1.2),
      opacity: 0.35 + (i % 5) * 0.14,
      blinkDelay: (i % 7) * 0.7,
      blinkDuration: 2.5 + (i % 4) * 0.8,
    }));
  }, []);

  const starsOpacity = useMemo(() => {
    // Obscured skies (overcast, rain, fog, snow, storm) have zero visible stars
    if (isSunObscured) return 0;
    if (hour >= sunriseHour + 0.5 && hour <= sunsetHour - 0.5) return 0;
    let base = 1;
    if (hour > sunsetHour - 0.5 && hour < sunsetHour + 2) base = (hour - (sunsetHour - 0.5)) / 2.5;
    if (hour > sunriseHour - 2 && hour < sunriseHour + 0.5) base = 1 - (hour - (sunriseHour - 2)) / 2.5;
    base = Math.max(0, Math.min(1, base));

    if (isPartlyCloudy) {
      return base * 0.35;
    }
    return base;
  }, [hour, sunriseHour, sunsetHour, isSunObscured, isPartlyCloudy]);

  const [layers, setLayers] = React.useState<{ current: string; next: string | null }>({
    current: skyBackground,
    next: null,
  });

  React.useEffect(() => {
    if (skyBackground !== layers.current) {
      setLayers({ current: layers.next || layers.current, next: skyBackground });
      const timer = setTimeout(() => {
        setLayers({ current: skyBackground, next: null });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [skyBackground, layers.current, layers.next]);

  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
    >
      {/* Base Sky Layer */}
      <div 
        className="absolute inset-0" 
        style={{ background: layers.current }} 
      />
      {/* Crossfading Incoming Sky Layer */}
      {layers.next && (
        <div 
          key={layers.next} 
          className="absolute inset-0 pointer-events-none" 
          style={{ background: layers.next, animation: 'crossFadeIn 500ms linear forwards' }} 
        />
      )}

      {/* Starfield for Night (Clear / Mostly Clear / Lightly filtered in Partly Cloudy) */}
      {starsOpacity > 0.05 && (
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: starsOpacity }}
        >
          {stars.map((s) => (
            <div
              key={s.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                opacity: s.opacity,
                boxShadow: s.size > 1.5 ? '0 0 3px rgba(255,255,255,0.8)' : 'none',
                animation: `twinkle ${s.blinkDuration}s infinite ease-in-out ${s.blinkDelay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Radiant Sun during Day (Hidden when overcast, rain, snow, fog, or storm) */}
      {sunData && (
        <div
          className="absolute transition-all duration-500 ease-linear"
          style={{
            left: `${sunData.x}%`,
            top: `${sunData.y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: sunData.opacity,
          }}
        >
          {/* Outer Sun Halo */}
          <div 
            className="w-56 h-56 rounded-full"
            style={{
              background: sunData.isPartlyCloudy
                ? 'radial-gradient(circle, rgba(255,248,220,0.3) 0%, rgba(255,225,120,0.12) 35%, transparent 70%)'
                : 'radial-gradient(circle, rgba(255,248,220,0.45) 0%, rgba(255,225,120,0.2) 35%, rgba(255,185,80,0.08) 60%, transparent 80%)',
              filter: 'blur(16px)',
              transform: sunData.isPartlyCloudy ? 'scale(1.0)' : 'scale(1.2)',
            }}
          />
          {/* Inner Glowing Sun Core */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full"
            style={{
              background: 'radial-gradient(circle, #ffffff 0%, #fff7d6 45%, #ffd466 85%, #fba63c 100%)',
              boxShadow: sunData.isPartlyCloudy
                ? '0 0 30px 10px rgba(255, 235, 150, 0.45)'
                : '0 0 45px 15px rgba(255, 235, 150, 0.65), 0 0 90px 40px rgba(255, 180, 50, 0.35)',
            }}
          />
          {/* Subtle Sun Rays / Lens Flare Accent (Clear only) */}
          {!sunData.isPartlyCloudy && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full opacity-30 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, transparent 70%)',
                transform: 'rotate(25deg)',
              }}
            />
          )}
        </div>
      )}

      {/* Realistic Crescent Moon during Night */}
      {moonData && (
        <div
          className="absolute transition-all duration-500 ease-linear"
          style={{
            left: `${moonData.x}%`,
            top: `${moonData.y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: moonData.opacity,
          }}
        >
          {/* Moon Outer Aura / Glow */}
          <div 
            className="absolute -inset-10 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(200, 225, 255, 0.25) 0%, rgba(160, 195, 255, 0.1) 45%, transparent 75%)',
              filter: 'blur(18px)',
            }}
          />

          {/* SVG Crescent Moon with Earthshine Disc */}
          <svg
            width="84"
            height="84"
            viewBox="0 0 100 100"
            className="relative drop-shadow-[0_0_20px_rgba(230,240,255,0.7)]"
          >
            <defs>
              <radialGradient id="earthshine" cx="45%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#8ba5c9" stopOpacity="0.22" />
                <stop offset="70%" stopColor="#455a7a" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.05" />
              </radialGradient>
              <linearGradient id="moonCrescent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#f4f7fb" />
                <stop offset="85%" stopColor="#d5e2f0" />
                <stop offset="100%" stopColor="#b4c6dc" />
              </linearGradient>
              <mask id="crescentMask">
                <circle cx="50" cy="50" r="42" fill="white" />
                <circle cx="36" cy="46" r="39" fill="black" />
              </mask>
            </defs>

            <circle cx="50" cy="50" r="42" fill="url(#earthshine)" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="url(#moonCrescent)"
              mask="url(#crescentMask)"
            />
          </svg>
        </div>
      )}

      {/* Atmospheric Overcast Cloud Banks (WMO 3) */}
      {isOvercast && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-700 opacity-60">
          <div 
            className="absolute -top-10 -left-1/4 w-[150%] h-64 rounded-full opacity-35"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(148, 163, 184, 0.4) 0%, rgba(100, 116, 139, 0.2) 50%, transparent 80%)',
              filter: 'blur(28px)',
              animation: 'cloudDriftSlow 32s infinite ease-in-out',
            }}
          />
          <div 
            className="absolute top-1/4 -right-1/4 w-[160%] h-80 rounded-full opacity-30"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(203, 213, 225, 0.3) 0%, rgba(148, 163, 184, 0.15) 50%, transparent 80%)',
              filter: 'blur(36px)',
              animation: 'cloudDriftFast 26s infinite ease-in-out',
            }}
          />
          <div 
            className="absolute bottom-0 inset-x-0 h-64 opacity-50"
            style={{
              background: 'linear-gradient(to top, rgba(148, 163, 184, 0.45) 0%, transparent 100%)',
              filter: 'blur(16px)',
            }}
          />
        </div>
      )}

      {/* Atmospheric Partly Cloudy Wisps (WMO 2) */}
      {isPartlyCloudy && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-700 opacity-40">
          <div 
            className="absolute top-16 -left-12 w-80 h-36 rounded-full"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 80%)',
              filter: 'blur(20px)',
              animation: 'cloudDriftSlow 38s infinite ease-in-out',
            }}
          />
          <div 
            className="absolute top-36 -right-16 w-96 h-44 rounded-full"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.08) 60%, transparent 80%)',
              filter: 'blur(24px)',
              animation: 'cloudDriftFast 44s infinite ease-in-out',
            }}
          />
        </div>
      )}

      {/* Atmospheric Rain & Drizzle Streaks (WMO 51-67, 80-82) */}
      {(isRain || isDrizzle) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-700">
          <div className="absolute inset-0 bg-slate-900/10 mix-blend-multiply" />
          {Array.from({ length: isRain ? 20 : 10 }).map((_, i) => (
            <div
              key={`rain-${i}`}
              className="absolute w-[1.5px] rounded-full bg-gradient-to-b from-sky-200/50 to-transparent"
              style={{
                left: `${(i * 19) % 96 + 2}%`,
                top: `${(i * 23) % 40}%`,
                height: `${28 + (i % 5) * 8}px`,
                animation: `rainDropFall ${0.9 + (i % 4) * 0.25}s linear infinite`,
                animationDelay: `${(i % 7) * 0.18}s`,
                transform: 'rotate(12deg)',
              }}
            />
          ))}
        </div>
      )}

      {/* Atmospheric Snow Drift (WMO 71-86) */}
      {isSnow && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-700">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={`snow-${i}`}
              className="absolute rounded-full bg-white/80"
              style={{
                left: `${(i * 21) % 96 + 2}%`,
                top: '-10px',
                width: `${3 + (i % 3) * 2}px`,
                height: `${3 + (i % 3) * 2}px`,
                filter: 'blur(0.5px)',
                animation: `snowDriftFall ${3.5 + (i % 5) * 0.8}s ease-in-out infinite`,
                animationDelay: `${(i % 6) * 0.6}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Atmospheric Thunderstorm & Sheet Lightning (WMO 95, 96, 99) */}
      {isStorm && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-700">
          <div 
            className="absolute -top-12 -left-1/4 w-[150%] h-80 rounded-full opacity-60"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.5) 60%, transparent 85%)',
              filter: 'blur(30px)',
            }}
          />
          <div 
            className="absolute inset-0 bg-indigo-200/25 mix-blend-color-dodge pointer-events-none"
            style={{
              animation: 'stormFlashPulse 7s infinite ease-in-out',
            }}
          />
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={`storm-rain-${i}`}
              className="absolute w-[1.5px] rounded-full bg-gradient-to-b from-slate-200/40 to-transparent"
              style={{
                left: `${(i * 17) % 96 + 2}%`,
                top: `${(i * 19) % 35}%`,
                height: `${35 + (i % 4) * 10}px`,
                animation: `rainDropFall ${0.7 + (i % 3) * 0.15}s linear infinite`,
                animationDelay: `${(i % 5) * 0.12}s`,
                transform: 'rotate(16deg)',
              }}
            />
          ))}
        </div>
      )}

      {/* Atmospheric Fog / Brouillard (WMO 45, 48) */}
      {isFog && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-700 opacity-60">
          <div 
            className="absolute inset-x-0 bottom-0 h-3/4"
            style={{
              background: 'linear-gradient(to top, rgba(209, 213, 219, 0.7) 0%, rgba(156, 163, 175, 0.4) 50%, transparent 100%)',
              filter: 'blur(20px)',
            }}
          />
        </div>
      )}

      {/* Atmospheric Horizon Haze Overlay */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: isDay 
            ? isOvercast || isRain || isStorm || isFog
              ? 'linear-gradient(to top, rgba(148, 163, 184, 0.25) 0%, transparent 100%)'
              : 'linear-gradient(to top, rgba(255, 255, 255, 0.3) 0%, transparent 100%)'
            : 'linear-gradient(to top, rgba(8, 14, 28, 0.5) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
