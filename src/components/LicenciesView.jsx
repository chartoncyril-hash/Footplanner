import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

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
    initial || {
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
        <label style={S.label}>URL Photo</label>
        <input
          style={S.input}
          value={form.photo_url}
          onChange={(e) => u("photo_url", e.target.value)}
          placeholder="https://..."
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

      <div
        style={{
          fontSize: 11,
          color: "#818cf8",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
          marginTop: 8,
        }}
      >
        Contact d'urgence
      </div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Nom</label>
          <input
            style={S.input}
            value={form.contact_urgence_nom}
            onChange={(e) => u("contact_urgence_nom", e.target.value)}
            placeholder="Nom du contact"
          />
        </div>
        <div>
          <label style={S.label}>Téléphone</label>
          <input
            style={S.input}
            value={form.contact_urgence_tel}
            onChange={(e) => u("contact_urgence_tel", e.target.value)}
            placeholder="06 xx xx xx xx"
          />
        </div>
      </div>

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
          owner_id: user.id,
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
                    <label style={S.label}>URL doc</label>
                    <input
                      style={S.input}
                      value={doc?.url || ""}
                      onChange={(e) => upsertDoc(type, "url", e.target.value)}
                      placeholder="https://..."
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
export function LicenciesView() {
  const [licencies, setLicencies] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterStatus, setFilterStatus] = useState("actif");

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: lic }, { data: d }] = await Promise.all([
      supabase
        .from("licencies")
        .select("*")
        .eq("owner_id", user.id)
        .order("last_name"),
      supabase.from("licencies_documents").select("*").eq("owner_id", user.id),
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
      status: form.status,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    };
    if (editing?.id) {
      await supabase.from("licencies").update(payload).eq("id", editing.id);
    } else {
      await supabase
        .from("licencies")
        .insert({ ...payload, owner_id: user.id });
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={S.title}>Licenciés & Équipes</div>
          <div style={S.sub}>Gérez vos licenciés, documents et conformité</div>
        </div>
        {tab === "licencies" && (
          <button
            style={S.btnPrimary}
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + Nouveau licencié
          </button>
        )}
      </div>

      <div style={S.tabs}>
        {[
          { v: "dashboard", l: "📊 Dashboard" },
          { v: "licencies", l: "👥 Licenciés" },
          { v: "documents", l: "📄 Documents" },
          { v: "equipes", l: "⚽ Équipes" },
        ].map((t) => (
          <button
            key={t.v}
            style={{ ...S.tab, ...(tab === t.v ? S.tabActive : {}) }}
            onClick={() => setTab(t.v)}
          >
            {t.l}
          </button>
        ))}
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
            {filtered.length} licencié{filtered.length > 1 ? "s" : ""}
          </div>
          {filtered.map((l) => {
            const licDocs = docs.filter((d) => d.licencie_id === l.id);
            const docsConformes = TYPES_DOCS.filter((type) =>
              licDocs.find((d) => d.type === type && d.statut === "conforme"),
            ).length;
            const isExpanded = expandedId === l.id;
            return (
              <div key={l.id} style={S.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {l.photo_url ? (
                    <img
                      src={l.photo_url}
                      alt=""
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "rgba(163,230,53,0.15)",
                        border: "1px solid rgba(163,230,53,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        fontWeight: 900,
                        color: "#a3e635",
                      }}
                    >
                      {l.first_name[0]}
                      {l.last_name[0]}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#f1f5f9",
                        }}
                      >
                        {l.first_name} {l.last_name}
                      </span>
                      {l.category && (
                        <span
                          style={{
                            ...S.badge,
                            background: "rgba(163,230,53,0.1)",
                            color: "#a3e635",
                            border: "1px solid rgba(163,230,53,0.2)",
                          }}
                        >
                          {l.category}
                        </span>
                      )}
                      {l.team && (
                        <span
                          style={{
                            ...S.badge,
                            background: "rgba(129,140,248,0.1)",
                            color: "#818cf8",
                            border: "1px solid rgba(129,140,248,0.2)",
                          }}
                        >
                          {l.team}
                        </span>
                      )}
                      {l.position && (
                        <span
                          style={{
                            ...S.badge,
                            background: "rgba(255,255,255,0.05)",
                            color: "#64748b",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {l.position}
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
                      {l.birth_date && (
                        <span>
                          🎂{" "}
                          {new Date(l.birth_date).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {l.licence_number && <span>🪪 {l.licence_number}</span>}
                      {l.phone && <span>📞 {l.phone}</span>}
                      <span
                        style={{
                          color:
                            docsConformes === TYPES_DOCS.length
                              ? "#34d399"
                              : docsConformes > 0
                                ? "#f59e0b"
                                : "#fb7185",
                        }}
                      >
                        📄 {docsConformes}/{TYPES_DOCS.length} docs
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      style={S.btnGhost}
                      onClick={() => setExpandedId(isExpanded ? null : l.id)}
                    >
                      📄 Docs
                    </button>
                    <button
                      style={S.btnGhost}
                      onClick={() => {
                        setEditing(l);
                        setShowForm(true);
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      style={S.btnDanger}
                      onClick={() => handleDelete(l.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <DocumentsPanel
                    licencie={l}
                    onClose={() => setExpandedId(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "documents" && (
        <div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            Vue globale de la conformité documentaire
          </div>
          {licencies
            .filter((l) => l.status === "actif")
            .map((l) => {
              const licDocs = docs.filter((d) => d.licencie_id === l.id);
              const docsConformes = TYPES_DOCS.filter((type) =>
                licDocs.find((d) => d.type === type && d.statut === "conforme"),
              ).length;
              const isOk = docsConformes === TYPES_DOCS.length;
              return (
                <div
                  key={l.id}
                  style={{
                    ...S.card,
                    borderLeft: `3px solid ${isOk ? "#34d399" : docsConformes > 0 ? "#f59e0b" : "#fb7185"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#f1f5f9",
                        }}
                      >
                        {l.first_name} {l.last_name}
                      </span>
                      {l.category && (
                        <span
                          style={{
                            ...S.badge,
                            marginLeft: 8,
                            background: "rgba(163,230,53,0.1)",
                            color: "#a3e635",
                            border: "1px solid rgba(163,230,53,0.2)",
                          }}
                        >
                          {l.category}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {TYPES_DOCS.map((type) => {
                        const doc = licDocs.find((d) => d.type === type);
                        const statut = STATUTS_DOC.find(
                          (s) => s.value === (doc?.statut || "manquant"),
                        );
                        return (
                          <span
                            key={type}
                            title={`${type}: ${statut.label}`}
                            style={{ fontSize: 16 }}
                          >
                            {statut.icon}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
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
                        <span style={{ color: "#f1f5f9" }}>
                          {m.first_name} {m.last_name}
                        </span>
}
