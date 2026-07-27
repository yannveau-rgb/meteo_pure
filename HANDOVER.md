# Dossier de transfert — Météo Pure

> Document de passation destiné à une nouvelle session Claude Code sans accès à
> l'historique des conversations précédentes.
>
> **Dernière mise à jour** : 26 juillet 2026 · commit `3397192`

---

## 1. Contexte général

### Le projet

**Météo Pure** est une PWA météo française, en production sur
<https://meteo-pure.vercel.app/>. Elle est utilisée par le propriétaire et
**une dizaine de ses amis** (≈11 abonnements push actifs) — ce ne sont pas des
utilisateurs de test, leurs retours pilotent les priorités.

L'objectif n'est pas d'être une n-ième app météo, mais de combiner :

1. **Une fiabilité de données supérieure** au grand public (modèle AROME 1,5 km
   de Météo-France, le même que celui utilisé sur le site officiel).
2. **Un ton humoristique assumé** (notifications sarcastiques, brief matinal
   mêlant horoscope et météo), avec 3 niveaux d'humour : `safe`, `spicy`,
   `vulgar`.
3. **Des informations actionnables** plutôt que des chiffres bruts.

L'interface est en français, style *glassmorphism* / « liquid glass » sur fond
dégradé bleu azur.

### Ce qui a été construit (chronologie condensée)

| Période | Travaux |
|---|---|
| Sessions initiales | Base de l'app : météo, vigilances, favoris, comparaison de villes, PWA |
| — | Notifications push (Web Push + VAPID + Upstash Redis) |
| — | Brief matinal IA (initialement Google Gemini) |
| — | Fiabilité : AROME + fallback, `minutely_15`, CAPE/foudre, corrections de fuseau horaire |
| — | Radar pluie/orages (Leaflet + RainViewer) |
| — | Suppression du widget « Score de Flemme » (retiré à la demande) |
| — | **Migration Gemini → Mistral** (le tier gratuit Gemini refusait les modèles) |
| — | Brief matinal audio (Web Speech API) |
| — | **Résolution du bug majeur de notifications** (voir §8) |
| Dernière session | Audit produit complet en 10 axes — 9 livrés, 1 écarté avec justification |

### Choix techniques et justifications

| Choix | Pourquoi |
|---|---|
| **Open-Meteo** | Gratuit, sans clé, expose AROME/ARPEGE/ECMWF séparément |
| **Cascade 3 modèles** | AROME s'arrête à ~2 j et ARPEGE à ~4 j (`null` au-delà, vérifié) ; ECMWF comble J+5→J+10, le blend générique en dernier recours |
| **Upstash Redis** | Intégration Vercel native, gratuit, suffisant pour ~11 abonnés |
| **Mistral** (pas Gemini) | Le tier gratuit Gemini renvoyait `404 model not found` ; Mistral fonctionne sans facturation |
| **Ancre du brief calculée en code** | Un LLM qui hallucine « 18° » alors qu'il fait 25° détruirait la crédibilité de l'app. L'IA n'écrit que la punchline, avec **interdiction explicite de produire un chiffre** |
| **cron-job.org** (externe) | Vercel Hobby limite les crons à 1×/jour, insuffisant pour des alertes météo |
| **Fontes auto-hébergées** | PWA offline-first : une fonte en CDN afficherait le cache dans une police de repli |
| **Cache localStorage** | Le Service Worker ignore `/api/` et Open-Meteo est cross-origin ; sans cache applicatif, l'app était **inutilisable hors-ligne** |

### Conventions de développement

- **Langue** : interface, messages de commit et commentaires métier en **français**.
  Les commentaires de code dans les fichiers sources sont en **anglais**
  (cohérence avec le code existant).
- **Commits** : format `type: description` (`feat:`, `fix:`, `perf:`, `chore:`).
  Corps détaillé expliquant **le pourquoi**, pas seulement le quoi.
  Terminés par `Co-Authored-By: Claude <noreply@anthropic.com>`.
- **Commentaires** : expliquer les décisions non évidentes et les pièges, pas
  paraphraser le code. Plusieurs commentaires documentent des bugs corrigés pour
  éviter les régressions — **ne pas les supprimer**.
