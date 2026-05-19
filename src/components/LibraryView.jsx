import React, { useState } from 'react';
import { Users, Briefcase, Edit3, Trash2, X, Save, Crown, Plus } from 'lucide-react';
import { Crest } from './Crest';

const COLORS = [
  '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185',
  '#facc15', '#f472b6', '#60a5fa', '#4ade80', '#fb923c',
];

export function LibraryView(props) {
  const teamsLibrary = props.teamsLibrary || [];
  const sponsors = props.sponsors || [];
  const onRemoveTeam = props.onRemoveFromLibrary;
  const onUpdateTeam = props.onUpdateLibraryTeam;
  const onRemoveSponsor = props.onRemoveSponsor;

  const [tab, setTab] = useState('teams');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

  const startEdit = (team) => {
    setEditingId(team.libraryId);
    setDraft({
      name: team.name || '',
      short: team.short || '',
      color: team.color || COLORS[0],
      logo: team.logo || null,
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setDraft(prev => ({ ...prev, logo: canvas.toDataURL('image/png', 0.85) }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const saveEdit = async () => {
    if (!onUpdateTeam) {
      cancelEdit();
      return;
    }
    try {
      await onUpdateTeam(editingId, draft);
      cancelEdit();
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  const handleRemoveTeam = (team) => {
    if (!window.confirm('Supprimer ' + team.name + ' de la bibliotheque ?')) return;
    onRemoveTeam(team.libraryId);
  };

  const handleRemoveSponsor = (sponsor) => {
    if (!window.confirm('Supprimer le sponsor ' + sponsor.name + ' ?')) return;
    onRemoveSponsor(sponsor.id);
  };

  return (
    <div style={{ paddingBottom: 130 }}>
      <div style={{
        padding: '14px 0 16px',
        borderBottom: '1px solid rgba(34,211,238,0.08)',
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 18,
          fontWeight: 800,
          color: '#f1f5f9',
          letterSpacing: 1,
          marginBottom: 4,
        }}>
          BIBLIOTHEQUE
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          Gere les equipes et sponsors reutilisables entre tournois
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => setTab('teams')}
          style={{
            flex: 1,
            padding: '10px',
            background: tab === 'teams' ? 'rgba(167,139,250,0.15)' : 'transparent',
            border: tab === 'teams' ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8,
            color: tab === 'teams' ? '#a78bfa' : '#64748b',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Users size={13} /> EQUIPES ({teamsLibrary.length})
        </button>
        <button
          onClick={() => setTab('sponsors')}
          style={{
            flex: 1,
            padding: '10px',
            background: tab === 'sponsors' ? 'rgba(34,211,238,0.15)' : 'transparent',
            border: tab === 'sponsors' ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8,
            color: tab === 'sponsors' ? '#22d3ee' : '#64748b',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Briefcase size={13} /> SPONSORS ({sponsors.length})
        </button>
      </div>

      {tab === 'teams' && (
        <div>
          {teamsLibrary.length === 0 && (
            <div style={{
              padding: 24,
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 10,
              textAlign: 'center',
              color: '#64748b',
              fontSize: 13,
            }}>
              Ta bibliotheque est vide. Les equipes que tu crees sont ajoutees automatiquement.
            </div>
          )}
          {teamsLibrary.map(team => (
            <div
              key={team.libraryId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                marginBottom: 8,
                background: 'rgba(15,23,42,0.4)',
                border: '1px solid rgba(167,139,250,0.15)',
                borderRadius: 10,
              }}
            >
              {editingId === team.libraryId ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      placeholder="Nom"
                      style={inputStyle}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={draft.short}
                        onChange={(e) => setDraft({ ...draft, short: e.target.value })}
                        placeholder="Court"
                        maxLength={4}
                        style={{ ...inputStyle, width: 80, fontFamily: "'JetBrains Mono', monospace" }}
                      />
                      <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                        {COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setDraft({ ...draft, color: c })}
                            style={{
                              width: 16, height: 16,
                              borderRadius: 4,
                              background: c,
                              border: draft.color === c ? '2px solid #f1f5f9' : '1px solid rgba(255,255,255,0.1)',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          />
                        ))}
                      </div>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 8px',
                        background: draft.logo ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
                        border: '1px solid ' + (draft.logo ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.1)'),
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 10,
                        fontWeight: 700,
                        color: draft.logo ? '#22d3ee' : '#94a3b8',
                      }}>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                        {draft.logo
                          ? <img src={draft.logo} alt="" style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'cover' }} />
                          : <Plus size={11} />
                        }
                        {draft.logo ? 'Changer' : 'Logo'}
                      </label>
                    </div>
                  </div>
                  <button onClick={saveEdit} style={btnSaveStyle}>
                    <Save size={13} />
                  </button>
                  <button onClick={cancelEdit} style={btnCancelStyle}>
                    <X size={13} />
                  </button>
                </>
              ) : (
                <>
                  <Crest team={team} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>
                      {team.name}
                      {team.isHost && (
                        <Crown size={11} color="#facc15" style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                      {team.short || '—'}
                    </div>
                  </div>
                  <button onClick={() => startEdit(team)} style={btnIconStyle}>
                    <Edit3 size={12} />
                  </button>
                  <button onClick={() => handleRemoveTeam(team)} style={btnRemoveStyle}>
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'sponsors' && (
        <div>
          {sponsors.length === 0 && (
            <div style={{
              padding: 24,
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 10,
              textAlign: 'center',
              color: '#64748b',
              fontSize: 13,
            }}>
              Aucun sponsor en bibliotheque. Les sponsors crees sont ajoutes automatiquement.
            </div>
          )}
          {sponsors.map(sponsor => (
            <div
              key={sponsor.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                marginBottom: 8,
                background: 'rgba(15,23,42,0.4)',
                border: '1px solid rgba(34,211,238,0.15)',
                borderRadius: 10,
              }}
            >
              {sponsor.logoUrl ? (
                <img
                  src={sponsor.logoUrl}
                  alt=""
                  style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 6,
                  background: 'rgba(34,211,238,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Briefcase size={14} color="#22d3ee" />
                </div>
              )}
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                {sponsor.name}
              </div>
              <button onClick={() => handleRemoveSponsor(sponsor)} style={btnRemoveStyle}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '6px 10px',
  background: '#0f172a',
  border: '1px solid rgba(34,211,238,0.25)',
  borderRadius: 6,
  color: '#f1f5f9',
  fontSize: 12,
  outline: 'none',
};

const btnIconStyle = {
  padding: 6,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  color: '#94a3b8',
  cursor: 'pointer',
  display: 'flex',
};

const btnSaveStyle = {
  padding: 6,
  background: 'rgba(34,211,238,0.15)',
  border: '1px solid rgba(34,211,238,0.4)',
  borderRadius: 6,
  color: '#22d3ee',
  cursor: 'pointer',
  display: 'flex',
};

const btnCancelStyle = {
  padding: 6,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  color: '#94a3b8',
  cursor: 'pointer',
  display: 'flex',
};

const btnRemoveStyle = {
  padding: 6,
  background: 'transparent',
  border: '1px solid rgba(251,113,133,0.25)',
  borderRadius: 6,
  color: '#fb7185',
  cursor: 'pointer',
  display: 'flex',
};