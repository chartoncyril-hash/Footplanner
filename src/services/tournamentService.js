import { supabase, requireUser } from '../lib/supabase';

// ============================================================
// tournamentService
// Toute interaction Supabase liée aux tournois passe par ici.
// Les composants n'appellent JAMAIS supabase directement.
// ============================================================

// Mapping db -> camelCase pour le front (et inverse pour les writes)
function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    accessCode: row.access_code,
    refereeCode: row.referee_code,
    name: row.name,
    autoKickoff: row.auto_kickoff !== false,  // true par défaut
    categories: Array.isArray(row.categories) ? row.categories : [],
    fieldsByCategory: row.fields_by_category || {},
    category: row.category,
    date: row.date,
    location: row.location,
    startTime: row.start_time,
    endTime: row.end_time,
    endDate: row.end_date,
    breaks: Array.isArray(row.breaks) ? row.breaks : [],
    matchDuration: row.match_duration,
    breakBetweenMatches: row.break_between_matches,
    knockoutFromTopN: row.knockout_from_top_n,
    fields: row.fields || ['T1', 'T2', 'T3', 'T4'],
    hasKnockout: row.has_knockout,
    hasThirdPlace: row.has_third_place !== false,
    knockoutFields: Array.isArray(row.knockout_fields) ? row.knockout_fields : null,
    knockoutFormat: row.knockout_format || 'standard',
    hasConsolation: row.has_consolation === true,
    categoryDurations: row.category_durations || {},
    rankingByCategory: row.ranking_by_category || {},
    scoring: row.scoring || { win: 3, draw: 1, loss: 0 },
    bonuses: row.bonuses || {},
    tiebreakers: row.tiebreakers || ['points', 'goalDiff', 'goalsFor', 'headToHead'],
    status: row.status,
    registrationOpen: row.registration_open,
    registrationFee: row.registration_fee || 0,
    registrationPaymentInfo: row.registration_payment_info || '',
    registrationConfig: row.registration_config || {},
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDb(t) {
  const out = {};
  if (t.ownerId !== undefined) out.owner_id = t.ownerId;
  if (t.accessCode !== undefined) out.access_code = t.accessCode;
  if (t.refereeCode !== undefined) out.referee_code = t.refereeCode;
  if (t.name !== undefined) out.name = t.name;
  if (t.autoKickoff !== undefined) out.auto_kickoff = t.autoKickoff;
  if (t.categories !== undefined) out.categories = t.categories;
  if (t.fieldsByCategory !== undefined) out.fields_by_category = t.fieldsByCategory;
  if (t.category !== undefined) out.category = t.category;
  if (t.date !== undefined) out.date = t.date;
  if (t.location !== undefined) out.location = t.location;
  if (t.startTime !== undefined) out.start_time = t.startTime;
  if (t.endTime !== undefined) out.end_time = t.endTime;
  if (t.endDate !== undefined) out.end_date = t.endDate;
  if (t.breaks !== undefined) out.breaks = t.breaks;
  if (t.matchDuration !== undefined) out.match_duration = t.matchDuration;
  if (t.breakBetweenMatches !== undefined) out.break_between_matches = t.breakBetweenMatches;
  if (t.knockoutFromTopN !== undefined) out.knockout_from_top_n = t.knockoutFromTopN;
  if (t.fields !== undefined) out.fields = t.fields;
  if (t.hasKnockout !== undefined) out.has_knockout = t.hasKnockout;
  if (t.hasThirdPlace !== undefined) out.has_third_place = t.hasThirdPlace;
  if (t.knockoutFields !== undefined) out.knockout_fields = t.knockoutFields;
  if (t.knockoutFormat !== undefined) out.knockout_format = t.knockoutFormat;
  if (t.hasConsolation !== undefined) out.has_consolation = t.hasConsolation;
  if (t.categoryDurations !== undefined) out.category_durations = t.categoryDurations;
  if (t.rankingByCategory !== undefined) out.ranking_by_category = t.rankingByCategory;
  if (t.scoring !== undefined) out.scoring = t.scoring;
  if (t.bonuses !== undefined) out.bonuses = t.bonuses;
  if (t.tiebreakers !== undefined) out.tiebreakers = t.tiebreakers;
  if (t.status !== undefined) out.status = t.status;
  if (t.registrationOpen !== undefined) out.registration_open = t.registrationOpen;
  if (t.registrationFee !== undefined) out.registration_fee = t.registrationFee;
  if (t.registrationPaymentInfo !== undefined) out.registration_payment_info = t.registrationPaymentInfo;
  if (t.registrationConfig !== undefined) out.registration_config = t.registrationConfig;
  if (t.archivedAt !== undefined) out.archived_at = t.archivedAt;
  return out;
}

// Génère un code d'accès court et lisible (sans caractères ambigus)
function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateRefereeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ARB-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ----- Lectures -----

// Liste mes tournois (organisateur connecté)
export async function listMine(userId = null) {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('owner_id', userId || user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromDb);
}

// Liste uniquement les tournois archivés
export async function listMineArchived() {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'archived')
    .order('archived_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromDb);
}

export async function getById(id) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return fromDb(data);
}

// Lookup public par code d'accès (pour spectateur qui scanne / saisit)
export async function getByAccessCode(code) {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) return null;
  const { data, error } = await supabase
    .rpc('get_tournament_by_code', { p_code: normalized });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return fromDb(row);
}

// ----- Écritures -----

export async function create(input = {}) {
  const user = await requireUser();
const payload = {
    owner_id: user.id,
    access_code: input.accessCode || generateAccessCode(),
    referee_code: input.refereeCode || generateRefereeCode(),
    name: input.name || 'Nouveau tournoi',
    category: (Array.isArray(input.categories) && input.categories.length > 0)
      ? input.categories[0]
      : (input.category || 'U11'),
    categories: Array.isArray(input.categories) ? input.categories : [],
    date: input.date || new Date().toISOString().slice(0, 10),
    location: input.location || null,
    start_time: input.startTime || '09:00',
    match_duration: input.matchDuration ?? 12,
    break_between_matches: input.breakBetweenMatches ?? 3,
    knockout_from_top_n: input.knockoutFromTopN ?? 2,
    fields: input.fields || ['T1', 'T2', 'T3', 'T4'],
    has_knockout: input.hasKnockout ?? true,
    has_third_place: input.hasThirdPlace ?? true,
    knockout_fields: Array.isArray(input.knockoutFields) ? input.knockoutFields : null,
    knockout_format: input.knockoutFormat || 'standard',
    has_consolation: input.hasConsolation === true,
    category_durations: input.categoryDurations || {
      U7: 8, U9: 10, U11: 12, U13: 15, U15: 20, U17: 25, Senior: 30,
    },
    scoring: input.scoring || { win: 3, draw: 1, loss: 0 },
    status: 'live',
  };
  const { data, error } = await supabase
    .from('tournaments')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export async function update(id, patch) {
  const { data, error } = await supabase
    .from('tournaments')
    .update(toDb(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export async function archive(id) {
  return update(id, { status: 'archived', archivedAt: new Date().toISOString() });
}

export async function remove(id) {
  const { error } = await supabase.from('tournaments').delete().eq('id', id);
  if (error) throw error;
}

export async function regenerateRefereeCode(id) {
  return update(id, { refereeCode: generateRefereeCode() });
}

export const tournamentService = {
  listMine,
  listMineArchived,
  getById,
  getByAccessCode,
  create,
  update,
  archive,
  remove,
  regenerateRefereeCode,
  generateAccessCode,
  generateRefereeCode,
};
