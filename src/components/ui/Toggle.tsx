interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  /** Tailwind bg-* class shown when on. Defaults to the sky accent used everywhere else. */
  activeColorClass?: string;
  /** Muted, non-interactive switch — e.g. category switches while push is off. */
  disabled?: boolean;
}

// The 4 notification switches in Réglages were copy-pasted with only the
// bound field and accent color changed each time (~60 lines of duplicated
// JSX). One component now, parameterized on what actually differs.
export default function Toggle({
  checked,
  onChange,
  label,
  activeColorClass = 'bg-sky-500',
  disabled = false,
}: ToggleProps) {
  return (
    <button
      onClick={disabled ? undefined : onChange}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      aria-label={label}
      className={`relative w-12 h-6 flex items-center rounded-full transition-colors duration-300 p-0.5 shrink-0 shadow-inner overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
        disabled
          ? 'bg-white/5 border border-white/10 opacity-60 cursor-not-allowed'
          : checked
            ? `${activeColorClass} cursor-pointer`
            : 'bg-white/10 border border-white/10 cursor-pointer'
      }`}
      type="button"
    >
      {/* Grey knob when disabled so the switch never reads as "on" while the
          master push switch is off. */}
      <div
        className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 relative z-10 ${
          disabled ? 'bg-white/40' : 'bg-white'
        } ${checked ? 'translate-x-6' : 'translate-x-0'}`}
      />
    </button>
  );
}
