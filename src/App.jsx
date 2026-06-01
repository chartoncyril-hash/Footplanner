import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import {
  useMyTournaments,
  useTournament,
  useTeams,
  useMatches,
  useStandings,
  useTeamLibrary,
} from './hooks/useTournamentData';
import { useFollowedTeams } from './hooks/useTournamentSecondary';
import { useNotifications } from './hooks/useNotifications';

import { LoadingScreen } from './components/LoadingScreen';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Dashboard } from './components/Dashboard';
import { ArchivesView } from './components/ArchivesView';
import { MatchList } from './components/MatchList';
import { MatchDetail } from './components/MatchDetail';
import { Standings } from './components/Standings';
import { TeamsView } from './components/TeamsView';
import { ScheduleView } from './components/ScheduleView';
import { SettingsView } from './components/SettingsView';
import { RoleSwitcher } from './components/RoleSwitcher';
import { FollowView } from './components/FollowView';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { AnnouncementBar } from './components/AnnouncementBar';
import { SponsorTicker } from './components/SponsorTicker';
import { ConfirmDialog } from './components/ConfirmDialog';
import { NotifStack } from './components/NotifStack';
import { DesktopSidebar } from './components/DesktopSidebar';
import { CategoryManager } from './components/CategoryManager';
import { TournamentWizard } from './components/TournamentWizard';
import { LibraryView } from './components/LibraryView';
import { FormatView } from './components/FormatView';
import { PresentationView } from './components/PresentationView';
import { AccountView } from './components/AccountView';
import { LandingPage } from './components/LandingPage';
import { RegistrationPage } from './components/RegistrationPage';
import { PosterView } from './components/PosterView';
import { InfoView } from './components/InfoView';
import { PrivacyPage, CGUPage } from './components/LegalPage';
import { RegistrationManager } from './components/RegistrationManager';
import { CheckInView } from './components/CheckInView';
import { HubDashboard } from './components/HubDashboard';
import { useProfile } from './hooks/useProfile';
import { useIsDesktop } from './hooks/useIsDesktop';

// ============================================================
// App.jsx — orchestration de haut niveau
//
// Choix d'architecture :
// - Aucun storage local : tout vient de Supabase via les hooks
// - Aucun appel Supabase ici, uniquement dans les services et hooks
// - L'état "rôle actif" reste local (préférence d'affichage du device)
// - Les composants reçoivent des actions (callbacks) issues des hooks
// ============================================================

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  
  // Lecture des query params pour le mode régie
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isPresentationMode = urlParams?.get('presentation') === '1';
  const isRegistrationMode = urlParams?.get('register') === '1';
  const isPosterMode = urlParams?.get('poster') === '1';
  const isPrivacyMode = urlParams?.get('page') === 'privacy';
  const isCGUMode = urlParams?.get('page') === 'cgu';
  const registrationCode = urlParams?.get('t') || null;

  // Lien QR spectateur : /?t=CODE (ni register, ni presentation)
  // Le spectateur n'a pas besoin d'être connecté — accès direct au tournoi live.
  const spectatorCode = (!isRegistrationMode && !isPresentationMode && registrationCode)
    ? registrationCode
    : null;

  if (authLoading) return <LoadingScreen />;
  if (isPosterMode) return <PosterView />;
  if (isPrivacyMode) return <PrivacyPage onBack={() => window.history.back()} />;
  if (isCGUMode) return <CGUPage onBack={() => window.history.back()} />;
  if (isRegistrationMode && registrationCode) return <RegistrationPage accessCode={registrationCode} />;
  // Spectateur via QR : bypass la landing même sans compte
  if (!user && !isPresentationMode && !spectatorCode) return <LandingPage />;

  // key={user.id} force React à tout recréer quand l'utilisateur change
  return <AuthenticatedApp key={user?.id || 'anon'} user={user} signOut={signOut} isPresentationMode={isPresentationMode} spectatorCode={spectatorCode} />;
}

