# Météo Pure

PWA météo française avec alertes push, briefings IA et vigilances Météo-France.

🔗 **Live** : https://meteo-pure.vercel.app/

## Fonctionnalités

- 🌤️ Météo temps réel + prévisions 7 jours / horaires (Open-Meteo)
- ⚠️ Vigilances Météo-France calculées dynamiquement (orages, vent, pluie, canicule)
- 🌧️ Pluie dans l'heure (modèle minute par minute)
- 🔔 Notifications push même app fermée (Web Push API + VAPID)
- 🔮 Briefings matinaux générés par Gemini AI (avec horoscope sarcastique)
- 🌕 Suivi des phases de lune + alertes pleine lune
- ⛪ Saint du jour + comptes à rebours (Noël, etc.)
- 🏙️ Comparaison de villes côte à côte
- ⭐ Favoris persistés + recherche communes françaises
- 📱 PWA installable (Android + iOS 16.4+)

## Stack

| Couche | Techno |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 |
| Backend | Vercel Serverless Functions (Node.js 20) |
| Stockage | Upstash Redis (subscriptions) |
| Push | Web Push API + VAPID |
| IA | Google Gemini 2.5 Flash |
| Animations | Motion (ex-Framer Motion) |
| Icônes | Lucide React |
| Tests | Vitest + V8 coverage |
| Lint | ESLint 9 (flat config) + typescript-eslint |
| CI/CD | Push GitHub → Vercel auto-deploy |

## Architecture

```
api/                     Vercel Serverless Functions
  _lib/                  Helpers partagés (Redis, VAPID, Gemini, auth, rate-limit, weather check)
  cron/check-weather.ts  Cron quotidien (Vercel Cron, 7h UTC)
  morning-brief.ts       POST: brief Gemini personnalisé
  subscribe.ts           POST: enregistre un abonnement push
  unsubscribe.ts         POST: retire un abonnement
  test-push.ts           POST: envoi de test (admin)
  vapid-public-key.ts    GET: clé publique VAPID
  health.ts              GET: ping + nb d'abonnés

src/
  App.tsx                Composant racine
  hooks/                 Hooks custom (useFavorites, useWeatherFetch, etc.)
  components/            Composants UI (13)
  utils/                 Logique métier (weatherApi, climatology, ephemeris, notificationService, ...)

public/sw.js             Service Worker (cache offline + push handler)
server.ts                Serveur Express (DEV uniquement, `npm run dev`)
```

## Démarrage local

Prérequis : Node.js ≥ 20.

```bash
npm install
cp .env.example .env.local       # remplir les valeurs
npm run dev                       # tsx server.ts (port 3000)
```

Pour générer des clés VAPID :
```bash
npx web-push generate-vapid-keys
```

## Variables d'environnement

| Nom | Usage |
|---|---|
| `GEMINI_API_KEY` | Briefings IA (obligatoire en prod) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Signature Web Push |
| `VAPID_CONTACT` | `mailto:` pour le service push |
| `ADMIN_TOKEN` | Auth des endpoints sensibles (cron manuel, test-push) |
| `CRON_SECRET` | Auto-injecté par Vercel Cron |
| `UPSTASH_REDIS_REST_KV_REST_API_URL` / `_TOKEN` | Auto-injecté par l'intégration Upstash |

Sur le frontend, placer `ADMIN_TOKEN` dans `localStorage` pour activer les boutons admin :
```js
localStorage.setItem('adminToken', '<même valeur que ADMIN_TOKEN>')
```

## Scripts

| Script | Action |
|---|---|
| `npm run dev` | Dev serveur (Express + Vite middleware) |
| `npm run build` | Build Vite + bundle server.ts |
| `npm run test` | Vitest run |
| `npm run test:watch` | Vitest watch mode |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Déploiement

Push sur `main` → Vercel redéploie automatiquement.

Cron Vercel : `vercel.json` programme `/api/cron/check-weather` quotidiennement à 7h UTC (limite plan Hobby = 1 cron/jour).

## Limitations connues

- **iOS** : Web Push fonctionne uniquement si la PWA est **installée** depuis Safari (Partager → Écran d'accueil).
- **Hobby Vercel** : alertes temps réel limitées à 1 vérif/jour. Pour 15 min, utiliser un planificateur externe (cron-job.org) qui appelle `/api/cron/check-weather` avec le token admin.
- **Icônes manifest** : actuellement SVG uniquement → installation PWA dégradée sur certains iOS.

## Licence

Privé.
