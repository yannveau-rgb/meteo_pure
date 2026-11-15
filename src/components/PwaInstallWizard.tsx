import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, Apple, Check, Globe, Share, Plus, HelpCircle } from 'lucide-react';

interface PwaInstallWizardProps {
  deferredPrompt: any;
  isAppInstalled: boolean;
  onInstallTrigger: () => void;
}

type Platform = 'ios' | 'android' | 'desktop';

export default function PwaInstallWizard({
  deferredPrompt,
  isAppInstalled,
  onInstallTrigger,
}: PwaInstallWizardProps) {
  const [platform, setPlatform] = useState<Platform>('android');

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

  const platforms: Array<{ id: Platform; label: string; Icon?: React.ComponentType<{ className?: string }> }> = [
    { id: 'android', label: 'Android' },
    { id: 'ios', label: 'iOS', Icon: Apple },
    { id: 'desktop', label: 'Ordinateur', Icon: Globe },
  ];

  return (
    <div id="pwa-install-container" className="card space-y-4">
      <div className="flex justify-between items-start gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-[18px] h-[18px] text-emerald-300" />
          </div>
          <div>
            <h4 className="kicker text-emerald-200">Installer l'application</h4>
            <p className="meta mt-0.5">Comme une vraie application native, sans store.</p>
          </div>
        </div>
        <span className="pill !bg-emerald-500/25 !border-emerald-500/40 !text-emerald-200 uppercase shrink-0">
          PWA
        </span>
      </div>

      {isAppInstalled ? (
        <div className="tile !bg-emerald-500/10 !border-emerald-500/35 flex items-center gap-3 text-emerald-100">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Check className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h5 className="text-[12px] font-bold">Météo Pure est déjà installée</h5>
            <p className="text-[11px] text-emerald-200/70 mt-0.5 leading-snug">
              L'application tourne en mode plein écran natif.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          <p className="text-[12px] text-white/85 leading-relaxed">
            Ajoutez Météo Pure à votre écran d'accueil sans passer par Google Play ou l'App Store. Choisissez votre appareil.
          </p>

          {/* Platform selector */}
          <div className="segmented" role="group" aria-label="Choisir la plateforme">
            {platforms.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setPlatform(id)}
                data-active={platform === id}
                aria-pressed={platform === id}
                className="segmented-item"
                type="button"
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{label}</span>
              </button>
            ))}
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
                  <div className="tile !bg-sky-500/10 !border-sky-400/30 flex flex-col justify-between gap-3">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4 text-sky-400" />
                      </div>
                      <div>
                        <h5 className="text-[12px] font-bold text-white">Prêt pour l'installation rapide</h5>
                        <p className="text-[11px] text-white/70 leading-snug mt-0.5">
                          Votre navigateur Android est compatible avec le lanceur automatique.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onInstallTrigger}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-[12px] transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      type="button"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Installer maintenant
                    </button>
                  </div>
                ) : (
                  <div className="tile space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[12px]">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Installation manuelle sur Android</span>
                    </div>
                    <ul className="list-decimal list-inside space-y-1.5 text-white/80 pl-1 text-[11px] leading-relaxed">
                      <li>
                        Appuyez sur les <strong className="text-white">trois petits points</strong> en haut à droite de Chrome.
                      </li>
                      <li>
                        Sélectionnez <strong className="text-white">« Ajouter à l'écran d'accueil »</strong> ou <strong className="text-white">« Installer l'application »</strong>.
                      </li>
                      <li>
                        Validez : l'icône <strong className="text-emerald-300">Météo Pure</strong> apparaît sur votre téléphone.
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
                <div className="tile space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-sky-300 text-[12px]">
                    <Apple className="w-3.5 h-3.5 text-white" />
                    <span>Instructions pour iPhone / iPad / Safari</span>
                  </div>
                  
                  <div className="space-y-3 text-white/80 pl-1 text-[11px] leading-relaxed">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        1
                      </div>
                      <p>
                        Ouvrez le site dans le navigateur <strong className="text-white">Safari</strong> d'Apple (les vues intégrées comme Gmail ou Facebook bloquent l'installation).
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="flex items-center gap-1 flex-wrap">
                          Appuyez sur le bouton de <strong className="text-white flex items-center gap-0.5">partage <Share className="w-3.5 h-3.5 text-sky-300 inline" /></strong> en bas au centre de l'écran.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        3
                      </div>
                      <p>
                        Faites défiler puis appuyez sur <strong className="text-white flex items-center gap-1 italic"><Plus className="w-3.5 h-3.5 inline text-emerald-300" /> Sur l'écran d'accueil</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        4
                      </div>
                      <p>
                        Appuyez sur <strong className="text-white">« Ajouter »</strong> en haut à droite. L'application fonctionnera sans barres de navigation.
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
                  <div className="tile !bg-sky-500/10 !border-sky-400/30 flex flex-col justify-between gap-3">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4 text-sky-400" />
                      </div>
                      <div>
                        <h5 className="text-[12px] font-bold text-white">Chrome / Edge prêt</h5>
                        <p className="text-[11px] text-white/70 mt-0.5">
                          Un raccourci natif pour Windows ou macOS peut être créé.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onInstallTrigger}
                      className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-[12px] transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      type="button"
                    >
                      Installer sur l'ordinateur
                    </button>
                  </div>
                ) : (
                  <div className="tile space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-[12px]">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Raccourci de bureau universel</span>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed">
                      Dans Chrome, Brave ou Edge, cliquez sur l'icône d'<strong className="text-white">installation</strong> située à droite de la <strong className="text-white">barre d'adresse</strong>, à côté des favoris.
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
