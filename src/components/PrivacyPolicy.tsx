import { Shield, FileText, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteAllData: () => void;
}

export default function PrivacyPolicy({ isOpen, onClose, onDeleteAllData }: PrivacyPolicyProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#06102b]/95 backdrop-blur-md px-6 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="glass-premium p-6 rounded-[32px] border border-white/20 shadow-2xl flex flex-col w-full max-w-sm overflow-y-auto max-h-[80vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center w-full mb-4">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            Confidentialité & Mentions légales
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/60"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4 text-white/80 text-[11px] leading-relaxed">
          {/* Mentions légales */}
          <section>
            <h3 className="text-sky-300 font-bold text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Mentions légales
            </h3>
            <p>
              <strong>Éditeur :</strong> Météo Pure est une application météo personnelle
              éditée à titre individuel. L'application est hébergée sur{' '}
              <strong>Vercel Inc.</strong> (340 S Lemon Ave #4133, Walnut, CA 91789, USA).
            </p>
            <p className="mt-1">
              <strong>Contact :</strong>{' '}
              <a href="mailto:contact@meteo-pure.app" className="text-sky-400 underline hover:text-sky-300">
                contact@meteo-pure.app
              </a>
            </p>
          </section>

          {/* Données collectées */}
          <section>
            <h3 className="text-sky-300 font-bold text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Données collectées
            </h3>
            <p>Pour fournir le service de météo personnalisée, nous collectons :</p>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>
                <strong>Commune recherchée</strong> — stockée localement et sur notre
                serveur pour les notifications push. Base légale : intérêt légitime
                (nécessaire au fonctionnement du service).
              </li>
              <li>
                <strong>Date de naissance</strong> — optionnelle, utilisée uniquement pour
                le signe astrologique du brief matinal. Base légale : consentement
                explicite (vous la saisissez volontairement).
              </li>
              <li>
                <strong>Préférences de notifications</strong> — niveau d'humour,
                catégories d'alertes. Stockées localement uniquement.
              </li>
              <li>
                <strong>Données techniques</strong> — l'endpoint de notification push
                (identifiant anonyme du navigateur) est stocké sur notre serveur pour
                l'envoi des alertes.
              </li>
            </ul>
            <p className="mt-1 text-white/50 italic">
              Aucune donnée n'est revendue, partagée avec des tiers, ou utilisée à des
              fins publicitaires. Les données météo sont fournies par Open-Meteo (API
              publique sans clé). Les punchlines du brief sont générées par Mistral AI.
            </p>
          </section>

          {/* Cookies et stockage local */}
          <section>
            <h3 className="text-sky-300 font-bold text-xs uppercase tracking-wider mb-1.5">
              Stockage local
            </h3>
            <p>
              Météo Pure utilise le stockage local de votre navigateur (localStorage)
              pour sauvegarder vos préférences, favoris et historique de notifications.
              Ces données restent sur votre appareil et ne sont jamais transmises à nos
              serveurs. Aucun cookie de tracking n'est utilisé.
            </p>
          </section>

          {/* Vos droits */}
          <section>
            <h3 className="text-sky-300 font-bold text-xs uppercase tracking-wider mb-1.5">
              Vos droits (RGPD)
            </h3>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li><strong>Droit d'accès</strong> — consulter les données vous concernant</li>
              <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
              <li><strong>Droit à l'effacement</strong> — supprimer toutes vos données</li>
              <li><strong>Droit à la portabilité</strong> — récupérer vos données</li>
              <li><strong>Droit d'opposition</strong> — vous opposer au traitement</li>
            </ul>
            <p className="mt-1">
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:contact@meteo-pure.app" className="text-sky-400 underline hover:text-sky-300">
                contact@meteo-pure.app
              </a>
              . Vous pouvez également introduire une réclamation auprès de la{' '}
              <a
                href="https://www.cnil.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 underline hover:text-sky-300 inline-flex items-center gap-0.5"
              >
                CNIL <ExternalLink className="w-2.5 h-2.5" />
              </a>
              .
            </p>
          </section>

          {/* Suppression des données */}
          <section>
            <h3 className="text-rose-300 font-bold text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer mes données
            </h3>
            <p>
              Vous pouvez supprimer immédiatement toutes vos données personnelles
              stockées sur votre appareil et sur notre serveur.
            </p>
            <button
              onClick={onDeleteAllData}
              className="mt-2 w-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-rose-400/60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer toutes mes données
            </button>
          </section>

          {/* Services tiers */}
          <section>
            <h3 className="text-sky-300 font-bold text-xs uppercase tracking-wider mb-1.5">
              Services tiers
            </h3>
            <ul className="list-disc pl-4 space-y-0.5">
              <li><strong>Open-Meteo</strong> — API météo gratuite, aucune donnée personnelle transmise</li>
              <li><strong>Mistral AI</strong> — génération des punchlines du brief matinal</li>
              <li><strong>geo.api.gouv.fr</strong> — recherche de communes françaises (API publique)</li>
              <li><strong>RainViewer</strong> — tuiles radar de pluie</li>
              <li><strong>Vercel</strong> — hébergement de l'application</li>
              <li><strong>Upstash Redis</strong> — stockage des abonnements push</li>
            </ul>
          </section>
        </div>
      </div>
    </motion.div>
  );
}