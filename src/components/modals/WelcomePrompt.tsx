import { motion, AnimatePresence } from 'motion/react';
import { MapPin } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';

interface WelcomePromptProps {
  isOpen: boolean;
  onDismiss: () => void;
  onUseLocation: () => void;
}

// No backdrop-click or close-X by design: the prompt forces a choice
// between the two buttons below, so Escape-to-close is disabled too.
export default function WelcomePrompt({ isOpen, onDismiss, onUseLocation }: WelcomePromptProps) {
  const modalRef = useModalA11y(isOpen, onDismiss, { closeOnEscape: false });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#06102b]/90 backdrop-blur-md px-6 text-center"
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-prompt-title"
            tabIndex={-1}
            className="glass-premium p-8 rounded-[36px] border border-white/20 shadow-2xl flex flex-col items-center max-w-sm w-full mx-auto relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-400/60"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/20 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full -translate-x-12 translate-y-12"></div>

            <div className="bg-white/10 p-5 rounded-full mb-6 z-10 border border-white/10">
              <MapPin className="w-10 h-10 text-sky-300" />
            </div>

            <h2 id="welcome-prompt-title" className="text-2xl font-bold text-white mb-3 z-10">Météo Locale</h2>
            <p className="text-white/70 text-sm font-medium mb-8 z-10 leading-relaxed">
              Souhaitez-vous utiliser votre position actuelle pour afficher immédiatement la météo de votre ville ?
            </p>

            <div className="flex flex-col gap-3 w-full z-10">
              <button
                onClick={onUseLocation}
                className="w-full bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] active:scale-95 flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                Utiliser ma position
              </button>
              <button
                onClick={onDismiss}
                className="w-full bg-white/10 hover:bg-white/15 text-white/90 font-semibold py-3.5 px-6 rounded-2xl transition-all border border-white/10 active:scale-95"
              >
                Chercher manuellement
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