- **Tests** : toute logique métier pure est testée (Vitest). Les tests
  documentent les cas limites réels rencontrés, pas des cas théoriques.
- **Validation avant commit** : `npm run build` + `npx tsc --noEmit` + `npm test`.
- **Vérification navigateur** : les changements visibles sont testés dans le
  navigateur avant commit (le projet a un `.claude/launch.json`).

---

## 2. État actuel du projet

### ✅ Terminé et en production

- Météo courante, horaire (12 h), 7 jours, avec cascade multi-modèles
- Vigilances dynamiques (orages / vent / pluie-inondation / canicule-froid)
- Pluie dans l'heure basée sur les vraies données `minutely_15`
- Radar pluie & orages animé (passé + nowcast 30 min)
- Notifications push fonctionnelles **app fermée** (iOS + Android, confirmé)
- Brief matinal 2 couches (ancre factuelle + punchline IA) + lecture audio
- Qualité de l'air + pollens avec seuils par espèce
- Fenêtres d'opportunité (créneau sec, verdict linge)
- Indice de confiance multi-modèles
- Cache offline avec badge « Hors-ligne · relevé de HH:MM »
- Comparaison de villes, favoris, partage PNG, phases de lune, saint du jour
- Typographie auto-hébergée (Inter + Instrument Serif)
- **64 tests** au vert, typecheck à 0, build propre

### 🟡 Partiellement terminé

| Sujet | État |
|---|---|
| **`server.ts` (dev local)** | Contient une **logique de transitions dupliquée** de `api/_lib/weatherCheck.ts`, **non mise à jour** avec les préférences par catégorie, le cooldown et les heures calmes. Sans impact en production (dev uniquement), mais divergence à connaître |
| **Compte à rebours de Noël mensuel** | Envoie 1 notification/mois toute l'année. Le propriétaire l'a demandé explicitement et **refusé de le retirer ou de le rendre optionnel**. Ne pas y toucher sans accord |
| **Nettoyage des abonnements morts** | Automatique via erreur `410/404` lors d'un envoi, mais jamais audité |

### ⬜ Reste à développer (aucun engagement pris)

Idées évoquées et **non retenues pour l'instant** :

- Volet social entre amis (classement météo, pronostics) — proposé, l'utilisateur
  a préféré le brief audio
- Voix TTS neuronale (ElevenLabs) — la voix native est jugée robotique mais le
  coût/quota n'a pas été jugé justifié ; **l'utilisateur a dit « c ok »**
- Notifications : digest du soir, alerte de révision J-1→J, alerte gel/plantes
  (recommandés dans l'audit, non implémentés)
- Refactor de `src/App.tsx` (~1600 lignes, monolithique)

### 🎯 Priorités suggérées pour les prochaines sessions

1. **Aucune tâche en cours** — le projet est dans un état stable et committé.
2. Attendre les retours des utilisateurs sur les changements récents
   (notifications allégées, nouveau brief matinal) avant d'ajouter des features.
3. Si besoin de nettoyage : aligner `server.ts` sur `api/_lib/weatherCheck.ts`.

### 🐛 Bugs connus / limitations

| Sujet | Détail |
|---|---|
| **iOS Web Push** | Ne fonctionne que si la PWA est installée depuis Safari. Apple peut retarder/supprimer les push en arrière-plan — limite plateforme, pas de contournement |
| **Android** | L'optimisation batterie retarde les push ; à désactiver pour Chrome côté utilisateur |
| **Radar +30 min** | Limite de RainViewer, pas du code. Aucune source gratuite ne va au-delà |
| **`tsc --noEmit` lent** | ~4 min et gourmand en RAM. **Ne jamais lancer deux `tsc` en parallèle** → `JavaScript heap out of memory`. Utiliser `NODE_OPTIONS="--max-old-space-size=4096"` |
| **HMR Tailwind v4 capricieux** | Les changements de `src/index.css` (surtout `@theme`/`@font-face`) ne sont souvent **pas** repris à chaud. Redémarrer le serveur de dev et ouvrir un **onglet neuf** |
| **Panneau d'onglet sortant** | Reste monté à `opacity: 0` après transition (pré-existant, non visible par l'utilisateur, non corrigé) |
| **`dist/` non nettoyé** | Les builds accumulent des `index-*.css` obsolètes. Sans impact (hash unique par build) |

