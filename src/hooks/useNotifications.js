import { useState, useEffect, useRef, useCallback } from 'react';
import { getMatchDuration } from '../utils/tournament';

// ============================================================
// useNotifications — moteur de notifications in-app (toasts)
//
// Détecte :
//   - scheduled → live : "Le match commence !" (spectateur si équipe suivie)
//   - score change pendant live : "Score : X-Y"
//   - live → validated : "Score final : X-Y"
//   - T-5min match scheduled : "Le match débute dans 5 min" (spectateur si équipe suivie)
//   - T-5min match scheduled : "Tu arbitres ce match dans 5 min" (arbitre)
//   - match live depuis > durée : "Pense à saisir le score" (arbitre)
//
// Dépendances : matches, role, followedIds, tournament.date / category
// Retourne : notifs (array), dismiss(id), pushManual({kind, title, message})
// ============================================================
export function useNotifications({ matches, tournament, role, followedIds }) {
  const [notifs, setNotifs] = useState([]);
  const [sentKeys, setSentKeys] = useState({});
  const prevMatchesRef = useRef(null);
  const tickRef = useRef(0);

  // Tick périodique pour réévaluer T-5min etc.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30 * 1000); // 30s
    return () => clearInterval(id);
  }, []);

  const dismiss = useCallback((id) => {
    setNotifs(curr => curr.filter(n => n.id !== id));
  }, []);

  const pushManual = useCallback((toast) => {
    const t = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      ...toast,
    };
    setNotifs(prev => [...prev, t]);
    setTimeout(() => dismiss(t.id), 5000);
  }, [dismiss]);

  useEffect(() => {
    if (!matches) return;

    const prev = prevMatchesRef.current;
    const newToasts = [];
    const newSent = { ...sentKeys };

    const isFollowed = (m) =>
      (m.home && followedIds?.includes(m.home))
      || (m.away && followedIds?.includes(m.away));

    const isReferee = role === 'referee';
    const isSpec = role === 'spectator' || role === 'coach';

    // ===== Transitions (besoin du previous state) =====
    if (prev) {
      matches.forEach(m => {
        const previous = prev.find(x => x.id === m.id);
        if (!previous) return;

        // scheduled → live
        if (previous.status === 'scheduled' && m.status === 'live') {
          const key = m.id + '_started';
          if (!newSent[key] && isSpec && isFollowed(m)) {
            newToasts.push(makeToast('start', m, 'Le match commence !'));
            newSent[key] = true;
          }
        }

        // score change pendant live
        if (previous.status === 'live' && m.status === 'live') {
          const scoreChanged =
            previous.scoreHome !== m.scoreHome || previous.scoreAway !== m.scoreAway;
          if (scoreChanged && isSpec && isFollowed(m)) {
            newToasts.push(makeToast('score', m, `Score : ${m.scoreHome ?? 0} - ${m.scoreAway ?? 0}`));
          }
        }

        // live → validated
        if (previous.status === 'live' && m.status === 'validated') {
          const key = m.id + '_ended';
          if (!newSent[key] && isSpec && isFollowed(m)) {
            newToasts.push(makeToast('end', m, `Score final : ${m.scoreHome} - ${m.scoreAway}`));
            newSent[key] = true;
          }
        }
      });
    }

    // ===== T-5min et reminders (sans previous state, tick périodique) =====
    const now = new Date();
    const matchDur = getMatchDuration(tournament);

    matches.forEach(m => {
      if (!m.time || !tournament?.date) return;

      // Construit une date complète à partir de tournament.date + m.time
      const timeStr = (m.time || '').slice(0, 5);
      if (!timeStr) return;
      const matchDate = new Date(`${tournament.date}T${timeStr}:00`);
      const minsToStart = (matchDate - now) / 60000;

      // T-5min sur scheduled
      if (m.status === 'scheduled' && minsToStart > 0 && minsToStart <= 5) {
        if (isSpec && isFollowed(m)) {
          const key = m.id + '_soon_spec';
          if (!newSent[key]) {
            newToasts.push(makeToast('soon', m, 'Le match débute dans 5 minutes'));
            newSent[key] = true;
          }
        }
        if (isReferee) {
          const key = m.id + '_soon_ref';
          if (!newSent[key]) {
            newToasts.push(makeToast('ref_soon', m, 'Tu arbitres ce match dans 5 min'));
            newSent[key] = true;
          }
        }
      }

      // Reminder saisie score : match live depuis > durée prévue
      if (m.status === 'live' && isReferee) {
        const minsLive = (now - matchDate) / 60000;
        if (minsLive >= matchDur) {
          const key = m.id + '_remind_score';
          if (!newSent[key]) {
            newToasts.push(makeToast('ref_remind', m, 'Pense à saisir le score final'));
            newSent[key] = true;
          }
        }
      }
    });

    if (newToasts.length > 0) {
      setNotifs(prev => [...prev, ...newToasts]);
      setSentKeys(newSent);
      newToasts.forEach(t => setTimeout(() => dismiss(t.id), 5000));
    }

    prevMatchesRef.current = matches;
  }, [matches, role, followedIds, tournament, dismiss]);
  // Note : sentKeys volontairement absent des deps — on lit la dernière valeur via setSentKeys

  return { notifs, dismiss, pushManual };
}

function makeToast(kind, match, title) {
  return {
    id: 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    kind,
    matchId: match?.id,
    homeId: match?.home,
    awayId: match?.away,
    title,
  };
}
