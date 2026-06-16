import { supabase } from '../lib/supabase';
import { circleMethodRoundRobin, pickBracketSize, makeKnockoutPairs } from '../utils/scheduling';
import { buildFinals, topoWaves } from '../utils/finalsEngine';

// ============================================================
// matchService
// CRUD matchs + génération auto du planning + saisie de score arbitre
// ============================================================

export function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    pool: row.pool,
    category: row.category,
    cup: row.cup,
    phase: row.phase,
    knockoutRound: row.knockout_round,
    knockoutIndex: row.knockout_index,
    round: row.round,
    home: row.home_team_id || row.home_slot, // unifié pour le front : id ou "slot:..." ou "winner:..."
    away: row.away_team_id || row.away_slot,
    homeLabel: row.home_label,
    awayLabel: row.away_label,
    field: row.field,
    time: row.match_time,
    referee: row.referee,
    scoreHome: row.score_home,
    scoreAway: row.score_away,
    status: row.status,
    fairplayHome: row.fairplay_home,
    fairplayAway: row.fairplay_away,
    kickedOffAt: row.kicked_off_at,
  };
}

// Découpe la propriété 'home'/'away' du front en 2 colonnes db (team_id ou slot)
function teamRefToDb(value) {
  if (!value) return { id: null, slot: null };
  if (typeof value === 'string' && (value.startsWith('slot:') || value.startsWith('winner:') || value.startsWith('loser:'))) {
    return { id: null, slot: value };
  }
  return { id: value, slot: null };
}

function toDb(m) {
  const out = {};
  if (m.tournamentId !== undefined) out.tournament_id = m.tournamentId;
  if (m.pool !== undefined) out.pool = m.pool;
  if (m.category !== undefined) out.category = m.category;
  if (m.cup !== undefined) out.cup = m.cup;
  if (m.phase !== undefined) out.phase = m.phase;
  if (m.knockoutRound !== undefined) out.knockout_round = m.knockoutRound;
  if (m.knockoutIndex !== undefined) out.knockout_index = m.knockoutIndex;
  if (m.round !== undefined) out.round = m.round;
  if (m.home !== undefined) {
    const { id, slot } = teamRefToDb(m.home);
    out.home_team_id = id;
    out.home_slot = slot;
  }
  if (m.away !== undefined) {
    const { id, slot } = teamRefToDb(m.away);
    out.away_team_id = id;
    out.away_slot = slot;
  }
  if (m.homeLabel !== undefined) out.home_label = m.homeLabel;
  if (m.awayLabel !== undefined) out.away_label = m.awayLabel;
  if (m.field !== undefined) out.field = m.field;
  if (m.time !== undefined) out.match_time = m.time;
  if (m.referee !== undefined) out.referee = m.referee;
  if (m.scoreHome !== undefined) out.score_home = m.scoreHome;
  if (m.scoreAway !== undefined) out.score_away = m.scoreAway;
  if (m.status !== undefined) out.status = m.status;
  if (m.fairplayHome !== undefined) out.fairplay_home = m.fairplayHome;
  if (m.fairplayAway !== undefined) out.fairplay_away = m.fairplayAway;
  if (m.kickedOffAt !== undefined) out.kicked_off_at = m.kickedOffAt;
  return out;
}

// ----- Lectures -----

export async function listByTournament(tournamentId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('match_time', { ascending: true });
  if (error) throw error;
  return (data || []).map(fromDb);
}

// ----- Écritures (organisateur) -----

