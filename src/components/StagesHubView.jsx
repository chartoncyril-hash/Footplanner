import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Tent, Plus, Users, CheckCircle, Clock, XCircle, CreditCard, Calendar, MapPin, ChevronRight, Edit2, Trash2, Copy, ToggleLeft, ToggleRight } from 'lucide-react';

const S = {
  page: { padding: '0 0 60px' },
  title: { fontSize: 22, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 },
  sub: { fontSize: 13, color: '#64748b', marginBottom: 24 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 },
  statCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '16px 20px',
  },
  statVal: { fontSize: 26, fontWeight: 900, color: '#f1f5f9', marginBottom: 2 },
  statLbl: { fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: '#f97316', color: '#fff', cursor: 'pointer',
    fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '20px 24px', marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 20,
    transition: 'border-color 0.15s',
  },
  badge: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    color, background: bg,
  }),
};

const STATUS_MAP = {
  draft:    { label: 'Brouillon', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
  open:     { label: 'Ouvert',    color: '#34d399', bg: 'rgba(52,211,153,0.15)'  },
  closed:   { label: 'Fermé',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  archived: { label: 'Archivé',   color: '#475569', bg: 'rgba(71,85,105,0.15)'   },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function StagesHubView() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editStage, setEditStage] = useState(null);
  const [detailStage, setDetailStage] = useState(null);
  const [stats, setStats] = useState({ total: 0, open: 0, participants: 0, paid: 0 });

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('stages')
      .select('*, stage_participants(id, status)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setStages(data);
      const total = data.length;
      const open = data.filter(s => s.status === 'open').length;
      const participants = data.reduce((acc, s) => acc + (s.stage_participants?.filter(p => p.status !== 'rejected').length || 0), 0);
      const paid = data.reduce((acc, s) => acc + (s.stage_participants?.filter(p => p.status === 'paid').length || 0), 0);
      setStats({ total, open, participants, paid });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleOpen = async (stage) => {
    const newOpen = !stage.registration_open;
    const newStatus = newOpen ? 'open' : 'closed';
    await supabase.from('stages').update({ registration_open: newOpen, status: newStatus }).eq('id', stage.id);
    load();
  };

  const deleteStage = async (id) => {
    if (!window.confirm('Supprimer ce stage ?')) return;
    await supabase.from('stages').delete().eq('id', id);
    load();
  };

  const copyLink = (code) => {
    navigator.clipboard.writeText(`${window.location.origin}/?stage=${code}`);
  };

  if (loading) return <div style={{ color: '#64748b', padding: 40 }}>Chargement...</div>;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={S.title}>🏕️ Stages & Vacances</h2>
          <p style={S.sub}>Gérez vos stages de foot et les inscriptions en ligne</p>
        </div>
        <button style={S.btn} onClick={() => { setEditStage(null); setWizardOpen(true); }}>
          <Plus size={16} /> Créer un stage
        </button>
      </div>

      {/* Stats */}
      <div style={S.stats}>
        {[
          { val: stats.total,        lbl: 'Stages créés',    color: '#f97316' },
          { val: stats.open,         lbl: 'En cours',        color: '#34d399' },
          { val: stats.participants, lbl: 'Participants',     color: '#818cf8' },
          { val: stats.paid,         lbl: 'Payés',           color: '#f59e0b' },
        ].map(s => (
          <div key={s.lbl} style={S.statCard}>
            <div style={{ ...S.statVal, color: s.color }}>{s.val}</div>
            <div style={S.statLbl}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {stages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 32px', color: '#475569' }}>
          <Tent size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 15, marginBottom: 4 }}>Aucun stage créé</p>
          <p style={{ fontSize: 13 }}>Créez votre premier stage pour commencer à recevoir des inscriptions</p>
        </div>
      ) : stages.map(stage => {
        const participants = stage.stage_participants || [];
        const nbTotal = participants.filter(p => p.status !== 'rejected').length;
        const nbPaid = participants.filter(p => p.status === 'paid').length;
        const st = STATUS_MAP[stage.status] || STATUS_MAP.draft;
        const pct = stage.max_participants ? Math.round((nbTotal / stage.max_participants) * 100) : null;
        return (
          <div key={stage.id} style={{ ...S.card, borderColor: stage.registration_open ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.08)' }}>
            {/* Infos principales */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>{stage.name}</span>
                <span style={S.badge(st.color, st.bg)}>{st.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {stage.date_start && (
                  <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {formatDate(stage.date_start)} → {formatDate(stage.date_end)}
                  </span>
                )}
                {stage.location && (
                  <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {stage.location}
                  </span>
                )}
                <span style={{ fontSize: 12, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={12} /> {nbTotal}{stage.max_participants ? `/${stage.max_participants}` : ''} inscrits
                </span>
                <span style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CreditCard size={12} /> {nbPaid} payés
                </span>
                {stage.price > 0 && (
                  <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>{stage.price}€</span>
                )}
              </div>
              {pct !== null && (
                <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', maxWidth: 300 }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct >= 90 ? '#fb7185' : '#f97316', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              )}
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button title="Copier le lien d'inscription" style={S.btnGhost} onClick={() => copyLink(stage.access_code)}>
                <Copy size={14} />
              </button>
              <button title="Modifier" style={S.btnGhost} onClick={() => { setEditStage(stage); setWizardOpen(true); }}>
                <Edit2 size={14} />
              </button>
              <button
                title={stage.registration_open ? 'Fermer les inscriptions' : 'Ouvrir les inscriptions'}
                style={{ ...S.btnGhost, color: stage.registration_open ? '#34d399' : '#64748b' }}
                onClick={() => toggleOpen(stage)}
              >
                {stage.registration_open ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
              <button title="Gérer les participants" style={{ ...S.btn, padding: '7px 14px', fontSize: 13 }} onClick={() => setDetailStage(stage)}>
                Gérer <ChevronRight size={14} />
              </button>
              <button title="Supprimer" style={{ ...S.btnGhost, color: '#fb7185' }} onClick={() => deleteStage(stage.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}

      {/* Modals */}
      {wizardOpen && (
        <StageWizard
          stage={editStage}
          onClose={() => { setWizardOpen(false); setEditStage(null); }}
          onSaved={() => { setWizardOpen(false); setEditStage(null); load(); }}
        />
      )}
      {detailStage && (
        <StageDetailView
          stage={detailStage}
          onClose={() => setDetailStage(null)}
          onRefresh={load}
        />
      )}
    </div>
  );
}

// ============================================
// STAGE WIZARD — 3 étapes
// ============================================
const DEFAULT_FIELDS = {
  first_name:    { enabled: true,  required: true,  label: 'Prénom' },
  last_name:     { enabled: true,  required: true,  label: 'Nom' },
  birth_date:    { enabled: true,  required: true,  label: 'Date de naissance' },
  gender:        { enabled: true,  required: false, label: 'Sexe' },
  email:         { enabled: true,  required: true,  label: 'Email parent/tuteur' },
  phone:         { enabled: true,  required: false, label: 'Téléphone' },
  size_shirt:    { enabled: true,  required: false, label: 'Taille maillot' },
  size_shorts:   { enabled: false, required: false, label: 'Taille short' },
  shoe_size:     { enabled: false, required: false, label: 'Pointure' },
  allergies:     { enabled: true,  required: false, label: 'Allergies' },
  medical_notes: { enabled: true,  required: false, label: 'Contre-indications médicales' },
  medical_cert:  { enabled: true,  required: false, label: 'Certificat médical' },
};

function StageWizard({ stage, onClose, onSaved }) {
  const isEdit = !!stage;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: stage?.name || '',
    description: stage?.description || '',
    location: stage?.location || '',
    date_start: stage?.date_start || '',
    date_end: stage?.date_end || '',
    registration_deadline: stage?.registration_deadline ? stage.registration_deadline.slice(0,16) : '',
    max_participants: stage?.max_participants || '',
    price: stage?.price || 0,
    payment_info: stage?.payment_info || '',
    notify_on_registration: stage?.notify_on_registration ?? true,
    categories: stage?.categories || [],
    fields_config: stage?.fields_config?.fields ? stage.fields_config : { fields: DEFAULT_FIELDS, custom_fields: [] },
  });

  const CATS = ['U6','U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19','Senior','Féminin'];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleCat = (cat) => {
    set('categories', form.categories.includes(cat)
      ? form.categories.filter(c => c !== cat)
      : [...form.categories, cat]
    );
  };

  const toggleField = (key, prop) => {
    const updated = { ...form.fields_config };
    updated.fields[key][prop] = !updated.fields[key][prop];
    if (prop === 'enabled' && !updated.fields[key].enabled) updated.fields[key].required = false;
    set('fields_config', updated);
  };

  const addCustomField = () => {
    const updated = { ...form.fields_config };
    updated.custom_fields = [...(updated.custom_fields || []), {
      id: crypto.randomUUID(), label: '', type: 'text', required: false, options: []
    }];
    set('fields_config', updated);
  };

  const updateCustomField = (id, key, val) => {
    const updated = { ...form.fields_config };
    updated.custom_fields = updated.custom_fields.map(f => f.id === id ? { ...f, [key]: val } : f);
    set('fields_config', updated);
  };

  const removeCustomField = (id) => {
    const updated = { ...form.fields_config };
    updated.custom_fields = updated.custom_fields.filter(f => f.id !== id);
    set('fields_config', updated);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      owner_id: user.id,
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      date_start: form.date_start || null,
      date_end: form.date_end || null,
      registration_deadline: form.registration_deadline || null,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      price: parseFloat(form.price) || 0,
      payment_info: form.payment_info.trim(),
      notify_on_registration: form.notify_on_registration,
      categories: form.categories,
      fields_config: form.fields_config,
    };
    if (isEdit) {
      await supabase.from('stages').update(payload).eq('id', stage.id);
    } else {
      await supabase.from('stages').insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  const inp = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: '#f1f5f9', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
  };
  const lbl = { fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, display: 'block' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:'100%', maxWidth:620, maxHeight:'90vh', overflow:'auto', padding:32 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h3 style={{ color:'#f1f5f9', fontSize:18, fontWeight:800, margin:0 }}>{isEdit ? 'Modifier le stage' : 'Créer un stage'}</h3>
            <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>Étape {step}/3</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>✕</button>
        </div>

        {/* Progress */}
        <div style={{ display:'flex', gap:6, marginBottom:28 }}>
          {[1,2,3].map(n => (
            <div key={n} style={{ flex:1, height:4, borderRadius:4, background: step >= n ? '#f97316' : 'rgba(255,255,255,0.08)', transition:'background 0.2s' }} />
          ))}
        </div>

        {/* ÉTAPE 1 — Infos générales */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={lbl}>Nom du stage *</label>
              <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Stage vacances de Pâques U12-U14" />
            </div>
            <div>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, minHeight:80, resize:'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Programme, encadrement, objectifs..." />
            </div>
            <div>
              <label style={lbl}>Lieu</label>
              <input style={inp} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Complexe sportif, ville..." />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>Date de début</label>
                <input type="date" style={inp} value={form.date_start} onChange={e => set('date_start', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Date de fin</label>
                <input type="date" style={inp} value={form.date_end} onChange={e => set('date_end', e.target.value)} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>Date limite d'inscription</label>
                <input type="datetime-local" style={inp} value={form.registration_deadline} onChange={e => set('registration_deadline', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Nombre de places (vide = illimité)</label>
                <input type="number" style={inp} value={form.max_participants} onChange={e => set('max_participants', e.target.value)} placeholder="Ex: 20" min={1} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>Prix (€)</label>
                <input type="number" style={inp} value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" min={0} step={0.01} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:22 }}>
                <input type="checkbox" id="notify" checked={form.notify_on_registration} onChange={e => set('notify_on_registration', e.target.checked)} />
                <label htmlFor="notify" style={{ color:'#94a3b8', fontSize:13, cursor:'pointer' }}>M'alerter à chaque inscription</label>
              </div>
            </div>
            <div>
              <label style={lbl}>Catégories acceptées</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {CATS.map(cat => (
                  <button key={cat} onClick={() => toggleCat(cat)} style={{
                    padding:'4px 12px', borderRadius:20, border:'1px solid',
                    borderColor: form.categories.includes(cat) ? '#f97316' : 'rgba(255,255,255,0.1)',
                    background: form.categories.includes(cat) ? 'rgba(249,115,22,0.15)' : 'transparent',
                    color: form.categories.includes(cat) ? '#f97316' : '#64748b',
                    cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit',
                  }}>{cat}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 — Champs du formulaire */}
        {step === 2 && (
          <div>
            <p style={{ color:'#64748b', fontSize:13, marginBottom:16 }}>Configurez les champs du formulaire d'inscription public.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {Object.entries(form.fields_config.fields || {}).map(([key, field]) => (
                <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ color: field.enabled ? '#f1f5f9' : '#475569', fontSize:13, fontWeight:600 }}>{field.label}</span>
                  <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#64748b', cursor:'pointer' }}>
                      <input type="checkbox" checked={field.enabled} onChange={() => toggleField(key, 'enabled')} />
                      Activé
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color: field.enabled ? '#f97316' : '#475569', cursor: field.enabled ? 'pointer' : 'not-allowed' }}>
                      <input type="checkbox" checked={field.required} disabled={!field.enabled} onChange={() => toggleField(key, 'required')} />
                      Obligatoire
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Champs custom */}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ color:'#94a3b8', fontSize:13, fontWeight:700 }}>Champs personnalisés</span>
                <button onClick={addCustomField} style={{ ...S.btnGhost, fontSize:12 }}><Plus size={12} /> Ajouter</button>
              </div>
              {(form.fields_config.custom_fields || []).map(cf => (
                <div key={cf.id} style={{ display:'grid', gridTemplateColumns:'1fr 120px 80px auto', gap:8, marginBottom:8, alignItems:'center' }}>
                  <input style={{ ...inp, fontSize:13 }} value={cf.label} onChange={e => updateCustomField(cf.id, 'label', e.target.value)} placeholder="Nom du champ" />
                  <select style={{ ...inp, fontSize:13 }} value={cf.type} onChange={e => updateCustomField(cf.id, 'type', e.target.value)}>
                    <option value="text">Texte</option>
                    <option value="select">Liste</option>
                    <option value="checkbox">Case à cocher</option>
                  </select>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#94a3b8', cursor:'pointer' }}>
                    <input type="checkbox" checked={cf.required} onChange={e => updateCustomField(cf.id, 'required', e.target.checked)} />
                    Requis
                  </label>
                  <button onClick={() => removeCustomField(cf.id)} style={{ background:'none', border:'none', color:'#fb7185', cursor:'pointer', fontSize:16 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — Communication & paiement */}
        {step === 3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={lbl}>Informations de paiement (IBAN, instructions)</label>
              <textarea style={{ ...inp, minHeight:100, resize:'vertical' }} value={form.payment_info} onChange={e => set('payment_info', e.target.value)} placeholder="Virement bancaire : IBAN FR76... — Référence : Nom + Prénom + Stage" />
            </div>
            <div style={{ padding:16, borderRadius:10, background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)' }}>
              <p style={{ color:'#f97316', fontSize:13, fontWeight:700, margin:'0 0 4px' }}>🔗 Lien d'inscription public</p>
              <p style={{ color:'#94a3b8', fontSize:12, margin:0 }}>Disponible après création. Format : {window.location.origin}/?stage=<span style={{ color:'#f97316' }}>CODE</span></p>
            </div>
            <div style={{ padding:16, borderRadius:10, background:'rgba(100,116,139,0.08)', border:'1px solid rgba(100,116,139,0.2)' }}>
              <p style={{ color:'#94a3b8', fontSize:13, fontWeight:700, margin:'0 0 4px' }}>💳 Paiement Stripe</p>
              <p style={{ color:'#64748b', fontSize:12, margin:0 }}>Intégration Stripe disponible prochainement. Pour l'instant, utilisez le virement bancaire.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:28 }}>
          <button style={S.btnGhost} onClick={() => step === 1 ? onClose() : setStep(s => s - 1)}>
            {step === 1 ? 'Annuler' : '← Retour'}
          </button>
          {step < 3 ? (
            <button style={{ ...S.btn, opacity: !form.name.trim() && step === 1 ? 0.5 : 1 }}
              disabled={!form.name.trim() && step === 1}
              onClick={() => setStep(s => s + 1)}>
              Suivant →
            </button>
          ) : (
            <button style={{ ...S.btn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={save}>
              {saving ? 'Enregistrement...' : isEdit ? '✓ Mettre à jour' : '✓ Créer le stage'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// STAGE DETAIL VIEW — Gestion participants
// ============================================
const STATUS_PARTICIPANT = {
  pending:         { label: 'En attente',      color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  approved:        { label: 'Approuvé',        color: '#34d399', bg: 'rgba(52,211,153,0.15)'  },
  payment_pending: { label: 'Paiement att.',   color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
  paid:            { label: 'Payé',            color: '#a3e635', bg: 'rgba(163,230,53,0.15)'  },
  rejected:        { label: 'Refusé',          color: '#fb7185', bg: 'rgba(251,113,133,0.15)' },
};

function StageDetailView({ stage, onClose, onRefresh }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('stage_participants')
      .select('*')
      .eq('stage_id', stage.id)
      .order('registered_at', { ascending: false });
    if (data) setParticipants(data);
    setLoading(false);
  }, [stage.id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    await supabase.from('stage_participants').update({ status }).eq('id', id);
    load();
    onRefresh();
  };

  const deleteParticipant = async (id) => {
    if (!window.confirm('Supprimer ce participant ?')) return;
    await supabase.from('stage_participants').delete().eq('id', id);
    load();
    onRefresh();
  };

  const filtered = filter === 'all' ? participants : participants.filter(p => p.status === filter);

  const counts = {
    all: participants.length,
    pending: participants.filter(p => p.status === 'pending').length,
    approved: participants.filter(p => p.status === 'approved').length,
    payment_pending: participants.filter(p => p.status === 'payment_pending').length,
    paid: participants.filter(p => p.status === 'paid').length,
    rejected: participants.filter(p => p.status === 'rejected').length,
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:24, overflowY:'auto' }}>
      <div style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:'100%', maxWidth:900, padding:32, marginTop:20 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h3 style={{ color:'#f1f5f9', fontSize:18, fontWeight:800, margin:0 }}>{stage.name}</h3>
            <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>
              {participants.filter(p=>p.status!=='rejected').length} inscrits
              {stage.max_participants ? ` / ${stage.max_participants} places` : ''}
              {stage.price > 0 ? ` · ${stage.price}€/participant` : ' · Gratuit'}
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={S.btn} onClick={() => setAddOpen(true)}><Plus size={14} /> Ajouter</button>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>✕</button>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
          {[
            { key:'all', label:'Tous' },
            { key:'pending', label:'En attente' },
            { key:'approved', label:'Approuvés' },
            { key:'payment_pending', label:'Paiement att.' },
            { key:'paid', label:'Payés' },
            { key:'rejected', label:'Refusés' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding:'5px 12px', borderRadius:20, border:'1px solid',
              borderColor: filter === f.key ? '#f97316' : 'rgba(255,255,255,0.1)',
              background: filter === f.key ? 'rgba(249,115,22,0.15)' : 'transparent',
              color: filter === f.key ? '#f97316' : '#64748b',
              cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit',
            }}>
              {f.label} <span style={{ opacity:0.7 }}>({counts[f.key]})</span>
            </button>
          ))}
        </div>

        {/* Table participants */}
        {loading ? (
          <div style={{ color:'#64748b', padding:40, textAlign:'center' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color:'#475569', padding:40, textAlign:'center', fontSize:14 }}>
            {filter === 'all' ? 'Aucun participant inscrit pour le moment.' : 'Aucun participant dans cette catégorie.'}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map(p => {
              const st = STATUS_PARTICIPANT[p.status] || STATUS_PARTICIPANT.pending;
              return (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 16px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  {/* Identité */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                      <span style={{ color:'#f1f5f9', fontWeight:700, fontSize:14 }}>{p.first_name} {p.last_name}</span>
                      {p.category && <span style={{ fontSize:11, color:'#818cf8', fontWeight:600 }}>{p.category}</span>}
                      {p.manual_entry && <span style={{ fontSize:10, color:'#64748b', background:'rgba(100,116,139,0.15)', padding:'1px 6px', borderRadius:10 }}>Manuel</span>}
                    </div>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                      {p.email && <span style={{ fontSize:12, color:'#64748b' }}>✉ {p.email}</span>}
                      {p.phone && <span style={{ fontSize:12, color:'#64748b' }}>📞 {p.phone}</span>}
                      {p.birth_date && <span style={{ fontSize:12, color:'#64748b' }}>🎂 {formatDate(p.birth_date)}</span>}
                    </div>
                  </div>

                  {/* Statut */}
                  <span style={S.badge(st.color, st.bg)}>{st.label}</span>

                  {/* Actions statut */}
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    {p.status === 'pending' && <>
                      <button onClick={() => updateStatus(p.id, 'approved')} style={{ ...S.btnGhost, color:'#34d399', fontSize:12 }}>✓ Approuver</button>
                      <button onClick={() => updateStatus(p.id, 'rejected')} style={{ ...S.btnGhost, color:'#fb7185', fontSize:12 }}>✕ Refuser</button>
                    </>}
                    {p.status === 'approved' && (
                      <button onClick={() => updateStatus(p.id, 'payment_pending')} style={{ ...S.btnGhost, color:'#818cf8', fontSize:12 }}>💳 Attente paiement</button>
                    )}
                    {p.status === 'payment_pending' && (
                      <button onClick={() => updateStatus(p.id, 'paid')} style={{ ...S.btnGhost, color:'#a3e635', fontSize:12 }}>✓ Marquer payé</button>
                    )}
                    <button onClick={() => setSelected(p)} style={{ ...S.btnGhost, fontSize:12 }}>Détail</button>
                    <button onClick={() => deleteParticipant(p.id)} style={{ ...S.btnGhost, color:'#fb7185', fontSize:12 }}><Trash2 size={12} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal détail participant */}
      {selected && (
        <ParticipantDetailModal
          participant={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => { load(); onRefresh(); setSelected(null); }}
        />
      )}

      {/* Modal ajout manuel */}
      {addOpen && (
        <AddParticipantModal
          stage={stage}
          onClose={() => setAddOpen(false)}
          onSaved={() => { setAddOpen(false); load(); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ============================================
// PARTICIPANT DETAIL MODAL
// ============================================
function ParticipantDetailModal({ participant: p, onClose, onUpdate }) {
  const [notes, setNotes] = useState(p.notes || '');
  const [saving, setSaving] = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    await supabase.from('stage_participants').update({ notes }).eq('id', p.id);
    setSaving(false);
    onUpdate();
  };

  const rows = [
    ['Prénom', p.first_name], ['Nom', p.last_name],
    ['Date de naissance', formatDate(p.birth_date)], ['Catégorie', p.category],
    ['Sexe', p.gender === 'M' ? 'Masculin' : p.gender === 'F' ? 'Féminin' : p.gender],
    ['Email', p.email], ['Téléphone', p.phone],
    ['Taille maillot', p.size_shirt], ['Taille short', p.size_shorts], ['Pointure', p.shoe_size],
    ['Allergies', p.allergies], ['Contre-indications', p.medical_notes],
    ['Certificat médical', p.has_medical_certificate ? '✅ Fourni' : '❌ Manquant'],
  ].filter(([, v]) => v);

  const inp = { width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', boxSizing:'border-box', resize:'vertical', minHeight:80 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:'100%', maxWidth:480, padding:28, maxHeight:'85vh', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h4 style={{ color:'#f1f5f9', fontSize:16, fontWeight:800, margin:0 }}>{p.first_name} {p.last_name}</h4>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
          {rows.map(([label, val]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color:'#64748b', fontSize:13 }}>{label}</span>
              <span style={{ color:'#f1f5f9', fontSize:13, fontWeight:600, textAlign:'right', maxWidth:'60%' }}>{val}</span>
            </div>
          ))}
        </div>
        {p.medical_certificate_url && (
          <a href={p.medical_certificate_url} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#818cf8', fontSize:13, marginBottom:16 }}>
            📄 Voir le certificat médical
          </a>
        )}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, display:'block', marginBottom:6 }}>Notes internes</label>
          <textarea style={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes visibles uniquement par l'organisateur..." />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={S.btnGhost}>Fermer</button>
          <button onClick={saveNotes} disabled={saving} style={{ ...S.btn, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Sauvegarde...' : '✓ Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ADD PARTICIPANT MODAL (ajout manuel)
// ============================================
function AddParticipantModal({ stage, onClose, onSaved }) {
  const [form, setForm] = useState({ first_name:'', last_name:'', birth_date:'', gender:'', email:'', phone:'', category:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const computeCategory = (birthDate) => {
    if (!birthDate) return '';
    const year = new Date(birthDate).getFullYear();
    const current = new Date().getFullYear();
    const age = current - year;
    if (age <= 5) return 'U6';
    if (age <= 7) return 'U7';
    if (age <= 8) return 'U8';
    if (age <= 9) return 'U9';
    if (age <= 10) return 'U10';
    if (age <= 11) return 'U11';
    if (age <= 12) return 'U12';
    if (age <= 13) return 'U13';
    if (age <= 14) return 'U14';
    if (age <= 15) return 'U15';
    if (age <= 16) return 'U16';
    if (age <= 17) return 'U17';
    if (age <= 18) return 'U18';
    if (age <= 19) return 'U19';
    return 'Senior';
  };

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('stage_participants').insert({
      stage_id: stage.id,
      owner_id: user.id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      category: form.category || computeCategory(form.birth_date),
      notes: form.notes.trim() || null,
      manual_entry: true,
      status: 'approved',
    });
    setSaving(false);
    onSaved();
  };

  const inp = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f1f5f9', fontSize:13, fontFamily:'inherit', boxSizing:'border-box' };
  const lbl = { fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:5, display:'block' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:'100%', maxWidth:460, padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h4 style={{ color:'#f1f5f9', fontSize:16, fontWeight:800, margin:0 }}>Ajouter un participant</h4>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label style={lbl}>Prénom *</label><input style={inp} value={form.first_name} onChange={e => set('first_name', e.target.value)} /></div>
            <div><label style={lbl}>Nom *</label><input style={inp} value={form.last_name} onChange={e => set('last_name', e.target.value)} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={lbl}>Date de naissance</label>
              <input type="date" style={inp} value={form.birth_date} onChange={e => { set('birth_date', e.target.value); set('category', computeCategory(e.target.value)); }} />
            </div>
            <div>
              <label style={lbl}>Sexe</label>
              <select style={inp} value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">—</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>
          <div><label style={lbl}>Email</label><input type="email" style={inp} value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div><label style={lbl}>Téléphone</label><input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div>
            <label style={lbl}>Catégorie <span style={{ color:'#475569', textTransform:'none', fontWeight:400 }}>(auto depuis naissance)</span></label>
            <input style={inp} value={form.category} onChange={e => set('category', e.target.value)} placeholder="Ex: U12" />
          </div>
          <div>
            <label style={lbl}>Notes internes</label>
            <input style={inp} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Observations..." />
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20 }}>
          <button onClick={onClose} style={S.btnGhost}>Annuler</button>
          <button onClick={save} disabled={saving || !form.first_name.trim() || !form.last_name.trim()} style={{ ...S.btn, opacity: saving || !form.first_name.trim() ? 0.5 : 1 }}>
            {saving ? 'Ajout...' : '✓ Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
