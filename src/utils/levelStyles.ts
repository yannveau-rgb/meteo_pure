// Single source of truth for the vigilance level color scale (vert / jaune /
// orange / rouge), previously reimplemented independently in VigilanceCard,
// AlertsView, and (in spirit) the notification toast — each with its own
// slightly different set of Tailwind classes, some of them invalid
// (text-rose-305, text-emerald-905... Tailwind has no such shades, so those
// classes silently generated no CSS rule and rendered plain white text).
//
// Every class below is written out in full on purpose: Tailwind's scanner
// only picks up complete class name literals in source, so building these
// with template strings like `text-${hue}-400` would make Tailwind emit no
// CSS for them at all.

export type VigilanceLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface LevelStyle {
  label: string;
  /** Solid dot / small filled indicator (status pill). */
  dot: string;
  /** Slightly brighter dot used as the animate-ping echo. */
  pingDot: string;
  /** Text color matching the dot, for use on a dark glass background. */
  accentText: string;
  /** Border + faint background wash, for an outlined pill on a dark glass background. */
  outline: string;
  /** Translucent badge (bg/20, text/300, border/30) for small category pills. */
  badge: string;
  /** Solid-ish alert banner (bg/25, white text, border/40) for a prominent status bar. */
  banner: string;
}

const LEVEL_STYLES: Record<VigilanceLevel, LevelStyle> = {
  green: {
    label: 'Verte',
    dot: 'bg-emerald-500',
    pingDot: 'bg-emerald-400',
    accentText: 'text-emerald-400',
    outline: 'border-emerald-500/30 bg-emerald-500/5',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    banner: 'bg-emerald-500/25 text-white border-emerald-500/40',
  },
  yellow: {
    label: 'Jaune',
    dot: 'bg-yellow-400',
    pingDot: 'bg-yellow-300',
    accentText: 'text-yellow-400',
    outline: 'border-yellow-400/30 bg-yellow-400/5',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    banner: 'bg-yellow-500/25 text-white border-yellow-500/40',
  },
  orange: {
    label: 'Orange',
    dot: 'bg-amber-500',
    pingDot: 'bg-amber-400',
    accentText: 'text-amber-400',
    outline: 'border-amber-500/30 bg-amber-500/5',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    banner: 'bg-amber-500/25 text-white border-amber-500/40',
  },
  red: {
    label: 'Rouge',
    dot: 'bg-rose-500',
    pingDot: 'bg-rose-400',
    accentText: 'text-rose-400',
    outline: 'border-rose-500/30 bg-rose-500/5',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    banner: 'bg-rose-500/25 text-white border-rose-500/40',
  },
};

export function normalizeLevel(level: string | undefined | null): VigilanceLevel {
  return level === 'yellow' || level === 'orange' || level === 'red' ? level : 'green';
}

export function getLevelStyle(level: string | undefined | null): LevelStyle {
  return LEVEL_STYLES[normalizeLevel(level)];
}