export async function create(tournamentId, input) {
  const payload = { ...toDb({ ...input, tournamentId }) };
  const { data, error } = await supabase
    .from('matches')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export async function update(id, patch) {
  const { data, error } = await supabase
    .from('matches')
    .update(toDb(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export async function remove(id) {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) throw error;
}

// Décale tous les matchs scheduled de delta minutes
export async function shiftSchedule(tournamentId, deltaMinutes) {
  // On lit, on calcule, on écrit en batch
  const { data, error } = await supabase
    .from('matches')
    .select('id, match_time, status, score_home, score_away')
    .eq('tournament_id', tournamentId)
    .in('status', ['scheduled', 'live']);
  if (error) throw error;
  const updates = (data || [])
    .filter(m => m.match_time)
    .filter(m => {
      // Exclure les matchs live qui ont déjà un score saisi (sinon on bouge un match en cours qui a un vrai score)
      if (m.status === 'live' && ((m.score_home || 0) > 0 || (m.score_away || 0) > 0)) return false;
      return true;
    })
    .map(m => {
      const [h, mn] = m.match_time.split(':').map(Number);
      const total = Math.max(0, Math.min(24 * 60 - 1, h * 60 + mn + deltaMinutes));
      const newH = Math.floor(total / 60);
      const newM = total % 60;
      return { id: m.id, match_time: `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:00` };
    });
  if (updates.length === 0) return;
    // Update un par un pour respecter les RLS (upsert batch est traité comme INSERT)
    for (const u of updates) {
      const { error: e2 } = await supabase
        .from('matches')
        .update({ match_time: u.match_time })
        .eq('id', u.id);
      if (e2) throw e2;
    }
  }

// ----- Saisie de score par un arbitre via le RPC sécurisé -----
// L'arbitre fournit le code arbitre du tournoi pour valider l'écriture
export async function submitScore({ matchId, refereeCode, scoreHome, scoreAway, status, fairplayHome, fairplayAway }) {
  const { data, error } = await supabase.rpc('submit_match_score', {
    p_match_id: matchId,
    p_referee_code: refereeCode,
    p_score_home: scoreHome,
    p_score_away: scoreAway,
    p_status: status,
    p_fairplay_home: fairplayHome ?? null,
    p_fairplay_away: fairplayAway ?? null,
  });
  if (error) throw error;
  return fromDb(data);
}

// ----- Génération automatique du planning -----
// Crée les matchs de poule (round-robin équilibré) + bracket d'élimination si activé.
// Ne touche pas aux matchs déjà joués/en cours.
export async function generateSchedule(tournament, teams, category) {
  const tournamentId = tournament.id;

  // 1. Récupérer matchs actuels et filtrer par catégorie si fournie
  const all = await listByTournament(tournamentId);
  const allInCategory = category ? all.filter(m => m.category === category) : all;
  const toKeep = allInCategory.filter(m => m.status === 'validated' || (m.status === 'live' && (m.scoreHome > 0 || m.scoreAway > 0)));
  const toDelete = allInCategory.filter(m => m.status === 'scheduled' || (m.status === 'live' && !(m.scoreHome > 0 || m.scoreAway > 0))).map(m => m.id);

  // Supprimer les anciens matchs scheduled
  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('matches')
      .delete()
      .in('id', toDelete);
    if (error) throw error;
  }

  // 2. Construction des nouveaux matchs en mémoire
  let fields = tournament.fields || ['T1', 'T2', 'T3', 'T4'];
  const knockoutFieldsList = Array.isArray(tournament.knockoutFields) && tournament.knockoutFields.length > 0
  ? tournament.knockoutFields
  : fields;
  const matchDur = (tournament.categoryDurations && category && tournament.categoryDurations[category])
  || (tournament.categoryDurations && tournament.categoryDurations[tournament.category])
  || tournament.matchDuration || 12;
  const pause = tournament.breakBetweenMatches ?? 3;
  const slotDur = matchDur + pause;

  const [sh, sm] = (tournament.startTime || '09:00').split(':').map(Number);
  let timeMinutes = sh * 60 + sm;
  let fieldIdx = 0;

  const fmtTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  const advance = () => {
    fieldIdx++;
    if (fieldIdx >= fields.length) {
      fieldIdx = 0;
      timeMinutes += slotDur;
    }
  };

  const generated = [];
  const pools = [...new Set(teams.map(t => t.pool))].sort();

  // ----- Phase poules -----
  const poolRounds = {};
  pools.forEach(pool => {
    const poolTeams = teams.filter(t => t.pool === pool);
    poolRounds[pool] = circleMethodRoundRobin(poolTeams);
  });
  const maxRounds = Math.max(0, ...pools.map(p => poolRounds[p].length));

  for (let r = 0; r < maxRounds; r++) {
    pools.forEach(pool => {
      const round = poolRounds[pool][r];
      if (!round) return;
      round.forEach(([a, b]) => {
        generated.push({
            tournament_id: tournamentId,
            pool,
            phase: 'pool',
            round: r + 1,
            home_team_id: a.id,
            away_team_id: b.id,
            status: 'scheduled',
            match_time: fmtTime(timeMinutes) + ':00',
            field: fields[fieldIdx],
                  referee: '',
                    category: category || null,
                  });
                  advance();
                  });
                  });
                  }
                  // ----- Phase finale (moteur v2 si activé) -----
  if (tournament.finalsEngine === 'v2' && tournament.hasKnockout && pools.length > 0) {
    fields = knockoutFieldsList;
    if (fieldIdx >= fields.length) fieldIdx = 0;

    // Configuration par défaut (sera pilotée par le wizard plus tard)
    const cfg = {
      qualifiersPerPool: tournament.knockoutFromTopN || 2,
      championsRanks: tournament.championsRanks || [1],
      europaRanks: tournament.europaRanks || [2],
      format: tournament.finalsFormat || 'auto',
      groupSize: tournament.finalsGroupSize || 4,
    };

    const poolNames = pools.map((p) => p.name || p);
    const finals = buildFinals(poolNames, cfg);

    // Concatène champions + europa, ordonne par round puis par cup pour placement horaire
    const allMatches = [
      ...finals.champions.matches.map((m) => ({ ...m, cupOrder: 0 })),
      ...finals.europa.matches.map((m) => ({ ...m, cupOrder: 1 })),
    ].sort((a, b) => a.round - b.round || a.cupOrder - b.cupOrder);

    const topo = topoWaves(allMatches);
    if (topo.error) {
      console.error('[finalsEngine v2] cycle de dépendances', topo);
      throw new Error('Impossible de planifier la phase finale (cycle détecté)');
    }

    // Saut logistique avant phase finale (cohérent avec legacy)
    if (fieldIdx > 0) { timeMinutes += slotDur; fieldIdx = 0; }
    timeMinutes += slotDur;

    // Insertion par vagues : on insère une vague, on récupère les UUID, on remappe les refs winner/loser des vagues suivantes
    const keyToUuid = {};
    const remap = (ref) => {
      if (typeof ref !== 'string') return ref;
      const m = ref.match(/^(winner|loser):(.+)$/);
      if (!m) return ref;
      const uuid = keyToUuid[m[2]];
      return uuid ? `${m[1]}:${uuid}` : ref;
    };

    let currentRound = null;
    for (const wave of topo.waves) {
      // Aligner sur un nouveau créneau si on change de round
      const wRound = wave[0].round;
      if (currentRound !== null && wRound !== currentRound && fieldIdx > 0) {
        timeMinutes += slotDur; fieldIdx = 0;
      }
      currentRound = wRound;

      const rows = wave.map((m) => {
        const hh = Math.floor(timeMinutes / 60);
        const mm = timeMinutes % 60;
        const field = fields[fieldIdx];
        const row = {
          tournament_id: tournament.id,
          category: category || null,
          phase: m.phaseKind || 'knockout',
          cup: m.cup || null,
          knockout_round: m.roundLabel,
          knockout_index: 0,
          round: m.round,
          home_team_id: null,
          away_team_id: null,
          home_slot: remap(m.home),
          away_slot: remap(m.away),
          home_label: m.homeLabel,
          away_label: m.awayLabel,
          field,
          match_time: `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`,
          status: 'scheduled',
        };
        advance();
        return row;
      });

      // Insert + récupération des UUID pour remapper la vague suivante
      const { data: inserted, error } = await supabase
        .from('matches')
        .insert(rows)
        .select('id');
      if (error) throw error;
      inserted.forEach((r, idx) => { keyToUuid[wave[idx].key] = r.id; });
    }

    return; // Court-circuite le legacy : tout est inséré.
  }

  // ----- Phase finale (legacy, inchangé) -----
  if (tournament.hasKnockout && pools.length > 0) {
    // Basculer sur les terrains dédiés à la phase finale
    fields = knockoutFieldsList;
    if (fieldIdx >= fields.length) fieldIdx = 0;
    const topN = tournament.knockoutFromTopN || 2;
    const qualifiedCount = pools.length * topN;
    const bracketSize = pickBracketSize(qualifiedCount);

    if (bracketSize >= 2) {
      // Espace logistique avant le bracket
      if (fieldIdx > 0) { timeMinutes += slotDur; fieldIdx = 0; }
      timeMinutes += slotDur;

      const qualified = [];
      pools.forEach(p => {
        for (let rank = 1; rank <= topN; rank++) {
          qualified.push({ slot: `${p}#${rank}`, label: `${rank}${rank === 1 ? 'er' : 'e'} P.${p}` });
        }
      });
      const seeds = qualified.slice(0, bracketSize);
      const pairsResult = makeKnockoutPairs(seeds, pools, topN, tournament.knockoutFormat);
      // Détection mode Multi-cup (pairsResult est un objet { champions, europa } au lieu d'un tableau)
      const isMultiCup = pairsResult && !Array.isArray(pairsResult) && pairsResult.champions !== undefined;
      const pairs = isMultiCup ? pairsResult.champions : pairsResult;
      // En multi-cup, le bracketSize Champions = pairs.length * 2 (pas le bracketSize global)
      const championsBracketSize = isMultiCup ? (pairs.length * 2) : bracketSize;
      const firstLabel = championsBracketSize === 16 ? 'r16' : championsBracketSize === 8 ? 'qf' : championsBracketSize === 4 ? 'sf' : 'final';
      // En multi-cup, on stocke la coupe ('champions' / 'europa')
      const currentCup = isMultiCup ? 'champions' : null;
      // 1er tour
      const tempIds = []; // on va re-utiliser ces matchs pour les rounds suivants
      pairs.forEach((pair, idx) => {
        const tempId = 'tmp_' + idx;
        tempIds.push(tempId);
        generated.push({
          _tempId: tempId,
          tournament_id: tournamentId,
          phase: 'knockout',
          knockout_round: firstLabel,
          knockout_index: idx,
          round: 1,
          home_slot: 'slot:' + pair[0].slot,
          away_slot: 'slot:' + pair[1].slot,
          home_label: pair[0].label,
          away_label: pair[1].label,
          status: 'scheduled',
          match_time: fmtTime(timeMinutes) + ':00',
          field: fields[fieldIdx],
          referee: '',
          category: category || null,
            cup: currentCup,
          });
          advance();
          });

          // === MULTI-CUP : créer aussi les matchs du 1er tour Europa ===
          const europaPairs = isMultiCup && Array.isArray(pairsResult.europa) ? pairsResult.europa : [];
          let europaFirstLabel = null;
        if (europaPairs.length > 0) {
        // En Multi-cup, Europa continue sur les terrains restants au même créneau si possible
        // Pas de saut horaire forcé : on enchaîne via advance() qui gère la rotation
        // Calculer la taille du bracket Europa (puissance de 2 contenant europaPairs.length)
          const europaBracketSize = europaPairs.length >= 8 ? 16 : europaPairs.length >= 4 ? 8 : europaPairs.length >= 2 ? 4 : 2;
          europaFirstLabel = europaBracketSize === 16 ? 'r16' : europaBracketSize === 8 ? 'qf' : europaBracketSize === 4 ? 'sf' : 'final';
          // 1er tour Europa
          europaPairs.forEach((pair, idx) => {
            const tempId = 'tmp_europa_' + idx;
            generated.push({
              _tempId: tempId,
              tournament_id: tournamentId,
              phase: 'knockout',
              knockout_round: europaFirstLabel,
              knockout_index: idx,
              round: 1,
              home_slot: 'slot:' + pair[0].slot,
              away_slot: 'slot:' + pair[1].slot,
              home_label: pair[0].label,
              away_label: pair[1].label,
              status: 'scheduled',
              match_time: fmtTime(timeMinutes) + ':00',
              field: fields[fieldIdx],
              referee: '',
              category: category || null,
              cup: 'europa',
            });
            advance();
          });
          }

          // Tours suivants : insertion en chaîne par ID retourné, donc on insère
      // par étapes pour pouvoir référencer les UUID réels
      // On passe par une insertion intermédiaire pour récupérer les vrais IDs
      // Pour rester simple ici, on stocke les IDs des matchs précédents en mémoire
      // après une insertion par lot.

      // Insertion du premier tour pour obtenir les IDs réels
      const firstRound = generated.filter(g => g._tempId);
      const cleanedFirst = firstRound.map(({ _tempId, ...rest }) => rest);

      // Insère tout ce qu'on a pour l'instant (poule + 1er tour ko)
      const poolMatches = generated.filter(g => !g._tempId && !g._roundLevel);
      const allFirst = [...poolMatches, ...cleanedFirst];

      const { data: insertedFirst, error: e1 } = await supabase
        .from('matches')
        .insert(allFirst)
        .select();
      // Récupère les UUID des matchs du 1er tour KO
      const koFirstByIndex = {};
      const koEuropaFirstByIndex = {};
      (insertedFirst || []).forEach(m => {
        if (m.phase === 'knockout') {
          if (m.knockout_round === firstLabel && (m.cup === 'champions' || m.cup === null)) {
            koFirstByIndex[m.knockout_index] = m.id;
          }
          if (m.cup === 'europa' && m.knockout_round === europaFirstLabel) {
            koEuropaFirstByIndex[m.knockout_index] = m.id;
          }
        }
      });

      // ============================================================
      // MULTI-CUP : générer les tours suivants de Champions + Europa
      // ============================================================
      if (isMultiCup) {
        async function generateCupRounds(firstByIndex, initialPairs, initialSize, cupName, skipFirstAdvance) {
          if (initialPairs.length === 0) return;
          let pIds = initialPairs.map((_, i) => firstByIndex[i]);
          // Le 1er tour est déjà créé avant le while, donc on démarre au tour d'après
          let s = initialSize / 4;
          let isFirstIteration = true;
          while (s >= 1) {
            // Pour la 1ère itération de generateCupRounds Europa, on peut continuer sur les terrains restants
            // Pour les autres, saut horaire normal
            if (!(isFirstIteration && skipFirstAdvance)) {
              if (fieldIdx > 0) { timeMinutes += slotDur; fieldIdx = 0; }
              timeMinutes += slotDur;
            }
            isFirstIteration = false;
            const lbl = s === 8 ? 'r16' : s === 4 ? 'qf' : s === 2 ? 'sf' : s === 1 ? 'final' : 'r' + (s * 2);
            const round = [];
            for (let i = 0; i < s; i++) {
              if (!pIds[i * 2] || !pIds[i * 2 + 1]) continue;
              round.push({
                tournament_id: tournamentId,
                phase: 'knockout',
                knockout_round: lbl,
                knockout_index: i,
                round: 1,
                home_slot: 'winner:' + pIds[i * 2],
                away_slot: 'winner:' + pIds[i * 2 + 1],
                home_label: s === 1 && pIds.length === 2 ? 'Vainqueur demi 1' : 'Vainqueur match ' + (i * 2 + 1),
                away_label: s === 1 && pIds.length === 2 ? 'Vainqueur demi 2' : 'Vainqueur match ' + (i * 2 + 2),
                status: 'scheduled',
                match_time: fmtTime(timeMinutes) + ':00',
                field: fields[fieldIdx],
                referee: '',
                category: category || null,
                cup: cupName,
              });
              advance();
            }
            if (s === 1 && pIds.length === 2 && tournament.hasThirdPlace !== false && pIds[0] && pIds[1]) {
              round.push({
                tournament_id: tournamentId,
                phase: 'knockout',
                knockout_round: '3rd',
                knockout_index: 0,
                round: 1,
                home_slot: 'loser:' + pIds[0],
                away_slot: 'loser:' + pIds[1],
                home_label: 'Perdant demi 1',
                away_label: 'Perdant demi 2',
                status: 'scheduled',
                match_time: fmtTime(timeMinutes) + ':00',
                field: fields[fieldIdx],
                referee: '',
                category: category || null,
                cup: cupName,
              });
              advance();
            }
            if (round.length === 0) break;
            const { data: insertedR, error: eR } = await supabase
              .from('matches')
              .insert(round)
              .select();
            if (eR) throw eR;
            const byIndex = {};
            (insertedR || []).forEach(m => {
              if (m.knockout_round === lbl) byIndex[m.knockout_index] = m.id;
            });
            pIds = Array.from({ length: s }, (_, i) => byIndex[i]);
            s = s / 2;
          }
        }
        await generateCupRounds(koFirstByIndex, pairs, championsBracketSize, 'champions', false);
        const europaBracketSize = europaPairs.length >= 8 ? 16 : europaPairs.length >= 4 ? 8 : europaPairs.length >= 2 ? 4 : 2;
        // Pour Europa, ne PAS sauter de créneau si on a encore des terrains dispo
        await generateCupRounds(koEuropaFirstByIndex, europaPairs, europaBracketSize, 'europa', fieldIdx > 0);
        return;
      }

      // ============================================================
      // STANDARD / CROSSED : génération classique des tours suivants
      // ============================================================
      let size = bracketSize / 4;
      let prevIds = pairs.map((_, i) => koFirstByIndex[i]);
      while (size >= 1) {
        if (fieldIdx > 0) { timeMinutes += slotDur; fieldIdx = 0; }
        timeMinutes += slotDur;

        const label = size === 8 ? 'r16' : size === 4 ? 'qf' : size === 2 ? 'sf' : size === 1 ? 'final' : 'r' + (size * 2);
        const newRound = [];
        for (let i = 0; i < size; i++) {
          newRound.push({
            tournament_id: tournamentId,
            phase: 'knockout',
            knockout_round: label,
            knockout_index: i,
            round: 1,
            home_slot: 'winner:' + prevIds[i * 2],
            away_slot: 'winner:' + prevIds[i * 2 + 1],
            home_label: size === 1 && prevIds.length === 2 ? 'Vainqueur demi 1' : 'Vainqueur match ' + (i * 2 + 1),
            away_label: size === 1 && prevIds.length === 2 ? 'Vainqueur demi 2' : 'Vainqueur match ' + (i * 2 + 2),
            status: 'scheduled',
            match_time: fmtTime(timeMinutes) + ':00',
            field: fields[fieldIdx],
            referee: '',
            category: category || null,
          });
          advance();
        }

        // Petite finale après les demis (uniquement si activée)
        // size === 1 = on crée la finale, prevIds contient les IDs des demi-finales
        if (size === 1 && prevIds.length === 2 && tournament.hasThirdPlace !== false) {
          newRound.push({
            tournament_id: tournamentId,
            phase: 'knockout',
            knockout_round: '3rd',
            knockout_index: 0,
            round: 1,
            home_slot: 'loser:' + prevIds[0],
            away_slot: 'loser:' + prevIds[1],
            home_label: 'Perdant demi 1',
            away_label: 'Perdant demi 2',
            status: 'scheduled',
            match_time: fmtTime(timeMinutes) + ':00',
            field: fields[fieldIdx],
            referee: '',
            category: category || null,
          });
          advance();
        }

        const { data: insertedRound, error: eR } = await supabase
          .from('matches')
          .insert(newRound)
          .select();
        if (eR) throw eR;

        const byIndex = {};
        (insertedRound || []).forEach(m => {
          if (m.knockout_round === label) byIndex[m.knockout_index] = m.id;
        });
        prevIds = Array.from({ length: size }, (_, i) => byIndex[i]);
        size = size / 2;
      }

      // ============================================================
      // CONSOLATION : matchs 5e à 8e place
      // Uniquement si bracketSize === 8 + mode Standard/Crossed + hasConsolation activé
      // ============================================================
      if (tournament.hasConsolation && bracketSize === 8 && !isMultiCup) {
        // Récupérer les IDs des matchs de quarts (déjà créés au 1er tour, label 'qf')
        const qfIds = [
          koFirstByIndex[0],
          koFirstByIndex[1],
          koFirstByIndex[2],
          koFirstByIndex[3],
        ];

        // Vérifier qu'on a bien 4 quarts (sinon on skip)
        if (qfIds.every(id => id)) {
          // Espace logistique
          if (fieldIdx > 0) { timeMinutes += slotDur; fieldIdx = 0; }
          timeMinutes += slotDur;

          // 1. DEMI-CONSOLATION (2 matchs avec les perdants des quarts)
          // Appariement : Perdant QF1 vs Perdant QF4 / Perdant QF2 vs Perdant QF3
          const consoSfRound = [
            {
              tournament_id: tournamentId,
              phase: 'knockout',
              knockout_round: 'sf_conso',
              knockout_index: 0,
              round: 1,
              home_slot: 'loser:' + qfIds[0],
              away_slot: 'loser:' + qfIds[3],
              home_label: 'Perdant quart 1',
              away_label: 'Perdant quart 4',
              status: 'scheduled',
              match_time: fmtTime(timeMinutes) + ':00',
              field: fields[fieldIdx],
              referee: '',
              category: category || null,
            },
          ];
          advance();
          consoSfRound.push({
            tournament_id: tournamentId,
            phase: 'knockout',
            knockout_round: 'sf_conso',
            knockout_index: 1,
            round: 1,
            home_slot: 'loser:' + qfIds[1],
            away_slot: 'loser:' + qfIds[2],
            home_label: 'Perdant quart 2',
            away_label: 'Perdant quart 3',
            status: 'scheduled',
            match_time: fmtTime(timeMinutes) + ':00',
            field: fields[fieldIdx],
            referee: '',
            category: category || null,
          });
          advance();

          // Insertion des demi-conso pour récupérer leurs IDs
          const { data: insertedConsoSf, error: eCS } = await supabase
            .from('matches')
            .insert(consoSfRound)
            .select();
          if (eCS) throw eCS;
          const consoSfByIndex = {};
          (insertedConsoSf || []).forEach(m => {
            if (m.knockout_round === 'sf_conso') consoSfByIndex[m.knockout_index] = m.id;
          });

          // 2. FINALE 5e/6e + MATCH 7e/8e
          if (consoSfByIndex[0] && consoSfByIndex[1]) {
            if (fieldIdx > 0) { timeMinutes += slotDur; fieldIdx = 0; }
            timeMinutes += slotDur;

            const consoFinalsRound = [
              // Match 5e/6e : Vainqueurs des demi-conso
              {
                tournament_id: tournamentId,
                phase: 'knockout',
                knockout_round: '5th',
                knockout_index: 0,
                round: 1,
                home_slot: 'winner:' + consoSfByIndex[0],
                away_slot: 'winner:' + consoSfByIndex[1],
                home_label: 'Vainqueur demi conso 1',
                away_label: 'Vainqueur demi conso 2',
                status: 'scheduled',
                match_time: fmtTime(timeMinutes) + ':00',
                field: fields[fieldIdx],
                referee: '',
                category: category || null,
              },
            ];
            advance();
            // Match 7e/8e : Perdants des demi-conso
            consoFinalsRound.push({
              tournament_id: tournamentId,
              phase: 'knockout',
              knockout_round: '7th',
              knockout_index: 0,
              round: 1,
              home_slot: 'loser:' + consoSfByIndex[0],
              away_slot: 'loser:' + consoSfByIndex[1],
              home_label: 'Perdant demi conso 1',
              away_label: 'Perdant demi conso 2',
              status: 'scheduled',
              match_time: fmtTime(timeMinutes) + ':00',
              field: fields[fieldIdx],
              referee: '',
              category: category || null,
            });
            advance();

            const { error: eCF } = await supabase
              .from('matches')
              .insert(consoFinalsRound);
            if (eCF) throw eCF;
          }
        }
      }

      return; // tout a été inséré au fur et à mesure
    }
  }

  // Si pas de phase finale, on insère juste les matchs de poule en bloc
  if (generated.length > 0) {
    const cleaned = generated.map(({ _tempId, _roundLevel, ...rest }) => rest);
    const { error } = await supabase.from('matches').insert(cleaned);
    if (error) throw error;
  }
}

export const matchService = {
  listByTournament,
  create,
  update,
  remove,
  shiftSchedule,
  submitScore,
  generateSchedule,
};
