import React, { useState } from 'react';
import {
  Calendar, Sparkles, Plus, Edit3, Lock, Filter,
  Hash, Goal as Whistle, Download, FileText, X,
  CheckSquare, Square, Trash2, AlertCircle,
} from 'lucide-react';
import { Crest } from './Crest';
import { PageHeader } from './MatchCards';
import { MatchEditor } from './MatchEditor';
import { getDisplayTeam } from '../utils/standings';
import { knockoutRoundLabel, knockoutRoundLabelLines } from '../utils/scheduling';
import { pdfService } from '../services/pdfService';
import { styles } from '../styles/styles';

// ============================================================
// ScheduleView — calendrier des matchs (édition manuelle + auto)
// ============================================================
  export function ScheduleView({
    tournament, teams, matches, standings, role, activeCategory,
    createMatch, updateMatch, removeMatch,
    generateSchedule, askConfirm, closeConfirm,
    setSelectedMatch, setView,
  }) {
  const [editing, setEditing] = useState(null); // null | 'new' | match
  const [filterPool, setFilterPool] = useState('all');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const canManage = role === 'organizer';
  const pools = [...new Set(teams.map(t => t.pool))].sort();
  const fields = tournament.fields || ['T1', 'T2', 'T3', 'T4'];

  if (!canManage) {
    return (
      <div style={{ paddingBottom: 130 }}>
        <PageHeader title="Calendrier" icon={Calendar} accent="#34d399" />
        <div style={styles.lockedBox}>
          <Lock size={28} color="#64748b" />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', marginTop: 8 }}>
            Accès restreint
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Seul l'organisateur peut configurer le calendrier
          </div>
        </div>
      </div>
    );
  }

  const saveMatch = async (data) => {
    setError('');
    try {
      if (data.id) {
        await updateMatch(data.id, data);
      } else {
        await createMatch({
          ...data,
          scoreHome: null,
          scoreAway: null,
          status: 'scheduled',
          fairplayHome: null,
          fairplayAway: null,
        });
      }
      setEditing(null);
    } catch (e) {
      setError(e.message || "Erreur d'enregistrement.");
    }
  };

  const deleteMatch = (id) => {
    const m = matches.find(x => x.id === id);
    const wasPlayed = m && m.status !== 'scheduled';
    askConfirm({
      title: wasPlayed ? 'Match déjà joué' : 'Supprimer ce match ?',
      message: wasPlayed
        ? 'Ce match a déjà été joué ou est en cours. La suppression effacera son score.'
        : 'Cette action retire le match du calendrier.',
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        try {
          await removeMatch(id);
          setEditing(null);
        } catch (e) {
          setError(e.message);
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const handleGenerate = () => {
    if (generating) return; // protection anti-double-clic immédiate

    const scheduledCount = matches.filter(m => m.status === 'scheduled').length;
    const playedCount = matches.filter(m => m.status !== 'scheduled').length;

    let message;
    if (teams.length < 2) {
      message = 'Il faut au moins 2 équipes pour générer un planning.';
    } else if (scheduledCount > 0) {
      message = `Le calendrier contient déjà ${scheduledCount} match${scheduledCount > 1 ? 's' : ''} programmé${scheduledCount > 1 ? 's' : ''}. La génération va les remplacer par un nouveau planning. ${playedCount > 0 ? `Les ${playedCount} match${playedCount > 1 ? 's' : ''} déjà joué${playedCount > 1 ? 's' : ''} ou en cours sero${playedCount > 1 ? 'nt' : ''} conservé${playedCount > 1 ? 's' : ''}.` : ''}`;
    } else {
      message = `Toutes les rencontres de poules${tournament.hasKnockout ? ' + phase finale' : ''} seront créées automatiquement.`;
    }

    askConfirm({
      title: scheduledCount > 0 ? 'Régénérer le planning ?' : 'Générer le planning ?',
      message,
      confirmLabel: scheduledCount > 0 ? 'Régénérer' : 'Générer',
      danger: scheduledCount > 0,
      onConfirm: async () => {
        closeConfirm();
        if (teams.length < 2) return;
        if (generating) return; // double protection
        setGenerating(true);
        setError('');
        try {
          const teamsToUse = activeCategory
            ? teams.filter(t => t.category === activeCategory)
            : teams;
          if (teamsToUse.length < 2) {
            setError("Pas assez d'equipes dans la categorie " + (activeCategory || 'active'));
            return;
          }
          await generateSchedule(tournament, teamsToUse, activeCategory);
        } catch (e) {
          setError(e.message || 'Erreur lors de la génération.');
        } finally {
          setGenerating(false);
        }
      },
    });
  };

  // Filtre par poule + tri par heure
    const matchesInCategory = activeCategory
      ? matches.filter(m => m.category === activeCategory)
      : matches;
    let filtered = filterPool === 'all'
      ? matchesInCategory
      : filterPool === 'knockout'
        ? matchesInCategory.filter(m => m.phase === 'knockout')
        : matchesInCategory.filter(m => m.pool === filterPool && m.phase !== 'knockout');

  filtered = [...filtered].sort((a, b) => {
    const ta = (a.time || '99:99').slice(0, 5);
    const tb = (b.time || '99:99').slice(0, 5);
    return ta.localeCompare(tb);
  });

  // Suppression en masse des matchs sélectionnés
  const deleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    askConfirm({
      title: `Supprimer ${ids.length} match${ids.length > 1 ? 's' : ''} ?`,
      message: 'Cette action est irréversible. Les matchs sélectionnés seront définitivement supprimés.',
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        try {
          await Promise.all(ids.map(id => removeMatch(id)));
          setSelectedIds(new Set());
          setSelectionMode(false);
        } catch (e) {
          setError(e.message || 'Erreur lors de la suppression.');
        } finally {
          closeConfirm();
        }
      },
    });
  };

  // Tout effacer sauf les matchs joués (validated + live avec score)
  const deleteAllRegeneratable = () => {
    const ids = matches
      .filter(m => 
        m.status === 'scheduled' 
        || (m.status === 'live' && !(m.scoreHome > 0 || m.scoreAway > 0))
      )
      .map(m => m.id);
    if (ids.length === 0) {
      setError('Aucun match à effacer.');
      return;
    }
    askConfirm({
      title: `Effacer ${ids.length} match${ids.length > 1 ? 's' : ''} ?`,
      message: 'Tous les matchs programmés (et matchs en LIVE sans score) seront supprimés. Les résultats déjà saisis sont conservés.',
      confirmLabel: 'Tout effacer',
      danger: true,
      onConfirm: async () => {
        try {
          await Promise.all(ids.map(id => removeMatch(id)));
        } catch (e) {
          setError(e.message);
        } finally {
          closeConfirm();
        }
      },
    });
  };

  // Bascule sélection d'un match
  const toggleSelection = (matchId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  };

  // Sélectionne/désélectionne tous les matchs sélectionnables visibles
  const toggleSelectAll = (visibleMatches) => {
    const selectableIds = visibleMatches
      .filter(m => m.status !== 'validated' && !(m.status === 'live' && (m.scoreHome > 0 || m.scoreAway > 0)))
      .map(m => m.id);
    if (selectableIds.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };
  
  // Export PDF
  const exportPdf = async (kind, pool) => {
    setExporting(true);
    setError('');
    try {
      if (kind === 'full') {
        await pdfService.downloadSchedulePdf(tournament, teams, matches);
      } else if (kind === 'summary') {
        await pdfService.downloadSummaryPdf(tournament, teams, matches);
      } else if (kind === 'pool') {
        await pdfService.downloadPoolPdf(tournament, teams, matches, pool);
      }
      setPdfMenuOpen(false);
    } catch (e) {
      setError(e.message || 'Erreur lors de la génération du PDF.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ paddingBottom: 130 }}>
      <PageHeader
        title="Calendrier"
        subtitle={`${matches.length} matchs programmés`}
        icon={Calendar}
        accent="#34d399"
      />

      {/* Actions */}
      <div style={styles.scheduleActions}>
        <button
          onClick={handleGenerate}
          disabled={generating || teams.length < 2}
          style={{ ...styles.btnGenerate || styles.btnPrimary, opacity: (generating || teams.length < 2) ? 0.5 : 1 }}
        >
          <Sparkles size={14} /> {generating ? 'Génération…' : 'GÉNÉRER AUTO'}
        </button>
        <button
          onClick={() => setEditing('new')}
          style={styles.btnSecondary}
        >
          <Plus size={14} /> AJOUTER
        </button>
      </div>

      {matches.length > 0 && !selectionMode && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => setSelectionMode(true)}
            style={{
              ...styles.btnSecondary,
              flex: 1,
              background: 'rgba(167,139,250,0.08)',
              borderColor: 'rgba(167,139,250,0.3)',
              color: '#a78bfa',
            }}
          >
            <CheckSquare size={14} /> SÉLECTIONNER
          </button>
          <button
            onClick={deleteAllRegeneratable}
            style={{
              ...styles.btnSecondary,
              flex: 1,
              background: 'rgba(251,113,133,0.08)',
              borderColor: 'rgba(251,113,133,0.3)',
              color: '#fb7185',
            }}
          >
            <Trash2 size={14} /> TOUT EFFACER
          </button>
        </div>
      )}
      
      {/* Bouton PDF (en pleine largeur si on a des matchs) */}
      {matches.length > 0 && (
        <button
          onClick={() => setPdfMenuOpen(true)}
          disabled={exporting}
          style={{
            ...styles.btnSecondary,
            width: '100%',
            marginBottom: 10,
            background: 'rgba(167,139,250,0.08)',
            borderColor: 'rgba(167,139,250,0.3)',
            color: '#a78bfa',
            opacity: exporting ? 0.5 : 1,
          }}
        >
          <Download size={14} /> {exporting ? 'Génération…' : 'EXPORTER EN PDF (AFFICHAGE TERRAIN)'}
        </button>
      )}

      {error && (
        <div style={{ ...styles.fieldError, marginBottom: 10, textAlign: 'center' }}>{error}</div>
      )}

      {/* Filtre par poule */}
      <div style={styles.filterBar}>
        <button
          onClick={() => setFilterPool('all')}
          style={{ ...styles.filterChip, ...(filterPool === 'all' ? styles.filterChipActive : {}) }}
        >
          TOUS
        </button>
        {pools.map(p => (
          <button
            key={p}
            onClick={() => setFilterPool(p)}
            style={{ ...styles.filterChip, ...(filterPool === p ? styles.filterChipActive : {}) }}
          >
            Poule {p}
          </button>
        ))}
        {matches.some(m => m.phase === 'knockout') && (
          <button
            onClick={() => setFilterPool('knockout')}
            style={{ ...styles.filterChip, ...(filterPool === 'knockout' ? styles.filterChipActive : {}) }}
          >
            Phases finales
          </button>
        )}
      </div>

      <div style={styles.cardStack}>
        {filtered.length === 0 && (
          <div style={styles.emptyState}>
            <Calendar size={28} color="#475569" />
            <span>
              Aucun match. Ajoute des équipes puis génère le planning, ou crée un match manuel.
            </span>
          </div>
        )}
        {filtered.map(m => (
          <ScheduleMatchRow
            key={m.id}
            match={m}
            teams={teams}
            matches={matches}
            standings={standings}
            onEdit={() => setEditing(m)}
            onTap={() => { setSelectedMatch(m); setView('match'); }}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(m.id)}
            onToggleSelect={toggleSelection}
          />
        ))}
      </div>

      {editing && (
        <MatchEditor
          match={editing === 'new' ? null : editing}
          teams={teams}
          fields={fields}
          pools={pools}
          onSave={saveMatch}
          onDelete={editing !== 'new' ? () => deleteMatch(editing.id) : null}
          onCancel={() => setEditing(null)}
        />
      )}
      
      {selectionMode && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: 448,
            padding: '12px 14px',
            background: 'rgba(167,139,250,0.12)',
            border: '1.5px solid rgba(167,139,250,0.4)',
            borderRadius: 14,
            boxShadow: '0 8px 24px rgba(167,139,250,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 100,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <button
            onClick={() => toggleSelectAll(filtered)}
            style={{
              ...styles.btnSmall,
              padding: '6px 10px',
              background: 'transparent',
              borderColor: 'rgba(167,139,250,0.4)',
              color: '#a78bfa',
              fontSize: 9,
            }}
          >
            <CheckSquare size={12} /> TOUT
          </button>
          <span
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: 800,
              color: '#a78bfa',
              textAlign: 'center',
            }}
          >
            {selectedIds.size} match{selectedIds.size > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
            style={{
              ...styles.btnSmall,
              padding: '6px 10px',
              background: 'transparent',
              borderColor: '#475569',
              color: '#94a3b8',
              fontSize: 9,
            }}
          >
            <X size={12} /> ANNULER
          </button>
          <button
            onClick={deleteSelected}
            disabled={selectedIds.size === 0}
            style={{
              ...styles.btnSmall,
              padding: '8px 12px',
              background: selectedIds.size > 0 ? '#fb7185' : '#475569',
              borderColor: selectedIds.size > 0 ? '#fb7185' : '#475569',
              color: '#0a0a0a',
              fontSize: 10,
              fontWeight: 800,
              opacity: selectedIds.size > 0 ? 1 : 0.5,
            }}
          >
            <Trash2 size={12} /> SUPPRIMER ({selectedIds.size})
          </button>
        </div>
      )}
      
      {pdfMenuOpen && (
        <PdfExportMenu
          tournament={tournament}
          pools={pools}
          hasKnockout={matches.some(m => m.phase === 'knockout')}
          exporting={exporting}
          onExport={exportPdf}
          onClose={() => setPdfMenuOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// PdfExportMenu — modale plein écran pour choisir le type d'export
// ============================================================
function PdfExportMenu({ tournament, pools, hasKnockout, exporting, onExport, onClose }) {
  return (
    <div style={styles.fullscreenSheet}>
      <div style={styles.sheetHead}>
        <button onClick={onClose} style={styles.sheetBack}>
          <X size={18} />
        </button>
        <span style={styles.sheetTitle}>Exporter en PDF</span>
        <div style={{ width: 38 }} />
      </div>

      <div style={styles.sheetBody}>
        <div style={{ ...styles.helpBox, marginBottom: 16 }}>
          <FileText size={12} color="#a78bfa" />
          <span>
            Génère un PDF prêt à imprimer pour affichage sur les terrains. Format A4, lisible à distance.
          </span>
        </div>

        {/* Planning complet (par poule, multi-pages) */}
        <PdfChoice
          icon={FileText}
          color="#22d3ee"
          title="Planning complet"
          desc={`${pools.length} poule${pools.length > 1 ? 's' : ''}${hasKnockout ? ' + phase finale' : ''}, une page par poule. Idéal pour distribuer aux équipes.`}
          onClick={() => onExport('full')}
          disabled={exporting}
        />

        {/* Résumé compact 1 page */}
        <PdfChoice
          icon={FileText}
          color="#a78bfa"
          title="Résumé compact"
          desc="Tous les matchs sur une seule page, triés par heure. Pratique pour la table de marque."
          onClick={() => onExport('summary')}
          disabled={exporting}
        />

        {/* Une poule en particulier */}
        {pools.length > 0 && (
          <>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 1.5,
                color: '#64748b',
                marginTop: 16,
                marginBottom: 6,
              }}
            >
              PAR POULE
            </div>
            {pools.map(pool => (
              <PdfChoice
                key={pool}
                icon={FileText}
                color="#34d399"
                title={`Poule ${pool}`}
                desc="Affichage dédié pour le terrain de cette poule."
                onClick={() => onExport('pool', pool)}
                disabled={exporting}
                small
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function PdfChoice({ icon: Icon, color, title, desc, onClick, disabled, small }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: small ? 12 : 14,
        marginBottom: 8,
        width: '100%',
        background: color + '08',
        border: `1px solid ${color}33`,
        borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: color + '15',
          border: `1px solid ${color}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>{desc}</div>
      </div>
      <Download size={14} color={color} />
    </button>
  );
}

function ScheduleMatchRow({ match, teams, matches, standings, onEdit, onTap, selectionMode, isSelected, onToggleSelect }) {
  const home = getDisplayTeam('home', match, teams, matches, standings);
  const away = getDisplayTeam('away', match, teams, matches, standings);
  const isKnockout = match.phase === 'knockout';
  const isProtected = match.status === 'validated' || (match.status === 'live' && (match.scoreHome > 0 || match.scoreAway > 0));

  return (
    <div style={{
      ...styles.matchListCard,
      ...(selectionMode && isSelected ? { borderColor: '#a78bfa', background: 'rgba(167,139,250,0.08)' } : {}),
      ...(selectionMode && isProtected ? { opacity: 0.5 } : {}),
    }}>
      {selectionMode && (
        <button
          onClick={() => !isProtected && onToggleSelect(match.id)}
          disabled={isProtected}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: isProtected ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title={isProtected ? 'Match déjà joué — non supprimable' : ''}
        >
          {isSelected
            ? <CheckSquare size={18} color="#a78bfa" />
            : <Square size={18} color={isProtected ? '#475569' : '#94a3b8'} />}
        </button>
      )}
      <button
        onClick={selectionMode && !isProtected ? () => onToggleSelect(match.id) : onTap}
        style={{ ...styles.matchListLeft, color: '#94a3b8', background: 'transparent', border: 'none', padding: 0 }}
      >
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>
          {(match.time || '—').slice(0, 5)}
        </span>
      </button>
      <button
        onClick={selectionMode && !isProtected ? () => onToggleSelect(match.id) : onTap}
        style={{ ...styles.matchListMid, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <div style={styles.matchListSide}>
          <Crest team={home} size="sm" />
          <span style={styles.matchListName}>{home.short}</span>
        </div>
        <div style={styles.matchListScore}>
          {match.status === 'validated'
            ? <span style={{ color: '#34d399', fontWeight: 800 }}>{match.scoreHome} - {match.scoreAway}</span>
            : match.status === 'live'
              ? <span style={{ color: '#22d3ee', fontWeight: 800 }}>{match.scoreHome ?? 0} - {match.scoreAway ?? 0}</span>
              : <span style={{ color: '#475569' }}>vs</span>}
        </div>
        <div style={{ ...styles.matchListSide, flexDirection: 'row-reverse' }}>
          <Crest team={away} size="sm" />
          <span style={styles.matchListName}>{away.short}</span>
        </div>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
        <span style={styles.matchListRight}>
          <Hash size={9} /> {match.field}
        </span>
        {isKnockout && (() => {
          const lbl = knockoutRoundLabelLines(match.knockoutRound, match.cup);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
              <span style={{ 
                fontSize: 10, 
                color: '#f59e0b', 
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}>
                {lbl.line1}
              </span>
              {lbl.line2 && (
                <span style={{ 
                  fontSize: 9, 
                  color: '#f59e0b',
                  opacity: 0.85,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  {lbl.line2}
                </span>
              )}
            </div>
          );
        })()}
      </div>
      {!isKnockout && !selectionMode && (
        <button
          onClick={onEdit}
          style={{
            ...styles.btnSmall,
            padding: '6px 8px',
            marginLeft: 4,
          }}
        >
          <Edit3 size={11} />
        </button>
      )}
    </div>
  );
}