import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Download, Check, AlertCircle, Share2 } from 'lucide-react';
import { shareImageNative } from '../utils/shareUtils';

interface SharePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  isGenerating: boolean;
  title: string;
  copyStatus: 'copied' | 'downloaded' | 'error' | null;
  onCopy: () => void;
  onDownload: () => void;
}

export default function SharePreviewModal({
  isOpen,
  onClose,
  imageSrc,
  isGenerating,
  title,
  copyStatus,
  onCopy,
  onDownload
}: SharePreviewModalProps) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [nativeShareStatus, setNativeShareStatus] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      setCanNativeShare(true);
    }
  }, []);

  const handleNativeShare = async () => {
    if (!imageSrc) return;
    const filename = `Meteo_Semaine_${Date.now()}.png`;
    const success = await shareImageNative(imageSrc, filename);
    if (success) {
      setNativeShareStatus(true);
      setTimeout(() => setNativeShareStatus(null), 2500);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div id="share-modal-root" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blurring the rest of the application */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Content Container */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/15">
              <h3 className="text-sm font-bold text-sky-200 tracking-wider uppercase">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex flex-col items-center">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-sky-400/20 border-t-sky-400 animate-spin" />
                  </div>
                  <p className="text-white/80 text-xs font-semibold tracking-wide uppercase animate-pulse">
                    Génération de l'image en cours...
                  </p>
                </div>
              ) : imageSrc ? (
                <>
                  {/* Real Image loaded for touch/click interaction */}
                  <div className="relative group w-full rounded-2xl overflow-hidden border border-white/15 shadow-lg bg-black/40">
                    <img
                      src={imageSrc}
                      alt="Aperçu météo"
                      className="w-full h-auto object-contain select-none"
                    />
                    
                    {/* Visual tutorial overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none p-4">
                      <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-3 text-center max-w-xs shadow-xl scale-90 group-hover:scale-100 transition-transform duration-300">
                        <p className="text-[11px] text-white/90 leading-relaxed font-medium">
                          💡 <strong>Clic droit</strong> ou <strong>appui long</strong> sur l'image pour la copier ou l'enregistrer directement !
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Informative Tip Banner */}
                  <div className="w-full bg-sky-500/10 border border-sky-500/20 rounded-2xl p-3.5 flex items-start gap-2.5 text-left">
                    <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 animate-fade-in">
                      <h4 className="text-xs font-bold text-sky-200">Conseil de partage</h4>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        Si la copie automatique ne fonctionne pas, vous pouvez toujours <strong>faire un clic droit</strong> ou <strong>un appui long</strong> sur l'image ci-dessus pour la copier ou l'enregistrer, ou cliquer sur <strong>« Télécharger »</strong> ci-dessous !
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-rose-300 text-xs font-bold">
                  ⚠️ Échec de la génération de l'image. Veuillez réessayer.
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            {imageSrc && !isGenerating && (
              <div className="px-6 py-4 border-t border-white/15 bg-slate-950 flex flex-col gap-3">
                <div className="flex flex-row gap-3">
                  <button
                    onClick={onCopy}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-md ${
                      copyStatus === 'copied'
                        ? 'bg-emerald-600 text-white'
                        : copyStatus === 'error'
                        ? 'bg-amber-600 hover:bg-amber-500 text-white animate-shake'
                        : 'bg-sky-500 hover:bg-sky-400 text-white'
                    }`}
                    type="button"
                  >
                    {copyStatus === 'copied' ? (
                      <>
                        <Check className="w-4 h-4 text-white animate-bounce" />
                        <span>Copié dans le presse-papiers !</span>
                      </>
                    ) : copyStatus === 'error' ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-white" />
                        <span>Copie bloquée (téléchargez à la place)</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-white" />
                        <span>Copier l'image</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onDownload}
                    className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                    title="Télécharger le fichier PNG"
                    type="button"
                  >
                    {copyStatus === 'downloaded' ? (
                      <>
                        <Check className="w-4 h-4 text-green-300 animate-pulse" />
                        <span>Téléchargé !</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-white" />
                        <span>Télécharger</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Mobile Native Share option */}
                {canNativeShare && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                    type="button"
                  >
                    {nativeShareStatus ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Partagé !</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-sky-200" />
                        <span>Partager via votre mobile</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
