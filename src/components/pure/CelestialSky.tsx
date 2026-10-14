import React, { useMemo } from 'react';

interface CelestialSkyProps {
  /** Hour in float, e.g. 14.5 for 14:30 */
  hour: number;
  weatherCode?: number;
  sunriseHour?: number;
  sunsetHour?: number;
}

/**
 * CelestialSky renders an astronomical sky simulation:
 * - Dynamic atmospheric gradient shifting continuously from midnight to noon to dusk.
 * - Starfield at night with gentle twinkling.
 * - Glowing sun traversing a realistic parabolic arc during daylight.
 * - Crescent moon with soft aura and earthshine at night.
 */
export default function CelestialSky({
  hour,
  weatherCode = 0,
  sunriseHour = 7,
  sunsetHour = 19.5,
}: CelestialSkyProps) {
  // Determine if it's daylight, dawn, dusk, or night
  const isDay = hour >= sunriseHour && hour <= sunsetHour;
  const isDawn = hour >= sunriseHour - 1.5 && hour < sunriseHour + 1;
  const isDusk = hour > sunsetHour - 1 && hour <= sunsetHour + 1.5;

  // Sky gradient interpolation based on 24h clock
  const skyBackground = useMemo(() => {
    // 0h - 4h: Deep velvet midnight
    if (hour < 4.5 || hour > 22.5) {
      return 'linear-gradient(180deg, #050813 0%, #0b1120 40%, #111a2e 75%, #18233c 100%)';
    }
    // 4.5h - 6.5h: Pre-dawn nautical twilight
    if (hour < 6.5) {
      const p = (hour - 4.5) / 2;
      return `linear-gradient(180deg, #090e1f 0%, #1a1e38 35%, #3d2d48 70%, #754452 100%)`;
    }
    // 6.5h - 8.5h: Golden dawn & sunrise
    if (hour < 8.5) {
      return 'linear-gradient(180deg, #324b77 0%, #5d688c 35%, #b87a74 70%, #f6b382 100%)';
    }
    // 8.5h - 11.5h: Morning clear blue sky
    if (hour < 11.5) {
      return 'linear-gradient(180deg, #3d7fd6 0%, #5f9eef 45%, #92c3fa 80%, #c4e0fd 100%)';
    }
    // 11.5h - 16.5h: High noon vibrant blue
    if (hour < 16.5) {
      return 'linear-gradient(180deg, #3878cf 0%, #5495e8 40%, #7eb8f7 75%, #b4daf9 100%)';
    }
    // 16.5h - 18.5h: Late afternoon golden warmth
    if (hour < 18.5) {
      return 'linear-gradient(180deg, #3c6db8 0%, #6885b5 40%, #bc8880 75%, #f2ae7a 100%)';
    }
    // 18.5h - 20.5h: Sunset / Dusk
    if (hour < 20.5) {
      return 'linear-gradient(180deg, #161e38 0%, #3a2e4e 35%, #884351 70%, #d8754b 100%)';
    }
    // 20.5h - 22.5h: Twilight to night
    return 'linear-gradient(180deg, #0b1022 0%, #121932 40%, #1a2542 75%, #1f2c4b 100%)';
  }, [hour]);

  // Position of the sun in daylight (parabolic trajectory)
  const sunData = useMemo(() => {
    if (!isDay && !isDawn && !isDusk) return null;
    const dayDuration = sunsetHour - sunriseHour;
    const progress = Math.max(0, Math.min(1, (hour - sunriseHour) / dayDuration));
    
    // X position: moves from ~15% to ~85%
    const x = 12 + progress * 76;
    // Y position: high noon at ~18%, rises from 70% and sets to 70%
    const normalizedY = 4 * Math.pow(progress - 0.5, 2); // 0 at middle, 1 at edges
    const y = 16 + normalizedY * 46;

    // Opacity fades near edges of daylight
    let opacity = 1;
    if (progress < 0.08) opacity = Math.max(0.1, progress / 0.08);
    if (progress > 0.92) opacity = Math.max(0.1, (1 - progress) / 0.08);

    return { x, y, opacity };
  }, [hour, isDay, isDawn, isDusk, sunriseHour, sunsetHour]);

  // Position of the moon in nighttime
  const moonData = useMemo(() => {
    // Night is either after sunset or before sunrise
    const isNight = hour > sunsetHour || hour < sunriseHour;
    if (!isNight) return null;

    let nightProgress = 0;
    if (hour >= sunsetHour) {
      const nightDuration = (24 - sunsetHour) + sunriseHour;
      nightProgress = (hour - sunsetHour) / nightDuration;
    } else {
      const nightDuration = (24 - sunsetHour) + sunriseHour;
      nightProgress = ((24 - sunsetHour) + hour) / nightDuration;
    }

    // Moon trajectory: moves gently across the upper-right sky
    const x = 55 + nightProgress * 30; // 55% to 85%
    const y = 30 + Math.sin(nightProgress * Math.PI) * -15; // arcs up to ~15%
    const opacity = Math.max(0.4, Math.sin(nightProgress * Math.PI));

    return { x, y, opacity };
  }, [hour, sunriseHour, sunsetHour]);

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
    if (hour >= 8 && hour <= 19) return 0;
    if (hour > 19 && hour < 21.5) return (hour - 19) / 2.5;
    if (hour > 5.5 && hour < 8) return 1 - (hour - 5.5) / 2.5;
    return 1;
  }, [hour]);

  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden transition-all duration-700 ease-out z-0"
      style={{ background: skyBackground }}
    >
      {/* Starfield for Night */}
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

      {/* Radiant Sun during Day */}
      {sunData && (
        <div
          className="absolute transition-all duration-300 ease-out"
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
              background: 'radial-gradient(circle, rgba(255,248,220,0.45) 0%, rgba(255,225,120,0.2) 35%, rgba(255,185,80,0.08) 60%, transparent 80%)',
              filter: 'blur(16px)',
              transform: 'scale(1.2)',
            }}
          />
          {/* Inner Glowing Sun Core */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full"
            style={{
              background: 'radial-gradient(circle, #ffffff 0%, #fff7d6 45%, #ffd466 85%, #fba63c 100%)',
              boxShadow: '0 0 45px 15px rgba(255, 235, 150, 0.65), 0 0 90px 40px rgba(255, 180, 50, 0.35)',
            }}
          />
          {/* Subtle Sun Rays / Lens Flare Accent */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, transparent 70%)',
              transform: 'rotate(25deg)',
            }}
          />
        </div>
      )}

      {/* Realistic Crescent Moon during Night */}
      {moonData && (
        <div
          className="absolute transition-all duration-500 ease-out"
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
              {/* Earthshine faint disc gradient */}
              <radialGradient id="earthshine" cx="45%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#8ba5c9" stopOpacity="0.22" />
                <stop offset="70%" stopColor="#455a7a" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.05" />
              </radialGradient>
              {/* Illuminated Crescent gradient */}
              <linearGradient id="moonCrescent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#f4f7fb" />
                <stop offset="85%" stopColor="#d5e2f0" />
                <stop offset="100%" stopColor="#b4c6dc" />
              </linearGradient>
              {/* Mask for crescent curve */}
              <mask id="crescentMask">
                <circle cx="50" cy="50" r="42" fill="white" />
                <circle cx="36" cy="46" r="39" fill="black" />
              </mask>
            </defs>

            {/* Earthshine (faintly visible full lunar sphere) */}
            <circle cx="50" cy="50" r="42" fill="url(#earthshine)" />

            {/* Bright Crescent Moon */}
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

      {/* Atmospheric Horizon Haze Overlay */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: isDay 
            ? 'linear-gradient(to top, rgba(255, 255, 255, 0.3) 0%, transparent 100%)'
            : 'linear-gradient(to top, rgba(8, 14, 28, 0.5) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
