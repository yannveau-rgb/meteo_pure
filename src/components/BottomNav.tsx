import { CloudSun, ArrowRightLeft, Bell, Settings } from 'lucide-react';

export type AppTab = 'meteo' | 'cartes' | 'alertes' | 'reglages';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  hasActiveVigilance: boolean;
}

const tabButtonClass = (active: boolean) =>
  `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
    active
      ? 'bg-white/20 text-white font-bold text-shadow-sm scale-105'
      : 'text-white/60 hover:text-white/90 font-medium'
  }`;

export default function BottomNav({ activeTab, onSelectTab, hasActiveVigilance }: BottomNavProps) {
  return (
    <nav
      id="tab-navigation-panel"
      role="tablist"
      aria-label="Sections de l'application"
      className="relative z-10 mt-6 bg-white/15 backdrop-blur-md border border-white/20 rounded-full p-1.5 flex justify-around items-center shadow-lg"
    >
      <button
        id="tab-meteo"
        role="tab"
        aria-selected={activeTab === 'meteo'}
        aria-controls="panel-meteo"
        onClick={() => onSelectTab('meteo')}
        aria-label="Météo"
        className={tabButtonClass(activeTab === 'meteo')}
      >
        <CloudSun className="w-5 h-5" />
        <span className="text-[9px]">Météo</span>
      </button>

      <button
        id="tab-cartes"
        role="tab"
        aria-selected={activeTab === 'cartes'}
        aria-controls="panel-cartes"
        onClick={() => onSelectTab('cartes')}
        aria-label="Comparer les villes"
        className={tabButtonClass(activeTab === 'cartes')}
      >
        <ArrowRightLeft className={`w-5 h-5 rotate-45 ${activeTab === 'cartes' ? 'text-sky-400' : ''}`} />
        <span className="text-[9px]">Comparer</span>
      </button>

      <button
        id="tab-alertes"
        role="tab"
        aria-selected={activeTab === 'alertes'}
        aria-controls="panel-alertes"
        onClick={() => onSelectTab('alertes')}
        aria-label="Alertes et vigilance"
        className={tabButtonClass(activeTab === 'alertes')}
      >
        <div className="relative">
          <Bell className="w-5 h-5" />
          {hasActiveVigilance && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-white/60" />
          )}
        </div>
        <span className="text-[9px]">Alertes</span>
      </button>

      <button
        id="tab-reglages"
        role="tab"
        aria-selected={activeTab === 'reglages'}
        aria-controls="panel-reglages"
        onClick={() => onSelectTab('reglages')}
        aria-label="Réglages"
        className={tabButtonClass(activeTab === 'reglages')}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[9px]">Réglages</span>
      </button>
    </nav>
  );
}
