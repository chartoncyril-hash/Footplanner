// ─────────────────────────────────────────────────────────────
// MOTEUR DE PHASE FINALE v2 — Champions / Europa League
// Logique pure (pas de Supabase). Validée par 12 cas de test.
// Voir transcript pour la conception détaillée.
// ─────────────────────────────────────────────────────────────

const isPow2 = (n) => n >= 1 && (n & (n - 1)) === 0;
const nextPow2 = (n) => {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
};

// Construit la liste des qualifiés (Champions + Europa) à partir des poules
export function buildQualifiers(pools, config) {
  const champions = [];
  const europa = [];
  const ordinal = (r) => `${r}${r === 1 ? "er" : "e"}`;
  pools.forEach((p) => {
    for (let rank = 1; rank <= config.qualifiersPerPool; rank++) {
      const entry = {
        slot: `${p}#${rank}`,
        label: `${ordinal(rank)} P.${p}`,
        pool: p,
        rank,
      };
      if (config.championsRanks.includes(rank)) champions.push(entry);
      else if (config.europaRanks.includes(rank)) europa.push(entry);
    }
  });
  return { champions, europa };
}

// Appariement croisé évitant les rencontres intra-poule au 1er tour
function crossPairs(entries) {
  const sorted = [...entries].sort(
    (a, b) => a.rank - b.rank || a.pool.localeCompare(b.pool),
  );
  const n = sorted.length;
  const used = new Array(n).fill(false);
  const pairs = [];
  for (let i = 0; i < n; i++) {
    if (used[i]) continue;
    used[i] = true;
    const mirror = n - 1 - i;
    const order = [];
    for (let d = 0; d < n; d++) {
      const cand = (mirror - d + n) % n;
      if (cand !== i) order.push(cand);
    }
    let partner = -1;
    for (const c of order)
      if (!used[c] && sorted[c].pool !== sorted[i].pool) {
        partner = c;
        break;
      }
    if (partner === -1)
      for (const c of order)
        if (!used[c]) {
          partner = c;
          break;
        }
    if (partner !== -1) {
      used[partner] = true;
      pairs.push([sorted[i], sorted[partner]]);
    } else pairs.push([sorted[i], null]);
  }
  return pairs;
}

const roundName = (slots) => {
  if (slots === 2) return "Finale";
  if (slots === 4) return "Demi-finales";
  if (slots === 8) return "Quarts de finale";
  if (slots === 16) return "8es de finale";
  return `Tour à ${slots}`;
};

// Bracket à élimination directe — gère tous les nombres (avec préliminaires)
function buildBracket(entries, cupKey, cupName) {
  const matches = [];
  if (entries.length < 2) return matches;
  const N = entries.length;
  const full = nextPow2(N);
  const byes = full - N;
  let feeders = [];
  let roundCounter = 1;

  if (byes === 0) {
    const pairs = crossPairs(entries);
    const label = roundName(full);
    pairs.forEach((pr, idx) => {
      const key = `${cupKey}1_${idx}`;
      matches.push({
        key,
        round: roundCounter,
        roundLabel: label,
        cup: cupName,
        phaseKind: "knockout",
        home: `slot:${pr[0].slot}`,
        homeLabel: pr[0].label,
        away: pr[1] ? `slot:${pr[1].slot}` : null,
        awayLabel: pr[1] ? pr[1].label : "Exempt",
      });
      feeders.push(`winner:${key}`);
    });
  } else {
    const ranked = [...entries].sort(
      (a, b) => a.rank - b.rank || a.pool.localeCompare(b.pool),
    );
    const exempt = ranked.slice(0, byes);
    const players = ranked.slice(byes);
    const prelimPairs = crossPairs(players);
    prelimPairs.forEach((pr, idx) => {
      const key = `${cupKey}P_${idx}`;
      matches.push({
        key,
        round: roundCounter,
        roundLabel: "Tour préliminaire",
        cup: cupName,
        phaseKind: "knockout",
        home: `slot:${pr[0].slot}`,
        homeLabel: pr[0].label,
        away: pr[1] ? `slot:${pr[1].slot}` : null,
        awayLabel: pr[1] ? pr[1].label : "Exempt",
      });
    });
    roundCounter++;
    feeders = [
      ...exempt.map((e) => ({ ref: `slot:${e.slot}`, label: e.label })),
      ...prelimPairs.map((_, idx) => ({
        ref: `winner:${cupKey}P_${idx}`,
        label: "Vainqueur prélim",
      })),
    ];
    const label = roundName(feeders.length);
    const half = feeders.length / 2;
    const next = [];
    for (let i = 0; i < half; i++) {
      const a = feeders[i];
      const b = feeders[feeders.length - 1 - i];
      const key = `${cupKey}${roundCounter}_${i}`;
      matches.push({
        key,
        round: roundCounter,
        roundLabel: label,
        cup: cupName,
        phaseKind: "knockout",
        home: a.ref,
        homeLabel: a.label,
        away: b ? b.ref : null,
        awayLabel: b ? b.label : "Exempt",
      });
      next.push(`winner:${key}`);
    }
    feeders = next;
  }

  while (feeders.length > 1) {
    roundCounter++;
    const label = roundName(feeders.length);
    const half = feeders.length / 2;
    const next = [];
    for (let i = 0; i < half; i++) {
      const a = feeders[i];
      const b = feeders[feeders.length - 1 - i];
      const key = `${cupKey}${roundCounter}_${i}`;
      matches.push({
        key,
        round: roundCounter,
        roundLabel: label,
        cup: cupName,
        phaseKind: "knockout",
        home: a,
        homeLabel: "Vainqueur",
        away: b,
        awayLabel: "Vainqueur",
      });
      next.push(`winner:${key}`);
    }
    if (half === 1) {
      matches.push({
        key: `${cupKey}_3RD`,
        round: roundCounter,
        roundLabel: "Match pour la 3e place",
        cup: cupName,
        phaseKind: "knockout",
        home: `loser:${feeders[0].replace("winner:", "")}`,
        homeLabel: "Perdant demi",
        away: `loser:${feeders[1].replace("winner:", "")}`,
        awayLabel: "Perdant demi",
      });
    }
    feeders = next;
  }
  return matches;
}