---

## 3. Architecture

### Vue d'ensemble

Application **PWA React** servie statiquement par Vercel, avec des **fonctions
serverless** pour tout ce qui nécessite un secret ou de la persistance.

```
Navigateur (PWA)                    Vercel                      Externes
─────────────────                   ──────                      ────────
React 19 + Vite       ──fetch──▶    /api/*  (serverless)  ──▶   Upstash Redis
  │                                    │                        Mistral API
  │ localStorage (cache, prefs)        │                        Open-Meteo
  │ Cache Storage (meta SW)            │
  ▼                                    ▼
Service Worker  ◀──── Web Push ──── web-push (VAPID)

Déclencheurs cron ──▶ /api/cron/check-weather ──▶ envoie les push
  · cron-job.org (10 min, principal)
  · GitHub Actions (10 min, secours)
  · Vercel Cron (1×/jour, filet)
```

**Point crucial** : les données météo sont récupérées **directement depuis le
navigateur** (Open-Meteo est public et sans clé). Le serveur ne refait un appel
météo que pour le cron de notifications.

### Technologies

| Domaine | Techno | Version |
|---|---|---|
| UI | React | 19 |
| Langage | TypeScript | ~5.8 |
| Build | Vite | 6 |
| CSS | Tailwind | v4 (`@tailwindcss/vite`, config CSS-first) |
| Animations | `motion` (ex-Framer Motion) | 12 |
| Icônes | `lucide-react` | 0.546 |
| Graphiques | `recharts` | 3 |
| Cartes | `leaflet` | 1.9 |
| Capture image | `html2canvas` | 1.4 |
| Push | `web-push` | 3.6 |
| KV | `@upstash/redis` | 1.34 |
| Dev server | `express` + `tsx` | — |
| Tests | `vitest` | 2.1 |

> ⚠️ Tailwind v4 se configure **dans le CSS** (`@theme { ... }` dans
> `src/index.css`), il n'y a **pas** de `tailwind.config.js`.

### Organisation des dossiers

```
.
├── .github/workflows/weather-check.yml   Cron de secours (10 min)
├── .claude/
│   ├── launch.json                       Config du serveur de dev pour Claude
│   └── settings.local.json               Permissions Bash autorisées
├── api/                                  Serverless PRODUCTION
│   ├── _lib/
│   │   ├── auth.ts                       Vérif ADMIN_TOKEN (header uniquement)
│   │   ├── gemini.ts                     ⚠️ NOM TROMPEUR → client MISTRAL
│   │   ├── rateLimit.ts                  Limite par IP via Redis (fail-open)
│   │   ├── storage.ts                    Abonnements dans Redis
│   │   ├── vapid.ts                      Config web-push
│   │   └── weatherCheck.ts               ★ CŒUR : détection + envoi des push
│   ├── cron/check-weather.ts             Endpoint protégé par CRON_SECRET
│   ├── morning-brief.ts, subscribe.ts, unsubscribe.ts,
│   │   test-push.ts, vapid-public-key.ts, health.ts
├── public/
│   ├── sw.js                             Service Worker (cache + push)
│   ├── fonts/                            Inter + Instrument Serif (woff2)
│   ├── manifest.json, icon-192.png, icon-512.png, icon.svg
├── src/
│   ├── App.tsx                           ★ Racine, ~1600 lignes
│   ├── main.tsx                          Entrée + StrictMode + SW register
│   ├── index.css                         Tailwind v4 + glassmorphism + keyframes
│   ├── types.ts                          Types partagés
│   ├── components/                       15 composants
│   ├── hooks/                            10 hooks
│   └── utils/                            Logique métier + __tests__/
├── server.ts                             Dev uniquement (Express + Vite)
├── vercel.json                           Build, rewrites, cron Vercel
└── vite.config.ts                        manualChunks (motion, recharts)
```

### Fichiers essentiels

