# Météo Pure

PWA météo française avec alertes push, brief matinal IA et vigilances Météo-France.

🔗 **Live** : https://meteo-pure.vercel.app/

> 📄 Reprise de projet / passation : voir **[HANDOVER.md](HANDOVER.md)**.

## Fonctionnalités

- 🌤️ Météo temps réel + prévisions 7 jours / heure par heure (Open-Meteo)
- 🎯 Cascade multi-modèles : AROME (1,5 km) → ARPEGE → ECMWF → blend GFS/ICON
- 📊 Indice de confiance affiché quand les modèles divergent
- ⚠️ Vigilances Météo-France calculées dynamiquement (orages, vent, pluie, canicule)
- 🌧️ Pluie dans l'heure (données réelles `minutely_15`, mm par tranche de 15 min)
- 📡 Radar pluie & orages animé (RainViewer, passé + nowcast 30 min)
- 🔔 Notifications push même app fermée (Web Push API + VAPID)
- 🔮 Brief matinal en 2 couches : ancre factuelle + punchline IA (Mistral)
- 🔊 Lecture audio du brief (Web Speech API, natif navigateur)
- 🌬️ Qualité de l'air + pollens par espèce (Open-Meteo Air Quality / CAMS)
- ☂️ Fenêtres d'opportunité : créneau sec, verdict linge
- 📴 Fonctionne hors-ligne (dernières prévisions en cache + badge explicite)
- 🌕 Phases de lune + alertes pleine lune
- ⛪ Saint du jour + comptes à rebours (Noël, etc.)
- 🏙️ Comparaison de villes côte à côte
- ⭐ Favoris persistés + recherche communes françaises
- 📱 PWA installable (Android + iOS 16.4+)

## Stack

| Couche | Techno |
|---|---|
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind v4 |
| Backend | Vercel Serverless Functions (Node.js 20) |
| Stockage | Upstash Redis (abonnements push) |
| Push | Web Push API + VAPID |
| IA | **Mistral** (`mistral-small-latest`, fallback `open-mistral-nemo`) |
| Animations | Motion (ex-Framer Motion) + keyframes CSS |
| Cartes | Leaflet + RainViewer |
| Graphiques | Recharts |
| Icônes | Lucide React |
| Typographie | Inter Variable + Instrument Serif (auto-hébergées) |
| Tests | Vitest + V8 coverage (64 tests) |
| Lint | ESLint 9 (flat config) + typescript-eslint |
| CI/CD | Push GitHub → Vercel auto-deploy |

## Architecture

```
api/                     Vercel Serverless Functions (PRODUCTION)
  _lib/                  Helpers partagés (Redis, VAPID, IA, auth, rate-limit, weather check)
    gemini.ts            ⚠️ nom historique — contient le client MISTRAL
  cron/check-weather.ts  Endpoint de vérification météo + envoi des push
  morning-brief.ts       POST: brief matinal personnalisé
  subscribe.ts           POST: enregistre/met à jour un abonnement push
  unsubscribe.ts         POST: retire un abonnement
  test-push.ts           POST: envoi de test (admin)
  vapid-public-key.ts    GET: clé publique VAPID
  health.ts              GET: ping + nb d'abonnés

src/
  App.tsx                Composant racine (~1600 lignes)
  hooks/                 useWeatherFetch, useAirQuality, useMorningBrief, ...
  components/            Composants UI
  utils/                 Logique métier + tests unitaires
    weatherApi.ts        Fusion 3 modèles, parsing, nowcast
    morningAnchor.ts     Ancre factuelle du brief (calculée en code, pas par l'IA)
    opportunityWindows.ts Créneaux secs / linge
    airQuality.ts        Pollens (seuils par espèce) + EAQI
    forecastConfidence.ts Accord entre modèles
    weatherCache.ts      Cache offline stale-while-revalidate

public/
  sw.js                  Service Worker (cache offline + push + resubscribe)
  fonts/                 Inter + Instrument Serif (woff2, 69 kB)

server.ts                Serveur Express — DEV UNIQUEMENT (`npm run dev`)
```

## Démarrage local

Prérequis : Node.js ≥ 20.

```bash
npm install
cp .env.example .env.local       # remplir les valeurs
npm run dev                       # tsx server.ts (port 3000)
```

Générer des clés VAPID (une seule fois — les régénérer invalide tous les abonnements) :
```bash
npx web-push generate-vapid-keys
```

## Variables d'environnement

| Nom | Usage |
|---|---|
| `MISTRAL_API_KEY` | Punchline du brief matinal (fallback statique si absente) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Signature Web Push |
| `VAPID_CONTACT` | `mailto:` pour le service push |
| `ADMIN_TOKEN` | Auth des endpoints sensibles (test-push, cron manuel) |
| `CRON_SECRET` | **À définir manuellement** — sans lui, aucune push n'est envoyée |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Auto-injecté par l'intégration Upstash |

Sur le frontend, placer `ADMIN_TOKEN` dans `localStorage` pour révéler le panneau admin :
```js
localStorage.setItem('adminToken', '<même valeur que ADMIN_TOKEN>')
```

## Scripts

| Script | Action |
|---|---|
| `npm run dev` | Dev serveur (Express + Vite middleware, port 3000) |
| `npm run build` | Build Vite + bundle `server.ts` |
| `npm run test` | Vitest run |
| `npm run test:watch` | Vitest watch |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` (lent, ~4 min — voir HANDOVER.md) |

## Déploiement

Push sur `main` → Vercel redéploie automatiquement. Aucune commande manuelle.

**Déclenchement des notifications** (3 sources, toutes vers `/api/cron/check-weather`) :

| Source | Fréquence | Rôle |
|---|---|---|
| cron-job.org | 10 min | Principal |
| GitHub Actions | 10 min | Secours |
| Vercel Cron | 1×/jour, 7h UTC | Filet de sécurité |

Les doublons sont neutralisés côté serveur (clés de date par abonné + cooldown).

## Limitations connues

- **iOS** : Web Push ne fonctionne que si la PWA est **installée** depuis Safari (Partager → Écran d'accueil).
- **Android** : l'optimisation batterie peut retarder les push ; désactiver l'optimisation pour Chrome.
- **Radar** : le nowcast RainViewer plafonne à **+30 min** (limite du fournisseur, pas du code).
- **Météo-France** : AROME couvre ~2 jours, ARPEGE ~4 jours. Au-delà, ECMWF prend le relais.

## Licence

Privé.
