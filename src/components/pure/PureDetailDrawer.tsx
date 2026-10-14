import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PureDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  cityName: string;
}

/**
 * PureDetailDrawer: Feuille de verre translucide qui glisse par-dessus CelestialSky
 * sans éteindre la couleur du ciel en arrière-plan.
 */
export default function PureDetailDrawer({
  isOpen,
  onClose,
  children,
  cityName,
}: PureDetailDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Voile léger qui laisse respirer la couleur du ciel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/25 backdrop-blur-sm cursor-pointer"
          />

          {/* Surface du tiroir : verre givré neutre et aérien */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative z-10 w-full max-w-md mx-auto bg-black/30 backdrop-blur-2xl border-t border-white/25 rounded-t-[36px] max-h-[88dvh] flex flex-col shadow-[0_-12px_40px_rgba(0,0,0,0.25)] overflow-hidden text-white"
          >
            {/* Barre de préhension (Grab handle) */}
            <div 
              onClick={onClose}
              className="w-full pt-3 pb-1.5 flex flex-col items-center cursor-pointer shrink-0"
            >
              <div className="w-10 h-1 bg-white/35 rounded-full" />
            </div>

            {/* En-tête minimaliste aligné sur la typographie de la page 1 */}
            <div className="px-6 pb-3 pt-1 flex items-center justify-between border-b border-white/15 shrink-0">
              <div className="flex items-baseline gap-2.5">
                <h2 className="text-lg font-medium text-white tracking-tight">
                  {cityName}
                </h2>
                <span className="font-display italic text-base text-white/75">
                  7 jours &amp; détails
                </span>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenu scrollable fluide */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3.5 overscroll-contain pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