// Poules de classement à la Tournify + finales par ligue
function buildClassement(entries, cupKey, cupName, groupSize) {
  const matches = [];
  const sorted = [...entries].sort(
    (a, b) => a.rank - b.rank || a.pool.localeCompare(b.pool),
  );
  const total = sorted.length;
  const gsPref = groupSize || 4;
  const nGroups = Math.max(1, Math.round(total / gsPref));
  const groups = Array.from({ length: nGroups }, () => []);
  let gi = 0,
    dir = 1;
  for (let i = 0; i < total; i++) {
    groups[gi].push(sorted[i]);
    gi += dir;
    if (gi === nGroups) {
      gi = nGroups - 1;
      dir = -1;
    } else if (gi < 0) {
      gi = 0;
      dir = 1;
    }
  }
  const groupKeys = [];
  groups.forEach((group, idx) => {
    if (group.length < 2) return;
    const g = idx + 1;
    const gKey = `${cupKey}G${g}`;
    groupKeys.push({ gKey });
    let m = 0;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        m++;
        matches.push({
          key: `${gKey}_${m}`,
          round: g,
          roundLabel: `Poule de classement ${g} (${cupName})`,
          cup: cupName,
          group: gKey,
          phaseKind: "ranking",
          home: `slot:${group[i].slot}`,
          homeLabel: group[i].label,
          away: `slot:${group[j].slot}`,
          awayLabel: group[j].label,
        });
      }
    }
  });
  if (groupKeys.length >= 2) {
    const finalRound = nGroups + 1;
    const cupName2 =
      cupName === "champions" ? "Champions League" : "Europa League";
    matches.push({
      key: `${cupKey}_FINAL`,
      round: finalRound,
      roundLabel: `Finale ${cupName2}`,
      cup: cupName,
      phaseKind: "final",
      home: `rank:${groupKeys[0].gKey}#1`,
      homeLabel: "1er poule classement 1",
      away: `rank:${groupKeys[1].gKey}#1`,
      awayLabel: "1er poule classement 2",
    });
    matches.push({
      key: `${cupKey}_3RD`,
      round: finalRound,
      roundLabel: `Match 3e place ${cupName === "champions" ? "Champions" : "Europa"}`,
      cup: cupName,
      phaseKind: "3rd",
      home: `rank:${groupKeys[0].gKey}#2`,
      homeLabel: "2e poule classement 1",
      away: `rank:${groupKeys[1].gKey}#2`,
      awayLabel: "2e poule classement 2",
    });
  }
  return matches;
}

function buildCup(entries, cupKey, cupName, formatPref, groupSize) {
  if (entries.length < 2) return { format: "none", matches: [] };
  if (formatPref === "classement")
    return {
      format: "classement",
      matches: buildClassement(entries, cupKey, cupName, groupSize),
    };
  if (formatPref === "bracket")
    return {
      format: "bracket",
      matches: buildBracket(entries, cupKey, cupName),
    };
  if (isPow2(entries.length))
    return {
      format: "bracket",
      matches: buildBracket(entries, cupKey, cupName),
    };
  return {
    format: "classement",
    matches: buildClassement(entries, cupKey, cupName, groupSize),
  };
}

// Point d'entrée principal
export function buildFinals(pools, config) {
  const { champions, europa } = buildQualifiers(pools, config);
  return {
    qualifiers: { champions, europa },
    champions: buildCup(
      champions,
      "I",
      "champions",
      config.format,
      config.groupSize,
    ),
    europa: buildCup(europa, "J", "europa", config.format, config.groupSize),
  };
}

// Trie les matchs en vagues d'insertion (chaque vague ne dépend que des précédentes)
export function topoWaves(matches) {
  const byKey = {};
  matches.forEach((m) => {
    if (m.key) byKey[m.key] = m;
  });
  const deps = (m) => {
    const d = [];
    [m.home, m.away].forEach((ref) => {
      if (typeof ref === "string") {
        const mm = ref.match(/^(winner|loser):(.+)$/);
        if (mm && byKey[mm[2]]) d.push(mm[2]);
      }
    });
    return d;
  };
  const resolved = new Set();
  const waves = [];
  let remaining = [...matches];
  let guard = 0;
  while (remaining.length && guard < 100) {
    guard++;
    const ready = remaining.filter((m) =>
      deps(m).every((k) => resolved.has(k)),
    );
    if (ready.length === 0)
      return { error: "cycle", stuck: remaining.map((m) => m.key) };
    waves.push(ready);
    ready.forEach((m) => resolved.add(m.key));
    remaining = remaining.filter((m) => !ready.includes(m));
  }
  return { waves };
}
