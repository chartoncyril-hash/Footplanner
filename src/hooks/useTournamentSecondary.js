import { useState, useEffect, useCallback } from 'react';
import { followService, sponsorService, announcementService } from '../services';

// ============================================================
// useFollowedTeams — équipes suivies par l'utilisateur connecté
// ============================================================
export function useFollowedTeams(tournamentId) {
  const [followedIds, setFollowedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!tournamentId) { setFollowedIds([]); setLoading(false); return; }
    setLoading(true);
    try {
      const ids = await followService.listMine(tournamentId);
      setFollowedIds(ids);
    } catch (e) {
      console.error('useFollowedTeams', e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { reload(); }, [reload]);

  const follow = useCallback(async (teamId) => {
    await followService.follow(tournamentId, teamId);
    setFollowedIds(prev => prev.includes(teamId) ? prev : [...prev, teamId]);
  }, [tournamentId]);

  const unfollow = useCallback(async (teamId) => {
    await followService.unfollow(teamId);
    setFollowedIds(prev => prev.filter(id => id !== teamId));
  }, []);

  const toggle = useCallback(async (teamId) => {
    if (followedIds.includes(teamId)) await unfollow(teamId);
    else await follow(teamId);
  }, [followedIds, follow, unfollow]);

  return { followedIds, loading, follow, unfollow, toggle };
}

// ============================================================
// useAnnouncements — annonces d'un tournoi
// ============================================================
export function useAnnouncements(tournamentId) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!tournamentId) { setList([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await announcementService.listByTournament(tournamentId);
      setList(data);
    } catch (e) {
      console.error('useAnnouncements', e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async ({ message, type }) => {
    const a = await announcementService.create(tournamentId, { message, type });
    setList(prev => [a, ...prev]);
    return a;
  }, [tournamentId]);

  const remove = useCallback(async (id) => {
    await announcementService.remove(id);
    setList(prev => prev.filter(a => a.id !== id));
  }, []);

  return { list, loading, create, remove, reload };
}

// ============================================================
// useSponsors — sponsors d'un tournoi + bibliothèque
// ============================================================
export function useSponsors(tournamentId) {
  const [list, setList] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!tournamentId) { setList([]); setLoading(false); return; }
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        sponsorService.listByTournament(tournamentId),
        sponsorService.listLibrary().catch(() => []), // si pas auth, pas de lib
      ]);
      setList(s);
      setLibrary(l);
    } catch (e) {
      console.error('useSponsors', e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async ({ name, logo }) => {
    const s = await sponsorService.create(tournamentId, { name, logo });
    setList(prev => [...prev, s]);
    // recharge la bibliothèque (un nouvel ajout l'enrichit)
    sponsorService.listLibrary().then(setLibrary).catch(() => {});
    return s;
  }, [tournamentId]);

  const remove = useCallback(async (id) => {
    await sponsorService.remove(id);
    setList(prev => prev.filter(s => s.id !== id));
  }, []);

  const removeLibrary = useCallback(async (libraryId) => {
    await sponsorService.removeFromLibrary(libraryId);
    setLibrary(prev => prev.filter(s => s.libraryId !== libraryId));
  }, []);

  const importFromLibrary = useCallback(async (libraryId) => {
    const s = await sponsorService.importFromLibrary(tournamentId, libraryId);
    setList(prev => [...prev, s]);
    return s;
  }, [tournamentId]);

  return { list, library, loading, create, remove, removeLibrary, importFromLibrary, reload };
}