| Fichier | Rôle | Attention |
|---|---|---|
| `src/utils/weatherApi.ts` | Fusion 3 modèles, parsing, nowcast, vigilance | Le plus complexe. `mergeSeries()` remplit les `null` d'AROME |
| `api/_lib/weatherCheck.ts` | Détection de transitions + envoi push | Toute la logique anti-spam est ici |
| `src/utils/notificationService.ts` | Messages humoristiques (3 niveaux), abonnement push | Très volumineux (banques de textes) |
| `src/utils/morningAnchor.ts` | Ancre factuelle du brief | **Ne jamais confier ce calcul à l'IA** |
| `api/_lib/gemini.ts` | Client Mistral | Nom historique conservé — renommer casserait 4 imports |
| `public/sw.js` | Cache offline + push + resubscribe | Bumper `CACHE_NAME` à chaque modif |
| `src/hooks/useWeatherFetch.ts` | Fetch + cache + polling + abort | Contient la logique stale-while-revalidate |

---

## 4. Configuration locale

```bash
# Installation
npm install

# Variables d'environnement (dev)
cp .env.example .env.local     # puis remplir

# Développement — port 3000
npm run dev

# Tests
npm run test                   # 64 tests, ~5 s
npm run test:watch

# Vérification de types (LENT : ~4 min)
NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit

# Lint
npm run lint

# Build de production
npm run build
```

### Outils CLI utilisés

| Outil | Usage | Installé ? |
|---|---|---|
| `node` / `npm` | Base (Node ≥ 20) | ✅ |
| `git` | Versioning | ✅ |
| `npx web-push` | Génération des clés VAPID | à la demande |
| `vercel` CLI | **Présent mais NON authentifié** (`vercel whoami` → token invalide) | ⚠️ inutilisable |
| `gh` CLI | **Non installé** (`gh: command not found`) | ❌ |

> Le déploiement ne dépend d'aucun CLI : il passe par `git push`.

### Particularités de l'environnement

- **Windows** + Git Bash. Les chemins contiennent des espaces et des accents
  (`Divers projets APP/Météo Pure`) → toujours guillemeter.
- Le projet est dans **OneDrive** (synchronisation possible pendant les écritures).
- Les fins de ligne : Git convertit LF → CRLF (avertissements normaux, sans gravité).

---

## 5. Déploiement

### Publication

**Vercel**, connecté au dépôt GitHub. Le déploiement est **entièrement
automatique** :

```bash
git push          # sur main → build + déploiement production
```

Aucune commande Vercel n'est nécessaire (et le CLI local n'est de toute façon
pas authentifié). Une branche autre que `main` produit un déploiement *Preview*.

### Configuration de build (`vercel.json`)

- `buildCommand`: `vite build` (le bundle `server.ts` du script npm n'est **pas**
  utilisé en production — `server.ts` est du dev uniquement)
- `outputDirectory`: `dist`
- `rewrites`: tout sauf `/api/*` → `index.html` (SPA)
- `crons`: `/api/cron/check-weather` à `0 7 * * *` (7h UTC = 9h Paris été)

### Après un déploiement

Le Service Worker se met à jour automatiquement (`registration.update()` +
rechargement sur `controllerchange`, cf. `src/main.tsx`).

> ⚠️ **Ajouter/modifier une variable d'environnement Vercel ne suffit pas** :
> il faut **redéployer** pour qu'elle soit prise en compte.

---

## 6. Accès et intégrations

> Aucun secret n'est stocké dans le dépôt. `.gitignore` couvre `.env*`,
> `vapid.json` et `subscriptions.json` — vérifié : `vapid.json` n'a **jamais**
> été commité.

### Inventaire

| Service | Rôle | Où c'est configuré | Réutilisable par le nouveau Claude ? |
|---|---|---|---|
| **Git** | Versioning local | `.git/` | ✅ Oui, identité `product.evaluo` déjà configurée |
| **GitHub** | Dépôt `yannveau-rgb/meteo_pure` (**public**) | remote `origin` en HTTPS | ✅ Oui — les `git push` ont fonctionné toute la session (credential helper Windows) |
| **Vercel** | Hébergement + serverless + cron | Dashboard Vercel | ⚠️ Via `git push` uniquement. Le **CLI n'est pas authentifié** |
| **Upstash Redis** | Abonnements push | Intégration Vercel (vars auto-injectées) | ✅ Côté serveur en prod |
| **Mistral AI** | Punchline du brief | `MISTRAL_API_KEY` dans Vercel | ✅ En prod. ❌ En local sauf `.env.local` |
| **cron-job.org** | Déclencheur principal (10 min) | Compte propriétaire | ❌ Pas d'accès Claude (interface web) |
| **GitHub Actions** | Déclencheur de secours (10 min) | `.github/workflows/` + secret repo `CRON_SECRET` | ✅ Le workflow est dans le dépôt |
| **Open-Meteo** | Météo + qualité d'air | Aucune clé requise | ✅ Public |
| **RainViewer** | Tuiles radar | Aucune clé requise | ✅ Public |
| **geo.api.gouv.fr** | Recherche de communes | Aucune clé requise | ✅ Public |
| **CartoDB** | Fond de carte du radar | Aucune clé requise | ✅ Public |

