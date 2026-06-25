import React, { useState } from 'react';
import { Bell, ShieldAlert, PhoneCall, Info, HelpCircle, CheckCircle2 } from 'lucide-react';
import { VigilanceStatus } from '../types';

interface AlertsViewProps {
  vigilance: VigilanceStatus;
  cityName: string;
}

export default function AlertsView({ vigilance, cityName }: AlertsViewProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'safety' | 'numbers'>('current');

  const getAlertLevelBanner = (level: string) => {
    switch (level) {
      case 'red': return 'bg-rose-500/25 text-white border-rose-500/40';
      case 'orange': return 'bg-amber-500/25 text-white border-amber-500/40';
      case 'yellow': return 'bg-yellow-500/25 text-white border-yellow-500/40';
      default: return 'bg-emerald-500/25 text-white border-emerald-500/40';
    }
  };

  const getAlertLabelText = (level: string) => {
    switch (level) {
      case 'red': return 'Niveau d\'alerte maximal - TRÈS GRAND DANGER';
      case 'orange': return 'Niveau d\'alerte orange - SOYEZ TRÈS VIGILANTS';
      case 'yellow': return 'Niveau d\'alerte jaune - SOYEZ ATTENTIFS';
      default: return 'Situation normale - AUCUN RISQUE MAJEUR';
    }
  };

  return (
    <div 
      id="alerts-panel-tab"
      className="glass-premium rounded-3xl p-5 shadow-lg flex flex-col justify-between flex-1 space-y-4 text-white select-none"
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-2.5 border-b border-white/15">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-400 animate-pulse" />
            Alertes & Infos
          </h2>
          <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1">
            Sécurité civile & prévisions
          </p>
        </div>
      </div>

      {/* Segmented control tabs */}
      <div className="grid grid-cols-3 gap-1 bg-black/15 backdrop-blur-md p-1 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveTab('current')}
          className={`text-[11px] font-bold py-1.5 rounded-lg transition-all ${
            activeTab === 'current' 
              ? 'bg-white/15 text-white border border-white/10 shadow-sm' 
              : 'text-white/60 hover:text-white/95 hover:bg-white/5'
          }`}
        >
          {cityName}
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`text-[11px] font-bold py-1.5 rounded-lg transition-all ${
            activeTab === 'safety' 
              ? 'bg-white/15 text-white border border-white/10 shadow-sm' 
              : 'text-white/60 hover:text-white/95 hover:bg-white/5'
          }`}
        >
          Consignes
        </button>
        <button
          onClick={() => setActiveTab('numbers')}
          className={`text-[11px] font-bold py-1.5 rounded-lg transition-all ${
            activeTab === 'numbers' 
              ? 'bg-white/15 text-white border border-white/10 shadow-sm' 
              : 'text-white/60 hover:text-white/95 hover:bg-white/5'
          }`}
        >
          Urgences
        </button>
      </div>

      {/* Tab contents */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 min-h-[300px]">
        {activeTab === 'current' && (
          <div className="space-y-3">
            {/* Main Status Badge */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-md ${getAlertLevelBanner(vigilance.globalLevel)}`}>
              <ShieldAlert className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)]" />
              <div>
                <h3 className="font-bold text-xs uppercase tracking-widest">Vigilance active à {cityName}</h3>
                <p className="text-[11px] font-bold leading-relaxed mt-0.5 text-white">
                  {getAlertLabelText(vigilance.globalLevel)}
                </p>
              </div>
            </div>

            {/* List details/categories are active */}
            <div className="space-y-2">
              {vigilance.categories.map((cat, idx) => (
                <div key={idx} className="bg-white/10 p-3.5 rounded-xl border border-white/10 flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-white">{cat.name}</h4>
                    <p className="text-[11px] text-white/80 mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    cat.level === 'green' ? 'bg-emerald-500/20 text-emerald-305 border-emerald-500/30' :
                    cat.level === 'yellow' ? 'bg-yellow-500/20 text-yellow-305 border-yellow-500/30' :
                    cat.level === 'orange' ? 'bg-amber-500/20 text-amber-305 border-amber-500/30' :
                    'bg-rose-500/20 text-rose-305 border-rose-500/30'
                  }`}>
                    {cat.level === 'green' ? 'VERT' :
                     cat.level === 'yellow' ? 'JAUNE' :
                     cat.level === 'orange' ? 'ORANGE' : 'ROUGE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-sky-200 uppercase tracking-widest pl-1 header-shadow">
              Consignes d'urgence France
            </h3>

            {/* Orage Conseils */}
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                ⚡ Vigilance Orages
              </h4>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Mettez à l'abri les objets sensibles au vent. Ne vous abritez pas sous un arbre ni près de pylônes. Débranchez les appareils électriques sensibles.
              </p>
            </div>

            {/* Inondation Conseils */}
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <h4 className="text-xs font-bold text-sky-305 flex items-center gap-1.5">
                🌊 Vigilance Pluie-Inondation
              </h4>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Ne descendez pas dans les sous-sols. Évitez les cours d'eau. Ne vous engagez absolument pas - en voiture comme à pied - sur une voie immergée.
              </p>
            </div>

            {/* Canicule/Grand Froid Conseils */}
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                🌡️ Températures Extrêmes (Canicule/Froid)
              </h4>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Gardez votre habitation au frais en fermant volets et fenêtres de jour. Buvez régulièrement de l'eau. En cas de grand froid, multipliez les épaisseurs et protégez vos extrémités.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'numbers' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-sky-200 uppercase tracking-widest pl-1 flex items-center gap-1.5 header-shadow">
              <PhoneCall className="w-3.5 h-3.5 text-sky-300" />
              Numéros Nationaux (Appel Gratuit)
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-white/10 p-3 rounded-xl border border-white/10 flex justify-between items-center transition-all hover:bg-white/15">
                <div>
                  <span className="text-lg font-black text-rose-450 tracking-tight block">112</span>
                  <span className="text-[10px] text-white/70 font-semibold">Numéro d'urgence Européen</span>
                </div>
                <span className="text-[10px] text-white/40 italic">Appel prioritaire</span>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/10 flex justify-between items-center transition-all hover:bg-white/15">
                <div>
                  <span className="text-lg font-black text-white tracking-tight block">15</span>
                  <span className="text-[10px] text-white/70 font-semibold">SAMU (Urgences Médicales)</span>
                </div>
                <span className="text-[10px] text-white/40 italic">24h/24 & 7j/7</span>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/10 flex justify-between items-center transition-all hover:bg-white/15">
                <div>
                  <span className="text-lg font-black text-white tracking-tight block">18</span>
                  <span className="text-[10px] text-white/70 font-semibold">Sapeurs-pompiers</span>
                </div>
                <span className="text-[10px] text-white/40 italic">Incendies & Secours</span>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/10 flex justify-between items-center transition-all hover:bg-white/15">
                <div>
                  <span className="text-lg font-black text-white tracking-tight block">3250</span>
                  <span className="text-[10px] text-white/70 font-semibold">Météo-France Audiotel</span>
                </div>
                <span className="text-[10px] text-white/40 italic">Météo par téléphone</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-center flex items-center justify-center gap-1.5 shadow-inner">
        <CheckCircle2 className="w-4 h-4 text-emerald-450" />
        <span className="text-[10px] text-white/90 font-bold leading-normal">
          Données officielles de vigilance Météo-France.
        </span>
      </div>
    </div>
  );
}
