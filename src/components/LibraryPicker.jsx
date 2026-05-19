import React, { useState } from 'react';
import { X, Plus, Trash2, Filter, Sparkles, Crown, Check, Users } from 'lucide-react';
import { Crest } from './Crest';
import { styles } from '../styles/styles';

// ============================================================
// LibraryPicker — sélecteur depuis la bibliothèque persistante
// ============================================================
export function LibraryPicker({
  library, existingTeams, existingPools, onPick, onRemove, onClose,
}) {
  const [search, setSearch] = useState('');
  const [targetPool, setTargetPool] = useState(existingPools[0] || 'A');
  const [customPool, setCustomPool] = useState(false);
  const [newPool, setNewPool] = useState('');
  const [pickedIds, setPickedIds] = useState([]);
  const [picking, setPicking] = useState(false);

  const finalPool = customPool ? newPool.toUpperCase().trim() : targetPool;
  const existingNames = new Set(existingTeams.map(t => t.name.toLowerCase()));

  const filtered = search.trim()
    ? library.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
        || (t.short || '').toLowerCase().includes(search.toLowerCase()))
    : library;

  const sorted = [...filtered].sort((a, b) => {
    const aIn = existingNames.has(a.name.toLowerCase());
    const bIn = existingNames.has(b.name.toLowerCase());
    if (aIn !== bIn) return aIn ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  const handlePick = async (team) => {
    if (!finalPool || picking) return;
    if (existingNames.has(team.name.toLowerCase())) return;
    setPicking(true);
    try {
      await onPick(team.libraryId, finalPool);
      setPickedIds(prev => [...prev, team.libraryId]);
    } finally {
      setPicking(false);
    }
  };

  return (
    <div style={styles.fullscreenSheet}>
      <div style={styles.sheetHead}>
        <button onClick={onClose} style={styles.sheetBack}>
          <X size={18} />
        </button>
        <span style={styles.sheetTitle}>Bibliothèque d'équipes</span>
        <button onClick={onClose} style={styles.sheetSave}>OK</button>
      </div>

      <div style={styles.sheetBody}>
        <div style={styles.helpBox}>
          <Sparkles size={12} color="#a78bfa" />
          <span>Importe rapidement des équipes déjà créées dans tes tournois précédents.</span>
        </div>

        <div style={styles.field}>
          <span style={styles.fieldLabel}>Importer dans la poule</span>
          {!customPool ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={targetPool}
                onChange={(e) => setTargetPool(e.target.value)}
                style={{ ...styles.input, flex: 1 }}
              >
                {existingPools.length === 0 && <option value="A">A</option>}
                {existingPools.map(p => <option key={p} value={p}>Poule {p}</option>)}
              </select>
              <button
                onClick={() => { setCustomPool(true); setNewPool(''); }}
                style={styles.btnSmall}
              >
                <Plus size={12} /> Nouvelle
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={newPool}
                onChange={(e) => setNewPool(e.target.value.toUpperCase().slice(0, 3))}
                placeholder="Ex : C"
                style={{ ...styles.input, flex: 1 }}
                autoFocus
              />
              <button onClick={() => setCustomPool(false)} style={styles.btnSmall}>
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div style={styles.searchBar}>
          <Filter size={14} color="#64748b" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans la bibliothèque…"
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={styles.searchClear}>
              <X size={14} />
            </button>
          )}
        </div>

        {sorted.length === 0 && (
          <div style={styles.emptyState}>
            <Users size={28} color="#475569" />
            <span>{search ? 'Aucune équipe ne correspond' : 'Bibliothèque vide'}</span>
          </div>
        )}

        <div style={styles.cardStack}>
          {sorted.map(t => {
            const alreadyIn = existingNames.has(t.name.toLowerCase());
            const justPicked = pickedIds.includes(t.libraryId);
            return (
              <div key={t.libraryId} style={{ ...styles.teamCard, opacity: alreadyIn && !justPicked ? 0.5 : 1 }}>
                <Crest team={t} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...styles.teamCardName, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {t.name}
                    {t.isHost && <Crown size={11} color="#facc15" fill="#facc15" />}
                  </div>
                  <div style={styles.teamCardShort}>
                    {t.short}{t.category ? ` · ${t.category}` : ''}
                  </div>
                </div>
                {(alreadyIn || justPicked) ? (
                  <div style={styles.successPill || { color: '#34d399', fontSize: 10 }}>
                    <Check size={12} /> Importée
                  </div>
                ) : (
                  <button
                    onClick={() => handlePick(t)}
                    disabled={!finalPool || picking}
                    style={{ ...styles.btnSmall, opacity: (finalPool && !picking) ? 1 : 0.4 }}
                  >
                    <Plus size={13} /> Ajouter
                  </button>
                )}
                <button
                  onClick={() => onRemove(t.libraryId)}
                  style={styles.btnDangerSmall}
                  title="Retirer de la bibliothèque"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
