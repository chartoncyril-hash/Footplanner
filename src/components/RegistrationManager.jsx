import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Clock, Copy, ExternalLink, Users, Lock, Unlock } from 'lucide-react';

// ============================================================
// RegistrationManager — gestion des inscriptions côté orga
// ============================================================

export function RegistrationManager({ tournament: initialTournament, onUpdateTournament }) {
  const [localTournament, setLocalTournament] = React.useState({});
  // Fusionner initialTournament (source de vérité) avec les mises à jour locales
  const tournament = { ...initialTournament, ...localTournament };
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all'); // all | pending | approved | rejected
  const [editingPayment, setEditingPayment] = useState(false);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  // Charger les inscriptions
  const loadRegistrations = useCallback(async () => {
    if (!tournament?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('tournament_id', tournament.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRegistrations(data || []);
    } catch (e) {
      console.error('loadRegistrations', e);
    } finally {
      setLoading(false);
    }
  }, [tournament?.id]);

  useEffect(() => { loadRegistrations(); }, [loadRegistrations]);

  // Ouvrir / fermer les inscriptions
  const toggleRegistration = async () => {
    if (!tournament) return;
    const newOpen = !tournament.registrationOpen;
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ registration_open: newOpen })
        .eq('id', tournament.id);
      if (error) throw error;
      setLocalTournament(prev => ({ ...prev, registrationOpen: newOpen }));
      if (onUpdateTournament) onUpdateTournament({ ...tournament, registrationOpen: newOpen });
      showToast(newOpen ? 'Inscriptions ouvertes ✓' : 'Inscriptions fermées ✓');
    } catch (e) {
      showToast('Erreur : ' + e.message, true);
    }
  };

  // Valider ou refuser une inscription
  const reviewRegistration = async (id, status, rejection_reason) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status, rejection_reason: rejection_reason || null, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status, rejection_reason } : r));
      showToast(status === 'approved' ? 'Inscription validée ✓' : 'Inscription refusée');
    } catch (e) {
      showToast('Erreur : ' + e.message, true);
    }
  };

  // Copier le lien d'inscription
  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?register=1&t=${tournament.accessCode}`;
    navigator.clipboard.writeText(url);
    showToast('Lien copié ✓');
  };

  const filtered = registrations.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'approved') return ['approved','payment_pending','paid'].includes(r.status);
    return r.status === filter;
  });
  const counts = {
    all: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => ['approved','payment_pending','paid'].includes(r.status)).length,
    rejected: registrations.filter(r => r.status === 'rejected').length,
  };

  return (
    <div style={{ padding: '0 0 80px' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 20px',
          background: toast.isError ? '#fb7185' : '#22c55e', color: '#0a0e1a',
          borderRadius: 10, fontWeight: 800, fontSize: 13, zIndex: 10000,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}>{toast.message}</div>
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Inscriptions</h2>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{tournament?.name}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{tournament?.name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {counts.all} demande{counts.all > 1 ? 's' : ''} reçue{counts.all > 1 ? 's' : ''} · {counts.approved} validée{counts.approved > 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={copyLink} style={S.btnSecondary}>
            <Copy size={14} /> Copier le lien
          </button>

            <a href={`?register=1&t=${tournament?.accessCode}`}
            target="_blank"
            rel="noreferrer"
            style={{ ...S.btnSecondary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ExternalLink size={14} /> Voir la page
          </a>
          <button
            onClick={toggleRegistration}
            style={{
              ...S.btnSecondary,
              background: tournament?.registrationOpen ? 'rgba(251,113,133,0.1)' : 'rgba(34,211,238,0.1)',
              border: `1px solid ${tournament?.registrationOpen ? 'rgba(251,113,133,0.3)' : 'rgba(34,211,238,0.3)'}`,
              color: tournament?.registrationOpen ? '#fb7185' : '#a3e635',
            }}
          >
            {tournament?.registrationOpen
              ? <><Lock size={14} /> Fermer les inscriptions</>
              : <><Unlock size={14} /> Ouvrir les inscriptions</>
            }
          </button>
        </div>
      </div>

      {/* PARAMÈTRES PAIEMENT */}
      <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', letterSpacing: 0.5 }}>PARAMÈTRES D'INSCRIPTION</div>
          <button
            onClick={async () => {
              if (editingPayment) {
                // Sauvegarder
                await supabase.from('tournaments').update({
                  registration_fee: tournament?.registrationFee || 0,
                  registration_payment_info: tournament?.registrationPaymentInfo || '',
                }).eq('id', tournament.id);
                showToast('Paramètres enregistrés ✓');
              }
              setEditingPayment(!editingPayment);
            }}
            style={{ padding: '5px 12px', background: editingPayment ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${editingPayment ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, color: editingPayment ? '#a3e635' : '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {editingPayment ? '✓ Enregistrer' : '✏️ Modifier'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 700 }}>Frais d'inscription (€)</label>
            {editingPayment ? (
              <input
                type="number"
                min="0"
                value={tournament?.registrationFee || 0}
                onChange={(e) => setLocalTournament(prev => ({ ...prev, registrationFee: parseInt(e.target.value, 10) || 0 }))}
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9', fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }}
              />
            ) : (
              <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, color: '#f1f5f9', fontSize: 14 }}>
                {tournament?.registrationFee ? `${tournament.registrationFee} €` : 'Gratuit'}
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 700 }}>Coordonnées bancaires</label>
            <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
              Les coordonnées bancaires sont gérées dans <strong style={{ color: '#94a3b8' }}>Mon compte → Informations de paiement</strong>
            </div>
          </div>
        </div>
      </div>
      
      {/* STATUT */}
      <div style={{
        padding: '12px 16px', borderRadius: 10, marginBottom: 20,
        background: tournament?.registrationOpen ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${tournament?.registrationOpen ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: tournament?.registrationOpen ? '#a3e635' : '#64748b',
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: tournament?.registrationOpen ? '#a3e635' : '#64748b', flex: 1 }}>
          {tournament?.registrationOpen ? '✅ Inscriptions ouvertes' : '🔒 Inscriptions fermées'}
        </span>
        {tournament?.registrationOpen && (
          <span style={{ fontSize: 10, color: '#64748b', width: '100%', paddingLeft: 18 }}>
            Lien : {window.location.origin}?register=1&t={tournament?.accessCode}
          </span>
        )}
      </div>

      {/* FILTRES */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Toutes', color: '#94a3b8' },
          { id: 'pending', label: 'En attente', color: '#f59e0b' },
          { id: 'approved', label: 'Validées', color: '#a3e635' },
          { id: 'rejected', label: 'Refusées', color: '#fb7185' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', fontFamily: 'inherit',
              background: filter === f.id ? `${f.color}20` : 'rgba(255,255,255,0.04)',
              color: filter === f.id ? f.color : '#64748b',
              outline: filter === f.id ? `1px solid ${f.color}40` : 'none',
            }}
          >
            {f.label} ({counts[f.id]})
          </button>
        ))}
      </div>

      {/* LISTE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Users size={32} color="#1e293b" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: '#64748b' }}>
            {filter === 'all' ? 'Aucune inscription reçue pour l\'instant.' : `Aucune inscription "${filter}".`}
          </div>
          {filter === 'all' && !tournament?.registrationOpen && (
            <div style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>
              Ouvrez les inscriptions et partagez le lien aux clubs.
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(r => (
          <RegistrationCard
            key={r.id}
            registration={r}
            hasFee={tournament?.registrationFee > 0}
            fee={tournament?.registrationFee || 0}
            onApprove={() => reviewRegistration(r.id, tournament?.registrationFee > 0 ? 'payment_pending' : 'approved')}
            onMarkPaid={() => reviewRegistration(r.id, 'paid')}
            onReject={() => {
              const reason = window.prompt('Motif du refus (optionnel) :');
              if (reason !== null) reviewRegistration(r.id, 'rejected', reason);
            }}
            onReset={() => reviewRegistration(r.id, 'pending')}
          />
          ))}
        </div>
      )}
    </div>
  );
}

function RegistrationCard({ registration: r, onApprove, onReject, onReset, onMarkPaid, hasFee, fee }) {
  const nbTeams = r.nb_players || 1;
  const totalDue = fee * nbTeams;
  const teamsList = r.teams_list || [];
  const statusConfig = {
    pending: { color: '#f59e0b', label: 'En attente', icon: Clock },
    approved: { color: '#a3e635', label: 'Validée', icon: Check },
    payment_pending: { color: '#f59e0b', label: 'Paiement en attente', icon: Clock },
    paid: { color: '#22c55e', label: 'Payée', icon: Check },
    rejected: { color: '#fb7185', label: 'Refusée', icon: X },
  };
  const s = statusConfig[r.status] || statusConfig.pending;
  const Icon = s.icon;

  return (
    <div style={{
      background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '16px 18px',
      borderLeft: `3px solid ${s.color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>{r.team_name}</span>
            {r.category && (
              <span style={{ padding: '2px 8px', background: 'rgba(167,139,250,0.15)', color: '#818cf8', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>
                {r.category}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: `${s.color}15`, color: s.color, borderRadius: 5, fontSize: 10, fontWeight: 700 }}>
              <Icon size={10} /> {s.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
            <span>👤 {r.contact_name}</span>
            <span style={{ margin: '0 8px', color: '#334155' }}>·</span>
            <span>✉️ {r.contact_email}</span>
            {r.contact_phone && <><span style={{ margin: '0 8px', color: '#334155' }}>·</span><span>📞 {r.contact_phone}</span></>}
            {nbTeams > 0 && <><span style={{ margin: '0 8px', color: '#334155' }}>·</span><span>⚽ {nbTeams} équipe{nbTeams > 1 ? 's' : ''}</span></>}
            {teamsList.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {teamsList.map((t, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(167,139,250,0.15)', color: '#818cf8', fontWeight: 600 }}>
                    {t.category} — Équipe {t.level}
                  </span>
                ))}
              </div>
            )}
          </div>
          {r.message && (
            <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
              "{r.message}"
            </div>
          )}
          {r.rejection_reason && (
            <div style={{ marginTop: 6, fontSize: 11, color: '#fb7185' }}>
              Motif : {r.rejection_reason}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 10, color: '#475569' }}>
            Reçue le {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          {r.status === 'pending' && (
            <>
              <button onClick={onApprove} style={{ ...S.btnAction, background: 'rgba(34,211,238,0.1)', color: '#a3e635', border: '1px solid rgba(34,211,238,0.3)' }}>
                <Check size={13} /> Valider
              </button>
              <button onClick={onReject} style={{ ...S.btnAction, background: 'rgba(251,113,133,0.1)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.3)' }}>
                <X size={13} /> Refuser
              </button>
            </>
          )}
          {r.status === 'payment_pending' && (
            <>
              <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 6, padding: '4px 8px', textAlign: 'center' }}>
                ⚠️ {totalDue > 0 ? totalDue + '€ dû' : 'Paiement en attente'}
              </div>
              <button onClick={onMarkPaid} style={{ ...S.btnAction, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Check size={13} /> Marquer payée
              </button>
            </>
          )}
          {r.status === 'approved' && hasFee && (
            <>
              <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '4px 8px', textAlign: 'center' }}>
                💰 {totalDue}€ dû
              </div>
              <button onClick={onMarkPaid} style={{ ...S.btnAction, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Check size={13} /> Marquer payée
              </button>
            </>
          )}
          {r.status === 'approved' && !hasFee && (
            <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>✓ Validée</div>
          )}
          {r.status === 'paid' && (
            <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>✓ Payée</div>
          )}
          {r.status !== 'pending' && (
            <button onClick={onReset} style={{ ...S.btnAction, background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)', marginTop: 4 }}>
              <Clock size={13} /> En attente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  btnSecondary: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnAction: { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
};
