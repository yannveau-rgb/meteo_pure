import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, Apple, Check, Globe, Share, Plus, HelpCircle, ArrowRight } from 'lucide-react';

interface PwaInstallWizardProps {
  deferredPrompt: any;
  isAppInstalled: boolean;
  onInstallTrigger: () => void;
}

export default function PwaInstallWizard({
  deferredPrompt,
  isAppInstalled,
  onInstallTrigger,
}: PwaInstallWizardProps) {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('android');
  const [showGuide, setShowGuide] = useState(false);

  // Automatically detect user environment
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);

    if (isIos) {
      setPlatform('ios');
    } else if (isMobile) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  return (
    <div id="pwa-install-container" className="glass-premium rounded-3xl p-5 shadow-lg space-y-4">
      <div className="flex justify-between items-start pb-2 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-300">
              Installation Mobile & Raccourci
            </h4>
          </div>
          <p className="text-[10px] text-white/60">Utilisez Météo Pure comme une vraie application native</p>
        </div>
        <span className="text-[9px] bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0">
          PRO-PWA
        </span>
      </div>

      {isAppInstalled ? (
        <div className="bg-emerald-500/10 border border-emerald-500/35 p-3.5 rounded-2xl flex items-center gap-3 text-emerald-100">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Check className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h5 className="text-[11px] font-bold">Météo Pure est déjà installée</h5>
            <p className="text-[9.5px] text-emerald-200/70 mt-0.5 leading-tight">
              L'application est lancée en mode plein écran natif de manière optimale, merci !
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          <p className="text-[11.5px] text-white/85 leading-relaxed">
            Pour installer l'application sur votre écran d'accueil sans passer par Google Play ou l'App Store, suivez ce guide interactif adapté à votre téléphone.
          </p>

          {/* Platform selector */}
          <div className="grid grid-cols-3 gap-1.5 bg-black/25 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setPlatform('android')}
              className={`py-1.5 rounded-lg text-[9.5px] font-bold flex items-center justify-center gap-1 transition-all outline-none cursor-pointer ${
                platform === 'android' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'
              }`}
              type="button"
            >
              <span>Android / Chrome</span>
            </button>
            <button
              onClick={() => setPlatform('ios')}
              className={`py-1.5 rounded-lg text-[9.5px] font-bold flex items-center justify-center gap-1 transition-all outline-none cursor-pointer ${
                platform === 'ios' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'
              }`}
              type="button"
            >
              <Apple className="w-3 h-3" />
              <span>Apple / iOS</span>
            </button>
            <button
              onClick={() => setPlatform('desktop')}
              className={`py-1.5 rounded-lg text-[9.5px] font-bold flex items-center justify-center gap-1 transition-all outline-none cursor-pointer ${
                platform === 'desktop' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'
              }`}
              type="button"
            >
              <Globe className="w-3 h-3" />
              <span>Ordinateur</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {platform === 'android' && (
              <motion.div
                key="android"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3 pt-1 text-slate-100"
              >
                {deferredPrompt ? (
                  <div className="bg-sky-500/10 border border-sky-400/30 p-3.5 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4 text-sky-400" />
                      </div>
                      <div>
                        <h5 className="text-[11.5px] font-bold text-white">Prêt pour l'installation rapide</h5>
                        <p className="text-[10px] text-white/70 leading-snug mt-0.5">
                          Votre navigateur Android Chrome/Samsung est compatible avec le lanceur automatique.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onInstallTrigger}
                      className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-[11px] transition-all hover:scale-101 active:scale-99 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      type="button"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Installer Météo Pure maintenant
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-[11px] space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Installation manuelle sur Android :</span>
                    </div>
                    <ul className="list-decimal list-inside space-y-1.5 text-white/80 pl-1 text-[10px] leading-relaxed">
                      <li>
                        Appuyez sur les <strong className="text-white">trois petits points (menu)</strong> en haut à droite de Google Chrome.
                      </li>
                      <li>
                        Sélectionnez <strong className="text-white">"Ajouter à l'écran d'accueil"</strong> ou <strong className="text-white">"Installer l'application"</strong>.
                      </li>
                      <li>
                        Validez le pop-up : l'icône <strong className="text-emerald-300">Météo Pure Pro</strong> apparaîtra immédiatement sur votre téléphone.
                      </li>
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {platform === 'ios' && (
              <motion.div
                key="ios"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3 pt-1 text-slate-100"
              >
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 text-[11px] space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-sky-300">
                    <Apple className="w-3.5 h-3.5 text-white" />
                    <span>Instructions pour iPhone / iPad / Safari :</span>
                  </div>
                  
                  <div className="space-y-3 text-white/80 pl-1 text-[10px] leading-relaxed">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        1
                      </div>
                      <p>
                        Ouvrez impérativement le site dans le navigateur <strong className="text-white">Safari</strong> d'Apple (les vues intégrées comme Gmail ou Facebook bloquent l'installation).
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="flex items-center gap-1 flex-wrap">
                          Appuyez sur le bouton de <strong className="text-white flex items-center gap-0.5">partage d'Apple <Share className="w-3.5 h-3.5 text-sky-300 inline" /> (Share)</strong> situé en bas au centre de votre écran.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        3
                      </div>
                      <p>
                        Faites défiler les options vers le bas et appuyez sur <strong className="text-white flex items-center gap-1 italic"><Plus className="w-3.5 h-3.5 inline text-emerald-300" /> Sur l'écran d'accueil (Add to Home Screen)</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        4
                      </div>
                      <p>
                        Appuyez ensuite sur <strong className="text-white">"Ajouter"</strong> en haut à droite. L'application aura ses propres accès isolés et fonctionnera sans barres de navigation URL !
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {platform === 'desktop' && (
              <motion.div
                key="desktop"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3 pt-1 text-slate-100"
              >
                {deferredPrompt ? (
                  <div className="bg-sky-500/10 border border-sky-400/30 p-3.5 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4 text-sky-400" />
                      </div>
                      <div>
                        <h5 className="text-[11.5px] font-bold text-white">Chrome / Edge Prêt</h5>
                        <p className="text-[10px] text-white/70 mt-0.5">
                          Un raccourci natif pour Windows ou macOS est prêt à être créé.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onInstallTrigger}
                      className="w-full py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-[11px] transition-all hover:scale-101 active:scale-99 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      type="button"
                    >
                      Installer sur l'ordinateur
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-[11px] space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Raccourci de Bureau universel :</span>
                    </div>
                    <p className="text-[10px] text-white/80 leading-relaxed">
                      Dans votre navigateur (Google Chrome, Brave ou Microsoft Edge), cliquez sur l'icône de <strong className="text-white">téléchargement / écran pliable</strong> située tout à droite dans la <strong className="text-white">barre d'adresse d'URL</strong> à côté du bouton favoris.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}
    </div>
  );
}
