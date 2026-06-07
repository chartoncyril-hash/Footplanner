import React from 'react';
import { Crest } from './Crest';
import { GitBranch, Layers, Trophy } from 'lucide-react';
import { filterTeamsByCategory } from '../utils/categoryHelpers';
import { BracketView } from './BracketView';

export function FormatView(props) {
  const tournament = props.tournament;
  const allTeams = props.teams || [];
  const allMatches = props.matches || [];
  const activeCategory = props.activeCategory;
  const updateTeam = props.updateTeam;
  const standings = props.standings || {};
  const teams = filterTeamsByCategory(allTeams, activeCategory);
  // Filtrer les matchs par catégorie active
  const matches = activeCategory 
    ? allMatches.filter(m => !m.category || m.category === activeCategory) 
    : allMatches;
  const knockoutMatches = matches.filter(m => m.phase === 'knockout');

  // State pour le drag-and-drop
  const [draggedTeam, setDraggedTeam] = React.useState(null);
  const [dragOverPool, setDragOverPool] = React.useState(null);
  const [extraPools, setExtraPools] = React.useState([]);

  // Compte les équipes par poule pour info
  const teamsByPool = teams.reduce((acc, t) => {
    const p = t.pool || 'Sans poule';
    if (!acc[p]) acc[p] = [];
    acc[p].push(t);
    return acc;
  }, {});
  const pools = Object.keys(teamsByPool).sort();

  // Liste de toutes les poules disponibles (existantes + extras créées manuellement)
  const allPools = ['A', 'B', 'C', 'D', 'E', 'F'];
  const existingPools = Object.keys(teamsByPool).filter(p => p !== 'Sans poule');
  const visiblePools = [...new Set([...existingPools, ...extraPools])].sort();
  
  // ---- Répartition automatique par serpentin ----
  const [snaking, setSnaking] = React.useState(false);
  const handleSnakeDraft = async (nbPools) => {
    if (!updateTeam || snaking) return;
    // Équipes sans poule ou toutes les équipes selon le choix
    const toAssign = [...teams].sort((a, b) => {
      const la = a.level || 2;
      const lb = b.level || 2;
      if (la !== lb) return la - lb; // level croissant (1 = fort en premier)
      return a.name.localeCompare(b.name); // alphabétique à level égal
    });
    if (toAssign.length === 0) return;
    setSnaking(true);
    try {
      const poolLetters = ['A','B','C','D','E','F'].slice(0, nbPools);
      // Serpentin : aller A→B→C→D puis retour D→C→B→A
      const assignments = [];
      let direction = 1;
      let poolIdx = 0;
      for (let i = 0; i < toAssign.length; i++) {
        assignments.push({ team: toAssign[i], pool: poolLetters[poolIdx] });
        poolIdx += direction;
        if (poolIdx >= nbPools) { poolIdx = nbPools - 1; direction = -1; }
        if (poolIdx < 0) { poolIdx = 0; direction = 1; }
      }
      // Mettre à jour en BDD
      for (const { team, pool } of assignments) {
        await updateTeam(team.id, { pool });
      }
    } catch (e) {
      console.error('Serpentin error', e);
    } finally {
      setSnaking(false);
    }
  };
  const handleDragStart = (e, team) => {
    setDraggedTeam(team);
    e.dataTransfer.effectAllowed = 'move';
    // Pour Firefox : il faut setData pour que le drag fonctionne
    e.dataTransfer.setData('text/plain', team.id);
  };

  const handleDragEnd = () => {
    setDraggedTeam(null);
    setDragOverPool(null);
  };

  const handleDragOver = (e, pool) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPool !== pool) setDragOverPool(pool);
  };

  const handleDragLeave = () => {
    setDragOverPool(null);
  };

  const handleDrop = async (e, targetPool) => {
    e.preventDefault();
    if (!draggedTeam || !updateTeam) return;
    if (draggedTeam.pool === targetPool) {
      setDragOverPool(null);
      setDraggedTeam(null);
      return;
    }
    try {
      await updateTeam(draggedTeam.id, { pool: targetPool });
      // Si la poule cible était une "extraPool", on la garde, sinon rien à faire
    } catch (err) {
      console.error('Move team failed', err);
    } finally {
      setDraggedTeam(null);
      setDragOverPool(null);
    }
  };

  const handleAddPool = () => {
    const next = allPools.find(p => !visiblePools.includes(p));
    if (next) setExtraPools(prev => [...prev, next]);
  };

  return (
    <div style={{ paddingBottom: 130 }}>
      {/* Header */}
      <div style={{
        padding: '14px 0 16px',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: 8,
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GitBranch size={16} color="#f59e0b" />
          </div>
          <div style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#f1f5f9',
            letterSpacing: 1,
          }}>
            FORMAT {activeCategory ? '— ' + activeCategory : ''}
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', paddingLeft: 42 }}>
          Composition des poules · Phase finale · Repartition des equipes
        </div>
      </div>

      {/* Layout 2 colonnes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
      }}>
        {/* COLONNE GAUCHE — Phase de poules */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}>
            <Layers size={14} color="#818cf8" />
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.5,
              color: '#818cf8',
            }}>
              PHASE DE POULES ({pools.length})
            </div>
          </div>

          {pools.length === 0 ? (
            <div style={{
              padding: 24,
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 10,
              textAlign: 'center',
              color: '#64748b',
              fontSize: 12,
            }}>
              Aucune equipe pour le moment.
              <br />
              Ajoute des equipes dans l'onglet "Equipes".
            </div>
          ) : (
            visiblePools.map(pool => (
              <div
                key={pool}
                onDragOver={(e) => handleDragOver(e, pool)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, pool)}
                style={{
                  marginBottom: 12,
                  background: dragOverPool === pool ? 'rgba(34,211,238,0.08)' : 'rgba(15,23,42,0.4)',
                  border: dragOverPool === pool
                    ? '2px dashed rgba(34,211,238,0.6)'
                    : '1px solid rgba(167,139,250,0.2)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  transition: 'background 0.15s, border 0.15s',
                  minHeight: 80,
                }}
              >
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(167,139,250,0.08)',
                  borderBottom: '1px solid rgba(167,139,250,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#818cf8',
                    letterSpacing: 1,
                  }}>
                    POULE {pool}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: '#64748b',
                    fontWeight: 700,
                  }}>
                    {(teamsByPool[pool] || []).length} equipe{(teamsByPool[pool] || []).length > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ padding: '6px 0', minHeight: 40 }}>
                  {(teamsByPool[pool] || []).map(team => (
                    <div
                      key={team.id}
                      draggable={!!updateTeam}
                      onDragStart={(e) => handleDragStart(e, team)}
                      onDragEnd={handleDragEnd}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 14px',
                        fontSize: 12,
                        color: '#f1f5f9',
                        cursor: updateTeam ? 'grab' : 'default',
                        opacity: draggedTeam && draggedTeam.id === team.id ? 0.4 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      <Crest team={team} size="sm" />
                      <span style={{ flex: 1 }}>{team.name}</span>
                      {team.level > 0 && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '2px 5px',
                          background: 'rgba(34,211,238,0.1)',
                          color: '#a3e635',
                          borderRadius: 3,
                          letterSpacing: 0.5,
                        }}>
                          Equipe {team.level}
                        </span>
                      )}
                    </div>
                  ))}
        </div>
              </div>
            ))
          )}
          {/* Bouton répartition auto serpentin */}
          {teams.length > 0 && updateTeam && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <select
                id="snakeNbPools"
                defaultValue={visiblePools.length || 2}
                style={{
                  padding: '8px 10px',
                  background: 'rgba(34,211,238,0.06)',
                  border: '1px solid rgba(34,211,238,0.2)',
                  borderRadius: 8,
                  color: '#a3e635',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {[2,3,4,5,6].map(n => (
                  <option key={n} value={n}>{n} poules</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const sel = document.getElementById('snakeNbPools');
                  handleSnakeDraft(parseInt(sel.value, 10));
                }}
                disabled={snaking}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: snaking ? 'rgba(34,211,238,0.03)' : 'rgba(34,211,238,0.08)',
                  border: '1px dashed rgba(34,211,238,0.3)',
                  borderRadius: 10,
                  color: snaking ? '#64748b' : '#a3e635',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  cursor: snaking ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {snaking ? 'Répartition en cours...' : '⚡ Répartition auto (serpentin)'}
              </button>
            </div>
          )}
          {/* Bouton + Nouvelle poule (visible si moins de 6 poules ET au moins 1 équipe) */}
          {visiblePools.length < 6 && pools.length > 0 && updateTeam && (
            <button
              onClick={handleAddPool}
              style={{
                width: '100%',
                padding: '10px 14px',
                marginTop: 8,
                background: 'rgba(167,139,250,0.06)',
                border: '1px dashed rgba(167,139,250,0.3)',
                borderRadius: 10,
                color: '#818cf8',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              + NOUVELLE POULE
            </button>
          )}
        </div>
        {/* COLONNE DROITE — Phase finale */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}>
            <Trophy size={14} color="#facc15" />
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.5,
              color: '#facc15',
            }}>
              PHASE FINALE
            </div>
          </div>

          {knockoutMatches.length === 0 ? (
            <div style={{
              padding: 32,
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(250,204,21,0.2)',
              borderRadius: 12,
              textAlign: 'center',
            }}>
              <Trophy size={28} color="#475569" style={{ marginBottom: 12, opacity: 0.6 }} />
              <div style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#f1f5f9',
                marginBottom: 6,
                letterSpacing: 0.5,
              }}>
                AUCUN MATCH GENERE
              </div>
              <div style={{
                fontSize: 11,
                color: '#64748b',
                lineHeight: 1.5,
                maxWidth: 280,
                margin: '0 auto',
              }}>
                Genere le planning depuis l'onglet Calendrier pour voir apparaitre la phase finale ici.
              </div>
            </div>
          ) : (
            <BracketView
              knockoutMatches={knockoutMatches}
              teams={teams}
              matches={matches}
              standings={standings}
              onMatchTap={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}