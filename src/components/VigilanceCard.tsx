import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { VigilanceStatus } from '../types';
import { ShieldAlert, X, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLevelStyle } from '../utils/levelStyles';

interface VigilanceCardProps {
  vigilance: VigilanceStatus;
  uvIndex?: number;
}

export default function VigilanceCard({ vigilance, uvIndex }: VigilanceCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeColor = getLevelStyle(vigilance.globalLevel);

  return (
    <>
      <div 
        id="vigilance-widget"
        onClick={() => setIsOpen(true)}
        className="glass-premium rounded-3xl p-4 flex flex-col justify-between shadow-lg cursor-pointer transition-all duration-300 hover:brightness-105 hover:scale-[1.02] active:scale-95 h-40 relative overflow-hidden"
      >
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
              {vigilance.globalLevel !== 'green' && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeColor.pingDot}`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${activeColor.dot}`}></span>
            </span>
            <span className={activeColor.accentText}>
              {activeColor.label}
            </span>
          </div>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <motion.div 
                 initial={{ scale: 0.95, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.95, opacity: 0 }}
                 transition={{ type: 'spring', duration: 0.35 }}
                 onClick={(e) => e.stopPropagation()}
                 className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden text-slate-800 cursor-default flex flex-col max-h-[80vh]"
              >
                {/* FIXED INTERNAL HEADER */}
                <div className="flex justify-between items-center border-b border-slate-200 px-5 py-4 shrink-0 bg-white/40">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`w-5 h-5 ${vigilance.globalLevel !== 'green' ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
                    <h3 className="text-base font-bold text-slate-900">Détails Vigilance</h3>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* SCROLLABLE BODY CONTENT */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${activeColor.lightBlock}`}>
                    <div className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${activeColor.dot}`} />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Vigilance : niveau {activeColor.label}</h4>
                      <p className="text-xs leading-relaxed mt-1 text-slate-700">
                        {vigilance.globalLevel === 'red' && "Alerte maximale. Des phénomènes météorologiques exceptionnels de très forte intensité sont prévus."}
                        {vigilance.globalLevel === 'orange' && "Soyez très vigilants. Des phénomènes météorologiques dangereux sont prévus."}
                        {vigilance.globalLevel === 'yellow' && "Soyez attentifs si vous pratiquez des activités sensibles au risque météorologique."}
                        {vigilance.globalLevel === 'green' && "Aucune vigilance particulière requise pour les prochaines 24 heures."}
                      </p>
                    </div>
                  </div>

                  {uvIndex !== undefined && (
                    <div className="p-4 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/70 to-orange-50/40 text-slate-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-amber-500 fill-amber-500/10 animate-spin" style={{ animationDuration: '20s' }} />
                          <span className="font-bold text-sm text-slate-900">Rayonnement UV : {uvIndex} / 11+</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          uvIndex >= 11 ? 'bg-violet-100 text-violet-700 border-violet-200' :
                          uvIndex >= 8 ? 'bg-rose-100 text-rose-700 border-rose-200' :
                          uvIndex >= 6 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          uvIndex >= 3 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {uvIndex >= 11 ? 'EXTRÊME' :
                           uvIndex >= 8 ? 'TRÈS ÉLEVÉ' :
                           uvIndex >= 6 ? 'ÉLEVÉ' :
                           uvIndex >= 3 ? 'MODÉRÉ' : 'FAIBLE'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
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
                        <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all text-slate-800">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-800">{cat.name}</span>
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${catColor.lightBlock}`}>
                              {catColor.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            {cat.description}
                          </p>
                          {cat.level !== 'green' && (
                            <div className="mt-2.5 bg-white p-2.5 rounded-xl border border-slate-200/50 text-[11px] text-slate-700 leading-relaxed">
                              <strong className="text-slate-800">Conseil Météo-France : </strong> 
                              {cat.advice}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FIXED INTERNAL FOOTER */}
                <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shrink-0 bg-slate-50">
                  <span className="text-[9px] text-slate-400 select-none">
                    Modèles de prévisions numériques Météo-France (AROME).
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
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
