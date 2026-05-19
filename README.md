# MATCHDAY — Architecture Supabase complète

App de gestion de tournois de football avec backend Supabase multi-tenant,
arborescence en couches, et compatibilité mobile via Capacitor.

## ✅ Parité MVP atteinte

Toutes les fonctionnalités du MVP monolithe sont portées :

### Affichage / consultation
- ✅ Dashboard avec live, à venir, stats, raccourcis adaptés au rôle
- ✅ Liste des matchs avec recherche par équipe et filtres (TOUS / LIVE / À VENIR / TERMINÉS)
- ✅ Détail match avec saisie de score (organisateur ET arbitre)
- ✅ Classement par poule + bracket de phase finale
- ✅ Bandeau annonces (haut, défilant) et sponsors (bas, ticker)
- ✅ Top bar et bottom nav adaptatives au rôle

### Édition organisateur
- ✅ Création/édition/suppression d'équipes (logo, niveau, couleur, hôte)
- ✅ Bibliothèque persistante d'équipes réutilisable entre tournois
- ✅ Création/édition/suppression de matchs
- ✅ Génération automatique du planning (round-robin + bracket)
- ✅ Avance/retard du planning (-10/-5/+5/+10 min)
- ✅ Réglages complets : identité, catégorie, durées, terrains, format,
  barème, bonus, classement par catégorie
- ✅ Diffusion d'annonces (info / bon plan / attention / urgent)
- ✅ Gestion sponsors avec bibliothèque persistante
- ✅ Codes d'accès spectateur et arbitre (régénération possible)

### Saisie scores
- ✅ Cycle scheduled → live → validated
- ✅ Saisie organisateur (RLS direct)
- ✅ Saisie arbitre via RPC sécurisée (`submit_match_score` avec code)
- ✅ Toggle fair-play par équipe
- ✅ Correction post-validation par l'organisateur

### Spectateur
- ✅ Accès via code de tournoi (saisie ou QR)
- ✅ Suivi d'équipes avec badge sur la nav
- ✅ Notifications in-app (toasts) :
  - Avant le match (T-5 min)
  - Au coup d'envoi
  - À chaque changement de score
  - Au score final
  - Reminder arbitre (T-5min + saisie score si match dépasse durée)

### Cycle de vie
- ✅ Archivage du tournoi
- ✅ Vue archives avec classement final + champion
- ✅ Restauration d'un tournoi archivé
- ✅ Suppression définitive

### Onboarding
- ✅ Welcome
- ✅ Mentions légales / RGPD à valider
- ✅ Demande de permissions (notifs / caméra)
- ✅ Choix : créer / rejoindre par code / reprendre un existant

### Multi-tenant Supabase
- ✅ Auth email/password
- ✅ Row Level Security stricte (owner uniquement pour les writes)
- ✅ Lecture publique des tournois (filtre par accessCode côté client)
- ✅ Bibliothèques équipes/sponsors par utilisateur

## 📁 Architecture

