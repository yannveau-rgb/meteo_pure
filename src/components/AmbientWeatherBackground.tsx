import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface AmbientWeatherBackgroundProps {
  weatherCode: number;
}

export default function AmbientWeatherBackground({ weatherCode }: AmbientWeatherBackgroundProps) {
  // Categorize weather codes
  const type = useMemo(() => {
    // Rain
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
      return 'rain';
    }
    // Snow
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
      return 'snow';
    }
    // Storm
    if ([95, 96, 99].includes(weatherCode)) {
      return 'storm';
    }
    // Clouds
    if ([1, 2, 3, 45, 48].includes(weatherCode)) {
      return 'clouds';
    }
    // Default / Clear
    return 'sunny';
  }, [weatherCode]);

  // Generate elements based on weather category
  const renderEffects = () => {
    switch (type) {
      case 'rain': {
        // Render 18 diagonal rain droplets
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
            {Array.from({ length: 18 }).map((_, i) => {
              const left = (i * 7) + Math.random() * 5;
              const delay = Math.random() * 2.5;
              const duration = 1.2 + Math.random() * 0.8;
              const height = 20 + Math.random() * 20;
              return (
                <motion.div
                  key={`rain-${i}`}
                  initial={{ y: -50, x: 20 }}
                  animate={{ y: 920, x: -70 }}
                  transition={{
                    duration: duration,
                    repeat: Infinity,
                    delay: delay,
                    ease: "linear"
                  }}
                  className="absolute w-[1.5px] bg-gradient-to-b from-sky-300/40 to-sky-100/10 rounded-full"
                  style={{
                    left: `${left}%`,
                    height: `${height}px`,
                  }}
                />
              );
            })}
          </div>
        );
      }
      
      case 'snow': {
        // Render 15 floating snowflakes
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-55">
            {Array.from({ length: 15 }).map((_, i) => {
              const left = (i * 8) + Math.random() * 5;
              const delay = Math.random() * 4;
              const duration = 4.5 + Math.random() * 3;
              const size = 3 + Math.random() * 4;
              return (
                <motion.div
                  key={`snow-${i}`}
                  initial={{ y: -20, x: 0, opacity: 0 }}
                  animate={{ 
                    y: 920, 
                    x: [0, 15, -15, 0],
                    opacity: [0, 0.7, 0.7, 0]
                  }}
                  transition={{
                    duration: duration,
                    repeat: Infinity,
                    delay: delay,
                    ease: "linear"
                  }}
                  className="absolute bg-white rounded-full filter blur-[0.3px]"
                  style={{
                    left: `${left}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                  }}
                />
              );
            })}
          </div>
        );
      }

      case 'storm': {
        // Render atmospheric dark nodes & random strike triggers
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Dark background overlay */}
            <div className="absolute inset-0 bg-slate-950/20 mix-blend-multiply" />
            
            {/* Ambient golden static flashes */}
            <motion.div
              animate={{
                opacity: [0, 0, 0.08, 0, 0.25, 0, 0, 0.05, 0, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-amber-200/30 mix-blend-color-dodge filter blur-md"
            />
            
            {/* Vertical rain in the background under the lightning storm */}
            {Array.from({ length: 12 }).map((_, i) => {
              const left = (i * 10) + Math.random() * 4;
              const delay = Math.random() * 2;
              const duration = 1.0 + Math.random() * 0.5;
              return (
                <motion.div
                  key={`storm-rain-${i}`}
                  initial={{ y: -40, x: 5 }}
                  animate={{ y: 920, x: -10 }}
                  transition={{
                    duration: duration,
                    repeat: Infinity,
                    delay: delay,
                    ease: "linear"
                  }}
                  className="absolute w-[1px] bg-slate-400/20"
                  style={{
                    left: `${left}%`,
                    height: '35px',
                  }}
                />
              );
            })}
          </div>
        );
      }

      case 'clouds': {
        // Drifting horizontal subtle cloud layers
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
            {Array.from({ length: 3 }).map((_, i) => {
              const top = 30 + i * 45;
              const duration = 35 + i * 15;
              const size = 120 + i * 60;
              return (
                <motion.div
                  key={`cloud-${i}`}
                  initial={{ x: -size - 20 }}
                  animate={{ x: 450 + size }}
                  transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 8
                  }}
                  className="absolute bg-white/10 rounded-full filter blur-2xl"
                  style={{
                    top: `${top}px`,
                    width: `${size}px`,
                    height: `${size * 0.6}px`,
                  }}
                />
              );
            })}
          </div>
        );
      }

      case 'sunny':
      default: {
        // Elegant sun flares rotating slowly in the upper container
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-45">
            {/* Elegant upper flare halo */}
            <motion.div 
              animate={{
                scale: [0.95, 1.08, 0.95],
                opacity: [0.35, 0.6, 0.35],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-400/10 filter blur-3xl"
            />
            <motion.div 
              animate={{
                scale: [1.1, 0.9, 1.1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-20 left-10 w-48 h-48 rounded-full bg-sky-200/10 filter blur-3xl"
            />
          </div>
        );
      }
    }
  };

  return <>{renderEffects()}</>;
}
