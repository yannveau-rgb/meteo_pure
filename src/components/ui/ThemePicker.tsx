import React from 'react';
import { Check } from 'lucide-react';
import { THEMES, ThemeId } from '../../utils/theme';

interface ThemePickerProps {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
}

/** Grille de thèmes : pastilles d'aperçu + nom, un seul actif à la fois. */
export default function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <div role="radiogroup" aria-label="Thème visuel" className="grid grid-cols-2 gap-2.5">
      {THEMES.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(t.id)}
            className="tile text-left cursor-pointer transition-transform active:scale-[0.98]"
            style={active ? { outline: '2px solid var(--t-accent, #38bdf8)', outlineOffset: '-1px' } : undefined}
          >
            <div
              className="relative mb-2 h-14 overflow-hidden rounded-xl border border-black/15"
              style={{ background: t.preview }}
              aria-hidden="true"
            >
              <span
                className="absolute bottom-1.5 left-1.5 right-6 h-5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.28)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}
              />
              <span
                className="absolute bottom-1.5 right-1.5 h-5 w-3.5 rounded-md"
                style={{ background: t.swatch[2] }}
              />
              {active && (
                <Check className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-white p-0.5 text-black" />
              )}
            </div>
            <div className="text-[13px] font-bold leading-tight">{t.label}</div>
            <div className="meta mt-0.5">{t.tagline}</div>
          </button>
        );
      })}
    </div>
  );
}
