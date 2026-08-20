import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { VigilanceStatus } from '../types';
import { ShieldAlert, X, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLevelStyle } from '../utils/levelStyles';
import { useModalA11y } from '../hooks/useModalA11y';

interface VigilanceCardProps {
  vigilance: VigilanceStatus;
  uvIndex?: number;
}

export default function VigilanceCard({ vigilance, uvIndex }: VigilanceCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useModalA11y(isOpen, () => setIsOpen(false));

  const activeColor = getLevelStyle(vigilance.globalLevel);

  return (
    <>
      <button
        type="button"
        id="vigilance-widget"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        className="w-full text-left glass-premium rounded-3xl p-4 flex flex-col justify-between shadow-lg cursor-pointer transition-all duration-300 hover:brightness-105 hover:scale-[1.02] active:scale-95 h-40 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-400/60"
      >
        {vigilance.globalLevel !== 'green' ? (
          <>
            {/* Vigilance active: it outranks UV, so it takes the card's
                dominant slot instead of a small footer pill. */}
            <div className="flex justify-between items-center text-[10px] text-white/50 uppercase tracking-widest leading-none select-none w-full">
              <span>Vigilance météo</span>
              <ShieldAlert className={`w-3.5 h-3.5 ${activeColor.accentText}`} />
            </div>

            <div className="flex flex-col items-center justify-center my-auto py-1 select-none w-full">
              <span className="relative flex h-3 w-3 mb-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeColor.pingDot}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${activeColor.dot}`}></span>
              </span>
              <span className={`text-2xl sm:text-3xl font-black tracking-wide drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] ${activeColor.accentText}`}>
                {activeColor.label}
              </span>
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mt-1">Appuyez pour les détails</span>
            </div>

            <div className="w-full border-t border-white/5 pt-2 flex items-center justify-between gap-2 select-none">
              <span className="text-[9px] text-white/60 font-medium tracking-wide uppercase">Rayonnement UV</span>
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-white/80">
                <Sun className="w-3 h-3 text-amber-300" />
                {uvIndex !== undefined ? `${uvIndex} / 11` : 'Indisponible'}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Card Header */}
            <div className="flex justify-between items-center text-[10px] text-white/50 uppercase tracking-widest leading-none select-none w-full">
              <span>Rayonnement UV</span>
              <Sun className="w-3.5 h-3.5 text-white/60" />
            </div>

            {/* Custom Central UV Display */}
            <div className="flex flex-col items-center justify-center my-auto py-1 select-none w-full">
              <div className="flex items-baseline justify-center gap-0.5 leading-none">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-widest drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">
                  {uvIndex !== undefined ? uvIndex : '—'}
                </span>
                <span className="text-xs font-semibold text-white/60 tracking-tight">/11</span>
              </div>

              <span className={`text-[9px] font-black tracking-wider uppercase mt-2 rounded-full px-2.5 py-0.5 border select-none transition-colors duration-300 ${
                uvIndex !== undefined && uvIndex >= 11 ? 'bg-violet-500/10 text-violet-300 border-violet-500/30' :
                uvIndex !== undefined && uvIndex >= 8 ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                uvIndex !== undefined && uvIndex >= 6 ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' :
                uvIndex !== undefined && uvIndex >= 3 ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                {uvIndex === undefined ? 'INDISPONIBLE' :
                 uvIndex >= 11 ? 'UV EXTRÊME' :
                 uvIndex >= 8 ? 'UV TRÈS ÉLEVÉ' :
                 uvIndex >= 6 ? 'UV ÉLEVÉ' :
                 uvIndex >= 3 ? 'UV MODÉRÉ' : 'UV FAIBLE'}
              </span>
            </div>

            {/* Elegant Bottom Border & Vigilance Status */}
            <div className="w-full border-t border-white/5 pt-2 flex items-center justify-between gap-2 select-none">
              <span className="text-[9px] text-white/60 font-medium tracking-wide uppercase">Vigilance</span>

              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9.5px] font-bold tracking-normal ${activeColor.outline}`}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${activeColor.dot}`}></span>
                </span>
                <span className={activeColor.accentText}>
                  {activeColor.label}
                </span>
              </div>
            </div>
          </>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                 ref={modalRef}
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="vigilance-modal-title"
                 tabIndex={-1}
                 initial={{ scale: 0.95, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.95, opacity: 0 }}
                 transition={{ type: 'spring', duration: 0.35 }}
                 onClick={(e) => e.stopPropagation()}
                 className="w-full max-w-md glass-premium rounded-3xl border border-white/20 shadow-2xl overflow-hidden text-white cursor-default flex flex-col max-h-[80vh] focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              >
                {/* FIXED INTERNAL HEADER */}
                <div className="flex justify-between items-center border-b border-white/15 px-5 py-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`w-5 h-5 ${vigilance.globalLevel !== 'green' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
                    <h3 id="vigilance-modal-title" className="text-base font-bold text-white">Détails Vigilance</h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* SCROLLABLE BODY CONTENT */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${activeColor.outline}`}>
                    <div className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${activeColor.dot}`} />
                    <div>
                      <h4 className={`font-bold text-sm ${activeColor.accentText}`}>Vigilance : niveau {activeColor.label}</h4>
                      <p className="text-xs leading-relaxed mt-1 text-white/80">
                        {vigilance.globalLevel === 'red' && "Alerte maximale. Des phénomènes météorologiques exceptionnels de très forte intensité sont prévus."}
                        {vigilance.globalLevel === 'orange' && "Soyez très vigilants. Des phénomènes météorologiques dangereux sont prévus."}
                        {vigilance.globalLevel === 'yellow' && "Soyez attentifs si vous pratiquez des activités sensibles au risque météorologique."}
                        {vigilance.globalLevel === 'green' && "Aucune vigilance particulière requise pour les prochaines 24 heures."}
                      </p>
                    </div>
                  </div>

                  {uvIndex !== undefined && (
                    <div className="p-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-amber-300 fill-amber-400/20 animate-spin" style={{ animationDuration: '20s' }} />
                          <span className="font-bold text-sm text-white">Rayonnement UV : {uvIndex} / 11+</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          uvIndex >= 11 ? 'bg-violet-500/15 text-violet-300 border-violet-500/30' :
                          uvIndex >= 8 ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                          uvIndex >= 6 ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' :
                          uvIndex >= 3 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                          'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {uvIndex >= 11 ? 'EXTRÊME' :
                           uvIndex >= 8 ? 'TRÈS ÉLEVÉ' :
                           uvIndex >= 6 ? 'ÉLEVÉ' :
                           uvIndex >= 3 ? 'MODÉRÉ' : 'FAIBLE'}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-2 leading-relaxed">
                        {uvIndex >= 11 && "Protection maximale requise : évitez l'exposition, portez un chapeau, de la crème indice 50+, des lunettes de soleil et des vêtements longs de protection."}
                        {uvIndex >= 8 && "Risque de brûlure solaire très élevé. Recherchez l'ombre entre 11h et 16h, utilisez de la crème indice 50+ et portez un chapeau de protection."}
                        {uvIndex >= 6 && "Risque de brûlure élevé. Protection nécessaire : portez du chapeau de protection, des lunettes de soleil de catégorie active et de la crème de très haute protection."}
                        {uvIndex >= 3 && "Protection conseillée pour toute exposition prolongée au soleil. Appliquez de la crème solaire et couvrez-vous la tête."}
                        {uvIndex <= 2 && "Le rayonnement solaire présente peu de risques. L'exposition normale ne requiert pas de mesure particulière."}
                      </p>
                    </div>
                  )}

                  {/* Grid of the 4 key categories */}
                  <div className="space-y-3">
                    {vigilance.categories.map((cat, i) => {
                      const catColor = getLevelStyle(cat.level);
                      return (
                        <div key={i} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-white">{cat.name}</span>
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${catColor.badge}`}>
                              {catColor.label}
                            </span>
                          </div>
                          <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                            {cat.description}
                          </p>
                          {cat.level !== 'green' && (
                            <div className="mt-2.5 bg-black/20 p-2.5 rounded-xl border border-white/10 text-[11px] text-white/80 leading-relaxed">
                              <strong className="text-white">Conseil Météo-France : </strong>
                              {cat.advice}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FIXED INTERNAL FOOTER */}
                <div className="px-5 py-4 border-t border-white/15 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shrink-0">
                  <span className="text-[9px] text-white/50 select-none">
                    Modèles de prévisions numériques Météo-France (AROME).
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Fermer
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