function AuthenticatedApp({ user, signOut, isPresentationMode, spectatorCode }) {
  const isDesktop = useIsDesktop();
  const { profile } = useProfile(user);
  // hubMode désactivé d'emblée pour les accès QR spectateur
  const [hubMode, setHubMode] = useState(spectatorCode ? false : true);
  const [hubView, setHubView] = useState('home');
  const [pendingRegistrations, setPendingRegistrations] = useState(0);

  // Sélection du tournoi actif (côté UI uniquement — n'affecte pas la BDD)
  // - Pour un organisateur : le dernier tournoi 'live' qu'il a créé
  // - Pour un spectateur : tournoi accédé via accessCode
  // Initial state pour activeTournamentId : lit l'URL si mode régie
  const initialTournamentId = (() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('presentation') === '1' && params.get('t')) return params.get('t');
    return null;
  })();
  const [activeTournamentId, setActiveTournamentId] = useState(initialTournamentId);
  // Lien QR : le code spectateur est pré-chargé comme accessCode
  const [accessCode, setAccessCode] = useState(spectatorCode || null);

  // Rôle d'affichage : organizer | referee | spectator | coach
  const [role, setRole] = useState('spectator');
  // Code arbitre saisi (stocké en sessionStorage uniquement, pas en bdd)
  const [refereeCode, setRefereeCode] = useState(() => {
    try { return sessionStorage.getItem('referee_code') || null; } catch { return null; }
  });

  // Navigation
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [paramsOpen, setParamsOpen] = useState(false);
  // Lecture des query params pour le mode régie (fenêtre détachée)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const presentationTournamentId = urlParams?.get('t') || null;
  const presentationCategory = urlParams?.get('cat') || null;
  
  const [view, setView] = useState(isPresentationMode ? 'presentation' : 'dashboard');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // ----- Données du tournoi actif -----
  const { tournament, loading: tLoading, update: updateTournament, reload: reloadTournament } =
    useTournament({ id: activeTournamentId, accessCode });
  const { teams, loading: teamsLoading, create: createTeam, update: updateTeam, remove: removeTeam, importFromLibrary } =
    useTeams(tournament?.id);
  const { matches, loading: matchesLoading, create: createMatch, update: updateMatch, remove: removeMatch,
          submitScore, shiftSchedule, generateSchedule } = useMatches(tournament?.id);
  const standings = useStandings(teams, matches, tournament);

  // Compteur inscriptions en attente
  useEffect(() => {
    if (!tournament?.id) { setPendingRegistrations(0); return; }
    supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id)
      .eq('status', 'pending')
      .then(({ count }) => setPendingRegistrations(count || 0));
  }, [tournament?.id]);

  // Liste des tournois de l'organisateur connecté
  const { list: myTournaments, loading: myTLoading, create: createTournament, archive: archiveTournament, remove: removeTournament, updateInList: updateTournamentInList } = useMyTournaments();

  // Bibliothèque persistante
  const { library: teamsLibrary, remove: removeFromLibrary, reload: reloadLibrary, update: updateLibraryTeam, add: addToLibrary } = useTeamLibrary();

  // Équipes suivies par l'utilisateur connecté (badge nav + filtre notifs)
  const { followedIds: followedTeamIds, toggle: toggleFollow } = useFollowedTeams(tournament?.id);

  // Moteur de notifications in-app (toasts)
  const { notifs, dismiss: dismissNotif } = useNotifications({
    matches, tournament, role, followedIds: followedTeamIds,
  });

  // ----- Sélection automatique du tournoi -----
  // Quand l'utilisateur s'authentifie, on charge automatiquement son dernier tournoi live.
  // Exception : si l'accès vient d'un QR spectateur, on ne touche pas au rôle/tournoi.
  useEffect(() => {
    if (spectatorCode) return; // accès QR — ne pas écraser le mode spectateur
    if (!user) {
      setActiveTournamentId(null);
      return;
    }
    if (myTournaments.length > 0 && !activeTournamentId && !accessCode) {
      const live = myTournaments.find(t => t.status === 'live') || myTournaments[0];
      setActiveTournamentId(live.id);
      setRole('organizer');
    }
  }, [user, myTournaments, activeTournamentId, accessCode, spectatorCode]);

  // ----- Coup d'envoi automatique des vagues -----
  // Surveille toutes les 10s les matchs scheduled : si l'heure est atteinte
  // et que autoKickoff est activé sur le tournoi, on les passe en LIVE.
  // L'organisateur reçoit un toast "Coup d'envoi de XX:XX — N matchs lancés".
  useEffect(() => {
    if (!tournament || !matches || tournament.autoKickoff === false) return;
    if (role !== 'organizer') return; // seul l'organisateur déclenche
    if (!tournament.date) return;

    // Ne rien faire si la date du tournoi est passée
    // (évite de basculer des matchs d'archives ou de tournois anciens en LIVE)
    const todayStr = new Date().toISOString().slice(0, 10);
    if (tournament.date < todayStr) return;

    const checkWaves = async () => {
      const now = new Date();
      // On groupe les scheduled par heure
      const grouped = {};
      matches.forEach(m => {
        if (m.status !== 'scheduled' || !m.time) return;
        const time = m.time.slice(0, 5);
        if (!grouped[time]) grouped[time] = [];
        grouped[time].push(m);
      });

      // Pour chaque vague, vérifier si l'heure est atteinte
      for (const time of Object.keys(grouped)) {
        const waveMatches = grouped[time];
        const waveDate = new Date(`${tournament.date}T${time}:00`);
        const diffSeconds = (now - waveDate) / 1000;
        // Ne déclencher que si l'heure est atteinte mais pas dépassée de plus de 5 minutes
        // Évite de basculer en live tous les matchs d'un tournoi commencé manuellement plus tôt
        if (diffSeconds >= 0 && diffSeconds <= 300) {
          // L'heure est atteinte ou passée → on lance la vague
          try {
            await Promise.all(
              waveMatches.map(m =>
                updateMatch(m.id, {
                  status: 'live',
                  scoreHome: m.scoreHome ?? 0,
                  scoreAway: m.scoreAway ?? 0,
                })
              )
            );
            // Affiche un toast de confirmation
            const toast = {
              id: 'auto_kickoff_' + time + '_' + Date.now(),
              kind: 'start',
              title: `🎉 Coup d'envoi automatique — ${time}`,
              message: waveMatches.length === 1
                ? '1 match lancé'
                : `${waveMatches.length} matchs lancés simultanément`,
            };
            // On l'ajoute via le state notifs
            // (le hook useNotifications gère la pile, mais ce toast est manuel)
            // → on utilise pushManual si dispo, sinon on est bon car useNotifications
            // détectera la transition scheduled→live et émettra son propre toast
          } catch (e) {
            console.error('Auto-kickoff failed for wave', time, e);
          }
        }
      }
    };

    // Premier check immédiat puis toutes les 10s
    checkWaves();
    const intervalId = setInterval(checkWaves, 10000);
    return () => clearInterval(intervalId);
  }, [tournament, matches, role, updateMatch]);

  // ----- Helpers UI -----
  const askConfirm = useCallback((opts) => setConfirmDialog(opts), []);
  const closeConfirm = useCallback(() => setConfirmDialog(null), []);

  // Lancer une vague de matchs (les passer tous en 'live' d'un coup)
  const kickoffWave = useCallback(async (waveMatches) => {
    if (!waveMatches || waveMatches.length === 0) return;
    // Passe tous les matchs de la vague à 'live' en parallèle
    await Promise.all(
      waveMatches.map(m =>
        updateMatch(m.id, {
          status: 'live',
          scoreHome: m.scoreHome ?? 0,
          scoreAway: m.scoreAway ?? 0,
        })
      )
    );
  }, [updateMatch]);
  
  // Initialise la catégorie active quand le tournoi change
  useEffect(() => {
    if (!tournament) {
      setActiveCategory(null);
      return;
    }
    const cats = (Array.isArray(tournament.categories) && tournament.categories.length > 0)
      ? tournament.categories
      : (tournament.category ? [tournament.category] : []);
    if (cats.length > 0 && !cats.includes(activeCategory)) {
      setActiveCategory(cats[0]);
    }
  }, [tournament, activeCategory]);
  
  // Onboarding spectateur : saisie du code de tournoi
  const handleAccessCodeSubmit = async (code) => {
    setAccessCode(code);
    setActiveTournamentId(null);
    setRole('spectator');
    setView('dashboard');
  };

  // Saisie du code arbitre
  const handleRefereeCodeSubmit = (code) => {
    if (!tournament || !code) return false;
    if (tournament.refereeCode === code) {
      try { sessionStorage.setItem('referee_code', code); } catch {}
      setRefereeCode(code);
      setRole('referee');
      return true;
    }
    return false;
  };

  // Lock du rôle staff (efface le code arbitre stocké)
  const lockRole = (roleId) => {
    if (roleId === 'referee') {
      try { sessionStorage.removeItem('referee_code'); } catch {}
      setRefereeCode(null);
    }
    setRole('spectator');
  };

  // ----- Création / archivage de tournoi -----
  // Ouvre le wizard de création au lieu de créer direct
  const startNewTournament = useCallback(() => {
    setWizardOpen(true);
  }, []);

  // Création effective du tournoi avec toutes les options du wizard
  const handleWizardCreate = useCallback(async (wizardData) => {
    const t = await createTournament(wizardData);
    setActiveTournamentId(t.id);
    setRole('organizer');
    setView('dashboard');
    setWizardOpen(false);
  }, [createTournament]);

  // Met à jour le tournoi existant avec les données du wizard
  const handleWizardUpdate = useCallback(async (wizardData) => {
    await updateTournament(wizardData);
    setParamsOpen(false);
  }, [updateTournament]);

  const closeTournament = useCallback(async () => {
    if (!tournament) return;
    askConfirm({
      title: 'Clôturer le tournoi ?',
      message: `« ${tournament.name} » sera archivé avec son classement et ses résultats.`,
      confirmLabel: 'Archiver',
      onConfirm: async () => {
        await archiveTournament(tournament.id);
        await reloadTournament();
        closeConfirm();
      },
    });
  }, [tournament, archiveTournament, reloadTournament, askConfirm, closeConfirm]);

  // ----- Rendu -----

  // Pas connecté = écran d'auth
  // Choix : on impose la connexion à tout le monde (multi-tenant strict).
  // Pour permettre aux spectateurs de visualiser sans compte, on pourrait
  // ajouter ici un bouton "accéder en tant que spectateur" qui demande
  // juste un code de tournoi sans authentification — à condition d'élargir
  // les policies RLS de lecture (déjà 'true' dans le SQL fourni).

  // Spectateur sans tournoi sélectionné = onboarding code
  if (myTLoading) return <LoadingScreen />;

  // Niveau COMPTE : Hub Dashboard
  if (hubMode && !isPresentationMode) {
    return (
      <HubDashboard
        profile={profile}
        myTournaments={myTournaments}
        onEnterModule={(moduleId, tournamentId) => {
          if (moduleId === 'tournaments') {
            if (tournamentId) {
              setActiveTournamentId(tournamentId);
              setRole('organizer');
            }
            setHubMode(false);
          } else if (moduleId === 'inscriptions') {
            setHubView('inscriptions');
          } else if (moduleId === 'scoreboard') {
            setHubView('scoreboard');
          } else if (moduleId === 'sponsors') {
            setHubView('sponsors');
          } else if (moduleId === 'licencies') {
            setHubView('licencies');
          } else if (moduleId === 'compositions') {
            setHubView('compositions');
          }
        }}
        onCreateTournament={() => {
          setHubMode(false);
          startNewTournament();
        }}
        onGoToAccount={() => setHubView('account')}
        hubView={hubView}
        onHubViewBack={() => setHubView('home')}
        onUpdateTournamentInList={updateTournamentInList}
        signOut={signOut}
      />
    );
  }
  if (!tournament && !tLoading) {
    return (
      <>
        <OnboardingFlow
          onAccessCodeSubmit={handleAccessCodeSubmit}
          onCreateTournament={startNewTournament}
          myTournaments={myTournaments}
          onPickTournament={(id) => { setActiveTournamentId(id); setRole('organizer'); setView('dashboard'); }}
          signOut={signOut}
        />
        {wizardOpen && (
          <TournamentWizard
            onClose={() => setWizardOpen(false)}
            onCreate={handleWizardCreate}
          />
        )}
      </>
    );
  }

  if (tLoading || teamsLoading || matchesLoading) return <LoadingScreen />;

  // Contexte injecté à tous les écrans
  const ctx = {
    // données
    tournament, teams, matches,
      standings: (standings && tournament && Array.isArray(tournament.categories) && tournament.categories.length > 0)
        ? (activeCategory ? (standings[activeCategory] || {}) : (standings[tournament.categories[0]] || {}))
        : standings,
      teamsLibrary, myTournaments,
    // navigation
    view, setView, selectedMatch, setSelectedMatch,
    activeCategory, setActiveCategory,
    // rôle
    role, setRole, refereeCode, lockRole,
    // actions tournoi
    updateTournament, closeTournament, startNewTournament,
    // actions équipes
    createTeam: (data) => createTeam({ ...data, category: activeCategory || data.category }),
    updateTeam, removeTeam,
    importFromLibrary: (libId, pool, options) => importFromLibrary(libId, pool, { ...options, category: (options && options.category) || activeCategory }),
    // bibliothèque
    removeFromLibrary, reloadLibrary, updateLibraryTeam,
    // follow
    followedTeamIds, toggleFollow,
    // actions matchs
    createMatch, updateMatch, removeMatch,
    submitScore: (params) => submitScore({ ...params, refereeCode }),
    shiftSchedule, generateSchedule, kickoffWave,
    // confirm
    askConfirm, closeConfirm,
    // auth
    signOut, user,
    handleRefereeCodeSubmit,
  };

  // Conditions d'affichage de la sidebar desktop
  const showSidebar = isDesktop && tournament && role === 'organizer' && !isPresentationMode;
  const SIDEBAR_W = 240;

  // Mode régie : rendu pur sans layout
  if (isPresentationMode && tournament) {
    return <PresentationView {...ctx} />;
  }
  
  return (
    <div key={user?.id || 'anon'} className="app" style={{
      minHeight: '100vh',
      background: '#050810',
      color: '#f1f5f9',
      fontFamily: "'Manrope', system-ui, sans-serif",
      position: 'relative',
      maxWidth: showSidebar ? 'none' : 480,
      margin: showSidebar ? 0 : '0 auto',
      paddingLeft: showSidebar ? SIDEBAR_W + 16 : 16,
      paddingRight: 16,
      boxSizing: 'border-box',
    }}>
      {showSidebar && (
        <DesktopSidebar
          tournament={tournament}
          view={view}
          setView={setView}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          myTournaments={myTournaments}
          onPickTournament={(id) => { setActiveTournamentId(id); setView('dashboard'); }}
          onCreateTournament={startNewTournament}
      onOpenCategoryManager={() => setCategoryManagerOpen(true)}
          onOpenParams={() => setParamsOpen(true)}
          signOut={signOut}
          role={role}
          onDeleteTournament={removeTournament}
          onGoToHub={() => setHubMode(true)}
          profile={profile}
          pendingRegistrations={pendingRegistrations}
        />
      )}
      {categoryManagerOpen && (
        <CategoryManager
          tournament={tournament}
          onClose={() => setCategoryManagerOpen(false)}
          onUpdate={updateTournament}
        />
      )}
      {wizardOpen && (
        <TournamentWizard
          onClose={() => setWizardOpen(false)}
          onCreate={handleWizardCreate}
        />
      )}
      {paramsOpen && tournament && (
        <TournamentWizard
          onClose={() => setParamsOpen(false)}
          onUpdate={handleWizardUpdate}
          existingTournament={tournament}
        />
      )}
      <TopBar {...ctx} profile={profile} accessCode={accessCode} />
      <AnnouncementBar tournamentId={tournament.id} />

      <main className="main">
        {view === 'dashboard' && <Dashboard {...ctx} />}
        {view === 'standings' && <Standings {...ctx} />}
        {view === 'library' && <LibraryView teamsLibrary={teamsLibrary} sponsors={[]} onRemoveFromLibrary={removeFromLibrary} onUpdateLibraryTeam={updateLibraryTeam} onAddToLibrary={addToLibrary} />}
        {view === 'format' && <FormatView {...ctx} />}
        {view === 'matches' && <MatchList {...ctx} />}
        {view === 'match' && selectedMatch && <MatchDetail {...ctx} />}
        {view === 'teams' && <TeamsView {...ctx} />}
        {view === 'schedule' && <ScheduleView {...ctx} />}
        {view === 'settings' && <SettingsView {...ctx} />}
        {view === 'roles' && <RoleSwitcher {...ctx} />}
        {view === 'follow' && <FollowView {...ctx} />}
        {view === 'presentation' && <PresentationView {...ctx} />}
        {view === 'account' && <AccountView signOut={signOut} />}
        {view === 'registrations' && <RegistrationManager tournament={tournament} onUpdateTournament={updateTournament} />}
        {view === 'checkin' && <CheckInView teams={teams} tournament={tournament} />}
        {view === 'poster' && <PosterView tournament={tournament} profile={profile} onBack={() => setView('dashboard')} />}
        {view === 'info' && <InfoView tournament={tournament} onBack={() => setView('dashboard')} />}
        {view === 'archives' && <ArchivesView {...ctx} setActiveTournament={(id) => { setActiveTournamentId(id); setView('dashboard'); }} />}
      </main>

      <SponsorTicker tournamentId={tournament.id} />
      <BottomNav {...ctx} />

      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={closeConfirm} />}
      <NotifStack
        notifs={notifs}
        teams={teams}
        onDismiss={dismissNotif}
        onTap={(matchId) => {
          const m = matches.find(x => x.id === matchId);
          if (m) { setSelectedMatch(m); setView('match'); }
        }}
      />
    </div>
  );
}
