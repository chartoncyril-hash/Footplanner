import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { getEffectiveOwnerId } from "../lib/effectiveUser";
import { EmergencyContactsSection, LegalGuardiansSection } from './LicencieContactsSection';
import { LicencieListItem, LicencieListHeader } from './LicencieListItem';
import { Users, LayoutDashboard, Shield, Send, FileText, Trash2 } from 'lucide-react';

// ── UPLOAD BUTTON ────────────────────────────────────────────
function UploadButton({ value, accept, bucket, path, compress, onUploaded, onClear }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef();

  const compressImage = (file) => new Promise((resolve) => {
    if (!compress || !file.type.startsWith('image/')) { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 800;
      let w = img.width, h = img.height;
      if (w > max || h > max) {
        if (w > h) { h = Math.round(h * max / w); w = max; }
        else { w = Math.round(w * max / h); h = max; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.82);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const compressed = await compressImage(file);
      const ext = file.name.split('.').pop();
      const finalPath = path.replace(/\.[^.]+$/, '') + '.' + ext;
      const { error: upErr } = await supabase.storage.from(bucket).upload(finalPath, compressed, { upsert: true, contentType: compressed.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(finalPath);
      onUploaded(data.publicUrl);
    } catch(err) {
      setError('Erreur upload');
      console.error(err);
    }
    setUploading(false);
  };

  const [dragOver, setDragOver] = useState(false);
  const isImage = value && /\.(jpg|jpeg|png|gif|webp)/i.test(value);
  const isPdf = value && /\.pdf/i.test(value);

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    // Simuler un event pour réutiliser handleFile
    await handleFile({ target: { files: [file] } });
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  return (
    <div>
      {value ? (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)' }}>
          {isImage && <img src={value} alt="doc" style={{ width:48, height:48, borderRadius:8, objectFit:'cover', border:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }} />}
          {isPdf && <div style={{ width:48, height:48, borderRadius:8, background:'rgba(251,113,133,0.1)', border:'1px solid rgba(251,113,133,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📄</div>}
          {!isImage && !isPdf && <div style={{ width:48, height:48, borderRadius:8, background:'rgba(163,230,53,0.1)', border:'1px solid rgba(163,230,53,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📁</div>}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, color:'#34d399', fontWeight:700, marginBottom:2 }}>✓ Fichier uploadé</div>
            <a href={value} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#64748b', textDecoration:'underline', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Voir le fichier →</a>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <button onClick={() => ref.current?.click()} title="Remplacer" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#94a3b8', cursor:'pointer', fontSize:11, padding:'3px 8px', fontFamily:'inherit' }}>🔄</button>
            <button onClick={() => { onClear(); if(ref.current) ref.current.value=''; }} title="Supprimer" style={{ background:'rgba(251,113,133,0.08)', border:'1px solid rgba(251,113,133,0.2)', borderRadius:6, color:'#fb7185', cursor:'pointer', fontSize:11, padding:'3px 8px', fontFamily:'inherit' }}>✕</button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:8, padding:'20px 16px', borderRadius:10,
            border: `2px dashed ${dragOver ? 'rgba(163,230,53,0.6)' : 'rgba(255,255,255,0.12)'}`,
            background: dragOver ? 'rgba(163,230,53,0.06)' : 'rgba(255,255,255,0.02)',
            cursor:'pointer', transition:'all 0.15s',
            transform: dragOver ? 'scale(1.01)' : 'scale(1)',
          }}
        >
          {uploading ? (
            <>
              <div style={{ fontSize:24 }}>⏳</div>
              <span style={{ fontSize:13, color:'#64748b' }}>Upload en cours...</span>
            </>
          ) : dragOver ? (
            <>
              <div style={{ fontSize:28 }}>📂</div>
              <span style={{ fontSize:13, color:'#a3e635', fontWeight:700 }}>Déposer le fichier ici</span>
            </>
          ) : (
            <>
              <div style={{ fontSize:24, opacity:0.5 }}>📁</div>
              <span style={{ fontSize:13, color:'#64748b', textAlign:'center' }}>
                Cliquer ou glisser-déposer<br/>
                <span style={{ fontSize:11, color:'#475569' }}>{accept?.includes('image') && !accept?.includes('pdf') ? 'JPG, PNG, WEBP' : 'PDF, JPG, PNG'}</span>
              </span>
            </>
          )}
        </div>
      )}
      {error && <div style={{ fontSize:11, color:'#fb7185', marginTop:4 }}>❌ {error}</div>}
      <input ref={ref} type="file" accept={accept} style={{ display:'none' }} onChange={handleFile} />
    </div>
  );
}

const CATEGORIES = [
  "U6",
  "U7",
  "U8",
  "U9",
  "U10",
  "U11",
  "U12",
  "U13",
  "U14",
  "U15",
  "U16",
  "U17",
  "U18",
  "U19",
  "U20",
  "Senior",
  "Vétéran",
];
const POSTES = [
  "Gardien",
  "Défenseur central",
  "Défenseur latéral",
  "Milieu défensif",
  "Milieu",
  "Milieu offensif",
  "Ailier",
  "Attaquant",
  "Polyvalent",
];
const TYPES_DOCS = [
  "Licence",
  "Certificat médical",
  "Assurance",
  "Pièce d'identité",
  "Autorisation parentale",
];
const STATUTS_DOC = [
  { value: "conforme", label: "Conforme", color: "#34d399", icon: "🟢" },
  {
    value: "expire_bientot",
    label: "Expire bientôt",
    color: "#f59e0b",
    icon: "🟠",
  },
  { value: "expire", label: "Expiré", color: "#fb7185", icon: "🔴" },
  { value: "manquant", label: "Manquant", color: "#64748b", icon: "⚪" },
];

function getAutoCategory(birthDate) {
  if (!birthDate) return "";
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
  if (age <= 6) return "U6";
  if (age <= 7) return "U7";
  if (age <= 8) return "U8";
  if (age <= 9) return "U9";
  if (age <= 10) return "U10";
  if (age <= 11) return "U11";
  if (age <= 12) return "U12";
  if (age <= 13) return "U13";
  if (age <= 14) return "U14";
  if (age <= 15) return "U15";
  if (age <= 16) return "U16";
  if (age <= 17) return "U17";
  if (age <= 18) return "U18";
  if (age <= 19) return "U19";
  if (age <= 20) return "U20";
  if (age <= 35) return "Senior";
  return "Vétéran";
}

const S = {
  page: { padding: "0 0 60px" },
  title: { fontSize: 22, fontWeight: 900, color: "#f1f5f9", marginBottom: 4 },
  sub: { fontSize: 13, color: "#64748b", marginBottom: 24 },
  tabs: {
    display: "flex",
    gap: 4,
    marginBottom: 24,
    background: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: "10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontFamily: "inherit",
    textAlign: "center",
  },
  tabActive: {
    background: "rgba(163,230,53,0.15)",
    color: "#a3e635",
    border: "1px solid rgba(163,230,53,0.3)",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  statCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 16,
    textAlign: "center",
  },
  statVal: { fontSize: 28, fontWeight: 900, marginBottom: 4 },
  statLbl: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    background: "#1e293b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#f1f5f9",
    fontSize: 13,
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  label: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
    marginBottom: 4,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 12,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    marginBottom: 12,
  },
  btnPrimary: {
    padding: "10px 20px",
    background: "#a3e635",
    color: "#060a12",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnGhost: {
    padding: "10px 20px",
    background: "rgba(255,255,255,0.05)",
    color: "#94a3b8",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnDanger: {
    padding: "8px 14px",
    background: "rgba(251,113,133,0.1)",
    color: "#fb7185",
    border: "1px solid rgba(251,113,133,0.2)",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 20,
    display: "inline-block",
  },
};
function LicencieForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial ? {
      ...initial,
      gender: initial.gender || "",
      strong_foot: initial.strong_foot || "",
      preferred_number: initial.preferred_number || "",
      emergency_contacts: initial.emergency_contacts || [],
      legal_guardians: initial.legal_guardians || [],
    } : {
      first_name: "",
      last_name: "",
      birth_date: "",
      category: "",
      licence_number: "",
      position: "",
      phone: "",
      email: "",
      photo_url: "",
      team: "",
      allergies: "",
      contre_indications: "",
      contact_urgence_nom: "",
      contact_urgence_tel: "",
      gender: "",
      strong_foot: "",
      preferred_number: "",
      emergency_contacts: [],
      legal_guardians: [],
      status: "actif",
      notes: "",
    },
  );
  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleBirthDate = (v) => {
    u("birth_date", v);
    if (v) u("category", getAutoCategory(v));
  };

  return (
    <div
      style={{
        ...S.card,
        border: "1px solid rgba(163,230,53,0.2)",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#f1f5f9",
          marginBottom: 16,
        }}
      >
        {initial?.id ? "Modifier le licencié" : "Nouveau licencié"}
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#a3e635",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        Informations personnelles
      </div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Prénom *</label>
          <input
            style={S.input}
            value={form.first_name}
            onChange={(e) => u("first_name", e.target.value)}
            placeholder="Prénom"
          />
        </div>
        <div>
          <label style={S.label}>Nom *</label>
          <input
            style={S.input}
            value={form.last_name}
            onChange={(e) => u("last_name", e.target.value)}
            placeholder="Nom"
          />
        </div>
      </div>
      <div style={S.grid3}>
        <div>
          <label style={S.label}>Date de naissance</label>
          <input
            style={S.input}
            type="date"
            value={form.birth_date}
            onChange={(e) => handleBirthDate(e.target.value)}
          />
        </div>
        <div>
          <label style={S.label}>
            Catégorie {form.birth_date ? "(auto)" : ""}
          </label>
          <select
            style={S.input}
            value={form.category}
            onChange={(e) => u("category", e.target.value)}
          >
            <option value="" style={{ background: "#1e293b" }}>
              Sélectionner...
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ background: "#1e293b" }}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={S.label}>N° Licence</label>
          <input
            style={S.input}
            value={form.licence_number}
            onChange={(e) => u("licence_number", e.target.value)}
            placeholder="Ex: 123456"
          />
        </div>
      </div>
      <div style={S.grid3}>
        <div>
          <label style={S.label}>Poste</label>
          <select
            style={S.input}
            value={form.position}
            onChange={(e) => u("position", e.target.value)}
          >
            <option value="" style={{ background: "#1e293b" }}>
              Sélectionner...
            </option>
            {POSTES.map((p) => (
              <option key={p} value={p} style={{ background: "#1e293b" }}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={S.label}>Équipe</label>
          <select style={S.input} value={form.team} onChange={e => u('team', e.target.value)}>
            <option value="" style={{background:'#1e293b'}}>Sélectionner...</option>
            {[1,2,3,4].map(n => (
              <option key={n} value={'Équipe ' + n} style={{background:'#1e293b'}}>Équipe {n}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={S.label}>Statut</label>
          <select
            style={S.input}
            value={form.status}
            onChange={(e) => u("status", e.target.value)}
          >
            <option value="actif" style={{ background: "#1e293b" }}>
              Actif
            </option>
            <option value="inactif" style={{ background: "#1e293b" }}>
              Inactif
            </option>
            <option value="suspendu" style={{ background: "#1e293b" }}>
              Suspendu
            </option>
          </select>
        </div>
      </div>
      <div style={S.grid3}>
        <div>
          <label style={S.label}>Sexe</label>
          <select style={S.input} value={form.gender || ""} onChange={(e) => u("gender", e.target.value)}>
            <option value="" style={{ background: "#1e293b" }}>—</option>
            <option value="M" style={{ background: "#1e293b" }}>Masculin</option>
            <option value="F" style={{ background: "#1e293b" }}>Féminin</option>
          </select>
        </div>
        <div>
          <label style={S.label}>Pied fort</label>
          <select style={S.input} value={form.strong_foot || ""} onChange={(e) => u("strong_foot", e.target.value)}>
            <option value="" style={{ background: "#1e293b" }}>—</option>
            <option value="droit" style={{ background: "#1e293b" }}>Droit</option>
            <option value="gauche" style={{ background: "#1e293b" }}>Gauche</option>
            <option value="ambidextre" style={{ background: "#1e293b" }}>Ambidextre</option>
          </select>
        </div>
        <div>
          <label style={S.label}>N° maillot préféré</label>
          <input style={S.input} type="number" min="1" max="99" value={form.preferred_number || ""} onChange={(e) => u("preferred_number", e.target.value)} placeholder="Ex: 10" />
        </div>
      </div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Téléphone</label>
          <input
            style={S.input}
            value={form.phone}
            onChange={(e) => u("phone", e.target.value)}
            placeholder="06 xx xx xx xx"
          />
        </div>
        <div>
          <label style={S.label}>Email</label>
          <input
            style={S.input}
            type="email"
            value={form.email}
            onChange={(e) => u("email", e.target.value)}
            placeholder="joueur@email.fr"
          />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>Photo d'identité</label>
        <UploadButton
          value={form.photo_url}
          accept="image/*"
          bucket="licencies-docs"
          path={`photos/${Date.now()}.jpg`}
          compress={true}
          onUploaded={(url) => u("photo_url", url)}
          onClear={() => u("photo_url", "")}
        />
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#f59e0b",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
          marginTop: 8,
        }}
      >
        Particularités médicales
      </div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Allergies</label>
          <input
            style={S.input}
            value={form.allergies}
            onChange={(e) => u("allergies", e.target.value)}
            placeholder="Ex: arachides, pénicilline..."
          />
        </div>
        <div>
          <label style={S.label}>Contre-indications</label>
          <input
            style={S.input}
            value={form.contre_indications}
            onChange={(e) => u("contre_indications", e.target.value)}
            placeholder="Ex: asthme..."
          />
        </div>
      </div>

      <EmergencyContactsSection
        contacts={form.emergency_contacts}
        onChange={(v) => u("emergency_contacts", v)}
      />

      <LegalGuardiansSection
        guardians={form.legal_guardians}
        onChange={(v) => u("legal_guardians", v)}
      />

      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Notes</label>
        <textarea
          style={{ ...S.input, minHeight: 60, resize: "vertical" }}
          value={form.notes}
          onChange={(e) => u("notes", e.target.value)}
          placeholder="Observations..."
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button style={S.btnPrimary} onClick={() => onSave(form)}>
          Enregistrer
        </button>
        <button style={S.btnGhost} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </div>
  );
}
function DocumentsPanel({ licencie, onClose }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDocs = async () => {
    const { data } = await supabase
      .from("licencies_documents")
      .select("*")
      .eq("licencie_id", licencie.id);
    setDocs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadDocs();
  }, [licencie.id]);

  const upsertDoc = async (type, field, value) => {
    const existing = docs.find((d) => d.type === type);
    if (existing) {
      await supabase
        .from("licencies_documents")
        .update({ [field]: value })
        .eq("id", existing.id);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from("licencies_documents")
        .insert({
          licencie_id: licencie.id,
          owner_id: await getEffectiveOwnerId(),
          type,
          [field]: value,
        });
    }
    loadDocs();
  };

  return (
    <div
      style={{
        ...S.card,
        border: "1px solid rgba(129,140,248,0.2)",
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
          📄 Documents — {licencie.first_name} {licencie.last_name}
        </div>
        <button style={S.btnGhost} onClick={onClose}>
          Fermer
        </button>
      </div>
      {loading ? (
        <div style={{ color: "#64748b", fontSize: 13 }}>Chargement...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {TYPES_DOCS.map((type) => {
            const doc = docs.find((d) => d.type === type);
            const statut = STATUTS_DOC.find(
              (s) => s.value === (doc?.statut || "manquant"),
            );
            const isExpiringSoon =
              doc?.date_expiration &&
              new Date(doc.date_expiration) <
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            return (
              <div
                key={type}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}
                  >
                    {type}
                  </span>
                  <span
                    style={{
                      ...S.badge,
                      background: statut.color + "20",
                      color: statut.color,
                      border: `1px solid ${statut.color}40`,
                    }}
                  >
                    {statut.icon} {statut.label}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: 8,
                    alignItems: "end",
                  }}
                >
                  <div>
                    <label style={S.label}>Statut</label>
                    <select
                      style={S.input}
                      value={doc?.statut || "manquant"}
                      onChange={(e) =>
                        upsertDoc(type, "statut", e.target.value)
                      }
                    >
                      {STATUTS_DOC.map((s) => (
                        <option
                          key={s.value}
                          value={s.value}
                          style={{ background: "#1e293b" }}
                        >
                          {s.icon} {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Expiration</label>
                    <input
                      style={{
                        ...S.input,
                        ...(isExpiringSoon ? { borderColor: "#f59e0b" } : {}),
                      }}
                      type="date"
                      value={doc?.date_expiration || ""}
                      onChange={(e) =>
                        upsertDoc(type, "date_expiration", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label style={S.label}>Document</label>
                    <UploadButton
                      value={doc?.url || ""}
                      accept=".pdf,image/*"
                      bucket="licencies-docs"
                      path={`docs/${Date.now()}_${type}`}
                      compress={false}
                      onUploaded={(url) => upsertDoc(type, "url", url)}
                      onClear={() => upsertDoc(type, "url", "")}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function DashboardTab({ licencies, docs }) {
  const actifs = licencies.filter((l) => l.status === "actif");
  const categories = [
    ...new Set(licencies.map((l) => l.category).filter(Boolean)),
  ].sort();

  const docStats = TYPES_DOCS.map((type) => {
    const manquants = actifs.filter(
      (l) =>
        !docs.find(
          (d) =>
            d.licencie_id === l.id &&
            d.type === type &&
            d.statut === "conforme",
        ),
    ).length;
    return { type, manquants };
  });

  const conformes = actifs.filter((l) =>
    TYPES_DOCS.every((type) =>
      docs.find(
        (d) =>
          d.licencie_id === l.id && d.type === type && d.statut === "conforme",
      ),
    ),
  ).length;

  const conformiteRate =
    actifs.length > 0 ? Math.round((conformes / actifs.length) * 100) : 0;
  const expirantDocs = docs.filter(
    (d) =>
      d.date_expiration &&
      new Date(d.date_expiration) <
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
      d.statut !== "expire",
  );

  return (
    <div>
      {/* Stats globales */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={S.statCard}>
          <div style={{ ...S.statVal, color: "#a3e635" }}>{actifs.length}</div>
          <div style={S.statLbl}>Licenciés actifs</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statVal, color: "#34d399" }}>{conformes}</div>
          <div style={S.statLbl}>Conformes</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statVal, color: "#fb7185" }}>
            {actifs.length - conformes}
          </div>
          <div style={S.statLbl}>Actions requises</div>
        </div>
        <div
          style={{
            ...S.statCard,
            background:
              conformiteRate >= 90
                ? "rgba(52,211,153,0.08)"
                : conformiteRate >= 70
                  ? "rgba(245,158,11,0.08)"
                  : "rgba(251,113,133,0.08)",
            borderColor:
              conformiteRate >= 90
                ? "rgba(52,211,153,0.2)"
                : conformiteRate >= 70
                  ? "rgba(245,158,11,0.2)"
                  : "rgba(251,113,133,0.2)",
          }}
        >
          <div
            style={{
              ...S.statVal,
              color:
                conformiteRate >= 90
                  ? "#34d399"
                  : conformiteRate >= 70
                    ? "#f59e0b"
                    : "#fb7185",
            }}
          >
            {conformiteRate}%
          </div>
          <div style={S.statLbl}>Conformité</div>
        </div>
      </div>

      {/* Alertes */}
      {expirantDocs.length > 0 && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 12,
            marginBottom: 20,
            fontSize: 13,
            color: "#f59e0b",
          }}
        >
          ⚠️ {expirantDocs.length} document{expirantDocs.length > 1 ? "s" : ""}{" "}
          expire{expirantDocs.length > 1 ? "nt" : ""} dans moins de 30 jours
        </div>
      )}

      {/* Docs manquants */}
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: 12,
          }}
        >
          État des documents
        </div>
        {docStats.map(({ type, manquants }) => (
          <div
            key={type}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span style={{ fontSize: 13, color: "#94a3b8" }}>{type}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 120,
                  height: 6,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${actifs.length > 0 ? ((actifs.length - manquants) / actifs.length) * 100 : 0}%`,
                    height: "100%",
                    background:
                      manquants === 0
                        ? "#34d399"
                        : manquants < 5
                          ? "#f59e0b"
                          : "#fb7185",
                    borderRadius: 3,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: manquants === 0 ? "#34d399" : "#fb7185",
                  fontWeight: 700,
                  minWidth: 60,
                  textAlign: "right",
                }}
              >
                {manquants === 0
                  ? "✓ Complet"
                  : `${manquants} manquant${manquants > 1 ? "s" : ""}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Répartition par catégorie */}
      {categories.length > 0 && (
        <div style={S.card}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#f1f5f9",
              marginBottom: 12,
            }}
          >
            Répartition par catégorie
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((cat) => (
              <div
                key={cat}
                style={{
                  padding: "8px 14px",
                  background: "rgba(163,230,53,0.08)",
                  border: "1px solid rgba(163,230,53,0.15)",
                  borderRadius: 10,
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: "#a3e635" }}
                >
                  {cat}
                </span>
                <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>
                  {licencies.filter((l) => l.category === cat).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function DocumentSettingsPanel() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const ownerId = await getEffectiveOwnerId();
    const { data } = await supabase.from('document_types_config').select('*').eq('owner_id', ownerId).order('sort_order');
    setTypes(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id, field, value) => {
    setTypes(ts => ts.map(t => t.id === id ? { ...t, [field]: value } : t));
    await supabase.from('document_types_config').update({ [field]: value }).eq('id', id);
  };

  const addType = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    const ownerId = await getEffectiveOwnerId();
    const maxOrder = types.reduce((m, t) => Math.max(m, t.sort_order || 0), 0);
    const { error } = await supabase.from('document_types_config').insert({
      owner_id: ownerId, name, required: false, has_expiry: false, licencie_readonly: false, sort_order: maxOrder + 1, active: true,
    });
    setSaving(false);
    if (error) { alert(error.message.includes('duplicate') ? 'Ce type existe déjà.' : 'Erreur'); return; }
    setNewName('');
    load();
  };

  const removeType = async (id, name) => {
    if (!confirm(`Supprimer le type "${name}" ? Les documents déjà déposés ne sont pas effacés.`)) return;
    await supabase.from('document_types_config').delete().eq('id', id);
    load();
  };

  const Switch = ({ on, onClick }) => (
    <button onClick={onClick} style={{ width:42, height:24, borderRadius:12, border:'none', cursor:'pointer', background: on ? '#34d399' : 'rgba(255,255,255,0.12)', position:'relative', transition:'all 0.15s', flexShrink:0 }}>
      <span style={{ position:'absolute', top:2, left: on ? 20 : 2, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'all 0.15s' }} />
    </button>
  );

  return (
    <div>
      <div style={{ ...S.card, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#f1f5f9', marginBottom:6 }}>Documents attendus</div>
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:0, lineHeight:1.5 }}>
          Configurez les documents que vos licenciés doivent fournir. <strong>Obligatoire</strong> : requis pour la conformité. <strong>Date de péremption</strong> : le licencié saisit une date de validité. <strong>Lecture seule</strong> : seul le club peut déposer ce document (le licencié le consulte uniquement).
        </div>
      </div>

      {loading ? (
        <div style={{ color:'#64748b', fontSize:13, padding:20 }}>Chargement...</div>
      ) : (
        <>
          {types.map(t => (
            <div key={t.id} style={{ ...S.card, marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:14 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>{t.name}</div>
                <button onClick={() => removeType(t.id, t.name)} title="Supprimer" style={{ background:'rgba(251,113,133,0.08)', border:'1px solid rgba(251,113,133,0.2)', borderRadius:8, color:'#fb7185', cursor:'pointer', padding:'5px 9px', display:'flex', alignItems:'center' }}><Trash2 size={14} /></button>
              </div>
              {[
                { field:'required',          label:'Obligatoire' },
                { field:'has_expiry',        label:'Date de péremption à saisir' },
                { field:'licencie_readonly', label:'Lecture seule (déposé par le club)' },
              ].map(row => (
                <div key={row.field} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize:13, color:'#94a3b8' }}>{row.label}</span>
                  <Switch on={!!t[row.field]} onClick={() => toggle(t.id, row.field, !t[row.field])} />
                </div>
              ))}
            </div>
          ))}

          <div style={{ ...S.card, display:'flex', gap:8, alignItems:'center' }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==='Enter' && addType()} placeholder="Ajouter un type de document..." style={{ ...S.input, flex:1, marginBottom:0 }} />
            <button onClick={addType} disabled={saving || !newName.trim()} style={{ ...S.btnPrimary, opacity: (saving||!newName.trim())?0.5:1, whiteSpace:'nowrap' }}>+ Ajouter</button>
          </div>
        </>
      )}
    </div>
  );
}

export function LicenciesView() {
  const isMobile = window.innerWidth < 768;
  const [licencies, setLicencies] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("licencies");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterStatus, setFilterStatus] = useState("actif");
  const [selectedLicencies, setSelectedLicencies] = useState([]);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteEmails, setInviteEmails] = useState({});
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const toggleSelect = (id) => setSelectedLicencies(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const handleSendInvitations = async () => {
    setInviteSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    const profile = await supabase.from('profiles').select('club_name').eq('id', user.id).single();
    const clubName = profile?.data?.club_name || 'FootPlanner';
    for (const licId of selectedLicencies) {
      const lic = licencies.find(l => l.id === licId);
      const licName = lic ? lic.first_name + ' ' + lic.last_name : 'un licencié';
      const emails = (inviteEmails[licId] || '').split(',').map(e => e.trim()).filter(Boolean);
      for (const email of emails) {
        const { data: inv, error: invError } = await supabase.from('family_invitations').insert({
          licencie_id: licId, owner_id: await getEffectiveOwnerId(), email, status: 'pending'
        }).select().single();
        if (inv?.token) {
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-family-invitation', {
            body: { email, token: inv.token, licencie_name: licName, club_name: clubName }
          });
        }
      }
    }
    setInviteSuccess(true);
    setInviteSending(false);
    setTimeout(() => { setShowInvitePanel(false); setSelectedLicencies([]); setInviteEmails({}); setInviteSuccess(false); }, 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const ownerId = await getEffectiveOwnerId();
    if (!ownerId) return;
    const [{ data: lic }, { data: d }] = await Promise.all([
      supabase
        .from("licencies")
        .select("*")
        .eq("owner_id", ownerId)
        .order("last_name"),
      supabase.from("licencies_documents").select("*").eq("owner_id", ownerId),
    ]);
    setLicencies(lic || []);
    setDocs(d || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (form) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      birth_date: form.birth_date || null,
      category: form.category || null,
      licence_number: form.licence_number || null,
      position: form.position || null,
      phone: form.phone || null,
      email: form.email || null,
      photo_url: form.photo_url || null,
      team: form.team || null,
      allergies: form.allergies || null,
      contre_indications: form.contre_indications || null,
      contact_urgence_nom: form.contact_urgence_nom || null,
      contact_urgence_tel: form.contact_urgence_tel || null,
      gender: form.gender || null,
      strong_foot: form.strong_foot || null,
      preferred_number: form.preferred_number ? parseInt(form.preferred_number, 10) : null,
      emergency_contacts: form.emergency_contacts || [],
      legal_guardians: form.legal_guardians || [],
      status: form.status,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    };
    if (editing?.id) {
      await supabase.from("licencies").update(payload).eq("id", editing.id);
    } else {
      const ownerIdSave = await getEffectiveOwnerId();
      await supabase
        .from("licencies")
        .insert({ ...payload, owner_id: ownerIdSave });
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce licencié ?")) return;
    await supabase.from("licencies").delete().eq("id", id);
    load();
  };

  const categories = [
    ...new Set(licencies.map((l) => l.category).filter(Boolean)),
  ].sort();
  const teams = [
    ...new Set(licencies.map((l) => l.team).filter(Boolean)),
  ].sort();

  const filtered = licencies.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${l.first_name} ${l.last_name}`.toLowerCase().includes(q) ||
      l.licence_number?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q);
    const matchCat = !filterCat || l.category === filterCat;
    const matchTeam = !filterTeam || l.team === filterTeam;
    const matchStatus = !filterStatus || l.status === filterStatus;
    return matchSearch && matchCat && matchTeam && matchStatus;
  });

  if (loading)
    return <div style={{ padding: 40, color: "#64748b" }}>Chargement...</div>;

  return (
    <div style={S.page}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems: isMobile ? "flex-start" : "flex-start", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0, marginBottom: 24 }}>
        <div>
          <div style={S.title}>Licenciés & Équipes</div>
          <div style={S.sub}>Gérez vos licenciés, documents et conformité</div>
        </div>
        {tab === "licencies" && (
          <button style={{ ...S.btnPrimary, width: isMobile ? '100%' : 'auto' }} onClick={() => { setEditing(null); setShowForm(true); }}>
            + Nouveau licencié
          </button>
        )}
      </div>

      <div style={S.tabs}>
        {[
          { v: "licencies", l: "Licenciés", icon: Users },
          { v: "dashboard", l: "Tableau de bord", icon: LayoutDashboard },
          { v: "equipes", l: "Équipes", icon: Shield },
          { v: "documents", l: "Documents", icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.v;
          return (
            <button
              key={t.v}
              style={{ ...S.tab, ...(active ? S.tabActive : {}), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              onClick={() => setTab(t.v)}
            >
              <Icon size={15} /> {t.l}
            </button>
          );
        })}
      </div>

      {tab === "dashboard" && (
        <DashboardTab licencies={licencies} docs={docs} />
      )}

      {tab === "licencies" && (
        <div>
          {showForm && (
            <LicencieForm
              initial={editing}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          )}
          <input
            style={{ ...S.input, marginBottom: 10 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Rechercher par nom, licence, email..."
          />
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <select
              style={{ ...S.input, width: "auto", flex: 1 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="" style={{ background: "#1e293b" }}>
                Tous les statuts
              </option>
              <option value="actif" style={{ background: "#1e293b" }}>
                Actif
              </option>
              <option value="inactif" style={{ background: "#1e293b" }}>
                Inactif
              </option>
              <option value="suspendu" style={{ background: "#1e293b" }}>
                Suspendu
              </option>
            </select>
            <select
              style={{ ...S.input, width: "auto", flex: 1 }}
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="" style={{ background: "#1e293b" }}>
                Toutes catégories
              </option>
              {categories.map((c) => (
                <option key={c} value={c} style={{ background: "#1e293b" }}>
                  {c}
                </option>
              ))}
            </select>
            <select
              style={{ ...S.input, width: "auto", flex: 1 }}
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
            >
              <option value="" style={{ background: "#1e293b" }}>
                Toutes les équipes
              </option>
              {teams.map((t) => (
                <option key={t} value={t} style={{ background: "#1e293b" }}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{filtered.length} licencié{filtered.length > 1 ? "s" : ""}</span>
              {selectedLicencies.length > 0 && (
                <button onClick={() => {
                  // Pré-remplir avec les emails des fiches
                  const prefilled = {};
                  selectedLicencies.forEach(id => {
                    const lic = licencies.find(l => l.id === id);
                    if (lic?.email) prefilled[id] = lic.email;
                  });
                  setInviteEmails(prefilled);
                  setShowInvitePanel(true);
                }} style={{ padding:'8px 16px', background:'rgba(129,140,248,0.1)', border:'1px solid rgba(129,140,248,0.2)', borderRadius:8, color:'#818cf8', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  <Send size={14} style={{ verticalAlign: "middle" }} /> Envoyer invitation ({selectedLicencies.length})
                </button>
              )}
            </div>
          </div>
          {showInvitePanel && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(129,140,248,0.3)', borderRadius:16, padding:24, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}><Send size={14} style={{ verticalAlign: "middle" }} /> Envoyer invitation</div>
                <button onClick={() => setShowInvitePanel(false)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:18 }}>×</button>
              </div>
              {inviteSuccess ? (
                <div style={{ padding:'12px 16px', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:8, color:'#34d399', fontSize:13 }}>✓ Invitation(s) envoyée(s) avec succès !</div>
              ) : (
                <>
                  <div style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>Entrez les emails des parents (plusieurs séparés par des virgules).</div>
                  {selectedLicencies.map(id => {
                    const lic = licencies.find(l => l.id === id);
                    return (
                      <div key={id} style={{ marginBottom:12 }}>
                        <label style={{ fontSize:11, color:'#818cf8', fontWeight:700, marginBottom:4, display:'block', textTransform:'uppercase', letterSpacing:0.5 }}>{lic?.first_name} {lic?.last_name}</label>
                        <input style={{ width:'100%', padding:'9px 12px', background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#f1f5f9', fontSize:13, boxSizing:'border-box', fontFamily:'inherit' }} placeholder="email@parent.fr, email2@parent.fr" value={inviteEmails[id] || ''} onChange={e => setInviteEmails(p => ({...p, [id]: e.target.value}))} />
                        <div style={{ fontSize:10, color:'#475569', marginTop:4 }}>Séparez plusieurs emails par des virgules. Pré-rempli depuis la fiche licencié.</div>
                      </div>
                    );
                  })}
                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
                    <button onClick={handleSendInvitations} disabled={inviteSending} style={{ padding:'10px 20px', background:'#a3e635', color:'#060a12', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                      {inviteSending ? 'Envoi...' : <><Send size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Envoyer</>}
                    </button>
                    <button onClick={() => setShowInvitePanel(false)} style={{ padding:'10px 20px', background:'rgba(255,255,255,0.05)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
                  </div>
                </>
              )}
            </div>
          )}
          {!isMobile && filtered.length > 0 && <LicencieListHeader />}
          {filtered.map((l) => (
            <LicencieListItem
              key={l.id}
              licencie={l}
              docs={docs}
              isMobile={isMobile}
              isExpanded={expandedId === l.id}
              isSelected={selectedLicencies.includes(l.id)}
              onToggleSelect={() => toggleSelect(l.id)}
              onToggleExpand={() => setExpandedId(expandedId === l.id ? null : l.id)}
              onEdit={() => { setEditing(l); setShowForm(true); }}
              onDelete={() => handleDelete(l.id)}
            >
              <DocumentsPanel licencie={l} onClose={() => setExpandedId(null)} />
            </LicencieListItem>
          ))}
        </div>
      )}

      {tab === "equipes" && (
        <div>
          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Aucune équipe</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>Ajoutez des licenciés avec une catégorie et une équipe</div>
            </div>
          ) : categories.map(cat => {
            const catLicencies = licencies.filter(l => l.category === cat);
            if (catLicencies.length === 0) return null;
            return (
              <div key={cat} style={{ ...S.card, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#a3e635' }}>{cat}</div>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{catLicencies.length} joueur{catLicencies.length > 1 ? 's' : ''} au total</span>
                </div>
                {[1,2,3,4].map(n => {
                  const membres = licencies.filter(l => l.category === cat && l.team === 'Équipe ' + n);
                  if (membres.length === 0) return null;
                  return (
                    <div key={n} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>Équipe {n}</div>
                        <span style={{ fontSize: 11, color: '#475569' }}>{membres.length} joueur{membres.length > 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 12 }}>
                        {membres.map(m => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)', borderRadius: 8, fontSize: 12 }}>
                            {m.photo_url ? <img src={m.photo_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(163,230,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#a3e635' }}>{m.first_name[0]}{m.last_name[0]}</div>}
                            <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{m.first_name} {m.last_name}</span>
                            {m.position && <span style={{ color: '#64748b' }}>· {m.position}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tab === "documents" && <DocumentSettingsPanel />}
    </div>
  );
}