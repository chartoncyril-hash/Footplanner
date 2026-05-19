// ============================================================
// Helpers logique métier — fonctions pures
// ============================================================

// Le classement est-il activé pour la catégorie courante du tournoi ?
// (Pour U7/U9 le classement est généralement désactivé)
export function isRankingEnabled(tournament) {
  if (!tournament || !tournament.rankingByCategory) return true;
  const cat = tournament.category;
  return tournament.rankingByCategory[cat] !== false;
}

// Durée d'un match selon la catégorie courante (avec fallback)
export function getMatchDuration(tournament) {
  if (!tournament) return 12;
  const fromCat = tournament.categoryDurations?.[tournament.category];
  return fromCat || tournament.matchDuration || 12;
}
