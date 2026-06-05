import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Tent, MapPin, Calendar, Clock, Users, Upload, CheckCircle, XCircle } from 'lucide-react';

// ============================================================
// StageRegistrationPage — page publique inscription stage
// Accessible via ?stage=ACCESS_CODE
// 3 états : waiting | form | closed | success
// ============================================================

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function computeCategory(birthDate) {
  if (!birthDate) return '';
  const year = new Date(birthDate).getFullYear();
  const age = new Date().getFullYear() - year;
  if (age <= 5)  return 'U6';
  if (age <= 7)  return 'U7';
  if (age <= 8)  return 'U8';
  if (age <= 9)  return 'U9';
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
}

// Compte à rebours
function useCountdown(target) {
  const [diff, setDiff] = useState(null);
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const ms = new Date(target) - new Date();
      setDiff(ms > 0 ? ms : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  if (diff === null) return null;
  const total = Math.floor(diff / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s, done: diff === 0 };
}

export function StageRegistrationPage({ stageCode }) {
  const [stage, setStage]     = useState(null);
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState('loading'); // loading|waiting|form|closed|success


  // Charger stage + branding
  useEffect(() => {
    if (!stageCode) return;
    (async () => {
      // Branding (SECURITY DEFINER — pas besoin d'auth)
      const { data: brand } = await supabase.rpc('get_stage_branding', { p_code: stageCode });
      if (brand?.[0]) setBranding(brand[0]);

      // Stage via RPC publique
      const { data: stageData } = await supabase.rpc('get_stage_by_code', { p_code: stageCode });

      if (!stageData || stageData.length === 0) {
        // Essayer sans le filtre registration_open pour afficher page d'attente
        const { data: raw } = await supabase
          .from('stages')
          .select('*')
          .eq('access_code', stageCode)
          .single();
        if (raw) {
          setStage(raw);
          if (raw.status === 'archived' || raw.status === 'closed') {
            setPageState('closed');
          } else {
            setPageState('waiting');
          }
        } else {
          setPageState('closed');
        }
      } else {
        const s = stageData[0];
        setStage(s);
        if (s.registration_open) {
          setPageState('form');
        } else if (s.status === 'closed' || s.status === 'archived') {
          setPageState('closed');
        } else {
          setPageState('waiting');
        }
      }
      setLoading(false);
    })();
  }, [stageCode]);

  const accentColor = branding?.club_color || '#f97316';

  const S = {
    page: { minHeight:'100vh', background:'#0a0e1a', color:'#f1f5f9', fontFamily:'system-ui, -apple-system, sans-serif' },
    header: { background:`linear-gradient(135deg, ${accentColor}22 0%, rgba(10,14,26,0) 60%)`, borderBottom:`1px solid ${accentColor}22`, padding:'24px 32px', display:'flex', alignItems:'center', gap:16 },
    logo: { width:48, height:48, borderRadius:12, objectFit:'cover', border:`2px solid ${accentColor}44` },
    logoFallback: { width:48, height:48, borderRadius:12, background:`${accentColor}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 },
    container: { maxWidth:640, margin:'0 auto', padding:'40px 24px' },
    card: { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'28px 32px', marginBottom:20 },
    inp: { width:'100%', padding:'11px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)', color:'#f1f5f9', fontSize:14, fontFamily:'inherit', boxSizing:'border-box', outline:'none' },
    lbl: { fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6, display:'block' },
    btn: { width:'100%', padding:'14px', borderRadius:12, border:'none', background:accentColor, color:'#fff', cursor:'pointer', fontSize:15, fontWeight:800, fontFamily:'inherit', marginTop:8 },
    err: { color:'#fb7185', fontSize:13, marginTop:4 },
  };

  if (loading) return (
    <div style={{ ...S.page, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <Tent size={40} style={{ color: accentColor, marginBottom:16, opacity:0.6 }} />
        <p style={{ color:'#64748b' }}>Chargement...</p>
      </div>
    </div>
  );

  // HEADER commun
  const Header = () => (
    <div style={S.header}>
      {branding?.club_logo_url
        ? <img src={branding.club_logo_url} alt="logo" style={S.logo} />
        : <div style={S.logoFallback}>🏕️</div>
      }
      <div>
        <div style={{ fontSize:18, fontWeight:800, color:'#f1f5f9' }}>{branding?.club_name || 'Stage de football'}</div>
        <div style={{ fontSize:13, color:'#64748b' }}>Inscription en ligne</div>
      </div>
    </div>
  );

  // ── ÉTAT : ATTENTE ──────────────────────────────────────
  // ── ÉTAT : ATTENTE PUBLIQUE (accès licenciés ouvert) ────
  if (pageState === 'waiting_public') {
    return (
      <div style={S.page}>
        <Header />
        <div style={S.container}>
          <div style={{ ...S.card, textAlign:'center', borderColor:`${accentColor}33` }}>
            <Tent size={48} style={{ color:accentColor, marginBottom:16 }} />
            <h1 style={{ fontSize:22, fontWeight:900, color:'#f1f5f9', marginBottom:8 }}>{stage?.name}</h1>
            <div style={{ background:`${accentColor}15`, border:`1px solid ${accentColor}33`, borderRadius:12, padding:'20px 24px', marginBottom:20 }}>
              <p style={{ color:accentColor, fontWeight:700, fontSize:14, marginBottom:12 }}>
                <Clock size={14} style={{ marginRight:6, verticalAlign:'middle' }} />
                Ouverture au grand public le {new Date(stage.registration_open_public).toLocaleString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
              </p>
              {countdown && !countdown.done && (
                <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                  {[{ val:countdown.d, lbl:'jours' },{ val:countdown.h, lbl:'heures' },{ val:countdown.m, lbl:'min' },{ val:countdown.s, lbl:'sec' }].map(({val,lbl}) => (
                    <div key={lbl} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:28, fontWeight:900, color:'#f1f5f9', minWidth:50, background:'rgba(255,255,255,0.06)', borderRadius:10, padding:'6px 10px' }}>{String(val).padStart(2,'0')}</div>
                      <div style={{ fontSize:11, color:'#64748b', marginTop:4, fontWeight:600, textTransform:'uppercase' }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background:'rgba(129,140,248,0.08)', border:'1px solid rgba(129,140,248,0.2)', borderRadius:10, padding:'12px 16px' }}>
              <p style={{ color:'#818cf8', fontSize:13, margin:0 }}>🎯 Vous êtes licencié du club ? Utilisez le lien reçu par email pour vous inscrire dès maintenant.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'waiting_all') {
    return (
      <div style={S.page}>
        <Header />
        <div style={S.container}>
          <div style={{ ...S.card, textAlign:'center', borderColor:`${accentColor}33` }}>
            <Tent size={48} style={{ color:accentColor, marginBottom:16 }} />
            <h1 style={{ fontSize:24, fontWeight:900, color:'#f1f5f9', marginBottom:8 }}>{stage?.name}</h1>
            {stage?.date_start && (
              <p style={{ color:'#64748b', fontSize:14, marginBottom:4, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <Calendar size={14} /> {formatDate(stage.date_start)}{stage.date_end ? ` → ${formatDate(stage.date_end)}` : ''}
              </p>
            )}
            {stage?.location && (
              <p style={{ color:'#64748b', fontSize:14, marginBottom:20, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <MapPin size={14} /> {stage.location}
              </p>
            )}
            <div style={{ background:`${accentColor}15`, border:`1px solid ${accentColor}33`, borderRadius:12, padding:'20px 24px', marginBottom:20 }}>
              <p style={{ color:accentColor, fontWeight:700, fontSize:14, marginBottom:16 }}>
                <Clock size={14} style={{ marginRight:6, verticalAlign:'middle' }} />
                Les inscriptions ouvriront le {formatDateTime(countdownTarget || stage?.registration_open_public || stage?.registration_open_licencies)}
              </p>
              {countdown && !countdown.done && (
                <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                  {[
                    { val: countdown.d, lbl: 'jours' },
                    { val: countdown.h, lbl: 'heures' },
                    { val: countdown.m, lbl: 'min' },
                    { val: countdown.s, lbl: 'sec' },
                  ].map(({ val, lbl }) => (
                    <div key={lbl} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:32, fontWeight:900, color:'#f1f5f9', minWidth:56, background:'rgba(255,255,255,0.06)', borderRadius:10, padding:'8px 12px' }}>
                        {String(val).padStart(2,'0')}
                      </div>
                      <div style={{ fontSize:11, color:'#64748b', marginTop:4, fontWeight:600, textTransform:'uppercase' }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              )}
              {countdown?.done && (
                <p style={{ color:'#34d399', fontWeight:700 }}>Les inscriptions viennent d'ouvrir — rechargez la page !</p>
              )}
            </div>
            {stage?.description && (
              <p style={{ color:'#94a3b8', fontSize:14, lineHeight:1.6, textAlign:'left' }}>{stage.description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── ÉTAT : FERMÉ ────────────────────────────────────────
  if (pageState === 'closed') {
    return (
      <div style={S.page}>
        <Header />
        <div style={S.container}>
          <div style={{ ...S.card, textAlign:'center' }}>
            <XCircle size={48} style={{ color:'#fb7185', marginBottom:16 }} />
            <h2 style={{ color:'#f1f5f9', fontSize:22, fontWeight:800, marginBottom:8 }}>Inscriptions fermées</h2>
            <p style={{ color:'#64748b', fontSize:14 }}>Les inscriptions pour ce stage sont actuellement fermées.<br />Contactez le club pour plus d'informations.</p>
            {branding?.club_name && <p style={{ color:'#94a3b8', fontSize:13, marginTop:16, fontWeight:600 }}>{branding.club_name}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── ÉTAT : SUCCÈS ───────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div style={S.page}>
        <Header />
        <div style={S.container}>
          <div style={{ ...S.card, textAlign:'center', borderColor:'rgba(52,211,153,0.3)' }}>
            <CheckCircle size={56} style={{ color:'#34d399', marginBottom:16 }} />
            <h2 style={{ color:'#f1f5f9', fontSize:22, fontWeight:800, marginBottom:8 }}>Inscription envoyée !</h2>
            <p style={{ color:'#94a3b8', fontSize:14, lineHeight:1.7, marginBottom:16 }}>
              Votre demande d'inscription a bien été reçue.<br />
              Le club vous contactera pour confirmer votre place.
            </p>
            {stage?.price > 0 && stage?.payment_info && (
              <div style={{ background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10, padding:'16px 20px', textAlign:'left' }}>
                <p style={{ color:'#f97316', fontWeight:700, fontSize:13, marginBottom:6 }}>💳 Informations de paiement</p>
                <p style={{ color:'#94a3b8', fontSize:13, lineHeight:1.6, whiteSpace:'pre-line' }}>{stage.payment_info}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── ÉTAT : FORMULAIRE ───────────────────────────────────
  return (
    <StageForm
      stage={stage}
      branding={branding}
      S={S}
      accentColor={accentColor}
      onSuccess={() => setPageState('success')}
    />
  );
}

// ============================================================
// STAGE FORM — formulaire dynamique piloté par fields_config
// ============================================================
function StageForm({ stage, branding, S, accentColor, onSuccess }) {
  const fields = stage?.fields_config?.fields || {};
  const customFields = stage?.fields_config?.custom_fields || [];

  const [form, setForm] = useState({
    first_name: '', last_name: '', birth_date: '', gender: '',
    email: '', phone: '',
    size_shirt: '', size_shorts: '', shoe_size: '',
    allergies: '', medical_notes: '',
  });
  const [customValues, setCustomValues] = useState({});
  const [certFile, setCertFile] = useState(null);
  const [certPreview, setCertPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setCustom = (id, v) => setCustomValues(f => ({ ...f, [id]: v }));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCertFile(file);
    setCertPreview(file.name);
  };

  const validate = () => {
    const errs = {};
    Object.entries(fields).forEach(([key, cfg]) => {
      if (!cfg.enabled || !cfg.required) return;
      if (key === 'medical_cert') {
        if (!certFile) errs[key] = 'Obligatoire';
      } else if (!form[key]?.trim()) {
        errs[key] = 'Obligatoire';
      }
    });
    customFields.forEach(cf => {
      if (cf.required && !customValues[cf.id]?.trim()) {
        errs[cf.id] = 'Obligatoire';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Vérifier la limite de places
  const checkLimit = async () => {
    if (!stage.max_participants) return true;
    const { data } = await supabase.rpc('get_stage_participant_count', { p_stage_id: stage.id });
    return data < stage.max_participants;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    const hasPlace = await checkLimit();
    if (!hasPlace) {
      setErrors({ _global: 'Désolé, le stage est complet.' });
      setSubmitting(false);
      return;
    }

    let certUrl = null;

    // Upload certificat médical
    if (certFile) {
      const ext = certFile.name.split('.').pop();
      const path = `stages/${stage.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('stage-docs')
        .upload(path, certFile, { contentType: certFile.type });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('stage-docs').getPublicUrl(path);
        certUrl = urlData.publicUrl;
      }
    }

    const category = computeCategory(form.birth_date);

    const { error } = await supabase.from('stage_participants').insert({
      stage_id: stage.id,
      owner_id: stage.owner_id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      category,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      size_shirt: form.size_shirt || null,
      size_shorts: form.size_shorts || null,
      shoe_size: form.shoe_size || null,
      allergies: form.allergies.trim() || null,
      medical_notes: form.medical_notes.trim() || null,
      has_medical_certificate: !!certUrl,
      medical_certificate_url: certUrl,
      custom_fields: customValues,
      status: 'pending',
      manual_entry: false,
    });

    if (error) {
      setErrors({ _global: 'Une erreur est survenue. Veuillez réessayer.' });
      setSubmitting(false);
      return;
    }

    // Email confirmation automatique
    if (form.email) {
      try {
        const { data: prof } = await supabase.from('profiles').select('club_name,club_color,club_logo_url').eq('id', stage.owner_id).single();
        await supabase.functions.invoke('send-stage-email', {
          body: {
            type: 'confirmation',
            email: form.email,
            participant_name: `${form.first_name} ${form.last_name}`,
            stage_name: stage.name,
            stage_date_start: stage.date_start ? new Date(stage.date_start).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) : null,
            stage_date_end: stage.date_end ? new Date(stage.date_end).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) : null,
            stage_location: stage.location,
            stage_price: stage.price,
            payment_info: stage.payment_info,
            club_name: prof?.club_name,
            club_color: prof?.club_color,
            club_logo_url: prof?.club_logo_url,
            stage_url: window.location.href,
          }
        });
      } catch(e) { console.error('Confirmation email error:', e); }
    }

    onSuccess();
  };

  const SHIRT_SIZES = ['3XS','2XS','XS','S','M','L','XL','2XL','3XL'];

  const isVisible = (key) => fields[key]?.enabled;
  const isRequired = (key) => fields[key]?.required;

  const fieldStyle = (key) => ({
    ...S.inp,
    borderColor: errors[key] ? 'rgba(251,113,133,0.5)' : 'rgba(255,255,255,0.12)',
  });

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        {branding?.club_logo_url
          ? <img src={branding.club_logo_url} alt="logo" style={S.logo} />
          : <div style={S.logoFallback}>🏕️</div>
        }
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'#f1f5f9' }}>{branding?.club_name || 'Stage de football'}</div>
          <div style={{ fontSize:13, color:'#64748b' }}>Inscription en ligne</div>
        </div>
      </div>

      <div style={S.container}>
        {/* Infos stage */}
        <div style={{ ...S.card, borderColor:`${accentColor}33`, marginBottom:24 }}>
          <h1 style={{ fontSize:20, fontWeight:900, color:'#f1f5f9', marginBottom:10 }}>{stage.name}</h1>
          <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
            {stage.date_start && (
              <span style={{ fontSize:13, color:'#94a3b8', display:'flex', alignItems:'center', gap:5 }}>
                <Calendar size={13} style={{ color:accentColor }} />
                {formatDate(stage.date_start)}{stage.date_end ? ` → ${formatDate(stage.date_end)}` : ''}
              </span>
            )}
            {stage.location && (
              <span style={{ fontSize:13, color:'#94a3b8', display:'flex', alignItems:'center', gap:5 }}>
                <MapPin size={13} style={{ color:accentColor }} />
                {stage.location}
              </span>
            )}
            {stage.max_participants && (
              <span style={{ fontSize:13, color:'#94a3b8', display:'flex', alignItems:'center', gap:5 }}>
                <Users size={13} style={{ color:accentColor }} />
                {stage.max_participants} places max
              </span>
            )}
          </div>
          {stage.description && (
            <p style={{ color:'#64748b', fontSize:13, lineHeight:1.7, marginTop:12, marginBottom:0 }}>{stage.description}</p>
          )}
          {stage.price > 0 && (
            <div style={{ marginTop:12, display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:20, background:`${accentColor}20`, border:`1px solid ${accentColor}44` }}>
              <span style={{ color:accentColor, fontWeight:800, fontSize:14 }}>{stage.price}€</span>
              <span style={{ color:'#94a3b8', fontSize:12 }}>par participant</span>
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div style={S.card}>
          <h2 style={{ color:'#f1f5f9', fontSize:16, fontWeight:800, marginBottom:20 }}>Formulaire d'inscription</h2>

          {errors._global && (
            <div style={{ background:'rgba(251,113,133,0.1)', border:'1px solid rgba(251,113,133,0.3)', borderRadius:8, padding:'10px 14px', color:'#fb7185', fontSize:13, marginBottom:16 }}>
              {errors._global}
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Identité */}
            {(isVisible('first_name') || isVisible('last_name')) && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {isVisible('first_name') && (
                  <div>
                    <label style={S.lbl}>Prénom {isRequired('first_name') && <span style={{ color:accentColor }}>*</span>}</label>
                    <input style={fieldStyle('first_name')} value={form.first_name} onChange={e => set('first_name', e.target.value)} />
                    {errors.first_name && <p style={S.err}>{errors.first_name}</p>}
                  </div>
                )}
                {isVisible('last_name') && (
                  <div>
                    <label style={S.lbl}>Nom {isRequired('last_name') && <span style={{ color:accentColor }}>*</span>}</label>
                    <input style={fieldStyle('last_name')} value={form.last_name} onChange={e => set('last_name', e.target.value)} />
                    {errors.last_name && <p style={S.err}>{errors.last_name}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Naissance + Sexe */}
            {(isVisible('birth_date') || isVisible('gender')) && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {isVisible('birth_date') && (
                  <div>
                    <label style={S.lbl}>Date de naissance {isRequired('birth_date') && <span style={{ color:accentColor }}>*</span>}</label>
                    <input type="date" style={fieldStyle('birth_date')} value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
                    {form.birth_date && <p style={{ color:'#818cf8', fontSize:12, marginTop:3 }}>Catégorie : {computeCategory(form.birth_date)}</p>}
                    {errors.birth_date && <p style={S.err}>{errors.birth_date}</p>}
                  </div>
                )}
                {isVisible('gender') && (
                  <div>
                    <label style={S.lbl}>Sexe {isRequired('gender') && <span style={{ color:accentColor }}>*</span>}</label>
                    <select style={fieldStyle('gender')} value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                    {errors.gender && <p style={S.err}>{errors.gender}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Contact */}
            {isVisible('email') && (
              <div>
                <label style={S.lbl}>Email parent / tuteur {isRequired('email') && <span style={{ color:accentColor }}>*</span>}</label>
                <input type="email" style={fieldStyle('email')} value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@exemple.fr" />
                {errors.email && <p style={S.err}>{errors.email}</p>}
              </div>
            )}
            {isVisible('phone') && (
              <div>
                <label style={S.lbl}>Téléphone {isRequired('phone') && <span style={{ color:accentColor }}>*</span>}</label>
                <input type="tel" style={fieldStyle('phone')} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="06 xx xx xx xx" />
                {errors.phone && <p style={S.err}>{errors.phone}</p>}
              </div>
            )}

            {/* Équipement */}
            {(isVisible('size_shirt') || isVisible('size_shorts') || isVisible('shoe_size')) && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
                {isVisible('size_shirt') && (
                  <div>
                    <label style={S.lbl}>Maillot {isRequired('size_shirt') && <span style={{ color:accentColor }}>*</span>}</label>
                    <select style={fieldStyle('size_shirt')} value={form.size_shirt} onChange={e => set('size_shirt', e.target.value)}>
                      <option value="">—</option>
                      {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.size_shirt && <p style={S.err}>{errors.size_shirt}</p>}
                  </div>
                )}
                {isVisible('size_shorts') && (
                  <div>
                    <label style={S.lbl}>Short {isRequired('size_shorts') && <span style={{ color:accentColor }}>*</span>}</label>
                    <select style={fieldStyle('size_shorts')} value={form.size_shorts} onChange={e => set('size_shorts', e.target.value)}>
                      <option value="">—</option>
                      {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.size_shorts && <p style={S.err}>{errors.size_shorts}</p>}
                  </div>
                )}
                {isVisible('shoe_size') && (
                  <div>
                    <label style={S.lbl}>Pointure {isRequired('shoe_size') && <span style={{ color:accentColor }}>*</span>}</label>
                    <input type="number" style={fieldStyle('shoe_size')} value={form.shoe_size} onChange={e => set('shoe_size', e.target.value)} placeholder="Ex: 38" min={28} max={48} />
                    {errors.shoe_size && <p style={S.err}>{errors.shoe_size}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Médical */}
            {isVisible('allergies') && (
              <div>
                <label style={S.lbl}>Allergies {isRequired('allergies') && <span style={{ color:accentColor }}>*</span>}</label>
                <input style={fieldStyle('allergies')} value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="Aucune, ou préciser..." />
                {errors.allergies && <p style={S.err}>{errors.allergies}</p>}
              </div>
            )}
            {isVisible('medical_notes') && (
              <div>
                <label style={S.lbl}>Contre-indications médicales {isRequired('medical_notes') && <span style={{ color:accentColor }}>*</span>}</label>
                <textarea style={{ ...fieldStyle('medical_notes'), minHeight:70, resize:'vertical' }} value={form.medical_notes} onChange={e => set('medical_notes', e.target.value)} placeholder="Aucune, ou préciser..." />
                {errors.medical_notes && <p style={S.err}>{errors.medical_notes}</p>}
              </div>
            )}

            {/* Certificat médical */}
            {isVisible('medical_cert') && (
              <div>
                <label style={S.lbl}>Certificat médical {isRequired('medical_cert') && <span style={{ color:accentColor }}>*</span>}</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ border:`2px dashed ${errors.medical_cert ? 'rgba(251,113,133,0.5)' : 'rgba(255,255,255,0.15)'}`, borderRadius:10, padding:'20px', textAlign:'center', cursor:'pointer', background:'rgba(255,255,255,0.02)', transition:'border-color 0.15s' }}
                >
                  <Upload size={20} style={{ color: certFile ? '#34d399' : '#64748b', marginBottom:6 }} />
                  <p style={{ color: certFile ? '#34d399' : '#64748b', fontSize:13, margin:0, fontWeight: certFile ? 700 : 400 }}>
                    {certPreview || 'Cliquez pour uploader (PDF, JPG, PNG)'}
                  </p>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={handleFile} />
                </div>
                {errors.medical_cert && <p style={S.err}>{errors.medical_cert}</p>}
              </div>
            )}

            {/* Champs custom */}
            {customFields.map(cf => (
              <div key={cf.id}>
                <label style={S.lbl}>{cf.label} {cf.required && <span style={{ color:accentColor }}>*</span>}</label>
                {cf.type === 'select' ? (
                  <select style={fieldStyle(cf.id)} value={customValues[cf.id] || ''} onChange={e => setCustom(cf.id, e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {(cf.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : cf.type === 'checkbox' ? (
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                    <input type="checkbox" checked={!!customValues[cf.id]} onChange={e => setCustom(cf.id, e.target.checked ? 'oui' : '')} />
                    <span style={{ color:'#94a3b8', fontSize:13 }}>{cf.label}</span>
                  </label>
                ) : (
                  <input style={fieldStyle(cf.id)} value={customValues[cf.id] || ''} onChange={e => setCustom(cf.id, e.target.value)} />
                )}
                {errors[cf.id] && <p style={S.err}>{errors[cf.id]}</p>}
              </div>
            ))}

          </div>

          {/* Prix récap */}
          {stage.price > 0 && (
            <div style={{ marginTop:20, padding:'12px 16px', borderRadius:10, background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)' }}>
              <p style={{ color:'#f97316', fontWeight:700, fontSize:14, margin:'0 0 4px' }}>💳 Paiement : {stage.price}€</p>
              {stage.payment_info && <p style={{ color:'#94a3b8', fontSize:12, margin:0, whiteSpace:'pre-line' }}>{stage.payment_info}</p>}
            </div>
          )}

          <button style={{ ...S.btn, opacity: submitting ? 0.6 : 1, background:accentColor }} disabled={submitting} onClick={submit}>
            {submitting ? 'Envoi en cours...' : "✓ Envoyer ma demande d'inscription"}
          </button>
          <p style={{ color:'#475569', fontSize:12, textAlign:'center', marginTop:10 }}>
            Vos données sont transmises uniquement au club organisateur.
          </p>
        </div>
      </div>
    </div>
  );
}

