import { useState, useEffect, useCallback, useMemo } from 'react';
import { tournamentService } from '../services/tournamentService';
import { teamService } from '../services/teamService';
import { matchService } from '../services/matchService';
import { computeStandings } from '../utils/standings';

// ============================================================
// useTournament — charge un tournoi par id ou par accessCode
// ============================================================
export function useTournament({ id, accessCode } = {}) {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      let t = null;
      if (id) t = await tournamentService.getById(id);
      else if (accessCode) t = await tournamentService.getByAccessCode(accessCode);
      setTournament(t);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id, accessCode]);

  useEffect(() => { reload(); }, [reload]);

  const update = useCallback(async (patch) => {
    if (!tournament) return;
    const next = await tournamentService.update(tournament.id, patch);
    setTournament(next);
    return next;
  }, [tournament]);

  return { tournament, loading, error, reload, update };
}

// ============================================================
// useMyTournaments — liste les tournois de l'organisateur connecté
// ============================================================
export function useMyTournaments() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const data = await tournamentService.listMine();
      setList(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (input) => {
    const t = await tournamentService.create(input);
    setList(prev => [t, ...prev]);
    return t;
  }, []);

  const archive = useCallback(async (id) => {
    const t = await tournamentService.archive(id);
    setList(prev => prev.map(x => x.id === id ? t : x));
    return t;
  }, []);

  const remove = useCallback(async (id) => {
    await tournamentService.remove(id);
    setList(prev => prev.filter(x => x.id !== id));
  }, []);

  const updateInList = useCallback((id, patch) => {
    setList(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
  }, []);
  return { list, loading, error, reload, create, archive, remove, updateInList };
}

// ============================================================
// useTeams — équipes d'un tournoi
// ============================================================
export function useTeams(tournamentId) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!tournamentId) { setTeams([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await teamService.listByTournament(tournamentId);
      setTeams(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (input) => {
    const t = await teamService.create(tournamentId, input);
    setTeams(prev => [...prev, t]);
    return t;
  }, [tournamentId]);

  const update = useCallback(async (id, patch) => {
    const t = await teamService.update(id, patch);
    setTeams(prev => prev.map(x => x.id === id ? t : x));
    return t;
  }, []);

  const remove = useCallback(async (id) => {
    await teamService.remove(id);
    setTeams(prev => prev.filter(t => t.id !== id));
  }, []);

  const importFromLibrary = useCallback(async (libraryId, targetPool, options) => {
    const t = await teamService.importFromLibrary(tournamentId, libraryId, targetPool, options);
    setTeams(prev => [...prev, t]);
    return t;
  }, [tournamentId]);

  return { teams, loading, error, reload, create, update, remove, importFromLibrary };
}

// ============================================================
// useTeamLibrary — bibliothèque persistante de l'organisateur
// ============================================================
export function useTeamLibrary() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teamService.listLibrary();
      setLibrary(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const remove = useCallback(async (libraryId) => {
      await teamService.removeFromLibrary(libraryId);
      setLibrary(prev => prev.filter(t => t.libraryId !== libraryId));
    }, []);
    const update = useCallback(async (libraryId, patch) => {
      const updated = await teamService.updateLibrary(libraryId, patch);
      setLibrary(prev => prev.map(t => t.libraryId === libraryId ? updated : t));
      return updated;
    }, []);
  const add = useCallback(async (input) => {
      const newItem = await teamService.addToLibrary(input);
      setLibrary(prev => [...prev, newItem]);
      return newItem;
    }, []);
    return { library, loading, error, reload, remove, update, add };
}

// ============================================================
// useMatches — matchs d'un tournoi
// ============================================================
export function useMatches(tournamentId) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!tournamentId) { setMatches([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await matchService.listByTournament(tournamentId);
      setMatches(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (input) => {
    const m = await matchService.create(tournamentId, input);
    setMatches(prev => [...prev, m]);
    return m;
  }, [tournamentId]);

  const update = useCallback(async (id, patch) => {
    const m = await matchService.update(id, patch);
    setMatches(prev => prev.map(x => x.id === id ? m : x));
    return m;
  }, []);

  const remove = useCallback(async (id) => {
    await matchService.remove(id);
    setMatches(prev => prev.filter(m => m.id !== id));
  }, []);

  const submitScore = useCallback(async (params) => {
    const m = await matchService.submitScore(params);
    setMatches(prev => prev.map(x => x.id === params.matchId ? m : x));
    return m;
  }, []);

  const shiftSchedule = useCallback(async (deltaMinutes) => {
    await matchService.shiftSchedule(tournamentId, deltaMinutes);
    await reload();
  }, [tournamentId, reload]);

  const generateSchedule = useCallback(async (tournament, teams, category) => {
    await matchService.generateSchedule(tournament, teams, category);
    await reload();
  }, [reload]);

  return {
    matches, loading, error, reload,
    create, update, remove, submitScore, shiftSchedule, generateSchedule,
  };
}

// ============================================================
// useStandings — calcul mémoïsé du classement
// ============================================================
export function useStandings(teams, matches, tournament) {
  return useMemo(() => {
    if (!tournament || !teams) return {};
    // Si le tournoi a plusieurs catégories, calculer un standings par catégorie
    if (Array.isArray(tournament.categories) && tournament.categories.length > 0) {
      const byCategory = {};
      tournament.categories.forEach(cat => {
        const teamsCat = teams.filter(t => t.category === cat);
        const matchesCat = (matches || []).filter(m => m.category === cat);
        byCategory[cat] = computeStandings(teamsCat, matchesCat, tournament);
      });
      return byCategory;
    }
    // Fallback monocategorie (ancien comportement)
    return computeStandings(teams, matches || [], tournament);
  }, [teams, matches, tournament]);
}
