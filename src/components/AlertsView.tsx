import React, { useState } from 'react';
import { Bell, ShieldAlert, PhoneCall, CheckCircle2 } from 'lucide-react';
import { VigilanceStatus } from '../types';
import { getLevelStyle } from '../utils/levelStyles';

interface AlertsViewProps {
  vigilance: VigilanceStatus;
  cityName: string;
}

type AlertTab = 'current' | 'safety' | 'numbers';

const SAFETY_GUIDES = [
  {
    emoji: '⚡',
    title: 'Vigilance orages',
    tone: 'text-amber-300',
    body: "Mettez à l'abri les objets sensibles au vent. Ne vous abritez pas sous un arbre ni près de pylônes. Débranchez les appareils électriques sensibles.",
  },
  {
    emoji: '🌊',
    title: 'Vigilance pluie-inondation',
    tone: 'text-sky-300',
    body: "Ne descendez pas dans les sous-sols. Évitez les cours d'eau. Ne vous engagez absolument pas — en voiture comme à pied — sur une voie immergée.",
  },
  {
    emoji: '🌡️',
    title: 'Températures extrêmes',
    tone: 'text-rose-300',
    body: "Gardez votre habitation au frais en fermant volets et fenêtres de jour. Buvez régulièrement de l'eau. En cas de grand froid, multipliez les épaisseurs et protégez vos extrémités.",
  },
];

const EMERGENCY_NUMBERS = [
  { number: '112', label: "Numéro d'urgence européen", note: 'Appel prioritaire', accent: 'text-rose-400' },
  { number: '15', label: 'SAMU (urgences médicales)', note: '24 h/24 & 7 j/7', accent: 'text-white' },
  { number: '18', label: 'Sapeurs-pompiers', note: 'Incendies & secours', accent: 'text-white' },
  { number: '3250', label: 'Météo-France Audiotel', note: 'Météo par téléphone', accent: 'text-white' },
];

export default function AlertsView({ vigilance, cityName }: AlertsViewProps) {
  const [activeTab, setActiveTab] = useState<AlertTab>('current');

  const getAlertLabelText = (level: string) => {
    switch (level) {
      case 'red': return 'Niveau d\'alerte maximal — très grand danger';
      case 'orange': return 'Niveau d\'alerte orange — soyez très vigilants';
      case 'yellow': return 'Niveau d\'alerte jaune — soyez attentifs';
      default: return 'Situation normale — aucun risque majeur';
    }
  };

  return (
    <div 
      id="alerts-panel-tab"
      className="card flex flex-col justify-between flex-1 space-y-4 select-none"
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-2.5 border-b border-white/15">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-400 animate-pulse" />
            Alertes & infos
          </h2>
          <p className="kicker text-white/70 mt-1">
            Sécurité civile & prévisions
          </p>
        </div>
      </div>

      {/* Segmented control tabs */}
      <div className="segmented" role="group" aria-label="Sections d'alerte">
        {([
          ['current', cityName],
          ['safety', 'Consignes'],
          ['numbers', 'Urgences'],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            data-active={activeTab === tab}
            aria-pressed={activeTab === tab}
            className="segmented-item truncate"
          >
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab contents */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 min-h-[300px]">
        {activeTab === 'current' && (
          <div className="space-y-3">
            {/* Main Status Badge */}
            <div className={`tile !p-3.5 flex items-center gap-3 shadow-md ${getLevelStyle(vigilance.globalLevel).banner}`}>
              <ShieldAlert className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)] shrink-0" />
              <div>
                <h3 className="font-bold text-[12px] uppercase tracking-widest">Vigilance active à {cityName}</h3>
                <p className="text-[11px] font-bold leading-relaxed mt-0.5 text-white">
                  {getAlertLabelText(vigilance.globalLevel)}
                </p>
              </div>
            </div>

            {/* List details/categories are active */}
            <div className="space-y-2">
              {vigilance.categories.map((cat, idx) => {
                const catStyle = getLevelStyle(cat.level);
                return (
                  <div key={idx} className="tile flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-[12px] text-white">{cat.name}</h4>
                      <p className="text-[11px] text-white/80 mt-1 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <span className={`pill !text-[10px] ${catStyle.badge}`}>
                      {catStyle.label.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="space-y-3">
            <h3 className="kicker text-sky-200 pl-1">
              Consignes d'urgence France
            </h3>

            {SAFETY_GUIDES.map((guide) => (
              <div key={guide.title} className="tile space-y-1.5">
                <h4 className={`text-[12px] font-bold flex items-center gap-1.5 ${guide.tone}`}>
                  <span aria-hidden="true">{guide.emoji}</span> {guide.title}
                </h4>
                <p className="text-[11px] text-white/80 leading-relaxed">
                  {guide.body}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'numbers' && (
          <div className="space-y-3">
            <h3 className="kicker text-sky-200 pl-1 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-sky-300" />
              Numéros nationaux (appel gratuit)
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              {EMERGENCY_NUMBERS.map((item) => (
                <div key={item.number} className="tile flex justify-between items-center transition-all hover:bg-white/10">
                  <div>
                    <span className={`text-lg font-black tracking-tight block ${item.accent}`}>{item.number}</span>
                    <span className="text-[11px] text-white/70 font-semibold">{item.label}</span>
                  </div>
                  <span className="text-[11px] text-white/60 italic text-right">{item.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="tile !p-3 text-center flex items-center justify-center gap-1.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-[11px] text-white/90 font-bold leading-normal">
          Données officielles de vigilance Météo-France.
        </span>
      </div>
    </div>
  );
}
