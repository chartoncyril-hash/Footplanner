import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const DEFAULT_SECTEURS = [
  "Alimentation",
  "Automobile",
  "Banque / Assurance",
  "BTP / Immobilier",
  "Commerce local",
  "Energie",
  "Industrie",
  "Médical / Santé",
  "Restauration",
  "Sport / Loisirs",
  "Technologie",
  "Transport",
  "Autre",
];
const DEFAULT_TYPES = [
  "Bronze",
  "Argent",
  "Or",
  "Premium",
  "Naming",
  "Partenaire officiel",
  "Fournisseur",
  "Autre",
];
const STATUTS = [
  { value: "prospect", label: "Prospect", color: "#64748b" },
  { value: "negociation", label: "En négociation", color: "#f59e0b" },
  { value: "actif", label: "Actif", color: "#34d399" },
  { value: "renouvellement", label: "Renouvellement", color: "#818cf8" },
  { value: "termine", label: "Terminé", color: "#fb7185" },
];

const S = {
  page: { padding: "0 0 60px" },
  title: { fontSize: 22, fontWeight: 900, color: "#f1f5f9", marginBottom: 4 },
  sub: { fontSize: 13, color: "#64748b", marginBottom: 24 },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginBottom: 28,
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
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    background: "rgba(255,255,255,0.05)",
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
  logo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    objectFit: "contain",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
};
function SettingsPanel({ settings, onSave, onClose }) {
  const [secteurs, setSecteurs] = useState([...settings.secteurs]);
  const [types, setTypes] = useState([...settings.types_partenariat]);
  const [champs, setChamps] = useState([...settings.champs_custom]);
  const [newSecteur, setNewSecteur] = useState("");
  const [newType, setNewType] = useState("");
  const [newChamp, setNewChamp] = useState({ label: "", type: "text" });

  return (
    <div
      style={{
        ...S.card,
        border: "1px solid rgba(163,230,53,0.2)",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
          ⚙️ Paramètres du module
        </div>
        <button style={S.btnGhost} onClick={onClose}>
          Fermer
        </button>
      </div>

      {/* Secteurs */}
      <div style={{ marginBottom: 24 }}>
        <label style={S.label}>Secteurs d'activité</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {secteurs.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 20,
                fontSize: 12,
              }}
            >
              <span style={{ color: "#94a3b8" }}>{s}</span>
              <button
                onClick={() =>
                  setSecteurs((prev) => prev.filter((_, idx) => idx !== i))
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "#fb7185",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            value={newSecteur}
            onChange={(e) => setNewSecteur(e.target.value)}
            placeholder="Nouveau secteur..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSecteur.trim()) {
                setSecteurs((p) => [...p, newSecteur.trim()]);
                setNewSecteur("");
              }
            }}
          />
          <button
            style={S.btnPrimary}
            onClick={() => {
              if (newSecteur.trim()) {
                setSecteurs((p) => [...p, newSecteur.trim()]);
                setNewSecteur("");
              }
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Types partenariat */}
      <div style={{ marginBottom: 24 }}>
        <label style={S.label}>Types de partenariat</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {types.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 20,
                fontSize: 12,
              }}
            >
              <span style={{ color: "#94a3b8" }}>{t}</span>
              <button
                onClick={() =>
                  setTypes((prev) => prev.filter((_, idx) => idx !== i))
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "#fb7185",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Nouveau type..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && newType.trim()) {
                setTypes((p) => [...p, newType.trim()]);
                setNewType("");
              }
            }}
          />
          <button
            style={S.btnPrimary}
            onClick={() => {
              if (newType.trim()) {
                setTypes((p) => [...p, newType.trim()]);
                setNewType("");
              }
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Champs personnalisés */}
      <div style={{ marginBottom: 24 }}>
        <label style={S.label}>Champs personnalisés</label>
        {champs.map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, color: "#94a3b8", flex: 1 }}>
              {c.label} <span style={{ color: "#475569" }}>({c.type})</span>
            </span>
            <button
              onClick={() =>
                setChamps((prev) => prev.filter((_, idx) => idx !== i))
              }
              style={{ ...S.btnDanger, padding: "4px 10px" }}
            >
              ×
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            value={newChamp.label}
            onChange={(e) =>
              setNewChamp((p) => ({ ...p, label: e.target.value }))
            }
            placeholder="Nom du champ..."
          />
          <select
            style={{ ...S.input, width: 120 }}
            value={newChamp.type}
            onChange={(e) =>
              setNewChamp((p) => ({ ...p, type: e.target.value }))
            }
          >
            <option value="text">Texte</option>
            <option value="number">Nombre</option>
            <option value="date">Date</option>
            <option value="url">URL</option>
          </select>
          <button
            style={S.btnPrimary}
            onClick={() => {
              if (newChamp.label.trim()) {
                setChamps((p) => [...p, { ...newChamp }]);
                setNewChamp({ label: "", type: "text" });
              }
            }}
          >
            +
          </button>
        </div>
      </div>

      <button
        style={{ ...S.btnPrimary, width: "100%" }}
        onClick={() =>
          onSave({ secteurs, types_partenariat: types, champs_custom: champs })
        }
      >
        Enregistrer les paramètres
      </button>
    </div>
  );
}
function SponsorForm({ initial, settings, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      name: "",
      logo_url: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      website: "",
      sector: "",
      contract_amount: "",
      contract_start: "",
      contract_end: "",
      partnership_type: "",
      status: "actif",
      notes: "",
      custom_fields: {},
    },
  );
  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const uc = (k, v) =>
    setForm((p) => ({ ...p, custom_fields: { ...p.custom_fields, [k]: v } }));

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
        {initial?.id ? "Modifier" : "Nouveau sponsor"}
      </div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Nom *</label>
          <input
            style={S.input}
            value={form.name}
            onChange={(e) => u("name", e.target.value)}
            placeholder="Nom de la société"
          />
        </div>
        <div>
          <label style={S.label}>URL Logo</label>
          <input
            style={S.input}
            value={form.logo_url}
            onChange={(e) => u("logo_url", e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Contact</label>
          <input
            style={S.input}
            value={form.contact_name}
            onChange={(e) => u("contact_name", e.target.value)}
            placeholder="Nom du contact"
          />
        </div>
        <div>
          <label style={S.label}>Téléphone</label>
          <input
            style={S.input}
            value={form.contact_phone}
            onChange={(e) => u("contact_phone", e.target.value)}
            placeholder="06 xx xx xx xx"
          />
        </div>
      </div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Email</label>
          <input
            style={S.input}
            type="email"
            value={form.contact_email}
            onChange={(e) => u("contact_email", e.target.value)}
            placeholder="contact@societe.fr"
          />
        </div>
        <div>
          <label style={S.label}>Site web</label>
          <input
            style={S.input}
            value={form.website}
            onChange={(e) => u("website", e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Secteur</label>
          <select
            style={S.input}
            value={form.sector}
            onChange={(e) => u("sector", e.target.value)}
          >
            <option value="" style={{background:"#1e293b",color:"#f1f5f9"}}>Sélectionner...</option>
            {(settings?.secteurs || DEFAULT_SECTEURS).map((s) => (
              <option key={s} value={s} style={{background:"#1e293b",color:"#f1f5f9"}}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={S.label}>Type partenariat</label>
          <select
            style={S.input}
            value={form.partnership_type}
            onChange={(e) => u("partnership_type", e.target.value)}
          >
            <option value="" style={{background:"#1e293b",color:"#f1f5f9"}}>Sélectionner...</option>
            {(settings?.types_partenariat || DEFAULT_TYPES).map((t) => (
              <option key={t} value={t} style={{background:"#1e293b",color:"#f1f5f9"}}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Montant contrat (€)</label>
          <input
            style={S.input}
            type="number"
            value={form.contract_amount}
            onChange={(e) => u("contract_amount", e.target.value)}
          />
        </div>
        <div>
          <label style={S.label}>Statut</label>
          <select
            style={S.input}
            value={form.status}
            onChange={(e) => u("status", e.target.value)}
          >
            {STATUTS.map((s) => (
              <option key={s.value} value={s.value} style={{background:"#1e293b",color:"#f1f5f9"}}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Début contrat</label>
          <input
            style={S.input}
            type="date"
            value={form.contract_start}
            onChange={(e) => u("contract_start", e.target.value)}
          />
        </div>
        <div>
          <label style={S.label}>Fin contrat</label>
          <input
            style={S.input}
            type="date"
            value={form.contract_end}
            onChange={(e) => u("contract_end", e.target.value)}
          />
        </div>
      </div>
      {(settings?.champs_custom || []).map((champ) => (
        <div key={champ.label} style={{ marginBottom: 12 }}>
          <label style={S.label}>{champ.label}</label>
          <input
            style={S.input}
            type={champ.type}
            value={form.custom_fields?.[champ.label] || ""}
            onChange={(e) => uc(champ.label, e.target.value)}
          />
        </div>
      ))}
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Notes</label>
        <textarea
          style={{ ...S.input, minHeight: 70, resize: "vertical" }}
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
export function SponsorsHubView({ profile }) {
  const [sponsors, setSponsors] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [filterSecteur, setFilterSecteur] = useState("");
  const [filterType, setFilterType] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: sp }, { data: st }] = await Promise.all([
      supabase
        .from("sponsor_library")
        .select("*")
        .eq("owner_id", user.id)
        .order("name"),
      supabase
        .from("sponsor_settings")
        .select("*")
        .eq("owner_id", user.id)
        .single(),
    ]);
    setSponsors(sp || []);
    setSettings(
      st || {
        secteurs: DEFAULT_SECTEURS,
        types_partenariat: DEFAULT_TYPES,
        champs_custom: [],
      },
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveSettings = async (newSettings) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("sponsor_settings")
      .upsert(
        {
          owner_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "owner_id" },
      );
    setSettings({ ...settings, ...newSettings });
    setShowSettings(false);
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleSave = async (form) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const payload = {
      name: form.name,
      logo_url: form.logo_url || null,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      website: form.website || null,
      sector: form.sector || null,
      contract_amount: form.contract_amount || null,
      contract_start: form.contract_start || null,
      contract_end: form.contract_end || null,
      partnership_type: form.partnership_type || null,
      status: form.status,
      notes: form.notes || null,
      custom_fields: form.custom_fields || {},
    };
    if (editing?.id) {
      await supabase
        .from("sponsor_library")
        .update(payload)
        .eq("id", editing.id);
    } else {
      await supabase
        .from("sponsor_library")
        .insert({ ...payload, owner_id: user.id });
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce sponsor ?")) return;
    await supabase.from("sponsor_library").delete().eq("id", id);
    load();
  };

  const actifs = sponsors.filter((s) => s.status === "actif");
  const expirant = sponsors.filter(
    (s) =>
      s.contract_end &&
      new Date(s.contract_end) <
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) &&
      s.status === "actif",
  );
  const totalCA = actifs.reduce(
    (acc, s) => acc + (parseFloat(s.contract_amount) || 0),
    0,
  );

  const filtered = sponsors.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.contact_name?.toLowerCase().includes(q) ||
      s.contact_email?.toLowerCase().includes(q) ||
      s.sector?.toLowerCase().includes(q);
    const matchStatut = filter === "all" || s.status === filter;
    const matchSecteur = !filterSecteur || s.sector === filterSecteur;
    const matchType = !filterType || s.partnership_type === filterType;
    return matchSearch && matchStatut && matchSecteur && matchType;
  });

  if (loading)
    return <div style={{ padding: 40, color: "#64748b" }}>Chargement...</div>;

  return (
    <div style={S.page}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={S.title}>Sponsors & Partenaires</div>
          <div style={S.sub}>
            Gérez vos partenaires commerciaux et suivez vos contrats
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={S.btnGhost}
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Paramètres
          </button>
          <button
            style={S.btnPrimary}
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + Nouveau
          </button>
        </div>
      </div>

      <div style={S.stats}>
        <div style={S.statCard}>
          <div style={{ ...S.statVal, color: "#a3e635" }}>{actifs.length}</div>
          <div style={S.statLbl}>Actifs</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statVal, color: "#f59e0b" }}>
            {sponsors.filter((s) => s.status === "negociation").length}
          </div>
          <div style={S.statLbl}>En négociation</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statVal, color: "#fb7185" }}>
            {expirant.length}
          </div>
          <div style={S.statLbl}>Expirent bientôt</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statVal, color: "#818cf8" }}>
            {totalCA.toLocaleString("fr-FR")}€
          </div>
          <div style={S.statLbl}>CA total</div>
        </div>
      </div>

      {expirant.length > 0 && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(251,113,133,0.08)",
            border: "1px solid rgba(251,113,133,0.2)",
            borderRadius: 12,
            marginBottom: 20,
            fontSize: 13,
            color: "#fb7185",
          }}
        >
          ⚠️ {expirant.length} contrat{expirant.length > 1 ? "s" : ""} expire
          {expirant.length > 1 ? "nt" : ""} bientôt :{" "}
          {expirant.map((s) => s.name).join(", ")}
        </div>
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showForm && (
        <SponsorForm
          initial={editing}
          settings={settings}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {/* Recherche et filtres */}
      <div style={{ marginBottom: 16 }}>
        <input
          style={{ ...S.input, marginBottom: 10 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Rechercher par nom, contact, secteur..."
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            style={{ ...S.input, width: "auto", flex: 1 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            {STATUTS.map((s) => (
              <option key={s.value} value={s.value} style={{background:"#1e293b",color:"#f1f5f9"}}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            style={{ ...S.input, width: "auto", flex: 1 }}
            value={filterSecteur}
            onChange={(e) => setFilterSecteur(e.target.value)}
          >
            <option value="" style={{background:"#1e293b",color:"#f1f5f9"}}>Tous les secteurs</option>
            {(settings?.secteurs || DEFAULT_SECTEURS).map((s) => (
              <option key={s} value={s} style={{background:"#1e293b",color:"#f1f5f9"}}>
                {s}
              </option>
            ))}
          </select>
          <select
            style={{ ...S.input, width: "auto", flex: 1 }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="" style={{background:"#1e293b",color:"#f1f5f9"}}>Tous les types</option>
            {(settings?.types_partenariat || DEFAULT_TYPES).map((t) => (
              <option key={t} value={t} style={{background:"#1e293b",color:"#f1f5f9"}}>
                {t}
              </option>
            ))}
          </select>
          {(search || filter !== "all" || filterSecteur || filterType) && (
            <button
              style={S.btnGhost}
              onClick={() => {
                setSearch("");
                setFilter("all");
                setFilterSecteur("");
                setFilterType("");
              }}
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>
        {filtered.length} sponsor{filtered.length > 1 ? "s" : ""} affiché
        {filtered.length > 1 ? "s" : ""}
      </div>

      {filtered.length === 0 && !showForm && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#475569",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
            Aucun résultat
          </div>
          <div style={{ fontSize: 13 }}>
            {sponsors.length === 0
              ? "Ajoutez vos premiers partenaires"
              : "Modifiez vos filtres de recherche"}
          </div>
        </div>
      )}

      {filtered.map((s) => {
        const statut =
          STATUTS.find((st) => st.value === s.status) || STATUTS[0];
        const isExpiring =
          s.contract_end &&
          new Date(s.contract_end) <
            new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) &&
          s.status === "actif";
        return (
          <div
            key={s.id}
            style={{
              ...S.card,
              ...(isExpiring ? { borderColor: "rgba(251,113,133,0.3)" } : {}),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
              }}
            >
              {s.logo_url ? (
                <img src={s.logo_url} alt="" style={S.logo} />
              ) : (
                <div style={S.logoPlaceholder}>🤝</div>
              )}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}
                  >
                    {s.name}
                  </div>
                  <span
                    style={{
                      ...S.badge,
                      background: statut.color + "20",
                      color: statut.color,
                      border: `1px solid ${statut.color}40`,
                    }}
                  >
                    {statut.label}
                  </span>
                  {s.partnership_type && (
                    <span
                      style={{
                        ...S.badge,
                        background: "rgba(255,255,255,0.06)",
                        color: "#64748b",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {s.partnership_type}
                    </span>
                  )}
                  {s.sector && (
                    <span
                      style={{
                        ...S.badge,
                        background: "rgba(255,255,255,0.04)",
                        color: "#475569",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {s.sector}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  {s.contact_name && <span>👤 {s.contact_name}</span>}
                  {s.contact_phone && <span>📞 {s.contact_phone}</span>}
                  {s.contact_email && <span>✉️ {s.contact_email}</span>}
                  {s.contract_amount && (
                    <span style={{ color: "#a3e635", fontWeight: 700 }}>
                      💰 {parseFloat(s.contract_amount).toLocaleString("fr-FR")}
                      €
                    </span>
                  )}
                  {s.contract_end && (
                    <span style={{ color: isExpiring ? "#fb7185" : "#64748b" }}>
                      📅 Fin:{" "}
                      {new Date(s.contract_end).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {s.website && (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...S.btnGhost,
                      textDecoration: "none",
                      padding: "8px 12px",
                    }}
                  >
                    🔗
                  </a>
                )}
                <button
                  style={S.btnGhost}
                  onClick={() => {
                    setEditing(s);
                    setShowForm(true);
                  }}
                >
                  ✏️
                </button>
                <button style={S.btnDanger} onClick={() => handleDelete(s.id)}>
                  🗑️
                </button>
              </div>
            </div>
            {s.notes && (
              <div
                style={{
                  fontSize: 12,
                  color: "#475569",
                  fontStyle: "italic",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                  paddingTop: 10,
                }}
              >
                {s.notes}
              </div>
            )}
            {s.custom_fields && Object.keys(s.custom_fields).length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {Object.entries(s.custom_fields).map(([k, v]) =>
                  v ? (
                    <span key={k} style={{ fontSize: 11, color: "#64748b" }}>
                      <strong style={{ color: "#475569" }}>{k}:</strong> {v}
                    </span>
                  ) : null,
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
