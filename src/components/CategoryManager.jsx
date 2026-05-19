import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3, Layers } from 'lucide-react';
import { STANDARD_CATEGORIES, getCategories } from '../utils/categoryHelpers';

export function CategoryManager(props) {
  const tournament = props.tournament;
  const onClose = props.onClose;
  const onUpdate = props.onUpdate;

  const currentCategories = getCategories(tournament);
  const [adding, setAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async (name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) { setError('Nom de categorie requis'); return; }
    if (currentCategories.includes(trimmed)) { setError('Cette categorie existe deja'); return; }
    const newList = currentCategories.concat([trimmed]);
    try {
      await onUpdate({ categories: newList });
      setNewCatName('');
      setAdding(false);
      setError('');
    } catch (e) { setError(e.message || 'Erreur'); }
  };

  const handleRename = async (idx, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) { setError('Nom requis'); return; }
    if (currentCategories.includes(trimmed) && currentCategories[idx] !== trimmed) {
      setError('Ce nom existe deja'); return;
    }
    const newList = currentCategories.slice();
    newList[idx] = trimmed;
    try {
      await onUpdate({ categories: newList });
      setEditingIdx(null);
      setEditValue('');
      setError('');
    } catch (e) { setError(e.message || 'Erreur'); }
  };

  const handleDelete = async (catName) => {
    if (!window.confirm('Supprimer la categorie ' + catName + ' ?')) return;
    const newList = currentCategories.filter(c => c !== catName);
    try { await onUpdate({ categories: newList }); }
    catch (e) { setError(e.message || 'Erreur'); }
  };

  const availablePresets = STANDARD_CATEGORIES.filter(c => !currentCategories.includes(c));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '85vh',
          background: '#0a0e1a',
          border: '1px solid rgba(34,211,238,0.25)',
          borderRadius: 16, padding: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'rgba(167,139,250,0.15)',
            border: '1px solid rgba(167,139,250,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Layers size={18} color="#a78bfa" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', letterSpacing: 1 }}>
              CATEGORIES
            </div>
            <div style={{ fontSize: 10, color: '#64748b' }}>
              Gere les categories de ton tournoi
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

        {error && (
          <div style={{
            padding: '8px 10px',
            background: 'rgba(251,113,133,0.1)',
            border: '1px solid rgba(251,113,133,0.3)',
            borderRadius: 7, color: '#fb7185',
            fontSize: 11, marginBottom: 10,
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
            color: '#64748b', marginBottom: 8,
          }}>
            CATEGORIES ACTIVES ({currentCategories.length})
          </div>
          {currentCategories.length === 0 && (
            <div style={{
              padding: 14,
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 8, textAlign: 'center',
              color: '#64748b', fontSize: 12,
            }}>
              Aucune categorie. Ajoute-en une ci-dessous.
            </div>
          )}
          {currentCategories.map((cat, idx) => (
            <div
              key={cat}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', marginBottom: 6,
                background: 'rgba(167,139,250,0.06)',
                border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: 8,
              }}
            >
              {editingIdx === idx ? (
                <React.Fragment>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1, padding: '4px 8px',
                      background: '#0f172a',
                      border: '1px solid rgba(34,211,238,0.4)',
                      borderRadius: 6, color: '#f1f5f9',
                      fontSize: 13, fontWeight: 700,
                    }}
                  />
                  <button
                    onClick={() => handleRename(idx, editValue)}
                    style={{
                      padding: '4px 10px', background: '#22d3ee',
                      border: 'none', borderRadius: 6,
                      color: '#0a0e1a', fontSize: 10,
                      fontWeight: 800, cursor: 'pointer',
                    }}
                  >OK</button>
                  <button
                    onClick={() => { setEditingIdx(null); setEditValue(''); }}
                    style={{
                      padding: '4px 8px', background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6, color: '#94a3b8',
                      fontSize: 10, cursor: 'pointer',
                    }}
                  >Annuler</button>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: 800,
                    color: '#a78bfa', letterSpacing: 1,
                  }}>{cat}</span>
                  <button
                    onClick={() => { setEditingIdx(idx); setEditValue(cat); }}
                    style={{
                      padding: 6, background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, color: '#94a3b8',
                      cursor: 'pointer', display: 'flex',
                    }}
                  ><Edit3 size={11} /></button>
                  <button
                    onClick={() => handleDelete(cat)}
                    style={{
                      padding: 6, background: 'transparent',
                      border: '1px solid rgba(251,113,133,0.25)',
                      borderRadius: 6, color: '#fb7185',
                      cursor: 'pointer', display: 'flex',
                    }}
                  ><Trash2 size={11} /></button>
                </React.Fragment>
              )}
            </div>
          ))}
        </div>

        {availablePresets.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
              color: '#64748b', marginBottom: 8,
            }}>
              AJOUT RAPIDE
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {availablePresets.map(preset => (
                <button
                  key={preset}
                  onClick={() => handleAdd(preset)}
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(34,211,238,0.1)',
                    border: '1px solid rgba(34,211,238,0.3)',
                    borderRadius: 6, color: '#22d3ee',
                    fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: 4,
                  }}
                >
                  <Plus size={10} /> {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
            color: '#64748b', marginBottom: 8,
          }}>
            AJOUT PERSONNALISE
          </div>
          {adding ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ex: U11 Filles, Veterans..."
                autoFocus
                style={{
                  flex: 1, padding: '8px 10px',
                  background: '#0f172a',
                  border: '1px solid rgba(34,211,238,0.4)',
                  borderRadius: 7, color: '#f1f5f9',
                  fontSize: 12,
                }}
              />
              <button
                onClick={() => handleAdd(newCatName)}
                style={{
                  padding: '8px 14px', background: '#22d3ee',
                  border: 'none', borderRadius: 7,
                  color: '#0a0e1a', fontSize: 11,
                  fontWeight: 800, cursor: 'pointer',
                }}
              >AJOUTER</button>
              <button
                onClick={() => { setAdding(false); setNewCatName(''); setError(''); }}
                style={{
                  padding: '8px 10px', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 7, color: '#94a3b8',
                  cursor: 'pointer',
                }}
              ><X size={12} /></button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{
                width: '100%', padding: '10px',
                background: 'rgba(34,211,238,0.08)',
                border: '1px dashed rgba(34,211,238,0.3)',
                borderRadius: 8, color: '#22d3ee',
                fontSize: 11, fontWeight: 700,
                letterSpacing: 1, cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 6,
              }}
            >
              <Plus size={12} /> NOUVELLE CATEGORIE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}