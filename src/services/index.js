import { supabase, requireUser } from '../lib/supabase';

// ============================================================
// sponsorService
// ============================================================
function fromDbSponsor(row) {
  if (!row) return null;
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    libraryId: row.library_id,
    name: row.name,
    logo: row.logo_url,
    displayOrder: row.display_order,
  };
}

export const sponsorService = {
  async listByTournament(tournamentId) {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return (data || []).map(fromDbSponsor);
  },

  async create(tournamentId, { name, logo }) {
    const payload = { tournament_id: tournamentId, name, logo_url: logo };
    const { data, error } = await supabase
      .from('sponsors')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    // Effet de bord : alimenter la bibliothèque
    try {
      await this.addToLibrary({ name, logo });
    } catch {}
    return fromDbSponsor(data);
  },

  async remove(id) {
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) throw error;
  },

  async listLibrary() {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('sponsor_library')
      .select('*')
      .eq('owner_id', user.id)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(r => ({
      libraryId: r.id,
      name: r.name,
      logo: r.logo_url,
    }));
  },

  async addToLibrary({ name, logo }) {
    const user = await requireUser();
    const existing = await this.listLibrary();
    if (existing.find(s => s.name.toLowerCase() === name.toLowerCase())) return null;
    const { data, error } = await supabase
      .from('sponsor_library')
      .insert({ owner_id: user.id, name, logo_url: logo })
      .select()
      .single();
    if (error) throw error;
    return { libraryId: data.id, name: data.name, logo: data.logo_url };
  },

  async removeFromLibrary(libraryId) {
    const { error } = await supabase
      .from('sponsor_library')
      .delete()
      .eq('id', libraryId);
    if (error) throw error;
  },

  async importFromLibrary(tournamentId, libraryId) {
    const { data: lib, error: e1 } = await supabase
      .from('sponsor_library')
      .select('*')
      .eq('id', libraryId)
      .single();
    if (e1) throw e1;
    const { data, error } = await supabase
      .from('sponsors')
      .insert({
        tournament_id: tournamentId,
        library_id: lib.id,
        name: lib.name,
        logo_url: lib.logo_url,
      })
      .select()
      .single();
    if (error) throw error;
    return fromDbSponsor(data);
  },
};

// ============================================================
// announcementService
// ============================================================
function fromDbAnnouncement(row) {
  if (!row) return null;
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    message: row.message,
    type: row.type,
    createdAt: row.created_at,
  };
}

export const announcementService = {
  async listByTournament(tournamentId) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(fromDbAnnouncement);
  },

  async create(tournamentId, { message, type = 'info' }) {
    const { data, error } = await supabase
      .from('announcements')
      .insert({ tournament_id: tournamentId, message, type })
      .select()
      .single();
    if (error) throw error;
    return fromDbAnnouncement(data);
  },

  async remove(id) {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================================
// followService — équipes suivies par un spectateur
// ============================================================
export const followService = {
  async listMine(tournamentId) {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('followed_teams')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('tournament_id', tournamentId);
    if (error) throw error;
    return (data || []).map(r => r.team_id);
  },

  async follow(tournamentId, teamId) {
    const user = await requireUser();
    const { error } = await supabase
      .from('followed_teams')
      .insert({ user_id: user.id, team_id: teamId, tournament_id: tournamentId });
    if (error && error.code !== '23505') throw error; // ignore duplicate
  },

  async unfollow(teamId) {
    const user = await requireUser();
    const { error } = await supabase
      .from('followed_teams')
      .delete()
      .eq('user_id', user.id)
      .eq('team_id', teamId);
    if (error) throw error;
  },
};
