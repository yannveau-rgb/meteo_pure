import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { MorningBriefView } from '../../hooks/useMorningBrief';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface MorningBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName?: string;
  loadingBrief: boolean;
  aiBrief: MorningBriefView | null;
  hasBirthDate: boolean;
  onOpenSettings: () => void;
  briefSpeech: ReturnType<typeof useSpeechSynthesis>;
}

export default function MorningBriefModal({
  isOpen,
  onClose,
  cityName,
  loadingBrief,
  aiBrief,
  hasBirthDate,
  onOpenSettings,
  briefSpeech,
}: MorningBriefModalProps) {
  const modalRef = useModalA11y(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#06102b]/95 backdrop-blur-md px-6 cursor-pointer"
          onClick={onClose}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="morning-brief-modal-title"
            tabIndex={-1}
            className="glass-premium p-6 rounded-[32px] border border-white/20 shadow-2xl flex flex-col items-center w-full max-w-sm relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform rotate-12 scale-150">
              <span className="text-6xl">🔮</span>
            </div>
            <div className="flex justify-between items-center w-full mb-6 z-10 relative">
              <h2 id="morning-brief-modal-title" className="text-lg font-bold text-white tracking-wide">Brief Matinal</h2>
              <button onClick={onClose} aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/60">
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-3 w-full text-white/90 z-10 relative">
              {loadingBrief ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
                  <p className="text-xs text-white/70 animate-pulse text-center">
                    L'IA interroge les constellations et la météo de {cityName || "ta ville"}...
                  </p>
                </div>
              ) : aiBrief ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sky-400 text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
                      {aiBrief.title}
                      {aiBrief.ai !== false && (
                        <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-normal uppercase">
                          IA
                        </span>
                      )}
                    </h3>
                    {briefSpeech.isSupported && (
                      <button
                        onClick={() => {
                          if (briefSpeech.isSpeaking) {
                            briefSpeech.stop();
                          } else {
                            // Pause between the two layers so the spoken
                            // version keeps the same fact-then-joke rhythm.
                            briefSpeech.speak(`${aiBrief.anchor}. ${aiBrief.punchline}`);
                          }
                        }}
                        aria-label={briefSpeech.isSpeaking ? "Arrêter la lecture" : "Écouter le brief"}
                        title={briefSpeech.isSpeaking ? "Arrêter la lecture" : "Écouter le brief"}
                        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all active:scale-95 ${
                          briefSpeech.isSpeaking
                            ? 'bg-sky-500/25 border-sky-400/50 text-sky-300 animate-pulse'
                            : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {briefSpeech.isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Layer 1 — the facts. Readable at a glance, half-awake. */}
                  <p className="text-[15px] font-medium text-white leading-snug">
                    {aiBrief.anchor.split(' · ').map((seg, i, arr) => (
                      <span key={i}>
                        {seg}
                        {i < arr.length - 1 && <span className="text-white/60 mx-1.5">·</span>}
                      </span>
                    ))}
                  </p>

                  {/* Layer 2 — the joke, visibly secondary. */}
                  <p className="text-[13px] italic text-white/70 leading-relaxed border-l-2 border-sky-400/40 pl-3">
                    {aiBrief.punchline}
                  </p>
                </>
              ) : !hasBirthDate ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <span className="text-4xl animate-pulse">🤫</span>
                  <p className="italic opacity-80 text-sm">
                    Pour lire ton astro-brief quotidien personnalisé par l'IA, renseigne d'abord ta date de naissance.
                  </p>
                  <button
                    onClick={onOpenSettings}
                    className="mt-2 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all shadow-lg active:scale-95"
                  >
                    Ouvrir les Réglages
                  </button>
                </div>
              ) : (
                <p className="text-center italic opacity-70">Données météo manquantes pour le brief.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
