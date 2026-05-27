import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';

// Normalise une chaîne pour la recherche : minuscules + sans accents
function normalize(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function TeamsLibraryPicker(props) {
  const teamsLibrary = props.teamsLibrary || [];
  const teamsInCategory = props.teamsInCategory || []; // équipes déjà dans la catégorie active
  const activeCategory = props.activeCategory;
  const onClose = props.onClose;
  const onConfirm = props.onConfirm;

  const [query, setQuery] = useState('');
  // Map { teamLibraryId: count } pour savoir combien d'équipes ajouter par club
  const [selections, setSelections] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Pour chaque équipe de la bibliothèque, on calcule les rangs déjà pris dans la catégorie
  const ranksInCategory = useMemo(() => {
    const map = {};
    teamsInCategory.forEach(t => {
      const key = normalize(t.name);
      if (!map[key]) map[key] = [];
      if (t.level) map[key].push(t.level);
    });
    return map;
  }, [teamsInCategory]);

  // Filtre la liste selon la recherche
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return teamsLibrary;
    return teamsLibrary.filter(t => normalize(t.name).includes(q));
  }, [query, teamsLibrary]);

  const totalSelected = Object.values(selections).reduce((s, n) => s + n, 0);

  const updateCount = (libId, delta) => {
    setSelections(prev => {
      const current = prev[libId] || 0;
      const next = Math.max(0, Math.min(3, current + delta));
      const newMap = { ...prev };
      if (next === 0) {
        delete newMap[libId];
      } else {
        newMap[libId] = next;
      }
      return newMap;
    });
  };

  const setCount = (libId, value) => {
    const n = Math.max(0, Math.min(3, parseInt(value, 10) || 0));
    setSelections(prev => {
      const newMap = { ...prev };
      if (n === 0) {
        delete newMap[libId];
      } else {
        newMap[libId] = n;
      }
      return newMap;
    });
  };

  const handleConfirm = async () => {
    if (totalSelected === 0 || submitting) return;
    setSubmitting(true);
    try {
      // On construit la liste d'imports à faire
      const imports = [];
      Object.entries(selections).forEach(([libId, count]) => {
        const lib = teamsLibrary.find(t => (t.libraryId || t.id) === libId);
        if (!lib) return;
        const existingRanks = ranksInCategory[normalize(lib.name)] || [];
        let rank = 1;
        for (let i = 0; i < count; i++) {
          while (existingRanks.includes(rank)) rank++;
          if (rank > 3) break; // Limite à 3 niveaux d'équipes (Equipe 1, 2, 3)
          imports.push({
            libraryId: lib.libraryId || lib.id,
            libraryItem: lib,
            level: rank,
          });
          existingRanks.push(rank);
          rank++;
        }
      });
      await onConfirm(imports);
      setSubmitting(false);
    } catch (e) {
      console.error('Library picker confirm failed', e);
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640, maxHeight: '90vh',
          background: '#0a0e1a',
          border: '1px solid rgba(34,211,238,0.25)',
          borderRadius: 16, padding: 20,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', letterSpacing: 1 }}>
              AJOUTER DEPUIS LA BIBLIOTHEQUE
              {activeCategory ? ' — ' + activeCategory : ''}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              Coche les equipes a ajouter et ajuste le nombre par club si besoin.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 6, background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7, color: '#94a3b8',
              cursor: 'pointer', display: 'flex',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', marginBottom: 12,
          background: '#0f172a',
          border: '1px solid rgba(34,211,238,0.25)',
          borderRadius: 8,
        }}>
          <Search size={14} color="#64748b" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une equipe..."
            autoFocus
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: '#f1f5f9', fontSize: 13, outline: 'none',
            }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, minHeight: 200 }}>
          {filtered.length === 0 && (
            <div style={{
              padding: 24,
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 8, textAlign: 'center',
              color: '#64748b', fontSize: 12,
            }}>
              {teamsLibrary.length === 0
                ? 'Ta bibliotheque est vide. Cree des equipes pour les retrouver ici.'
                : 'Aucune equipe ne correspond a la recherche.'}
            </div>
          )}
          {filtered.map(lib => {
            const libId = lib.libraryId || lib.id;
            const count = selections[libId] || 0;
            const existingRanks = ranksInCategory[normalize(lib.name)] || [];
            const alreadyInCategory = existingRanks.length > 0;
            return (
              <div
                key={libId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', marginBottom: 4,
                  background: count > 0 ? 'rgba(34,211,238,0.06)' : 'transparent',
                  border: count > 0 ? '1px solid rgba(34,211,238,0.25)' : '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  opacity: alreadyInCategory && count === 0 ? 0.6 : 1,
                }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: 4,
                  background: lib.color || '#a3e635',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                    {lib.name}
                  </div>
                  {alreadyInCategory && (
                    <div style={{ fontSize: 9, color: '#fb923c', marginTop: 2 }}>
                      Deja engagee : {existingRanks.map(r => 'Equipe ' + r).join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => updateCount(libId, -1)}
                    disabled={count === 0}
                    style={{
                      width: 26, height: 26,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      color: count === 0 ? '#475569' : '#94a3b8',
                      fontSize: 14, fontWeight: 800,
                      cursor: count === 0 ? 'not-allowed' : 'pointer',
                      padding: 0, lineHeight: 1,
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0" max="3"
                    value={count}
                    onChange={(e) => setCount(libId, e.target.value)}
                    style={{
                      width: 36, height: 26,
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      color: '#f1f5f9',
                      fontSize: 12, fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => updateCount(libId, 1)}
                    style={{
                      width: 26, height: 26,
                      background: 'rgba(34,211,238,0.15)',
                      border: '1px solid rgba(34,211,238,0.4)',
                      borderRadius: 6,
                      color: '#a3e635',
                      fontSize: 14, fontWeight: 800,
                      cursor: 'pointer',
                      padding: 0, lineHeight: 1,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#94a3b8',
              fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              cursor: 'pointer',
            }}
          >
            ANNULER
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleConfirm}
            disabled={totalSelected === 0 || submitting}
            style={{
              padding: '10px 22px',
              background: (totalSelected === 0 || submitting) ? 'rgba(34,211,238,0.3)' : '#a3e635',
              border: 'none',
              borderRadius: 8, color: '#0a0e1a',
              fontSize: 12, fontWeight: 800, letterSpacing: 0.5,
              cursor: (totalSelected === 0 || submitting) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Check size={13} />
            {submitting
              ? 'AJOUT...'
              : totalSelected === 0
                ? 'AJOUTER'
                : 'AJOUTER ' + totalSelected + ' EQUIPE' + (totalSelected > 1 ? 'S' : '')}
          </button>
        </div>
      </div>
    </div>
  );
}