// ============================================================
// feasibility.js
// Calcule si un tournoi rentre dans sa fenêtre temporelle
// ============================================================

/**
 * Calcule le nombre de minutes disponibles par jour
 * en soustrayant les pauses de la fenêtre temporelle.
 */
function minutesPerDay(startTime, endTime, breaks) {
  const toMin = (t) => {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return h * 60 + m;
  };
  const total = toMin(endTime) - toMin(startTime);
  if (total <= 0) return 0;
  const breakMin = (breaks || []).reduce((acc, b) => {
    const dur = toMin(b.to) - toMin(b.from);
    return acc + (dur > 0 ? dur : 0);
  }, 0);
  return Math.max(0, total - breakMin);
}

/**
 * Calcule le nombre de jours du tournoi.
 */
function countDays(startDate, endDate) {
  if (!startDate) return 1;
  if (!endDate || endDate <= startDate) return 1;
  const d1 = new Date(startDate);
  const d2 = new Date(endDate);
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

/**
 * Estime le nombre de matchs de poules.
 * Formule : n équipes dans une poule → n*(n-1)/2 matchs
 */
function estimatePoolMatches(nbTeams, nbPools) {
  if (!nbTeams || !nbPools || nbPools === 0) return 0;
  const teamsPerPool = Math.ceil(nbTeams / nbPools);
  const matchesPerPool = (teamsPerPool * (teamsPerPool - 1)) / 2;
  return matchesPerPool * nbPools;
}

/**
 * Estime le nombre de matchs de phase finale.
 * Basé sur le nombre d'équipes qualifiées.
 */
function estimateKnockoutMatches(nbTeams, nbPools, qualifiedPerPool, hasKnockout, hasThirdPlace, hasConsolation, knockoutFormat) {
  if (!hasKnockout) return 0;
  const qualified = nbPools * qualifiedPerPool;
  if (qualified < 2) return 0;

  // Taille du bracket (puissance de 2 supérieure)
  let bracketSize = 2;
  while (bracketSize < qualified) bracketSize *= 2;

  let matches = bracketSize - 1; // matches d'un bracket simple
  if (hasThirdPlace) matches += 1;
  if (hasConsolation && bracketSize === 8) matches += 4; // sf_conso + 5th + 7th

  // Multicup : double bracket (Champions + Europa)
  if (knockoutFormat === 'multicup') matches = matches * 2;

  return matches;
}

/**
 * Fonction principale de faisabilité.
 * Retourne { ok, capacity, required, deficit, message }
 */
export function checkFeasibility({ 
  startDate, endDate, startTime, endTime, breaks,
  fields, matchDurationMin, pauseMin,
  nbTeams, nbPools, qualifiedPerPool,
  hasKnockout, hasThirdPlace, hasConsolation, knockoutFormat
}) {
  const slotDur = parseInt(matchDurationMin, 10) + parseInt(pauseMin, 10);
  if (slotDur <= 0) return { ok: true };

  const days = countDays(startDate, endDate);
  const minPerDay = minutesPerDay(startTime, endTime, breaks);
  const slotsPerDayPerField = Math.floor(minPerDay / slotDur);
  const totalSlots = slotsPerDayPerField * days * parseInt(fields, 10);

  const poolMatches = estimatePoolMatches(nbTeams, nbPools);
  const knockoutMatches = estimateKnockoutMatches(
    nbTeams, nbPools, qualifiedPerPool,
    hasKnockout, hasThirdPlace, hasConsolation, knockoutFormat
  );
  const required = poolMatches + knockoutMatches;

  const ok = totalSlots >= required;
  const deficit = required - totalSlots;

  return {
    ok,
    capacity: totalSlots,
    required,
    deficit,
    days,
    minPerDay,
    poolMatches,
    knockoutMatches,
    message: ok
      ? `✓ ${totalSlots} créneaux disponibles pour ${required} matchs estimés.`
      : `✗ Il manque ${deficit} créneau(x). ${totalSlots} disponibles pour ${required} matchs estimés.`,
  };
}