### Variables d'environnement (noms uniquement)

| Nom | Rôle | Où |
|---|---|---|
| `MISTRAL_API_KEY` | Génération de la punchline | Vercel (Prod + Preview) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Signature Web Push | Vercel |
| `VAPID_CONTACT` | Contact `mailto:` | Vercel |
| `ADMIN_TOKEN` | Endpoints admin | Vercel + `localStorage` navigateur |
| `CRON_SECRET` | **Critique** — auth du cron | Vercel **et** secret GitHub Actions **et** cron-job.org |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Redis | Auto-injecté par Vercel |

> 🔑 **`CRON_SECRET` est le point de défaillance historique du projet.**
> Il était absent pendant des mois : le endpoint renvoyait `401` et **aucune
> notification push n'a jamais été envoyée**. Voir §8.

### Domaine & SSL

`meteo-pure.vercel.app` — sous-domaine Vercel, certificat TLS géré
automatiquement. Aucun domaine personnalisé, aucun renouvellement à gérer.

---

## 7. Automatisations

### CI/CD

| Automatisation | Déclencheur | Effet |
|---|---|---|
| Déploiement Vercel | `git push` sur `main` | Build + mise en production |
| Déploiement Preview | push sur une autre branche | URL de preview |

### Tâches planifiées (3 sources vers le même endpoint)

| Source | Fréquence | Auth | Statut |
|---|---|---|---|
| **cron-job.org** | 10 min | `Authorization: Bearer <CRON_SECRET>` | ✅ Principal, `200 OK` confirmé |
| **GitHub Actions** | 10 min | secret repo `CRON_SECRET` | ✅ ~80 exécutions, toutes en succès |
| **Vercel Cron** | 1×/jour 7h UTC | `CRON_SECRET` auto | ✅ Filet de sécurité |

Les trois appellent `/api/cron/check-weather`. **La redondance est volontaire** —
les crons GitHub Actions sont réputés peu fiables. Les doublons sont neutralisés
côté serveur par des clés de date par abonné (`lastBriefDate`,
`lastChristmasDate`, `lastMonthlyXmasDate`) et un cooldown
(`lastTransitionPushAt`).

### Automatisations applicatives

- **Service Worker** : mise à jour automatique + rechargement de la page
- **`pushsubscriptionchange`** : ré-abonnement automatique si le navigateur fait
  tourner l'abonnement (fréquent sur iOS), en relisant la commune depuis le
  Cache Storage (`meteo-pure-meta`)
- **Rafraîchissement silencieux** : à chaque ouverture de l'app, l'abonnement
  est renvoyé au serveur pour garder l'endpoint frais
- **Nettoyage des abonnements morts** : sur `410`/`404`, l'abonnement est supprimé
- **Polling météo** : toutes les 10 min, **suspendu quand l'onglet est caché**

### Hooks Git

Aucun.

---

## 8. Ce que le nouveau Claude doit absolument savoir

### 🔴 Les pièges historiques (déjà payés cher)

**1. `api/_lib/gemini.ts` ne contient PAS de code Gemini.**
Le projet a migré vers Mistral ; le nom du fichier a été conservé pour ne pas
casser 4 imports. Ne pas être surpris, ne pas « corriger » sans raison.

**2. `CRON_SECRET` conditionne TOUTE la chaîne de notifications.**
S'il est absent de Vercel, `/api/cron/check-weather` renvoie `401` et **aucune
push ne part**, silencieusement. Ça a été le bug le plus long à diagnostiquer :
les utilisateurs croyaient recevoir des notifications, alors qu'ils ne voyaient
que des notifications **locales** déclenchées à l'ouverture de l'app.

