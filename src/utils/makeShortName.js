// Génère un nom court (max 4 car) depuis un nom de club
export function makeShortName(name) {
  if (!name) return '???';
  // Nettoyer les points et espaces multiples
  const clean = name
    .toLowerCase()
    .replace(/\.+/g, '') // enlever les points (u.s. → us)
    .replace(/\s+/g, ' ')
    .trim();
  const words = clean.split(' ').filter(Boolean);
  if (!words.length) return '???';

  const PREFIXES = ['as','us','fc','rc','sc','oc','aj','ea','ac','ca','al','ol','om','psg','co','js','sf','sm'];
  const first = words[0];

  if (PREFIXES.includes(first) && words.length > 1) {
    // Garder le préfixe + initiale(s) des mots suivants
    const rest = words.slice(1).map(w => w[0]).join('');
    return (first + rest).slice(0, 4).toUpperCase();
  }

  // Sinon initiales de tous les mots
  const initials = words.map(w => w[0]).join('');
  return initials.slice(0, 4).toUpperCase();
}
