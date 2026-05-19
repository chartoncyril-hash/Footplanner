// ============================================================
// Utilitaires de scheduling — logique pure, pas de dépendance Supabase
// Extrait du monolithe pour être testable et réutilisable
// ============================================================

// Round-robin équilibré (méthode du cercle)
// Renvoie un tableau de rounds, chaque round = liste de paires [teamA, teamB]
export function circleMethodRoundRobin(teamsArr) {
  const list = [...teamsArr];
  if (list.length < 2) return [];
  const hasBye = list.length % 2 === 1;
  if (hasBye) list.push({ id: '__bye__', short: 'BYE' });
  const n = list.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a.id !== '__bye__' && b.id !== '__bye__') {
        round.push([a, b]);
      }
    }
    rounds.push(round);
    list.splice(1, 0, list.pop());
  }
  return rounds;
}

// Plus grande puissance de 2 contenue dans qualifiedCount, max 16
export function pickBracketSize(qualifiedCount) {
  if (qualifiedCount < 2) return 0;
  if (qualifiedCount >= 16) return 16;
  if (qualifiedCount >= 8) return 8;
  if (qualifiedCount >= 4) return 4;
  return 2;
}

// Construit les paires du 1er tour de phase finale selon le format choisi
// format: 'standard' (default) | 'crossed' | 'multicup'
// Pour 'multicup', retourne un objet { champions: [...], europa: [...] } au lieu d'un tableau
export function makeKnockoutPairs(seeds, pools, topN, format) {
  const size = seeds.length;
  if (size === 2) return [[seeds[0], seeds[1]]];

  // Grouper les seeds par rang (1er, 2e, etc.)
  const byRank = {};
  seeds.forEach(s => {
    const [, rank] = s.slot.split('#');
    if (!byRank[rank]) byRank[rank] = [];
    byRank[rank].push(s);
  });
  const ranks = Object.keys(byRank).sort();
  const firsts = byRank[ranks[0]] || [];
  const seconds = byRank[ranks[1]] || [];

  // ---------- Format CROSSED ----------
  // 1er A vs 2e A, 1er B vs 2e B : chaque poule garde ses équipes
  if (format === 'crossed') {
    const pairs = [];
    firsts.forEach(a => {
      const [aPool] = a.slot.split('#');
      const partner = seconds.find(s => {
        const [bPool] = s.slot.split('#');
        return bPool === aPool;
      });
      if (partner) pairs.push([a, partner]);
    });
    // Reste (3es, 4es...)
    for (let r = 2; r < ranks.length; r++) {
      const group = byRank[ranks[r]];
      for (let i = 0; i < group.length; i += 2) {
        if (group[i + 1]) pairs.push([group[i], group[i + 1]]);
      }
    }
    return pairs.slice(0, size / 2);
  }

  // ---------- Format MULTICUP ----------
  // 2 brackets séparés : 1ers entre eux (Champions) + 2es entre eux (Europa)
  if (format === 'multicup') {
    const championsPairs = [];
    const europaPairs = [];
    // Appariement classique au sein des 1ers (positions opposées)
    for (let i = 0; i < firsts.length / 2; i++) {
      const a = firsts[i];
      const b = firsts[firsts.length - 1 - i];
      if (a && b && a.slot !== b.slot) championsPairs.push([a, b]);
    }
    // Idem pour les 2es
    for (let i = 0; i < seconds.length / 2; i++) {
      const a = seconds[i];
      const b = seconds[seconds.length - 1 - i];
      if (a && b && a.slot !== b.slot) europaPairs.push([a, b]);
    }
    return { champions: championsPairs, europa: europaPairs };
  }

  // ---------- Format STANDARD (défaut) ----------
  // 1er A vs 2e B, 1er B vs 2e A (croisement classique)
  const pairs = [];
  const used = new Set();
  for (let i = 0; i < firsts.length; i++) {
    const a = firsts[i];
    let b = null;
    for (let off = 1; off < seconds.length + 1; off++) {
      const candidate = seconds[(i + off) % seconds.length];
      if (candidate && !used.has(candidate.slot)) {
        const [aPool] = a.slot.split('#');
        const [bPool] = candidate.slot.split('#');
        if (aPool !== bPool) { b = candidate; break; }
      }
    }
    if (!b) {
      b = seconds.find(s => !used.has(s.slot)) || firsts.find(s => s.slot !== a.slot && !used.has(s.slot));
    }
    if (b) { pairs.push([a, b]); used.add(b.slot); }
  }
  for (let r = 2; r < ranks.length; r++) {
    const group = byRank[ranks[r]];
    for (let i = 0; i < group.length; i += 2) {
      if (group[i + 1]) pairs.push([group[i], group[i + 1]]);
    }
  }
  return pairs.slice(0, size / 2);
}

export function knockoutRoundLabel(round, cup) {
  const base = {
    r16: '8es de finale',
    qf: 'Quarts de finale',
    sf: 'Demi-finales',
    final: 'Finale',
    '3rd': 'Match pour la 3e place',
    sf_conso: 'Demi-finale consolation',
    '5th': 'Match pour la 5e place',
    '7th': 'Match pour la 7e place',
  }[round] || round;
  const shortRound = {
    r16: '8es',
    qf: 'Quarts',
    sf: 'Demi',
    final: 'Finale',
    '3rd': '3e place',
    sf_conso: 'Demi conso',
    '5th': '5e place',
    '7th': '7e place',
  }[round] || round;
  if (cup === 'champions') return '🏆 ' + shortRound;
  if (cup === 'europa') return '🥈 ' + shortRound;
  return base;
}

// Variante pour affichage sur 2 lignes (utilisée dans le calendrier compact)
export function knockoutRoundLabelLines(round, cup) {
  const shortRound = {
    r16: '8es',
    qf: 'Quarts',
    sf: 'Demi',
    final: 'Finale',
    '3rd': '3e place',
    sf_conso: 'Demi conso',
    '5th': '5e place',
    '7th': '7e place',
  }[round] || round;
  const base = {
    r16: '8es de finale',
    qf: 'Quarts de finale',
    sf: 'Demi-finales',
    final: 'Finale',
    '3rd': '3e place',
    sf_conso: 'Demi consolation',
    '5th': '5e place',
    '7th': '7e place',
  }[round] || round;
  if (cup === 'champions') return { line1: '🏆 Champions', line2: shortRound };
  if (cup === 'europa') return { line1: '🥈 Europa', line2: shortRound };
  return { line1: base, line2: null };
}
