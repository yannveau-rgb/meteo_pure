import React, { useMemo } from 'react';
import type { ThemeId } from '../../utils/theme';

/**
 * Fonds des thèmes alternatifs. Remplace CelestialSky : ces thèmes sont
 * volontairement indépendants de l'heure et de la météo, que le héros et les
 * cartes continuent d'exprimer.
 *
 * Les dégradés vivent dans themes.css (classes .bd-*) : ils y ont un repli sRGB
 * puis une version interpolée en OKLCH, que le navigateur ignore s'il ne la
 * comprend pas. Un style inline n'aurait pas pu porter ce repli.
 */

const LAYER = 'fixed inset-0 sm:absolute pointer-events-none overflow-hidden z-0';

function Blob({
  className,
  style,
}: {
  className: string;
  style: React.CSSProperties;
}) {
  return <div className={`theme-blob absolute rounded-full ${className}`} style={style} />;
}

function AuroraBackdrop() {
  const stars = useMemo(
    () =>
      Array.from({ length: 38 }, (_, i) => ({
        id: i,
        x: ((i * 37) % 96) + 2,
        y: ((i * 53) % 62) + 2,
        size: i % 5 === 0 ? 2 : 1,
        opacity: 0.3 + (i % 5) * 0.12,
        delay: (i % 7) * 0.7,
        duration: 3 + (i % 4) * 0.9,
      })),
    []
  );

  return (
    <div className={`${LAYER} bd-aurora`} aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animation: `twinkle ${s.duration}s infinite ease-in-out ${s.delay}s`,
          }}
        />
      ))}
      {/* Mesh : quatre nappes de couleur qui dérivent, fondues en « screen ». */}
      <Blob
        className="h-[26rem] w-[26rem] mix-blend-screen"
        style={{
          top: '-8%', left: '-30%',
          background: 'radial-gradient(circle, oklch(0.82 0.19 165 / 0.75), transparent 68%)',
          ['--dx' as string]: '18%', ['--dy' as string]: '10%', animationDuration: '26s',
        }}
      />
      <Blob
        className="h-[30rem] w-[30rem] mix-blend-screen"
        style={{
          top: '2%', right: '-42%',
          background: 'radial-gradient(circle, oklch(0.62 0.26 295 / 0.8), transparent 68%)',
          ['--dx' as string]: '-16%', ['--dy' as string]: '14%', animationDuration: '32s',
        }}
      />
      <Blob
        className="h-[24rem] w-[24rem] mix-blend-screen"
        style={{
          top: '34%', left: '-12%',
          background: 'radial-gradient(circle, oklch(0.7 0.22 340 / 0.5), transparent 68%)',
          ['--dx' as string]: '22%', ['--dy' as string]: '-8%', animationDuration: '38s',
        }}
      />
      <Blob
        className="h-[22rem] w-[22rem] mix-blend-screen"
        style={{
          bottom: '-10%', right: '-20%',
          background: 'radial-gradient(circle, oklch(0.78 0.14 215 / 0.55), transparent 68%)',
          ['--dx' as string]: '-20%', ['--dy' as string]: '-12%', animationDuration: '29s',
        }}
      />
      <div className="absolute inset-0 theme-grain opacity-[0.16] mix-blend-overlay" />
    </div>
  );
}

function KraftBackdrop() {
  return (
    <div className={`${LAYER} bd-kraft`} aria-hidden="true">
      {/* Halo de lumière chaude, comme un soleil bas sur du papier. */}
      <Blob
        className="h-[34rem] w-[34rem]"
        style={{
          top: '-22%', right: '-38%',
          background: 'radial-gradient(circle, oklch(0.84 0.1 55 / 0.7), transparent 66%)',
          ['--dx' as string]: '-6%', ['--dy' as string]: '6%', animationDuration: '40s',
        }}
      />
      <Blob
        className="h-[26rem] w-[26rem]"
        style={{
          bottom: '-14%', left: '-26%',
          background: 'radial-gradient(circle, oklch(0.8 0.07 150 / 0.4), transparent 66%)',
          ['--dx' as string]: '8%', ['--dy' as string]: '-6%', animationDuration: '46s',
        }}
      />
      <div className="absolute inset-0 theme-grain opacity-[0.28] mix-blend-multiply" />
    </div>
  );
}

function RadarBackdrop() {
  return (
    <div className={`${LAYER} bd-radar`} aria-hidden="true">
      {/* Matrice de points : plus actuel que le quadrillage en traits. */}
      <div className="absolute inset-0 bd-radar-dots" />
      {/* Anneaux estompés vers les bords, et balayage. */}
      <div className="absolute left-1/2 top-[34%] h-[130vmax] w-[130vmax] -translate-x-1/2 -translate-y-1/2 bd-radar-mask">
        <div className="theme-radar-sweep absolute inset-0 rounded-full bd-radar-sweep" />
        <div className="absolute inset-0 rounded-full bd-radar-rings" />
      </div>
      <div className="absolute inset-0 theme-grain opacity-[0.12] mix-blend-screen" />
    </div>
  );
}

function PopBackdrop() {
  return (
    <div className={`${LAYER} bd-pop`} aria-hidden="true">
      {/* Mesh vif + formes organiques « blob » qui se déforment. */}
      <Blob
        className="theme-blob-morph h-80 w-80"
        style={{
          top: '-6%', left: '-26%',
          background: 'oklch(0.9 0.17 100)',
          ['--dx' as string]: '10%', ['--dy' as string]: '8%', animationDuration: '14s',
        }}
      />
      <Blob
        className="theme-blob-morph h-72 w-72"
        style={{
          top: '26%', right: '-30%',
          background: 'oklch(0.84 0.14 200)',
          ['--dx' as string]: '-10%', ['--dy' as string]: '10%', animationDuration: '18s',
        }}
      />
      <Blob
        className="theme-blob-morph h-96 w-96"
        style={{
          bottom: '-14%', right: '-26%',
          background: 'oklch(0.55 0.27 295)',
          ['--dx' as string]: '-8%', ['--dy' as string]: '-8%', animationDuration: '22s',
        }}
      />
      <Blob
        className="theme-blob-morph h-56 w-56"
        style={{
          bottom: '18%', left: '-18%',
          background: 'oklch(0.7 0.24 350)',
          ['--dx' as string]: '12%', ['--dy' as string]: '-6%', animationDuration: '16s',
        }}
      />
      <div className="absolute inset-0 theme-grain opacity-[0.35] mix-blend-overlay" />
      <div className="absolute inset-0 bd-pop-halftone" />
    </div>
  );
}

export default function ThemeBackdrop({ theme }: { theme: Exclude<ThemeId, 'auto'> }) {
  if (theme === 'aurora') return <AuroraBackdrop />;
  if (theme === 'kraft') return <KraftBackdrop />;
  if (theme === 'pop') return <PopBackdrop />;
  return <RadarBackdrop />;
}