**3. Ne jamais laisser l'IA produire un chiffre météo.**
L'ancre du brief (`26° · averses dès 15h · parapluie`) est calculée en
TypeScript dans `src/utils/morningAnchor.ts`. Le prompt Mistral **interdit
explicitement** tout chiffre. C'est une décision structurante : une température
hallucinée ruinerait l'argument central de l'app.

**4. Le cumul de pluie prime sur la probabilité.**
ECMWF annonce 21-51 % là où le blend GFS donne 0-13 %, **pour 0 mm dans les
trois modèles**. Un seuil de probabilité trop bas faisait déclarer « aucun
créneau sec » un soir visiblement dégagé. Voir les constantes
`PROB_CEILING_OUTING` / `PROB_CEILING_LAUNDRY`.

**5. Ne jamais appeler `Math.random()` dans le corps d'un render.**
`AmbientWeatherBackground` le faisait : le tick d'horloge (10 s) redistribuait
les positions et **relançait les 18 gouttes de pluie toutes les 10 secondes**.
Les particules sont désormais mémoïsées et le composant est `React.memo`.

**6. Les heures hors plage doivent ROMPRE une séquence, pas être filtrées.**
`findDryWindow` filtrait, ce qui soudait 22 h aux heures de 6 h-10 h du
lendemain (« 22h → 10h · 5h sans pluie »). Trois tests de régression protègent
ce comportement.

**7. Deux `tsc` en parallèle = `heap out of memory`.**
Toujours un seul, avec `NODE_OPTIONS="--max-old-space-size=4096"`.

**8. Le HMR de Tailwind v4 ne reprend pas les changements de `index.css`.**
Redémarrer le serveur de dev **et** ouvrir un onglet neuf. Plusieurs faux
diagnostics ont été causés par du CSS en cache.

**9. Vérifier la VISIBILITÉ, pas la présence DOM.**
Les panneaux d'onglets sortants restent montés à `opacity: 0`. Un test basé sur
`document.getElementById(...)` conclut à tort que la navigation est cassée.

### 🧠 Logique métier à connaître

- **3 niveaux d'humour** : `safe` / `spicy` / `vulgar`. Le niveau `vulgar` est
  volontairement grossier — c'est un choix produit assumé, pas un bug.
- **Le brief matinal est en 2 couches** : ancre factuelle (code) + punchline (IA).
  Push : `title` = ancre (lisible sur écran verrouillé sans dérouler),
  `body` = punchline.
