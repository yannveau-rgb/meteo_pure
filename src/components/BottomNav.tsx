import React from 'react';
import { Navigation, Heart, Map, ShieldAlert, MoreHorizontal } from 'lucide-react';

export type AppTab = 'meteo' | 'villes' | 'cartes' | 'alertes' | 'reglages';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  hasActiveVigilance?: boolean;
}

export default function BottomNav({ activeTab, onSelectTab, hasActiveVigilance }: BottomNavProps) {
  return (
    <nav
      id="tab-navigation-panel"
      role="tablist"
      aria-label="Sections de l'application"
      className="relative z-20 w-full max-w-sm mx-auto bg-black/40 backdrop-blur-xl border border-white/15 rounded-full p-1.5 flex justify-around items-center shadow-2xl"
    >
      {/* 1. Nearby (Météo locale) */}
      <button
        id="tab-meteo"
        role="tab"
        aria-selected={activeTab === 'meteo'}
        aria-controls="panel-meteo"
        onClick={() => onSelectTab('meteo')}
        aria-label="Météo actuelle"
        className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
          activeTab === 'meteo'
            ? 'bg-sky-500/25 text-sky-400 font-semibold scale-105'
            : 'text-white/60 hover:text-white/90 font-medium'
        }`}
      >
        <Navigation className={`w-4 h-4 ${activeTab === 'meteo' ? 'fill-sky-400 text-sky-400' : ''}`} />
        <span className="text-[10px] tracking-tight">Proche</span>
      </button>

      {/* 2. Cities (Favoris & Recherche) */}
      <button
        id="tab-villes"
        role="tab"
        aria-selected={activeTab === 'villes'}
        aria-controls="panel-villes"
        onClick={() => onSelectTab('villes')}
        aria-label="Villes favorites"
        className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
          activeTab === 'villes'
            ? 'bg-white/20 text-white font-semibold scale-105'
            : 'text-white/60 hover:text-white/90 font-medium'
        }`}
      >
        <Heart className={`w-4 h-4 ${activeTab === 'villes' ? 'fill-white text-white' : ''}`} />
        <span className="text-[10px] tracking-tight">Villes</span>
      </button>

      {/* 3. Map (Radar de pluie & cartes) */}
      <button
        id="tab-cartes"
        role="tab"
        aria-selected={activeTab === 'cartes'}
        aria-controls="panel-cartes"
        onClick={() => onSelectTab('cartes')}
        aria-label="Radar et cartes"
        className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
          activeTab === 'cartes'
            ? 'bg-white/20 text-white font-semibold scale-105'
            : 'text-white/60 hover:text-white/90 font-medium'
        }`}
      >
        <Map className="w-4 h-4" />
        <span className="text-[10px] tracking-tight">Carte</span>
      </button>

      {/* 4. Vigilance */}
      <button
        id="tab-alertes"
        role="tab"
        aria-selected={activeTab === 'alertes'}
        aria-controls="panel-alertes"
        onClick={() => onSelectTab('alertes')}
        aria-label="Vigilance Météo"
        className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer relative ${
          activeTab === 'alertes'
            ? 'bg-white/20 text-white font-semibold scale-105'
            : 'text-white/60 hover:text-white/90 font-medium'
        }`}
      >
        <div className="relative">
          <ShieldAlert className="w-4 h-4" />
          {hasActiveVigilance && (
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
          )}
        </div>
        <span className="text-[10px] tracking-tight">Vigilance</span>
      </button>

      {/* 5. More (Réglages & Options) */}
      <button
        id="tab-reglages"
        role="tab"
        aria-selected={activeTab === 'reglages'}
        aria-controls="panel-reglages"
        onClick={() => onSelectTab('reglages')}
        aria-label="Plus d'options"
        className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
          activeTab === 'reglages'
            ? 'bg-white/20 text-white font-semibold scale-105'
            : 'text-white/60 hover:text-white/90 font-medium'
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
        <span className="text-[10px] tracking-tight">Plus</span>
      </button>
    </nav>
  );
}
