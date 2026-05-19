import React, { useState } from 'react';
import { Users, Crown, Plus, Edit3 } from 'lucide-react';
import { Crest } from './Crest';
import { PageHeader, SectionHeader } from './MatchCards';
import { TeamEditor } from './TeamEditor';
import { LibraryPicker } from './LibraryPicker';
import { styles } from '../styles/styles';
import { filterTeamsByCategory } from '../utils/categoryHelpers';
import { TeamsTableDesktop } from './TeamsTableDesktop';
import { useIsDesktop } from '../hooks/useIsDesktop';

// ============================================================
// TeamsView — vue + édition des équipes
// ============================================================
export function TeamsView({
  tournament, teams, role, activeCategory,
  createTeam, updateTeam, removeTeam, importFromLibrary,
  teamsLibrary, removeFromLibrary,
  matches, askConfirm, closeConfirm,
}) {
  const isDesktop = useIsDesktop();
  const [editing, setEditing] = useState(null); // null | 'new' | team object
  const [showLibrary, setShowLibrary] = useState(false);
  const [error, setError] = useState('');

  // Filtrer les équipes selon la catégorie active
  const visibleTeams = filterTeamsByCategory(teams, activeCategory);

  const canManage = role === 'organizer';

  const grouped = visibleTeams.reduce((acc, t) => {
    if (!acc[t.pool]) acc[t.pool] = [];
    acc[t.pool].push(t);
    return acc;
  }, {});
  const pools = Object.keys(grouped).sort();
  const existingPools = pools;

  const saveTeam = async (data) => {
    setError('');
    try {
      if (data.id) {
        await updateTeam(data.id, data);
      } else {
        await createTeam(data);
      }
      setEditing(null);
    } catch (e) {
      setError(e.message || 'Erreur d\'enregistrement.');
    }
  };

  const deleteTeam = (id) => {
    // Bloquer la suppression si l'équipe est utilisée dans un match en cours/joué
    const used = matches.some(m => (m.home === id || m.away === id) && m.status !== 'scheduled');
    if (used) {
      askConfirm({
        title: 'Suppression impossible',
        message:
          'Cette équipe a déjà joué ou est en cours de match. Tu ne peux pas la supprimer sans casser le calendrier.',
        confirmLabel: 'Compris',
        onConfirm: closeConfirm,
      });
      return;
    }
    askConfirm({
      title: 'Supprimer cette équipe ?',
      message: 'Les matchs programmés impliquant cette équipe seront aussi supprimés.',
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        try {
          await removeTeam(id);
          setEditing(null);
        } catch (e) {
          setError(e.message);
        } finally {
          closeConfirm();
        }
      },
    });
  };

  return (
    <div style={{ paddingBottom: 130 }}>
      <PageHeader
        title="Équipes"
        subtitle={`${visibleTeams.length} équipes engagées`}
        icon={Users}
        accent="#a78bfa"
      />

      {isDesktop ? (
      <TeamsTableDesktop
        teams={visibleTeams}
        allTeams={teams}
        teamsLibrary={teamsLibrary || []}
        activeCategory={activeCategory}
        onCreateTeam={createTeam}
        onUpdateTeam={updateTeam}
        onRemoveTeam={removeTeam}
        onImportFromLibrary={importFromLibrary}
        onOpenLibrary={teamsLibrary && teamsLibrary.length > 0 ? () => setShowLibrary(true) : null}
      />
      ) : (
        <>

      {canManage && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setEditing('new')}
            style={{ ...styles.btnAddTeam, flex: 1, marginBottom: 0 }}
          >
            <Plus size={16} /> NOUVELLE
          </button>
          {teamsLibrary && teamsLibrary.length > 0 && (
            <button onClick={() => setShowLibrary(true)} style={styles.btnLibrary || styles.btnSecondary}>
              <Users size={14} /> BIBLIOTHÈQUE ({teamsLibrary.length})
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{ ...styles.fieldError, marginBottom: 10, textAlign: 'center' }}>{error}</div>
      )}

      {pools.length === 0 && (
        <div style={styles.emptyState}>
          <Users size={28} color="#475569" />
          <span>Aucune équipe encore. Crée la première !</span>
        </div>
      )}

      {pools.map(p => (
        <section key={p} style={styles.section}>
          <SectionHeader icon={Users} title={`Poule ${p}`} accent="#a78bfa" badge={grouped[p].length} />
          <div style={styles.cardStack}>
            {grouped[p].map(t => (
              <button
                key={t.id}
                onClick={() => canManage && setEditing(t)}
                disabled={!canManage}
                style={{
                  ...styles.teamCard,
                  cursor: canManage ? 'pointer' : 'default',
                  textAlign: 'left',
                  ...(t.isHost ? { borderColor: 'rgba(250,204,21,0.4)' } : {}),
                }}
              >
                <Crest team={t} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...styles.teamCardName, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {t.name}
                    {t.isHost && <Crown size={11} color="#facc15" fill="#facc15" />}
                  </div>
                  <div style={styles.teamCardShort}>
                    {t.short} · Poule {t.pool}
                    {t.isHost && <span style={{ color: '#facc15', marginLeft: 4, fontWeight: 700 }}> · HÔTE</span>}
                  </div>
                </div>
                {canManage && <Edit3 size={13} color="#64748b" />}
              </button>
            ))}
          </div>
        </section>
      ))}

          </>
          )}
          {editing && (
        <TeamEditor
          team={editing === 'new' ? null : editing}
          existingPools={existingPools}
          defaultCategory={tournament?.category}
          onSave={saveTeam}
          onDelete={editing !== 'new' ? () => deleteTeam(editing.id) : null}
          onCancel={() => setEditing(null)}
        />
      )}

      {showLibrary && (
        <LibraryPicker
          library={teamsLibrary}
          existingTeams={teams}
          existingPools={existingPools}
          onPick={async (libraryId, targetPool) => {
            try {
              await importFromLibrary(libraryId, targetPool);
            } catch (e) {
              setError(e.message);
            }
          }}
          onRemove={async (libraryId) => {
            try {
              await removeFromLibrary(libraryId);
            } catch (e) {
              setError(e.message);
            }
          }}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}
