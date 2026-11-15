import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Volume2, VolumeX, Sparkles, Settings } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { MorningBriefView } from '../../hooks/useMorningBrief';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface MorningBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName?: string;
  loadingBrief: boolean;
  aiBrief: MorningBriefView | null;
  onOpenSettings: () => void;
  briefSpeech: ReturnType<typeof useSpeechSynthesis>;
}

/**
 * Morning brief: two layers only.
 * 1. Facts (temperature, rain timing, what to bring) — computed in code.
 * 2. Punchline — the only part the model writes.
 * No astrology, no birth date: it is a weather brief for everyone.
 */
export default function MorningBriefModal({
  isOpen,
  onClose,
  cityName,
  loadingBrief,
  aiBrief,
  onOpenSettings,
  briefSpeech,
}: MorningBriefModalProps) {
  const modalRef = useModalA11y(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#06102b]/95 backdrop-blur-md px-5 cursor-pointer"
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="morning-brief-modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="card w-full max-w-sm relative overflow-hidden focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-[18px] h-[18px] text-amber-300" />
                </div>
                <div>
                  <h2 id="morning-brief-modal-title" className="kicker text-amber-200">
                    Brief matinal
                  </h2>
                  <p className="meta mt-0.5">{cityName || 'Votre commune'}</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Fermer le brief" className="icon-btn icon-btn--sm">
                <span aria-hidden="true" className="text-lg leading-none">&times;</span>
              </button>
            </div>

            <div className="mt-4">
              {loadingBrief ? (
                <div className="flex flex-col items-center justify-center py-9 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-300" />
                  <p className="meta text-center animate-pulse">
                    Lecture de la météo de {cityName || 'votre ville'}…
                  </p>
                </div>
              ) : aiBrief ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="kicker text-sky-200 flex items-center gap-2">
                      {aiBrief.title}
                      {aiBrief.ai !== false && (
                        <span className="pill !py-0 !bg-sky-500/20 !border-sky-400/40 !text-sky-200">
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
                        aria-label={briefSpeech.isSpeaking ? 'Arrêter la lecture' : 'Écouter le brief'}
                        title={briefSpeech.isSpeaking ? 'Arrêter la lecture' : 'Écouter le brief'}
                        className={`icon-btn icon-btn--sm ${
                          briefSpeech.isSpeaking
                            ? '!bg-sky-500/30 !border-sky-400/50 !text-sky-200 animate-pulse'
                            : ''
                        }`}
                      >
                        {briefSpeech.isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Layer 1 — the facts. Readable at a glance, half-awake. */}
                  <p className="tile text-[15px] font-medium text-white leading-snug">
                    {aiBrief.anchor.split(' · ').map((seg, i, arr) => (
                      <span key={i}>
                        {seg}
                        {i < arr.length - 1 && <span className="text-white/50 mx-1.5">·</span>}
                      </span>
                    ))}
                  </p>

                  {/* Layer 2 — the joke, visibly secondary. */}
                  <p className="text-[13px] italic text-white/70 leading-relaxed border-l-2 border-amber-400/50 pl-3">
                    {aiBrief.punchline}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <p className="meta">Aucune donnée météo disponible pour le brief.</p>
                  <button onClick={onOpenSettings} className="pill !py-2 !px-4 hover:bg-white/20">
                    <Settings className="w-3.5 h-3.5" />
                    Régler le brief matinal
                  </button>
                </div>
              )}
            </div>

            {!loadingBrief && aiBrief && (
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                <p className="text-[11px] text-white/45 leading-snug">
                  Faits calculés localement, punchline générée par IA.
                </p>
                <button
                  onClick={onOpenSettings}
                  className="shrink-0 text-[11px] font-bold text-sky-300 hover:text-sky-200 transition-colors"
                >
                  Régler
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