- **Notifications supprimées volontairement** : `end_rain` / `end_storm`
  (« il ne pleut plus » n'appelle aucune action et doublait chaque épisode).
  L'état reste suivi pour détecter le début du suivant.
- **Heures calmes 22h-7h** : les vigilances **orange et rouge** les contournent
  (sécurité).
- **Seuils de pollen par espèce** : 20 grains/m³ d'ambroisie ≠ 20 grains/m³ de
  graminées. Un seuil unique serait pire que rien.

### 🚫 À ne surtout pas modifier sans accord

| Élément | Raison |
|---|---|
| **Clés VAPID** | Les régénérer **invalide les 11 abonnements existants** |
| **Compte à rebours de Noël mensuel** | Demandé explicitement ; retrait/option **refusé** par le propriétaire |
| **Niveau d'humour `vulgar`** | Choix produit assumé |
| **Nom `api/_lib/gemini.ts`** | Renommer casse 4 imports pour un gain nul |
| **Commentaires documentant des bugs** | Ils empêchent des régressions déjà vécues |
| **`CACHE_NAME` dans `sw.js`** | À **incrémenter** (pas supprimer) à chaque modif du SW |
| **Cache `meteo-pure-meta`** | Exclu de la purge du SW — le `pushsubscriptionchange` en dépend |

### 💬 Préférences de travail du propriétaire

- Il valide fonctionnalité par fonctionnalité, souvent par « ok », « vas-y »,
  « continue ».
- Il attend une **vérification réelle** (navigateur, tests) avant qu'on annonce
  que ça marche — pas une supposition.
- Il apprécie qu'on **signale ses propres erreurs de diagnostic** plutôt que de
  les masquer.
- Les explications doivent rester **claires et sans jargon inutile** : privilégier
  le sens et l'impact concret plutôt que les détails d'implémentation.
- Les interventions manuelles (Vercel, cron-job.org, GitHub secrets) doivent être
  données en **étapes numérotées explicites**.

---

## 9. Vérification — manque-t-il quelque chose ?

### ✅ Prêt immédiatement

- Dépôt complet, arbre de travail **propre**, tout est poussé (`3397192`)
- `npm install` suffit pour démarrer
- Tests, build, typecheck fonctionnels
- Déploiement automatique opérationnel
- Aucun secret dans le dépôt

### ⚠️ Limites d'accès pour le nouveau Claude

| Limite | Impact | Contournement |
|---|---|---|
| **Pas de `.env.local`** | `npm run dev` fonctionne, mais le brief utilise le fallback statique (pas Mistral) et les push locales sont indisponibles | Créer `.env.local` depuis `.env.example` si besoin |
| **CLI Vercel non authentifié** | Pas de lecture des logs ni des variables | Le déploiement passe par `git push` — suffisant |
| **`gh` CLI absent** | Pas de gestion des PR/issues en ligne de commande | API GitHub publique via `curl` (fonctionne) |
| **Pas d'accès cron-job.org** | Impossible de vérifier le planificateur principal | Demander une capture au propriétaire |
| **Valeurs des secrets inconnues** | Impossible de tester `/api/cron/check-weather` en direct | Déclencher le workflow GitHub Actions (`Run workflow`) |

### ❌ Rien de bloquant

Un nouveau Claude peut reprendre le développement immédiatement. Les seuls
points nécessitant le propriétaire concernent la **vérification de la production**,
pas le développement.

---

## 10. Prompt de reprise

> Copier-coller intégralement dans une nouvelle conversation Claude Code,
> depuis le dossier du projet.

```
Je reprends le développement de "Météo Pure", une PWA météo française en
production (https://meteo-pure.vercel.app/), après un changement de compte
Claude Code. Tu n'as aucun accès à nos conversations précédentes.

AVANT TOUTE CHOSE :

1. Lis intégralement le fichier HANDOVER.md à la racine du dépôt. C'est le
   dossier de passation complet : contexte, architecture, décisions prises,
   pièges connus et éléments à ne pas modifier.
2. Lis ensuite README.md.
3. Explore le dépôt local pour vérifier que le code correspond réellement à ce
   qui est décrit dans HANDOVER.md. Signale-moi TOUTE incohérence que tu
   trouves plutôt que de supposer que la documentation a raison.
4. Vérifie l'état de santé du projet :
   - git status et git log --oneline -5
   - npm run test
   Ne lance pas `tsc --noEmit` sans nécessité : il prend ~4 minutes.

RÈGLES DE TRAVAIL :

- Respecte scrupuleusement les conventions existantes (commits en français avec
  corps explicatif, commentaires de code en anglais, tests pour toute logique
  métier pure).
- Ne modifie rien "au passage" : pas de refactor spontané, pas de renommage,
  pas de reformatage de code qui fonctionne.
- Les commentaires qui documentent des bugs corrigés sont là pour éviter des
  régressions : ne les supprime pas.
- Consulte la section "À ne surtout pas modifier sans accord" de HANDOVER.md
  avant de toucher aux clés VAPID, au compte à rebours de Noël, au nom du
  fichier api/_lib/gemini.ts ou au CACHE_NAME du Service Worker.
- Vérifie réellement (navigateur, tests) avant d'affirmer que quelque chose
  fonctionne. Ne suppose jamais.
- Si un diagnostic que tu as posé se révèle faux, dis-le clairement.
- Explique simplement, sans jargon inutile, et donne-moi les interventions
  manuelles (Vercel, GitHub, cron) en étapes numérotées.

ÉTAT ACTUEL : le projet est stable, entièrement committé et poussé, aucune tâche
en cours. Les 64 tests passent.

Commence par lire HANDOVER.md, puis fais-moi un point : confirme que le code est
cohérent avec la documentation, signale les écarts, et propose les prochaines
étapes pertinentes. Ne code rien tant que je n'ai pas validé la direction.
```

---

*Document généré le 26 juillet 2026 — commit `3397192`.*