```
matchday-supabase/
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql    # Schéma complet + RLS + RPC
├── src/
│   ├── lib/
│   │   └── supabase.js                # Client singleton + helpers user
│   │
│   ├── services/                       # Couche d'accès données (parle à Supabase)
│   │   ├── tournamentService.js
│   │   ├── teamService.js
│   │   ├── matchService.js            # avec generateSchedule
│   │   └── index.js                   # sponsor / announcement / follow
│   │
│   ├── hooks/                          # Logique métier React
│   │   ├── useAuth.js
│   │   ├── useTournamentData.js       # tournament/teams/matches/standings
│   │   ├── useTournamentSecondary.js  # follow/announcements/sponsors
│   │   └── useNotifications.js        # moteur de toasts
│   │
│   ├── utils/                          # Logique pure (pas de React, pas de Supabase)
│   │   ├── scheduling.js              # round-robin, bracket
│   │   ├── standings.js               # calcul classement, getDisplayTeam
│   │   ├── tournament.js              # helpers (isRankingEnabled…)
│   │   └── __tests__/                 # exemples de tests
│   │
│   ├── components/                     # 27 composants UI
│   │   ├── form/Fields.jsx            # primitives FieldText, FieldRow, etc.
│   │   ├── Crest.jsx                  # écusson + badge couronne hôte
│   │   ├── MatchCards.jsx             # primitives partagées
│   │   ├── LoadingScreen.jsx
│   │   ├── AuthScreen.jsx
│   │   ├── OnboardingFlow.jsx         # welcome → légales → permissions → choix
│   │   ├── ConfirmDialog.jsx
│   │   ├── TopBar.jsx
│   │   ├── BottomNav.jsx
│   │   ├── Dashboard.jsx
│   │   ├── MatchList.jsx
│   │   ├── MatchDetail.jsx
│   │   ├── TeamsView.jsx              # avec TeamEditor + LibraryPicker
│   │   ├── TeamEditor.jsx
│   │   ├── LibraryPicker.jsx
│   │   ├── ScheduleView.jsx           # avec MatchEditor + génération auto
│   │   ├── MatchEditor.jsx
│   │   ├── Standings.jsx
│   │   ├── BracketView.jsx
│   │   ├── SettingsView.jsx           # complet
│   │   ├── SettingsParts.jsx          # tous les sub-components
│   │   ├── RoleSwitcher.jsx
│   │   ├── FollowView.jsx
│   │   ├── AnnouncementBar.jsx
│   │   ├── SponsorTicker.jsx
│   │   ├── NotifStack.jsx
│   │   └── ArchivesView.jsx           # avec ArchiveDetail intégré
│   │
│   ├── styles/
│   │   └── styles.js                  # 312 styles inline + globalCSS
│   ├── App.jsx                        # Orchestration top-level
│   └── main.jsx                       # Entrée React + injection CSS
├── package.json
├── vite.config.js
├── capacitor.config.json
└── .env.example
```

### Règle d'or des couches

```
Composants  →  Hooks  →  Services  →  Supabase
   (UI)       (state)    (data)
```

- Un **composant** consomme un hook et appelle des callbacks. Il ne touche
  jamais à `supabase` directement (sauf `OnboardingFlow` qui utilise
  `tournamentService.getByAccessCode` pour l'auth-like, et `AuthScreen`).
- Un **hook** orchestre du state React + appelle des services.
- Un **service** est la seule couche qui parle à Supabase.
- Les **utils** sont du JS pur, testables isolément.

## 🚀 Démarrage

### 1. Créer le projet Supabase
```
https://app.supabase.com → nouveau projet
```
Récupère URL + anon key dans Settings → API.

### 2. Exécuter la migration SQL
Supabase Studio → SQL Editor → coller le contenu de
`supabase/migrations/0001_initial_schema.sql` → Run.

Ça crée toutes les tables, indexes, triggers, RLS policies, et la RPC
`submit_match_score`.

### 3. Variables d'environnement
```bash
cp .env.example .env.local
# Éditer .env.local avec tes vraies valeurs
```

### 4. Installer & lancer
```bash
npm install
npm run dev
```

Premier compte : crée-toi un compte (mode signup), accepte les légales,
puis crée un tournoi.

## 🔐 Modèle d'authentification

**Multi-tenant strict** : chaque organisateur s'authentifie, ses tournois
lui appartiennent (`owner_id`).

### RLS résumée

| Table             | Lecture                | Écriture                          |
|-------------------|------------------------|-----------------------------------|
| `tournaments`     | publique               | owner uniquement                  |
| `teams`           | publique               | owner du tournoi                  |
| `matches`         | publique               | owner OU arbitre via RPC + code   |
| `sponsors`        | publique               | owner du tournoi                  |
| `announcements`   | publique               | owner du tournoi                  |
| `team_library`    | propriétaire           | propriétaire                      |
| `sponsor_library` | propriétaire           | propriétaire                      |
| `followed_teams`  | propre utilisateur     | propre utilisateur                |
| `profiles`        | propre utilisateur     | propre utilisateur                |

**Lecture publique** des tournois/teams/matches : nécessaire pour les
spectateurs sans avoir à connaître l'organisateur. Le filtre se fait par
`access_code` côté client.

**Écriture par les arbitres** : non-owners donc bloqués par RLS standard.
Ils passent par la RPC `submit_match_score(matchId, refereeCode, ...)`
qui valide le code arbitre du tournoi avant écriture.

## 📱 Capacitor (mobile natif)

L'archi est compatible mobile sans modification :
- Le client Supabase utilise `localStorage` natif via la WebView
- Les variables d'env sont injectées au build
- `capacitor.config.json` est prêt avec permissions caméra et notifs

```bash
npm install
npm run build
npx cap add ios
npx cap add android
npm run cap:sync
npm run cap:ios     # ou cap:android
```

### Notifications push réelles (à brancher plus tard)

Capacitor `@capacitor/push-notifications` + Firebase Cloud Messaging
(Android) + APNs (iOS). Côté serveur, une Edge Function Supabase qui
écoute les changements de `matches` et envoie les pushs aux utilisateurs
ayant des `followed_teams` correspondants.

Pour l'instant, les notifications restent **in-app** (toasts via
`NotifStack` + hook `useNotifications`).

