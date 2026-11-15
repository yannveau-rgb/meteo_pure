import React from 'react';
import { Navigation, Heart, Map, ShieldAlert, MoreHorizontal } from 'lucide-react';

export type AppTab = 'meteo' | 'villes' | 'cartes' | 'alertes' | 'reglages';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  hasActiveVigilance?: boolean;
}

const TABS: Array<{
  id: AppTab;
  label: string;
  ariaLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'meteo', label: 'Proche', ariaLabel: 'Météo actuelle', Icon: Navigation },
  { id: 'villes', label: 'Villes', ariaLabel: 'Villes favorites', Icon: Heart },
  { id: 'cartes', label: 'Carte', ariaLabel: 'Radar et cartes', Icon: Map },
  { id: 'alertes', label: 'Vigilance', ariaLabel: 'Vigilance Météo', Icon: ShieldAlert },
  { id: 'reglages', label: 'Plus', ariaLabel: "Plus d'options", Icon: MoreHorizontal },
];

export default function BottomNav({ activeTab, onSelectTab, hasActiveVigilance }: BottomNavProps) {
  return (
    <nav
      id="tab-navigation-panel"
      role="tablist"
      aria-label="Sections de l'application"
      className="relative z-20 w-full max-w-sm mx-auto bg-black/40 backdrop-blur-xl border border-white/15 rounded-full p-1.5 flex justify-around items-center shadow-2xl"
    >
      {TABS.map(({ id, label, ariaLabel, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${id}`}
            onClick={() => onSelectTab(id)}
            aria-label={ariaLabel}
            className={`flex flex-col items-center justify-center gap-0.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              isActive
                ? id === 'meteo'
                  ? 'bg-sky-500/25 text-sky-300 font-semibold scale-105'
                  : 'bg-white/20 text-white font-semibold scale-105'
                : 'text-white/60 hover:text-white/90 font-medium'
            }`}
          >
            <span className="relative">
              <Icon
                className={`w-4 h-4 ${
                  isActive && id === 'meteo'
                    ? 'fill-sky-300 text-sky-300'
                    : isActive && id === 'villes'
                      ? 'fill-white text-white'
                      : ''
                }`}
              />
              {hasActiveVigilance && id === 'alertes' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
              )}
            </span>
            <span className="text-[11px] leading-none tracking-tight">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
