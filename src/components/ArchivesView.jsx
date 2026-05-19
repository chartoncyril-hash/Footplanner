import React, { useState, useEffect } from 'react';
import {
  Trophy, ArrowLeft, Calendar, MapPin, Users, RefreshCw, Trash2,
  CircleDot, ChevronRight, Crown,
} from 'lucide-react';
import { Crest } from './Crest';
import { PageHeader } from './MatchCards';
import { tournamentService } from '../services/tournamentService';
import { teamService } from '../services/teamService';
import { matchService } from '../services/matchService';
import { computeStandings } from '../utils/standings';
import { styles } from '../styles/styles';

// ============================================================
// ArchivesView — liste les tournois archivés de l'organisateur
// ============================================================
export function ArchivesView({
  setView, setActiveTournament, askConfirm, closeConfirm,
}) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); // tournoi sélectionné pour le détail

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await tournamentService.listMineArchived();
      setList(data);
    } catch (e) {
      setError(e.message || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const restore = (id) => {
    askConfirm({
      title: 'Restaurer ce tournoi ?',
      message: 'Le tournoi redeviendra actif. Tu pourras à nouveau modifier les matchs et l\'archiver à nouveau plus tard.',
      confirmLabel: 'Restaurer',
      onConfirm: async () => {
        try {
          await tournamentService.update(id, { status: 'live', archivedAt: null });
          await reload();
        } catch (e) {
          setError(e.message);
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const remove = (id) => {
    askConfirm({
      title: 'Supprimer définitivement ?',
      message: 'Cette action est irréversible. Toutes les équipes, matchs, sponsors et annonces seront perdus.',
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        try {
          await tournamentService.remove(id);
          setList(prev => prev.filter(t => t.id !== id));
        } catch (e) {
          setError(e.message);
        } finally {
          closeConfirm();
        }
      },
    });
  };

  if (selected) {
    return (
      <ArchiveDetail
        tournament={selected}
        onBack={() => setSelected(null)}
        onRestore={() => restore(selected.id)}
        onRemove={() => remove(selected.id)}
      />
    );
  }

  return (
    <div style={{ paddingBottom: 130 }}>
      <button onClick={() => setView('dashboard')} style={styles.backBtn}>
        <ArrowLeft size={16} /> Retour
      </button>

      <PageHeader
        title="Archives"
        subtitle={loading ? 'Chargement…' : `${list.length} tournoi${list.length > 1 ? 's' : ''} archivé${list.length > 1 ? 's' : ''}`}
        icon={Trophy}
        accent="#a78bfa"
      />

      {error && (
        <div style={{ ...styles.fieldError, marginBottom: 10, textAlign: 'center' }}>{error}</div>
      )}

      {!loading && list.length === 0 && (
        <div style={styles.emptyState}>
          <Trophy size={28} color="#475569" />
          <span>Aucun tournoi archivé pour l'instant.</span>
        </div>
      )}

      <div style={styles.cardStack}>
        {list.map(t => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            style={styles.archiveCard || styles.matchListCard}
          >
            <div style={styles.archiveHead || { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  ...styles.archiveBadge || {},
                  color: '#94a3b8',
                  borderColor: 'rgba(148,163,184,0.4)',
                  background: 'rgba(148,163,184,0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 7px',
                  borderRadius: 4,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 1,
                  border: '1px solid',
                }}
              >
                <Trophy size={9} /> ARCHIVÉ
              </div>
              {t.archivedAt && (
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  {new Date(t.archivedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
              {t.name}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 10 }}>
              {t.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <MapPin size={10} /> {t.location}
                </span>
              )}
              {t.category && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Users size={10} /> {t.category}
                </span>
              )}
            </div>
            <ChevronRight size={14} color="#475569" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ArchiveDetail — vue détaillée d'un tournoi archivé
// avec classement final + actions restaurer/supprimer
// ============================================================
function ArchiveDetail({ tournament, onBack, onRestore, onRemove }) {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [t, m] = await Promise.all([
          teamService.listByTournament(tournament.id),
          matchService.listByTournament(tournament.id),
        ]);
        setTeams(t);
        setMatches(m);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [tournament.id]);

  const standings = computeStandings(teams, matches, tournament);
  const pools = Object.keys(standings).sort();

  // Champion = 1er de la finale validée OU 1er de la phase de poules
  let champion = null;
  const finalMatch = matches.find(m => m.knockoutRound === 'final' && m.status === 'validated');
  if (finalMatch) {
    const winnerId = finalMatch.scoreHome > finalMatch.scoreAway
      ? finalMatch.home
      : finalMatch.scoreAway > finalMatch.scoreHome
        ? finalMatch.away
        : null;
    champion = teams.find(t => t.id === winnerId);
  } else if (pools.length === 1 && standings[pools[0]]?.length > 0) {
    champion = standings[pools[0]][0];
  }

  return (
    <div style={{ paddingBottom: 130 }}>
      <button onClick={onBack} style={styles.backBtn}>
        <ArrowLeft size={16} /> Toutes les archives
      </button>

      <div style={styles.matchDetailHero || styles.hero}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>
          {tournament.name}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          {tournament.date && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={11} /> {new Date(tournament.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
          {tournament.location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} /> {tournament.location}
            </span>
          )}
          {tournament.category && <span>· {tournament.category}</span>}
        </div>

        {champion && (
          <div style={styles.winnerCard || {
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 14,
            background: 'linear-gradient(135deg, rgba(250,204,21,0.12), rgba(250,204,21,0.04))',
            border: '1px solid rgba(250,204,21,0.4)',
            borderRadius: 12,
          }}>
            <Crown size={24} color="#facc15" fill="#facc15" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: '#facc15', marginBottom: 2 }}>
                CHAMPION
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>
                {champion.name}
              </div>
            </div>
            <Crest team={champion} size="lg" />
          </div>
        )}
      </div>

      {error && (
        <div style={{ ...styles.fieldError, marginBottom: 10, textAlign: 'center' }}>{error}</div>
      )}

      {loading ? (
        <div style={styles.emptyState}>
          <span style={{ color: '#94a3b8' }}>Chargement du classement…</span>
        </div>
      ) : (
        <>
          {pools.map(pool => (
            <section key={pool} style={styles.section}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: '#a78bfa', marginBottom: 8 }}>
                CLASSEMENT POULE {pool}
              </div>
              <div style={styles.standingsCard}>
                <div style={styles.standingsHead}>
                  <div style={{ width: 24 }}>#</div>
                  <div style={{ flex: 1 }}>ÉQUIPE</div>
                  <div style={styles.statCol}>J</div>
                  <div style={{ ...styles.statCol, width: 38, fontWeight: 800, color: '#22d3ee' }}>PTS</div>
                </div>
                {standings[pool].map((t, i) => (
                  <div key={t.id} style={styles.standingsRow}>
                    <div style={{ width: 24, fontWeight: 800, color: i === 0 ? '#facc15' : '#64748b' }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Crest team={t} size="sm" />
                      <span style={styles.teamNameSmall}>{t.name}</span>
                    </div>
                    <div style={styles.statCol}>{t.played}</div>
                    <div style={{ ...styles.statCol, width: 38, fontWeight: 800, fontSize: 15, color: '#22d3ee' }}>
                      {t.points}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {/* Actions */}
      <section style={styles.section}>
        <button onClick={onRestore} style={styles.btnPrimary}>
          <RefreshCw size={14} /> RESTAURER LE TOURNOI
        </button>
        <button onClick={onRemove} style={{ ...styles.btnDanger, marginTop: 6 }}>
          <Trash2 size={14} /> Supprimer définitivement
        </button>
      </section>
    </div>
  );
}
