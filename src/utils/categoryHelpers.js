// ============================================================
// categoryHelpers.js — utilitaires pour la gestion multi-catégories
// ============================================================

/**
 * Liste des catégories d'un tournoi.
 * Si le tournoi n'a pas de catégories définies, on retourne
 * une catégorie unique basée sur tournament.category (rétrocompatibilité).
 */
export function getCategories(tournament) {
  if (!tournament) return [];
  const list = tournament.categories;
  if (Array.isArray(list) && list.length > 0) return list;
  // Fallback : catégorie unique héritée de tournament.category
  if (tournament.category) return [tournament.category];
  return [];
}

/**
 * Indique si un tournoi a plusieurs catégories actives.
 */
export function isMultiCategory(tournament) {
  return getCategories(tournament).length > 1;
}

/**
 * Filtre des équipes par catégorie.
 * Si pas de catégorie active, retourne toutes les équipes.
 */
export function filterTeamsByCategory(teams, categoryName) {
  if (!categoryName) return teams || [];
  return (teams || []).filter(t => t.category === categoryName);
}

/**
 * Filtre des matchs par catégorie via leurs équipes.
 * Un match appartient à une catégorie si au moins une de ses équipes est dans cette catégorie.
 */
export function filterMatchesByCategory(matches, teams, categoryName) {
  if (!categoryName) return matches || [];
  const teamIds = new Set(
    (teams || []).filter(t => t.category === categoryName).map(t => t.id)
  );
  return (matches || []).filter(m =>
    teamIds.has(m.home) || teamIds.has(m.away)
    // Pour les matchs de KO qui n'ont pas encore les équipes assignées,
    // on vérifie aussi via pool/phase si on a une référence
  );
}

/**
 * Terrains disponibles pour une catégorie donnée.
 * Si fields_by_category contient une entrée pour cette catégorie, on l'utilise.
 * Sinon on prend tous les terrains du tournoi.
 */
export function getFieldsForCategory(tournament, categoryName) {
  if (!tournament) return [];
  if (categoryName && tournament.fieldsByCategory && tournament.fieldsByCategory[categoryName]) {
    return tournament.fieldsByCategory[categoryName];
  }
  return tournament.fields || ['T1', 'T2', 'T3', 'T4'];
}

/**
 * Liste des catégories d'âge françaises standard, dans l'ordre.
 * Utilisé pour le sélecteur d'ajout de catégorie.
 */
export const STANDARD_CATEGORIES = [
  'U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U19', 'Senior', 'Vétéran',
];

/**
 * Retourne le nom d'affichage d'une équipe en incluant son niveau si > 1.
 * Ex: "PSG" si level=1, "PSG (2)" si level=2
 */
export function getTeamDisplay(team) {
  if (!team) return '?';
  if (team.level && team.level > 1) {
    return team.name + ' (' + team.level + ')';
  }
  return team.name;
}