## 🧪 Tests

Un exemple de tests Vitest est dans `src/utils/__tests__/`.

```bash
npm install -D vitest
npx vitest run
```

Les fichiers à tester en priorité :
- `utils/scheduling.js` (round-robin, bracket size)
- `utils/standings.js` (calcul classement, getDisplayTeam)

Les services et hooks peuvent être testés avec un mock Supabase.

## 🔄 Mapping ancien → nouveau

| Ancien (monolithe + storage)             | Nouveau                                    |
|------------------------------------------|--------------------------------------------|
| `useState` + `window.storage.set/get`    | Hooks (useTournament, useTeams, etc.)      |
| `SEED_TOURNAMENT`, `SEED_TEAMS`          | Vraies données Supabase                    |
| `staffAccess.organizerCode`              | Auth Supabase email/password               |
| `staffAccess.refereeCode`                | `tournament.refereeCode` + RPC sécurisée   |
| `unlockedRoles` local                    | Affichage local + auth.user                |
| Bibliothèque équipes en localStorage     | Table `team_library` (RLS owner)           |
| `archives` en localStorage               | `tournaments.status = 'archived'`          |
| Onboarding stocké en localStorage        | localStorage `matchday_onboarding_v1`      |
| `setMatches(prev => ...)` direct         | `updateMatch(id, patch)` async via service |

## ⚠️ Points d'attention

1. **Génération de planning** : fait plusieurs INSERTs pour chaîner les
   `winner:<uuid>` entre tours du bracket. Sur 16+ équipes en KO,
   envisager une RPC PL/pgSQL.

2. **`refereeCode`** stocké en `sessionStorage` (pas localStorage) pour
   qu'il s'efface à la fermeture du navigateur.

3. **Pas de Realtime** par défaut. Pour ajouter sans casser :
   ```js
   // dans useMatches
   useEffect(() => {
     if (!tournamentId) return;
     const ch = supabase.channel(`matches:${tournamentId}`)
       .on('postgres_changes',
         { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` },
         () => reload())
       .subscribe();
     return () => { supabase.removeChannel(ch); };
   }, [tournamentId, reload]);
   ```

4. **Permissions onboarding** : pour l'instant simulées (boutons "Autoriser
   / Non"). Pour les vraies permissions natives sur mobile, brancher
   `@capacitor/push-notifications` et `@capacitor/camera` au moment où
   l'utilisateur clique "Autoriser".
