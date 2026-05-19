import { TeamsLibraryPicker } from './TeamsLibraryPicker';
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Crown, Star, X } from 'lucide-react';
import { Crest } from './Crest';

const COLORS = [
  '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185',
  '#facc15', '#f472b6', '#60a5fa', '#4ade80', '#fb923c',
];

const POOLS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function TeamsTableDesktop(props) {
  const teams = props.teams || [];
  const activeCategory = props.activeCategory;
  const onCreateTeam = props.onCreateTeam;
  const onUpdateTeam = props.onUpdateTeam;
  const onRemoveTeam = props.onRemoveTeam;
  const onOpenLibrary = props.onOpenLibrary;
  const allTeams = props.allTeams || [];
  const teamsLibrary = props.teamsLibrary || [];
  const onImportFromLibrary = props.onImportFromLibrary;

  const [editingCell, setEditingCell] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const newInputRef = useRef(null);

  // Calcule les suggestions selon ce que l'utilisateur tape
  const suggestions = (() => {
    const q = (newName || '').trim().toLowerCase();
    if (q.length < 2) return [];
    const existingNames = new Set(teams.map(t => t.name.toLowerCase()));
    // 1. Equipes de la bibliotheque (filtrees par catégorie si possible)
    const libMatches = teamsLibrary
      .filter(t =>
        t.name.toLowerCase().includes(q)
        && !existingNames.has(t.name.toLowerCase())
        && (!activeCategory || !t.category || t.category === activeCategory)
      )
      .slice(0, 5)
      .map(t => ({ source: 'library', team: t }));
    // 2. Equipes d'autres categories du meme tournoi
    const otherCatMatches = allTeams
      .filter(t =>
        t.name.toLowerCase().includes(q)
        && t.category !== activeCategory
        && !existingNames.has(t.name.toLowerCase())
        && !libMatches.some(s => s.team.name.toLowerCase() === t.name.toLowerCase())
      )
      .slice(0, 3)
      .map(t => ({ source: 'other_cat', team: t }));
    return libMatches.concat(otherCatMatches).slice(0, 6);
  })();

  useEffect(() => {
    if (adding && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [adding]);

  // Quand l'utilisateur confirme la sélection depuis la modale bibliothèque
  const handlePickerConfirm = async (imports) => {
    if (!imports || imports.length === 0) return;
    try {
      for (const imp of imports) {
        if (onImportFromLibrary && imp.libraryId) {
          await onImportFromLibrary(imp.libraryId, 'A', { level: imp.level });
        } else if (onCreateTeam) {
          await onCreateTeam({
            name: imp.libraryItem.name,
            short: imp.libraryItem.short,
            color: imp.libraryItem.color,
            level: imp.level,
            pool: 'A',
          });
        }
      }
      setPickerOpen(false);
    } catch (e) {
      console.error('Picker confirm failed', e);
    }
  };
  const handleQuickAdd = async (nameOrSuggestion) => {
    // Si c'est un objet suggestion (depuis la bibliothèque ou autre catégorie)
    if (nameOrSuggestion && typeof nameOrSuggestion === 'object') {
      const sugg = nameOrSuggestion;
      try {
        if (sugg.source === 'library' && onImportFromLibrary) {
          await onImportFromLibrary(sugg.team.libraryId || sugg.team.id, 'A');
        } else {
          // Equipe d'une autre catégorie : on la duplique dans la catégorie active
          await onCreateTeam({
            name: sugg.team.name,
            short: sugg.team.short,
            color: sugg.team.color,
            level: sugg.team.level || 1,
            pool: 'A',
          });
        }
        setNewName('');
        setShowSuggestions(false);
      } catch (e) {
        console.error('Import failed', e);
      }
      return;
    }
    // Sinon création classique
    const trimmed = (nameOrSuggestion || '').trim();
    if (!trimmed) return;
    try {
      await onCreateTeam({
        name: trimmed,
        short: trimmed.slice(0, 4).toUpperCase(),
        color: COLORS[teams.length % COLORS.length],
        pool: 'A',
        level: 1,
      });
      setNewName('');
      setShowSuggestions(false);
    } catch (e) {
      console.error('Create failed', e);
    }
  };

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newName.trim()) {
        handleQuickAdd(newName);
      } else {
        setAdding(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setNewName('');
      setAdding(false);
    }
  };

  const updateField = async (teamId, field, value) => {
    try {
      await onUpdateTeam(teamId, { [field]: value });
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  const toggleHost = async (team) => {
    await updateField(team.id, 'isHost', !team.isHost);
  };

  const headerStyle = {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: '#64748b',
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(34,211,238,0.03)',
  };

  const cellStyle = {
    padding: '6px 12px',
    fontSize: 13,
    color: '#f1f5f9',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    verticalAlign: 'middle',
  };

  const inputStyle = {
    width: '100%',
    padding: '4px 8px',
    background: '#0f172a',
    border: '1px solid rgba(34,211,238,0.3)',
    borderRadius: 5,
    color: '#f1f5f9',
    fontSize: 13,
    outline: 'none',
  };

      return (
        <>
        <div style={{
      background: 'rgba(15,23,42,0.4)',
      border: '1px solid rgba(34,211,238,0.1)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderBottom: '1px solid rgba(34,211,238,0.08)',
        background: 'rgba(34,211,238,0.04)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', letterSpacing: 1 }}>
            EQUIPES {activeCategory ? '— ' + activeCategory : ''}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
            {teams.length} equipe{teams.length > 1 ? 's' : ''} · Tab pour cellule suivante · Entree pour valider
          </div>
        </div>
        <button
          onClick={() => setPickerOpen(true)}
          style={{
            padding: '6px 12px',
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.3)',
            borderRadius: 7,
            color: '#22d3ee',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
            cursor: 'pointer',
          }}
        >
          + DEPUIS LA BIBLIOTHEQUE
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...headerStyle, width: 40 }}></th>
            <th style={headerStyle}>NOM</th>
            <th style={{ ...headerStyle, width: 80 }}>COURT</th>
            <th style={{ ...headerStyle, width: 100 }}>COULEUR</th>
            <th style={{ ...headerStyle, width: 80 }}>POULE</th>
            <th style={{ ...headerStyle, width: 110 }}>EQUIPE</th>
            <th style={{ ...headerStyle, width: 60 }}>HOTE</th>
            <th style={{ ...headerStyle, width: 50 }}></th>
          </tr>
        </thead>
        <tbody>
          {teams.map(team => (
            <tr key={team.id} style={{ background: 'transparent' }}>
              <td style={cellStyle}>
                <Crest team={team} size="sm" />
              </td>
              <td style={cellStyle}>
                {editingCell === team.id + '_name' ? (
                  <input
                    autoFocus
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => { updateField(team.id, 'name', draftName); setEditingCell(null); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { updateField(team.id, 'name', draftName); setEditingCell(null); }
                      if (e.key === 'Escape') setEditingCell(null);
                    }}
                    style={inputStyle}
                  />
                ) : (
                  <span
                    onClick={() => { setEditingCell(team.id + '_name'); setDraftName(team.name); }}
                    style={{ cursor: 'text', display: 'block', padding: '4px 0' }}
                  >
                    {team.name}
                  </span>
                )}
              </td>
              <td style={cellStyle}>
                <input
                  type="text"
                  defaultValue={team.short || ''}
                  onBlur={(e) => updateField(team.id, 'short', e.target.value)}
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                />
              </td>
              <td style={cellStyle}>
                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {COLORS.slice(0, 6).map(c => (
                    <button
                      key={c}
                      onClick={() => updateField(team.id, 'color', c)}
                      style={{
                        width: 14, height: 14,
                        borderRadius: 3,
                        background: c,
                        border: team.color === c ? '2px solid #f1f5f9' : '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </td>
              <td style={cellStyle}>
                <select
                  value={team.pool || 'A'}
                  onChange={(e) => updateField(team.id, 'pool', e.target.value)}
                  style={inputStyle}
                >
                  {POOLS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </td>
              <td style={cellStyle}>
                <select
                  value={team.level || 1}
                  onChange={(e) => updateField(team.id, 'level', parseInt(e.target.value, 10))}
                  style={inputStyle}
                >
                  {[1, 2, 3].map(n => <option key={n} value={n}>Equipe {n}</option>)}
                </select>
              </td>
              <td style={cellStyle}>
                <button
                  onClick={() => toggleHost(team)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <Crown
                    size={16}
                    color={team.isHost ? '#facc15' : '#475569'}
                    fill={team.isHost ? '#facc15' : 'transparent'}
                  />
                </button>
              </td>
              <td style={cellStyle}>
                <button
                  onClick={() => {
                    if (window.confirm('Supprimer ' + team.name + ' ?')) {
                      onRemoveTeam(team.id);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(251,113,133,0.25)',
                    borderRadius: 6,
                    padding: 4,
                    color: '#fb7185',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}

          <tr style={{ background: 'rgba(34,211,238,0.04)' }}>
            <td style={cellStyle} colSpan={8}>
                  {adding ? (
                    <>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    ref={newInputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => { setNewName(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={handleAddKeyDown}
                    placeholder="Nom de l'equipe... (Entree pour valider, Echap pour annuler)"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={() => handleQuickAdd(newName)}
                    style={{
                      padding: '6px 14px',
                      background: '#22d3ee',
                      border: 'none',
                      borderRadius: 6,
                      color: '#0a0e1a',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    AJOUTER
                  </button>
                  <button
                    onClick={() => { setAdding(false); setNewName(''); }}
                    style={{
                      padding: '6px 8px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
                      {showSuggestions && suggestions.length > 0 && (
                        <div style={{
                          marginTop: 4,
                          padding: 6,
                          background: '#0a0e1a',
                          border: '1px solid rgba(34,211,238,0.25)',
                          borderRadius: 8,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        }}>
                          <div style={{
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: 1,
                            color: '#64748b',
                            padding: '4px 8px',
                          }}>
                            SUGGESTIONS ({suggestions.length})
                          </div>
                          {suggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => handleQuickAdd(s)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                width: '100%',
                                padding: '6px 8px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 5,
                                color: '#f1f5f9',
                                fontSize: 12,
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              <div style={{
                                width: 18, height: 18,
                                borderRadius: 4,
                                background: s.team.color || '#22d3ee',
                                flexShrink: 0,
                              }} />
                              <span style={{ flex: 1, fontWeight: 700 }}>{s.team.name}</span>
                              <span style={{
                                fontSize: 9,
                                fontWeight: 800,
                                letterSpacing: 0.5,
                                color: s.source === 'library' ? '#a78bfa' : '#facc15',
                                padding: '2px 6px',
                                background: s.source === 'library' ? 'rgba(167,139,250,0.1)' : 'rgba(250,204,21,0.1)',
                                borderRadius: 4,
                              }}>
                                {s.source === 'library' ? 'BIBLIO' : s.team.category}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      </>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'transparent',
                    border: '1px dashed rgba(34,211,238,0.3)',
                    borderRadius: 7,
                    color: '#22d3ee',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Plus size={12} /> NOUVELLE EQUIPE
                </button>
              )}
            </td>
          </tr>
        </tbody>
      </table>
</div>
    {pickerOpen && (
      <TeamsLibraryPicker
        teamsLibrary={teamsLibrary}
        teamsInCategory={teams}
        activeCategory={activeCategory}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickerConfirm}
      />
    )}
    </>
  );
}
