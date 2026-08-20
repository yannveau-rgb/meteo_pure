interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  /** Tailwind bg-* class shown when on. Defaults to the sky accent used everywhere else. */
  activeColorClass?: string;
}

// The 4 notification switches in Réglages were copy-pasted with only the
// bound field and accent color changed each time (~60 lines of duplicated
// JSX). One component now, parameterized on what actually differs.
export default function Toggle({ checked, onChange, label, activeColorClass = 'bg-sky-500' }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative w-12 h-6 flex items-center rounded-full cursor-pointer transition-colors duration-300 p-0.5 shrink-0 shadow-inner overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
        checked ? activeColorClass : 'bg-white/10 border border-white/10'
      }`}
      type="button"
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 relative z-10 ${
        checked ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  );
}
