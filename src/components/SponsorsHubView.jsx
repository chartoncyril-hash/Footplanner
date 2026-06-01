import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const STATUTS = [
  { value: 'prospect', label: 'Prospect', color: '#64748b' },
  { value: 'negociation', label: 'En négociation', color: '#f59e0b' },
  { value: 'actif', label: 'Actif', color: '#34d399' },
  { value: 'renouvellement', label: 'Renouvellement', color: '#818cf8' },
  { value: 'termine', label: 'Terminé', color: '#fb7185' },
];

const SECTEURS = ['Alimentation', 'Automobile', 'Banque / Assurance', 'BTP / Immobilier', 'Commerce local', 'Energie', 'Industrie', 'Médical / Santé', 'Restauration', 'Sport / Loisirs', 'Technologie', 'Transport', 'Autre'];

const TYPES = ['Bronze', 'Argent', 'Or', 'Premium', 'Naming', 'Partenaire officiel', 'Fournisseur', 'Autre'];

const S = {
  page: { padding: '0 0 60px' },
  header: { marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 },
  sub: { fontSize: 13, color: '#64748b' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 },
  statCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px', textAlign: 'center' },
  statVal: { fontSize: 28, fontWeight: 900, marginBottom: 4 },
  statLbl: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px', marginBottom: 12 },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  logo: { width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' },
  logoPlaceholder: { width: 48, height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  name: { fontSize: 16, fontWeight: 700, color: '#f1f5f9' },
  badge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, display: 'inline-block' },
  input: { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  label: { fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  btnPrimary: { padding: '10px 20px', background: '#a3e635', color: '#060a12', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  btnGhost: { padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  btnDanger: { padding: '8px 14px', background: 'rgba(251,113,133,0.1)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' },
};
function SponsorForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: '', logo_url: '', contact_name: '', contact_email: '', contact_phone: '', website: '', sector: '', contract_amount: '', contract_start: '', contract_end: '', partnership_type: '', status: 'actif', notes: '' });
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ ...S.card, border: '1px solid rgba(163,230,53,0.2)' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>{initial?.id ? 'Modifier le sponsor' : 'Nouveau sponsor'}</div>
      <div style={S.grid2}>
        <div><label style={S.label}>Nom *</label><input style={S.input} value={form.name} onChange={e => u('name', e.target.value)} placeholder="Nom de la société" /></div>
        <div><label style={S.label}>URL Logo</label><input style={S.input} value={form.logo_url} onChange={e => u('logo_url', e.target.value)} placeholder="https://..." /></div>
      </div>
      <div style={S.grid2}>
        <div><label style={S.label}>Contact</label><input style={S.input} value={form.contact_name} onChange={e => u('contact_name', e.target.value)} placeholder="Nom du contact" /></div>
        <div><label style={S.label}>Téléphone</label><input style={S.input} value={form.contact_phone} onChange={e => u('contact_phone', e.target.value)} placeholder="06 xx xx xx xx" /></div>
      </div>
      <div style={S.grid2}>
        <div><label style={S.label}>Email</label><input style={S.input} type="email" value={form.contact_email} onChange={e => u('contact_email', e.target.value)} placeholder="contact@societe.fr" /></div>
        <div><label style={S.label}>Site web</label><input style={S.input} value={form.website} onChange={e => u('website', e.target.value)} placeholder="https://www.societe.fr" /></div>
      </div>
      <div style={S.grid2}>
        <div><label style={S.label}>Secteur</label>
          <select style={S.input} value={form.sector} onChange={e => u('sector', e.target.value)}>
            <option value="">Sélectionner...</option>
            {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label style={S.label}>Type de partenariat</label>
          <select style={S.input} value={form.partnership_type} onChange={e => u('partnership_type', e.target.value)}>
            <option value="">Sélectionner...</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div style={S.grid2}>
        <div><label style={S.label}>Montant contrat (€)</label><input style={S.input} type="number" value={form.contract_amount} onChange={e => u('contract_amount', e.target.value)} placeholder="0" /></div>
        <div><label style={S.label}>Statut</label>
          <select style={S.input} value={form.status} onChange={e => u('status', e.target.value)}>
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div style={S.grid2}>
        <div><label style={S.label}>Début contrat</label><input style={S.input} type="date" value={form.contract_start} onChange={e => u('contract_start', e.target.value)} /></div>
        <div><label style={S.label}>Fin contrat</label><input style={S.input} type="date" value={form.contract_end} onChange={e => u('contract_end', e.target.value)} /></div>
      </div>
      <div style={{ marginBottom: 16 }}><label style={S.label}>Notes</label><textarea style={{ ...S.input, minHeight: 70, resize: 'vertical' }} value={form.notes} onChange={e => u('notes', e.target.value)} placeholder="Observations, historique..." /></div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={S.btnPrimary} onClick={() => onSave(form)}>Enregistrer</button>
        <button style={S.btnGhost} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}
export function SponsorsHubView({ profile }) {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('sponsor_library').select('*').eq('owner_id', user.id).order('name');
    setSponsors(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (editing?.id) {
      await supabase.from('sponsor_library').update({ name: form.name, logo_url: form.logo_url, contact_name: form.contact_name, contact_email: form.contact_email, contact_phone: form.contact_phone, website: form.website, sector: form.sector, contract_amount: form.contract_amount || null, contract_start: form.contract_start || null, contract_end: form.contract_end || null, partnership_type: form.partnership_type, status: form.status, notes: form.notes }).eq('id', editing.id);
    } else {
      await supabase.from('sponsor_library').insert({ owner_id: user.id, name: form.name, logo_url: form.logo_url, contact_name: form.contact_name, contact_email: form.contact_email, contact_phone: form.contact_phone, website: form.website, sector: form.sector, contract_amount: form.contract_amount || null, contract_start: form.contract_start || null, contract_end: form.contract_end || null, partnership_type: form.partnership_type, status: form.status, notes: form.notes });
    }
    setShowForm(false); setEditing(null); load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce sponsor ?')) return;
    await supabase.from('sponsor_library').delete().eq('id', id);
    load();
  };

  const actifs = sponsors.filter(s => s.status === 'actif');
  const expirant = sponsors.filter(s => s.contract_end && new Date(s.contract_end) < new Date(Date.now() + 60*24*60*60*1000) && s.status === 'actif');
  const totalCA = sponsors.filter(s => s.status === 'actif').reduce((acc, s) => acc + (parseFloat(s.contract_amount) || 0), 0);
  const filtered = filter === 'all' ? sponsors : sponsors.filter(s => s.status === filter);

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Chargement...</div>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.title}>Sponsors & Partenaires</div>
        <div style={S.sub}>Gérez vos partenaires commerciaux et suivez vos contrats</div>
      </div>

      <div style={S.stats}>
        <div style={S.statCard}><div style={{ ...S.statVal, color: '#a3e635' }}>{actifs.length}</div><div style={S.statLbl}>Sponsors actifs</div></div>
        <div style={S.statCard}><div style={{ ...S.statVal, color: '#f59e0b' }}>{sponsors.filter(s => s.status === 'negociation').length}</div><div style={S.statLbl}>En négociation</div></div>
        <div style={S.statCard}><div style={{ ...S.statVal, color: '#fb7185' }}>{expirant.length}</div><div style={S.statLbl}>Expirent bientôt</div></div>
        <div style={S.statCard}><div style={{ ...S.statVal, color: '#818cf8' }}>{totalCA.toLocaleString('fr-FR')}€</div><div style={S.statLbl}>CA sponsoring</div></div>
      </div>

      {expirant.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 12, marginBottom: 20, fontSize: 13, color: '#fb7185' }}>
          ⚠️ {expirant.length} contrat{expirant.length > 1 ? 's' : ''} expire{expirant.length > 1 ? 'nt' : ''} dans moins de 60 jours : {expirant.map(s => s.name).join(', ')}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[{ v: 'all', l: 'Tous' }, ...STATUTS].map(s => (
            <button key={s.value || s.v} onClick={() => setFilter(s.value || s.v)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === (s.value || s.v) ? '#a3e635' : 'rgba(255,255,255,0.06)', color: filter === (s.value || s.v) ? '#060a12' : '#94a3b8' }}>
              {s.label || s.l}
            </button>
          ))}
        </div>
        <button style={S.btnPrimary} onClick={() => { setEditing(null); setShowForm(true); }}>+ Nouveau sponsor</button>
      </div>

      {showForm && <SponsorForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}

      {filtered.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Aucun sponsor</div>
          <div style={{ fontSize: 13 }}>Ajoutez vos premiers partenaires commerciaux</div>
        </div>
      )}

      {filtered.map(s => {
        const statut = STATUTS.find(st => st.value === s.status) || STATUTS[0];
        const isExpiring = s.contract_end && new Date(s.contract_end) < new Date(Date.now() + 60*24*60*60*1000) && s.status === 'actif';
        return (
          <div key={s.id} style={{ ...S.card, ...(isExpiring ? { borderColor: 'rgba(251,113,133,0.3)' } : {}) }}>
            <div style={S.cardHeader}>
              {s.logo_url ? <img src={s.logo_url} alt="" style={S.logo} /> : <div style={S.logoPlaceholder}>🤝</div>}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={S.name}>{s.name}</div>
                  <span style={{ ...S.badge, background: statut.color + '20', color: statut.color, border: `1px solid ${statut.color}40` }}>{statut.label}</span>
                  {s.partnership_type && <span style={{ ...S.badge, background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)' }}>{s.partnership_type}</span>}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {s.contact_name && <span>👤 {s.contact_name}</span>}
                  {s.contact_phone && <span>📞 {s.contact_phone}</span>}
                  {s.contact_email && <span>✉️ {s.contact_email}</span>}
                  {s.contract_amount && <span style={{ color: '#a3e635', fontWeight: 700 }}>💰 {parseFloat(s.contract_amount).toLocaleString('fr-FR')}€</span>}
                  {s.contract_end && <span style={{ color: isExpiring ? '#fb7185' : '#64748b' }}>📅 Fin: {new Date(s.contract_end).toLocaleDateString('fr-FR')}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={S.btnGhost} onClick={() => { setEditing(s); setShowForm(true); }}>✏️</button>
                <button style={S.btnDanger} onClick={() => handleDelete(s.id)}>🗑️</button>
              </div>
            </div>
            {s.notes && <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>{s.notes}</div>}
          </div>
        );
      })}
    </div>
  );
}