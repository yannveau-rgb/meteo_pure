import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Volume2, VolumeX, Sparkles, Heart, Briefcase, Zap, Lightbulb, Clover, Compass } from 'lucide-react';
import { MorningBriefView } from '../hooks/useMorningBrief';

interface HoroscopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  brief: MorningBriefView | null;
  hasBirthDate: boolean;
  onOpenSettings: () => void;
  cityName?: string;
  speech: {
    isSupported: boolean;
    isSpeaking: boolean;
    speak: (text: string) => void;
    stop: () => void;
  };
}

const ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Feu: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
  Terre: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  Air: { bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/30' },
  Eau: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' }
};

export const HoroscopeModal: React.FC<HoroscopeModalProps> = ({
  isOpen,
  onClose,
  loading,
  brief,
  hasBirthDate,
  onOpenSettings,
  cityName,
  speech
}) => {
  if (!isOpen) return null;

  const horoscope = brief?.horoscope;
  const elementStyle = horoscope?.element
    ? ELEMENT_COLORS[horoscope.element] || ELEMENT_COLORS.Air
    : ELEMENT_COLORS.Air;

  const fullSpeechText = horoscope
    ? `Horoscope du jour pour le ${horoscope.sign}. Climat astral : ${horoscope.general}. Amour : ${horoscope.love}. Travail : ${horoscope.career}. Vitalité : ${horoscope.vitality}. Conseil du jour : ${horoscope.advice}.`
    : brief ? `${brief.title}. ${brief.anchor}. ${brief.punchline}` : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#06102b]/90 backdrop-blur-md p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="glass-premium p-5 sm:p-7 rounded-[32px] border border-white/20 shadow-2xl flex flex-col w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start w-full pb-3 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400/20 to-sky-400/20 border border-white/15 flex items-center justify-center text-2xl shadow-inner">
                {horoscope?.symbol || '✨'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-1.5">
                    Horoscope du Jour
                  </h2>
                  {horoscope?.sign && (
                    <span className="text-[11px] font-bold text-amber-300">
                      • {horoscope.sign}
                    </span>
                  )}
                  {brief?.ai && (
                    <span className="text-[8px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                      IA
                    </span>
                  )}
                </div>
                {horoscope && (
                  <p className="text-[10px] text-white/60 mt-0.5 flex items-center gap-1.5">
                    <span>{horoscope.period}</span>
                    <span>•</span>
                    <span className={`px-1.5 py-0.2 rounded font-semibold ${elementStyle.text}`}>
                      Élément {horoscope.element}
                    </span>
                    <span>•</span>
                    <span>{horoscope.planet}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {speech.isSupported && horoscope && (
                <button
                  onClick={() => {
                    if (speech.isSpeaking) {
                      speech.stop();
                    } else {
                      speech.speak(fullSpeechText);
                    }
                  }}
                  aria-label={speech.isSpeaking ? 'Arrêter la lecture' : 'Écouter l\'horoscope'}
                  title={speech.isSpeaking ? 'Arrêter la lecture' : 'Écouter l\'horoscope'}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all active:scale-95 ${
                    speech.isSpeaking
                      ? 'bg-amber-500/25 border-amber-400/50 text-amber-300 animate-pulse'
                      : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {speech.isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              <button
                onClick={onClose}
                aria-label="Fermer"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors focus:outline-none"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="mt-4 flex flex-col gap-4 text-white/90">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-300" />
                <p className="text-xs text-white/70 animate-pulse text-center">
                  Consultation des aspects astraux pour votre signe...
                </p>
              </div>
            ) : !hasBirthDate ? (
              <div className="flex flex-col items-center gap-4 text-center py-8">
                <span className="text-4xl animate-bounce">✨</span>
                <p className="text-xs sm:text-sm text-white/80 max-w-xs leading-relaxed">
                  Pour obtenir votre horoscope du jour personnalisé, renseignez votre date de naissance dans les paramètres.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="mt-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all shadow-lg active:scale-95 text-white"
                >
                  Ouvrir les Réglages
                </button>
              </div>
            ) : horoscope ? (
              <>
                {/* General Astral Climate */}
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-1.5 text-amber-300 font-bold text-xs uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5" /> Climat Astral du Jour
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-white/90 leading-relaxed">
                    {horoscope.general}
                  </p>
                </div>

                {/* 3 Pillars: Love, Career, Vitality */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[11px] uppercase tracking-wide">
                      <Heart className="w-3.5 h-3.5" /> Amour
                    </div>
                    <p className="text-[11px] text-white/80 leading-snug">
                      {horoscope.love}
                    </p>
                  </div>

                  <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-2xl flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sky-300 font-bold text-[11px] uppercase tracking-wide">
                      <Briefcase className="w-3.5 h-3.5" /> Travail
                    </div>
                    <p className="text-[11px] text-white/80 leading-snug">
                      {horoscope.career}
                    </p>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px] uppercase tracking-wide">
                      <Zap className="w-3.5 h-3.5" /> Vitalité
                    </div>
                    <p className="text-[11px] text-white/80 leading-snug">
                      {horoscope.vitality}
                    </p>
                  </div>
                </div>

                {/* Advice of the Day */}
                <div className="bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-sky-500/15 border border-amber-400/30 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1 text-amber-200 font-bold text-[11px] uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-300" /> Conseil du Jour
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-white font-medium italic leading-relaxed">
                    « {horoscope.advice} »
                  </p>
                </div>

                {/* Footer Highlights (Lucky Number, Compatibility, Weather Context) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[10px] text-white/70">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      <Clover className="w-3 h-3 text-emerald-400" />
                      Numéro chance : <strong className="text-white ml-0.5">{horoscope.luckyNumber}</strong>
                    </span>
                    <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      <Compass className="w-3 h-3 text-sky-400" />
                      Signe allié : <strong className="text-white ml-0.5">{horoscope.compatibility}</strong>
                    </span>
                  </div>

                  {brief?.anchor && (
                    <span className="text-[9.5px] text-white/50 italic truncate max-w-[200px]" title={brief.anchor}>
                      🌤️ {cityName ? `${cityName} : ` : ''}{brief.anchor}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-center italic opacity-70 py-6">
                Données astrologiques indisponibles pour le moment.
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HoroscopeModal;
