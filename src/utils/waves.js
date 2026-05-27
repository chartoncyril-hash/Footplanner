// ============================================================
// waves.js — gestion des "vagues" de matchs (lancement groupé)
// ============================================================

export function groupScheduledByTime(matches) {
  if (!matches) return [];
  const grouped = {};
  matches.forEach(m => {
    if (m.status !== 'scheduled') return;
    if (!m.time) return;
    const time = m.time.slice(0, 5);
    if (!grouped[time]) grouped[time] = [];
    grouped[time].push(m);
  });
  return Object.keys(grouped)
    .sort()
    .map(time => ({ time, matches: grouped[time] }));
}

export function getNextWave(matches) {
  const waves = groupScheduledByTime(matches);
  return waves[0] || null;
}

export function getWaveTimingStatus(wave, tournamentDate) {
  if (!wave || !tournamentDate) {
    return { onTime: true, lateMin: 0, status: 'ontime' };
  }
  const now = new Date();
  const matchDate = new Date(tournamentDate + 'T' + wave.time + ':00');
  const diffMin = (matchDate - now) / 60000;

  if (diffMin >= 5) return { onTime: true, lateMin: 0, status: 'ontime' };
  if (diffMin >= 0) return { onTime: true, lateMin: 0, status: 'soon' };
  return { onTime: false, lateMin: Math.abs(Math.round(diffMin)), status: 'late' };
}

export function getWaveColor(status) {
  switch (status) {
    case 'late':   return '#fb7185';
    case 'soon':   return '#facc15';
    default:       return '#a3e635';
  }
}

export function getWaveStatusLabel(timing) {
  if (timing.status === 'late') return 'EN RETARD DE ' + timing.lateMin + ' MIN';
  if (timing.status === 'soon') return 'IMMINENT';
  return 'A LANCER';
}
