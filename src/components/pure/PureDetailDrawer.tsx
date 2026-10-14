import React, { useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PureDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  cityName: string;
}

/**
 * PureDetailDrawer: A fluid bottom-sheet / modal that slides up
 * when the user taps the arrow button on the minimalist hero screen.
 * Displays all comprehensive Météo-France cards and stats.
 */
export default function PureDetailDrawer({
  isOpen,
  onClose,
  children,
  cityName,
}: PureDetailDrawerProps) {
  // Prevent background scroll when drawer is open
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
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
          />

          {/* Drawer content surface */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-lg mx-auto bg-slate-900/90 backdrop-blur-2xl border-t border-white/20 rounded-t-[32px] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Grab handle bar */}
            <div 
              onClick={onClose}
              className="w-full pt-3 pb-2 flex flex-col items-center cursor-pointer shrink-0"
            >
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Header with Title and Close button */}
            <div className="px-6 pb-3 pt-1 flex items-center justify-between border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  Détails météo
                </h2>
                <p className="text-xs text-white/60 font-medium">
                  {cityName}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/80 transition-all cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable details list */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
