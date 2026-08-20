import { useEffect, useRef, useState, ReactNode } from 'react';

interface InfoBadgeProps {
  label: string;
  className?: string;
  children: ReactNode;
}

/**
 * A pill that carries an explanatory `label` — station distance, altitude
 * correction, model confidence, pollen thresholds. `title` alone never
 * surfaces on a touchscreen, so this shows the same text as a tap-dismissible
 * popover instead, while remaining a native title on devices that do hover.
 */
export default function InfoBadge({ label, className = '', children }: InfoBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title={label}
        aria-expanded={open}
        aria-label={label}
        className={`${className} cursor-help`}
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-30 left-1/2 -translate-x-1/2 top-full mt-1.5 w-max max-w-[13rem] px-2.5 py-1.5 rounded-lg bg-slate-900/95 border border-white/15 text-white/90 text-[11px] font-normal leading-snug shadow-xl whitespace-normal text-left"
        >
          {label}
        </span>
      )}
    </span>
  );
}
