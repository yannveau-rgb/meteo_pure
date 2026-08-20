import { motion, AnimatePresence } from 'motion/react';
import { getNext7DaysMoonPhases } from '../../utils/weatherUtils';
import { useModalA11y } from '../../hooks/useModalA11y';

interface MoonPhasesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MoonPhasesModal({ isOpen, onClose }: MoonPhasesModalProps) {
  const modalRef = useModalA11y(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#06102b]/90 backdrop-blur-md px-6 cursor-pointer"
          onClick={onClose}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="moon-modal-title"
            tabIndex={-1}
            className="glass-premium p-6 rounded-[32px] border border-white/20 shadow-2xl flex flex-col items-center w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center w-full mb-6 relative">
              <h2 id="moon-modal-title" className="text-xl font-bold text-white tracking-wide">Cycles Lunaires</h2>
              <button onClick={onClose} aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/60">
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {getNext7DaysMoonPhases().map((moon, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{moon.emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-white/50 font-bold uppercase tracking-wider">
                        {index === 0 ? "Aujourd'hui" : index === 1 ? "Demain" : moon.date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                      </span>
                      <span className="text-sm text-white font-medium capitalize">{moon.name}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/60 font-mono">
                    {Math.round(moon.phase * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
