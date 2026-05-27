import { supabase, requireUser } from '../lib/supabase';

// ============================================================
// teamService
// Équipes inscrites à un tournoi + bibliothèque persistante
// ============================================================

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    libraryId: row.library_id,
    name: row.name,
    short: row.short_name,
    color: row.color,
    logo: row.logo_url,
    category: row.category,
    pool: row.pool,
    isHost: row.is_host,
    level: row.level,
    checkedIn: row.checked_in ?? false,
    coachName: row.coach_name ?? null,
    coachPhone: row.coach_phone ?? null,
    jerseyColor: row.jersey_color ?? null,
  };
}

function toDb(t) {
  const out = {};
  if (t.tournamentId !== undefined) out.tournament_id = t.tournamentId;
  if (t.libraryId !== undefined) out.library_id = t.libraryId;
  if (t.name !== undefined) out.name = t.name;
  if (t.short !== undefined) out.short_name = t.short;
  if (t.color !== undefined) out.color = t.color;
  if (t.logo !== undefined) out.logo_url = t.logo;
  if (t.category !== undefined) out.category = t.category;
  if (t.pool !== undefined) out.pool = t.pool;
  if (t.isHost !== undefined) out.is_host = t.isHost;
  if (t.level !== undefined) out.level = t.level;
  if (t.checkedIn !== undefined) out.checked_in = t.checkedIn;
  if (t.coachName !== undefined) out.coach_name = t.coachName;
  if (t.coachPhone !== undefined) out.coach_phone = t.coachPhone;
  if (t.jerseyColor !== undefined) out.jersey_color = t.jerseyColor;
  return out;
}

function libFromDb(row) {
  if (!row) return null;
  return {
    libraryId: row.id,
    ownerId: row.owner_id,
    name: row.name,
    short: row.short_name,
    color: row.color,
    logo: row.logo_url,
    category: row.category,
    isHost: row.is_host,
  };
}

function libToDb(t) {
  const out = {};
  if (t.name !== undefined) out.name = t.name;
  if (t.short !== undefined) out.short_name = t.short;
  if (t.color !== undefined) out.color = t.color;
  if (t.logo !== undefined) out.logo_url = t.logo;
  if (t.category !== undefined) out.category = t.category;
  if (t.isHost !== undefined) out.is_host = t.isHost;
  return out;
}

// ----- Équipes du tournoi -----

export async function listByTournament(tournamentId) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('pool', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(fromDb);
}

export async function create(tournamentId, input) {
  const payload = { ...toDb(input), tournament_id: tournamentId };
  const { data, error } = await supabase
    .from('teams')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  // Effet de bord : on alimente la bibliothèque (déduplication par nom)
  try {
    await addToLibrary(input);
  } catch {
    // Non bloquant : si la lib échoue (dédup), on continue
  }
  return fromDb(data);
}

export async function update(id, patch) {
  const { data, error } = await supabase
    .from('teams')
    .update(toDb(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export async function remove(id) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}

// ----- Bibliothèque persistante -----

export async function listLibrary() {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('team_library')
    .select('*')
    .eq('owner_id', user.id)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(libFromDb);
}

export async function addToLibrary(input) {
  const user = await requireUser();
  // Dédup par nom (case-insensitive) côté client
  const existing = await listLibrary();
  if (existing.find(t => t.name.toLowerCase() === (input.name || '').toLowerCase())) {
    return null; // déjà présent
  }
  const payload = { ...libToDb(input), owner_id: user.id };
  const { data, error } = await supabase
    .from('team_library')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return libFromDb(data);
}

export async function updateLibrary(libraryId, patch) {
  const dbPatch = libToDb(patch);
  const { data, error } = await supabase
    .from('team_library')
    .update(dbPatch)
    .eq('id', libraryId)
    .select()
    .single();
  if (error) throw error;
  return libFromDb(data);
}

export async function removeFromLibrary(libraryId) {
  const { error } = await supabase
    .from('team_library')
    .delete()
    .eq('id', libraryId);
  if (error) throw error;
}

// Importe une équipe depuis la bibliothèque vers un tournoi
  export async function importFromLibrary(tournamentId, libraryId, targetPool, options) {
    const opts = options || {};
    const { data: libRow, error: e1 } = await supabase
      .from('team_library')
      .select('*')
      .eq('id', libraryId)
      .single();
    if (e1) throw e1;
    if (!libRow) throw new Error('Équipe introuvable dans la bibliothèque');
    const payload = {
      tournament_id: tournamentId,
      library_id: libRow.id,
      name: libRow.name,
      short_name: libRow.short_name,
      color: libRow.color,
      logo_url: libRow.logo_url,
      category: opts.category || libRow.category,
      level: opts.level !== undefined ? opts.level : 1,
      pool: targetPool,
      is_host: libRow.is_host,
    };
  const { data, error } = await supabase
    .from('teams')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export const teamService = {
  listByTournament,
  create,
  update,
  remove,
  listLibrary,
  addToLibrary,
  updateLibrary,
  removeFromLibrary,
  importFromLibrary,
};
