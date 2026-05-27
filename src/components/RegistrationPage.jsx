import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================
// RegistrationPage — page publique d'inscription
// Accessible via ?register=1&t=ACCESS_CODE
// Reprend le branding du club organisateur
// ============================================================

export function RegistrationPage({ accessCode }) {
  const [tournament, setTournament] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('form'); // form | success | closed
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    team_name: '',
    club_name: '',
    category: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    message: '',
    nb_players: '',
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const [selectedTeams, setSelectedTeams] = useState({});
  const [selectedCategories, setSelectedCategories] = useState({});
  const toggleCategory = (cat) => {
    setSelectedCategories(prev => {
      const newVal = !prev[cat];
      if (!newVal) {
        // Désélectionner toutes les équipes de cette catégorie
        setSelectedTeams(prev2 => {
          const updated = { ...prev2 };
          [1,2,3].forEach(l => delete updated[cat + '_' + l]);
          return updated;
        });
      }
      return { ...prev, [cat]: newVal };
    });
  };
  const [playersByTeam, setPlayersByTeam] = useState({});
  const addPlayer = (key) => setPlayersByTeam(prev => ({ ...prev, [key]: [...(prev[key] || []), { first_name: '', last_name: '', birth_date: '', license_number: '' }] }));
  const updatePlayer = (key, i, field, val) => setPlayersByTeam(prev => ({ ...prev, [key]: prev[key].map((p, idx) => idx === i ? { ...p, [field]: val } : p) }));
  const removePlayer = (key, i) => setPlayersByTeam(prev => ({ ...prev, [key]: prev[key].filter((_, idx) => idx !== i) }));
  const toggleTeam = (cat, level) => {
    const key = cat + '_' + level;
    setSelectedTeams(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const totalTeams = Object.values(selectedTeams).filter(Boolean).length;
  const totalPrice = totalTeams * (tournament?.registration_fee || 0);

  // Charger le tournoi + profil de l'organisateur
  useEffect(() => {
    if (!accessCode) return;
    (async () => {
      setLoading(true);
      try {
        // Récupérer le tournoi via RPC (bypass RLS)
        const { data: tData, error: tErr } = await supabase
          .rpc('get_tournament_by_code', { p_code: accessCode.toUpperCase() });
        if (tErr || !tData?.length) { setLoading(false); return; }
        const t = tData[0];
        setTournament(t);
        // Charger le branding TOUJOURS (même si inscriptions fermées)
        const { data: pData } = await supabase
          .rpc('get_club_branding', { p_owner_id: t.owner_id });
        setProfile(Array.isArray(pData) ? pData[0] : pData);
        // Si inscriptions fermées
        if (!t.registration_open) { setStep('closed'); setLoading(false); return; }
      } catch (e) {
        console.error('RegistrationPage load error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessCode]);

  const clubColor = profile?.club_color || '#a3e635';
  const clubName = profile?.club_name || 'Club organisateur';
  const config = tournament?.registration_config || {};
  const categories = Array.isArray(tournament?.categories) ? tournament.categories : [];

  const handleSubmit = async () => {
    if (!form.contact_name.trim() || !form.contact_email.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (config.require_phone && !form.contact_phone.trim()) {
      setError('Le numéro de téléphone est obligatoire.');
      return;
    }
    if (totalTeams === 0) {
      setError('Veuillez sélectionner au moins une équipe.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { data: insData, error: insErr } = await supabase.from('registrations').insert({
        tournament_id: tournament.id,
        team_name: form.club_name.trim() || form.contact_name.trim(),
        category: null,
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || null,
        message: form.message.trim() || null,
        nb_players: totalTeams,
        status: 'pending',
        teams_list: Object.entries(selectedTeams).filter(([,v]) => v).map(([key]) => { const parts = key.split('_'); const level = parts[parts.length-1]; const cat = parts.slice(0,-1).join('_'); return { category: cat, level: parseInt(level,10) }; }),
      }).select();
      if (insErr) throw insErr;
      const allPlayers = Object.entries(playersByTeam).flatMap(([key, plist]) => {
        const parts = key.split('_'); const level = parts[parts.length-1]; const cat = parts.slice(0,-1).join('_');
        return plist.filter(p => p.first_name.trim() && p.last_name.trim()).map(p => ({
          registration_id: insData?.[0]?.id,
          tournament_id: tournament.id,
          first_name: p.first_name.trim(),
          last_name: p.last_name.trim(),
          birth_date: p.birth_date || null,
          license_number: p.license_number.trim() || null,
          category: cat,
          level: parseInt(level, 10),
          team_key: key,
        }));
      });
      if (allPlayers.length > 0 && insData?.[0]?.id) {
        await supabase.from('players').insert(allPlayers);
      }
      setStep('success');
    } catch (e) {
      setError('Erreur lors de l\'inscription : ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={S.page}>
      <div style={{ textAlign: 'center', padding: 80, color: '#64748b' }}>Chargement...</div>
    </div>
  );

  if (!tournament) return (
    <div style={S.page}>
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Tournoi introuvable</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>Vérifiez le lien d'inscription.</div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {/* HEADER CLUB */}
      <div style={{ background: `linear-gradient(135deg, ${clubColor}22 0%, transparent 70%)`, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          {profile?.club_logo_url ? (
            <img src={profile.club_logo_url} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: 10, background: `${clubColor}22`, border: `2px solid ${clubColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: clubColor }}>
              {clubName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: clubColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{clubName}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9' }}>{tournament.name}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {tournament.date ? new Date(tournament.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              {tournament.location ? ` · ${tournament.location}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }}>

        {/* FERMÉ */}
        {step === 'closed' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Inscriptions fermées</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Les inscriptions pour ce tournoi sont clôturées.</div>
          </div>
        )}

        {/* SUCCÈS */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Inscription envoyée !</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              Votre demande d'inscription a été transmise à l'organisateur.<br/>
              Vous recevrez une confirmation par email dès validation.
            </div>
            <div style={{ marginTop: 24, padding: '14px 20px', background: `${clubColor}12`, border: `1px solid ${clubColor}30`, borderRadius: 12, fontSize: 13, color: '#94a3b8' }}>
              <strong style={{ color: '#f1f5f9' }}>{totalTeams} équipe{totalTeams > 1 ? 's' : ''}</strong><br/>
              Contact : {form.contact_name} · {form.contact_email}
            </div>
          </div>
        )}

        {/* FORMULAIRE */}
        {step === 'form' && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Formulaire d'inscription</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: tournament?.registration_fee > 0 ? 12 : 24 }}>Remplissez les informations de votre équipe. L'organisateur validera votre demande.</div>
            {tournament?.registration_fee > 0 && (
              <div style={{ padding: '14px 16px', background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 12, marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#facc15', marginBottom: 4 }}>💰 Frais d'inscription : {tournament.registration_fee}€</div>
                {tournament?.registration_payment_info && (
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{tournament.registration_payment_info}</div>
                )}
                {profile?.iban && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>🏦 IBAN : <span style={{ fontFamily: 'monospace', color: '#f1f5f9' }}>{profile.iban}</span></div>
                )}
                {profile?.payment_info && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{profile.payment_info}</div>
                )}
                {profile?.payment_link && (
                  <div style={{ marginTop: 8 }}>
                    <a href={profile.payment_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#a3e635', fontWeight: 700, textDecoration: 'none' }}>
                      💳 Payer en ligne →
                    </a>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: 8, color: '#fb7185', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Équipes */}
            <div style={S.section}>
              <div style={{ ...S.sectionTitle, color: clubColor }}>⚽ Vos équipes</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Sélectionnez toutes les équipes que vous souhaitez inscrire.</div>
              {categories.length > 0 ? categories.map(cat => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <button
                    onClick={() => toggleCategory(cat)}
                    style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:'none',
                      background: selectedCategories[cat] ? clubColor + '22' : 'rgba(255,255,255,0.04)',
                      color: selectedCategories[cat] ? clubColor : '#94a3b8',
                      outline: selectedCategories[cat] ? '1px solid ' + clubColor : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {selectedCategories[cat] ? '✓ ' : ''}{cat}
                  </button>
                  {selectedCategories[cat] && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingLeft: 8 }}>
                    {[1, 2, 3].map(level => {
                      const key = cat + '_' + level;
                      const checked = !!selectedTeams[key];
                      return (
                        <button
                          key={level}
                          onClick={() => toggleTeam(cat, level)}
                          style={{
                            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            background: checked ? clubColor + '22' : 'rgba(255,255,255,0.04)',
                            border: checked ? '1px solid ' + clubColor : '1px solid rgba(255,255,255,0.1)',
                            color: checked ? clubColor : '#94a3b8',
                          }}
                        >
                          {checked ? '✓ ' : ''}Équipe {level}
                        </button>
                      );
                    })}
                  </div>}
                </div>
              )) : (
                <div style={{ fontSize: 13, color: '#64748b' }}>Aucune catégorie définie pour ce tournoi.</div>
              )}
              {totalTeams > 0 && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                    {totalTeams} équipe{totalTeams > 1 ? 's' : ''} sélectionnée{totalTeams > 1 ? 's' : ''}
                    {tournament?.registration_fee > 0 && (
                      <span style={{ color: '#facc15', marginLeft: 8 }}>→ {totalPrice}€</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Responsable */}
            <div style={S.section}>
              <div style={{ ...S.sectionTitle, color: clubColor }}>👤 Responsable de l'équipe</div>
              <Field label="Nom du club *">
                <input style={S.input} placeholder="Ex: FC Mâcon, AS Bourg..." value={form.club_name} onChange={e => update('club_name', e.target.value)} />
              </Field>
              <Field label="Nom et prénom du responsable *">
                <input style={S.input} placeholder="Ex: Jean Dupont" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} />
              </Field>
              <Field label="Email *">
                <input style={S.input} type="email" placeholder="jean.dupont@email.fr" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} />
              </Field>
              <Field label={`Téléphone${config.require_phone ? ' *' : ' (optionnel)'}`}>
                <input style={S.input} type="tel" placeholder="06 12 34 56 78" value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} />
              </Field>
            </div>

            {/* Message */}
            {config.require_message !== false && (
              <div style={S.section}>
                <div style={{ ...S.sectionTitle, color: clubColor }}>💬 Message (optionnel)</div>
                <textarea
                  style={{ ...S.input, minHeight: 80, resize: 'vertical' }}
                  placeholder="Questions, informations complémentaires..."
                  value={form.message}
                  onChange={e => update('message', e.target.value)}
                />
              </div>
            )}

            {/* Joueurs par équipe */}
            {totalTeams > 0 && (
              <div style={S.section}>
                <div style={{ ...S.sectionTitle, color: clubColor }}>👥 Joueurs (optionnel)</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Vous pouvez ajouter vos joueurs maintenant ou lors de votre arrivée à la table de marque.</div>
                {Object.entries(selectedTeams).filter(([,v]) => v).map(([key]) => {
                  const parts = key.split('_'); const level = parts[parts.length-1]; const cat = parts.slice(0,-1).join('_');
                  const teamPlayers = playersByTeam[key] || [];
                  return (
                    <div key={key} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,211,238,0.1)', color: '#a3e635', border: '1px solid rgba(34,211,238,0.2)' }}>{cat}</span>
                        Équipe {level}
                        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>{teamPlayers.length} joueur{teamPlayers.length > 1 ? 's' : ''}</span>
                      </div>
                      {teamPlayers.map((p, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px', marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Joueur {i + 1}</span>
                            <button onClick={() => removePlayer(key, i)} style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', fontSize: 16 }}>×</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                            <input style={S.input} placeholder="Prénom *" value={p.first_name} onChange={e => updatePlayer(key, i, 'first_name', e.target.value)} />
                            <input style={S.input} placeholder="Nom *" value={p.last_name} onChange={e => updatePlayer(key, i, 'last_name', e.target.value)} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <input style={S.input} type="date" value={p.birth_date} onChange={e => updatePlayer(key, i, 'birth_date', e.target.value)} />
                            <input style={S.input} placeholder="N° licence" value={p.license_number} onChange={e => updatePlayer(key, i, 'license_number', e.target.value)} />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => addPlayer(key)} style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 8, color: '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        + Ajouter un joueur
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ width: '100%', padding: '14px', background: clubColor, color: '#060a12', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: 'inherit' }}
            >
              {submitting ? 'Envoi en cours...' : 'Envoyer ma demande d\'inscription →'}
            </button>

            <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 12 }}>
              Vos données sont utilisées uniquement dans le cadre de ce tournoi.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5, letterSpacing: 0.3 }}>{label}</label>
      {children}
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#060a12', color: '#f1f5f9', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" },
  section: { background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 18, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 800, letterSpacing: 0.5, marginBottom: 14, textTransform: 'uppercase' },
  input: { width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9', fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
};