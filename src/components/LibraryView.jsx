import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Briefcase, Edit3, Trash2, X, Save, Crown, Plus } from 'lucide-react';
import { Crest } from './Crest';

const COLORS = [
  '#a3e635', '#818cf8', '#34d399', '#f59e0b', '#fb7185',
  '#facc15', '#f472b6', '#60a5fa', '#4ade80', '#fb923c',
];

export function LibraryView(props) {
  const teamsLibrary = props.teamsLibrary || [];
  const sponsors = props.sponsors || [];
  const onRemoveTeam = props.onRemoveFromLibrary;
  const onUpdateTeam = props.onUpdateLibraryTeam;
  const onRemoveSponsor = props.onRemoveSponsor;
  const onAddToLibrary = props.onAddToLibrary;

  const [tab, setTab] = useState('teams');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [fffSearch, setFffSearch] = useState('');
  const [fffResults, setFffResults] = useState([]);
  const [fffLoading, setFffLoading] = useState(false);
  const [fffDistrict, setFffDistrict] = useState('');
  const [districts, setDistricts] = useState([]);

  const searchFff = useCallback(async (q, district) => {
    if (!q || q.length < 2) { setFffResults([]); return; }
    setFffLoading(true);
    let query = supabase.from('clubs_fff').select('*').ilike('name', `%${q}%`).limit(30);
    if (district) query = query.eq('district_short', district);
    const { data } = await query.order('name');
    setFffResults(data || []);
    setFffLoading(false);
  }, []);

  const loadDistricts = useCallback(async () => {
    const { data } = await supabase.rpc('get_distinct_districts');
    setDistricts(data || []);
  }, []);

  React.useEffect(() => { if (tab === 'fff') loadDistricts(); }, [tab]);
  React.useEffect(() => { searchFff(fffSearch, fffDistrict); }, [fffSearch, fffDistrict]);

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
    if (editingId === 'new') {
      if (!onAddToLibrary || !draft.name?.trim()) { cancelEdit(); return; }
      try {
        await onAddToLibrary({ name: draft.name.trim(), short: draft.short || '', color: draft.color || '#a3e635', isHost: false });
        cancelEdit();
      } catch (e) { console.error('Add failed', e); }
      return;
    }
    if (!onUpdateTeam) { cancelEdit(); return; }
    try {
      await onUpdateTeam(editingId, draft);
      cancelEdit();
    } catch (e) { console.error('Update failed', e); }
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
          Gérez vos clubs réutilisables entre tournois
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
            color: tab === 'teams' ? '#818cf8' : '#64748b',
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
          <Users size={13} /> MES CLUBS ({teamsLibrary.length})
        </button>
        <button onClick={() => setTab('fff')} style={{ flex:1, padding:'10px', background: tab==='fff' ? 'rgba(163,230,53,0.15)' : 'transparent', border: tab==='fff' ? '1px solid rgba(163,230,53,0.4)' : '1px solid rgba(255,255,255,0.05)', borderRadius:8, color: tab==='fff' ? '#a3e635' : '#64748b', fontSize:12, fontWeight:800, letterSpacing:1, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}>
          🏆 BASE FFF
        </button>

      </div>

      {tab === 'teams' && (
        <div>
          <button
            onClick={() => setEditingId('new')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', marginBottom: 12, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 10, color: '#818cf8', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span style={{ fontSize: 18 }}>+</span> NOUVEAU CLUB
          </button>
          {editingId === 'new' && (
            <div style={{ padding: '16px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input type="text" value={draft.name || ''} onChange={e => setDraft({...draft, name: e.target.value})} placeholder="Nom du club *" style={inputStyle} />
                <input type="text" value={draft.short || ''} onChange={e => setDraft({...draft, short: e.target.value})} placeholder="Abréviation (4 car. max)" maxLength={4} style={inputStyle} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {COLORS.map(col => (
                    <button key={col} onClick={() => setDraft({...draft, color: col})} style={{ width: 24, height: 24, borderRadius: '50%', background: col, border: 'none', cursor: 'pointer', outline: draft.color === col ? '2px solid white' : 'none', outlineOffset: 2 }} />
                  ))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: draft.logo ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (draft.logo ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.1)'), borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: draft.logo ? '#a3e635' : '#94a3b8' }}>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    {draft.logo ? <img src={draft.logo} alt="" style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'cover' }} /> : <Plus size={11} />}
                    {draft.logo ? 'Changer' : 'Logo'}
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveEdit} style={{ flex: 1, padding: '8px', background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 8, color: '#818cf8', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Créer</button>
                  <button onClick={cancelEdit} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#64748b', cursor: 'pointer', fontSize: 13 }}>Annuler</button>
                </div>
              </div>
            </div>
          )}
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
              Ta bibliotheque est vide. Les clubs que tu crees sont ajoutes automatiquement.
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
                        color: draft.logo ? '#a3e635' : '#94a3b8',
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

      {tab === 'fff' && (
        <div>
          <input
              style={{ width:'100%', padding:'9px 12px', background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#f1f5f9', fontSize:13, fontFamily:'inherit', boxSizing:'border-box', marginBottom:8 }}
              placeholder="🔍 Rechercher un club (ex: US Feillens, Feillens, Bourg...)"
              value={fffSearch}
              onChange={e => setFffSearch(e.target.value)}
            />
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <select
              style={{ flex:1, padding:'9px 12px', background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#f1f5f9', fontSize:12, fontFamily:'inherit' }}
              value={fffDistrict}
              onChange={e => setFffDistrict(e.target.value)}
            >
              <option value="" style={{background:'#1e293b'}}>Tous les districts</option>
              {districts.map(d => <option key={d.district_short} value={d.district_short} style={{background:'#1e293b'}}>{d.district_short}</option>)}
            </select>
            <select
              style={{ flex:1, padding:'9px 12px', background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#f1f5f9', fontSize:12, fontFamily:'inherit' }}
              value={fffCity}
              onChange={e => setFffCity(e.target.value)}
            >
              <option value="" style={{background:'#1e293b'}}>{fffDistrict ? 'Toutes les villes' : 'Toutes les villes'}</option>
              {cities.map(d => <option key={d.city} value={d.city} style={{background:'#1e293b'}}>{d.city} {d.postal_code ? '('+d.postal_code+')' : ''}</option>)}
            </select>
          </div>
          {fffLoading && <div style={{ color:'#64748b', fontSize:13, padding:8 }}>Recherche...</div>}
          {!fffLoading && fffResults.length === 0 && (fffSearch.length >= 2 || fffDistrict || fffCity) && <div style={{ color:'#475569', fontSize:13, padding:8 }}>Aucun club trouvé</div>}
          {!fffSearch && !fffDistrict && !fffCity && <div style={{ color:'#475569', fontSize:13, padding:'20px 8px', textAlign:'center' }}>Sélectionnez un district, une ville ou tapez le nom d'un club</div>}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {fffResults.map(club => {
              const isInLib = teamsLibrary.some(t => t.fff_cl_no === club.cl_no);
              return (
                <div key={club.cl_no} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10 }}>
                  {club.logo_url ? <img src={club.logo_url} alt="" style={{ width:36, height:36, objectFit:'contain', borderRadius:6 }} /> : <div style={{ width:36, height:36, borderRadius:6, background:'rgba(163,230,53,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚽</div>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{club.name}</div>
                    <div style={{ fontSize:11, color:'#475569' }}>{club.location} {club.postal_code ? '('+club.postal_code+')' : ''} · {club.district_short}</div>
                  </div>
                  {isInLib ? (
                    <span style={{ fontSize:11, color:'#a3e635', fontWeight:700 }}>✓ Dans mes clubs</span>
                  ) : (
                    <button onClick={async () => {
                      await onAddToLibrary({ name: club.name, short: club.short_name || club.name.substring(0,4).toUpperCase(), color: '#818cf8', isHost: false, fff_cl_no: club.cl_no, logo: club.logo_url, district: club.district, city: club.location });
                    }} style={{ padding:'6px 12px', background:'rgba(163,230,53,0.1)', border:'1px solid rgba(163,230,53,0.2)', borderRadius:8, color:'#a3e635', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      + Ajouter
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {tab === 'sponsors_disabled' && (
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
                  <Briefcase size={14} color="#a3e635" />
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
  color: '#a3e635',
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