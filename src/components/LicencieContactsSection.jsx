import React from "react";
import { Plus, Trash2, Phone, UserCheck } from "lucide-react";

// ============================================================
// Sections réutilisables de la fiche licencié :
//   - EmergencyContactsSection : liste dynamique de contacts d'urgence
//   - LegalGuardiansSection : jusqu'à 2 représentants légaux
// Les données sont des tableaux d'objets stockés en JSONB.
// ============================================================

const inp = {
  width: "100%",
  padding: "9px 12px",
  background: "#1e293b",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#f1f5f9",
  fontSize: 13,
  boxSizing: "border-box",
  fontFamily: "inherit",
};
const lbl = {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 700,
  marginBottom: 4,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
const sectionTitle = (color) => ({
  fontSize: 11,
  color,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1,
  marginBottom: 10,
  marginTop: 16,
  display: "flex",
  alignItems: "center",
  gap: 6,
});

const RELATIONS = [
  "Père",
  "Mère",
  "Tuteur",
  "Tutrice",
  "Grand-parent",
  "Autre",
];

// ── Contacts d'urgence (illimités) ──
export function EmergencyContactsSection({ contacts = [], onChange }) {
  const list = Array.isArray(contacts) ? contacts : [];

  const add = () => onChange([...list, { name: "", phone: "", relation: "" }]);
  const update = (i, k, v) =>
    onChange(list.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)));
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={sectionTitle("#fb7185")}>
        <Phone size={13} /> Contacts d'urgence
      </div>

      {list.length === 0 && (
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>
          Aucun contact d'urgence. Ajoutez-en au moins un.
        </div>
      )}

      {list.map((c, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 110px 36px",
            gap: 8,
            marginBottom: 8,
            alignItems: "end",
          }}
        >
          <div>
            {i === 0 && <label style={lbl}>Nom</label>}
            <input
              style={inp}
              value={c.name || ""}
              placeholder="Nom complet"
              onChange={(e) => update(i, "name", e.target.value)}
            />
          </div>
          <div>
            {i === 0 && <label style={lbl}>Téléphone</label>}
            <input
              style={inp}
              value={c.phone || ""}
              placeholder="06 xx xx xx xx"
              onChange={(e) => update(i, "phone", e.target.value)}
            />
          </div>
          <div>
            {i === 0 && <label style={lbl}>Lien</label>}
            <select
              style={inp}
              value={c.relation || ""}
              onChange={(e) => update(i, "relation", e.target.value)}
            >
              <option value="" style={{ background: "#1e293b" }}>
                —
              </option>
              {RELATIONS.map((r) => (
                <option key={r} value={r} style={{ background: "#1e293b" }}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            style={{
              height: 36,
              borderRadius: 8,
              background: "rgba(251,113,133,0.1)",
              border: "1px solid rgba(251,113,133,0.2)",
              color: "#fb7185",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        style={{
          marginTop: 4,
          padding: "8px 14px",
          background: "rgba(251,113,133,0.08)",
          border: "1px dashed rgba(251,113,133,0.3)",
          borderRadius: 8,
          color: "#fb7185",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Plus size={13} /> Ajouter un contact
      </button>
    </div>
  );
}

// ── Représentants légaux (2 max) ──
export function LegalGuardiansSection({ guardians = [], onChange }) {
  const list = Array.isArray(guardians) ? guardians : [];

  const add = () => {
    if (list.length >= 2) return;
    onChange([
      ...list,
      { first_name: "", last_name: "", email: "", phone: "", relation: "" },
    ]);
  };
  const update = (i, k, v) =>
    onChange(list.map((g, idx) => (idx === i ? { ...g, [k]: v } : g)));
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={sectionTitle("#818cf8")}>
        <UserCheck size={13} /> Représentants légaux
      </div>

      {list.length === 0 && (
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>
          Pour les licenciés mineurs, ajoutez le ou les représentants légaux.
        </div>
      )}

      {list.map((g, i) => (
        <div
          key={i}
          style={{
            padding: 12,
            marginBottom: 10,
            background: "rgba(129,140,248,0.05)",
            border: "1px solid rgba(129,140,248,0.15)",
            borderRadius: 10,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8" }}>
              Représentant {i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "rgba(251,113,133,0.1)",
                border: "1px solid rgba(251,113,133,0.2)",
                color: "#fb7185",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div>
              <label style={lbl}>Prénom</label>
              <input
                style={inp}
                value={g.first_name || ""}
                placeholder="Prénom"
                onChange={(e) => update(i, "first_name", e.target.value)}
              />
            </div>
            <div>
              <label style={lbl}>Nom</label>
              <input
                style={inp}
                value={g.last_name || ""}
                placeholder="Nom"
                onChange={(e) => update(i, "last_name", e.target.value)}
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div>
              <label style={lbl}>Email</label>
              <input
                style={inp}
                type="email"
                value={g.email || ""}
                placeholder="parent@email.fr"
                onChange={(e) => update(i, "email", e.target.value)}
              />
            </div>
            <div>
              <label style={lbl}>Téléphone</label>
              <input
                style={inp}
                value={g.phone || ""}
                placeholder="06 xx xx xx xx"
                onChange={(e) => update(i, "phone", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label style={lbl}>Lien de parenté</label>
            <select
              style={inp}
              value={g.relation || ""}
              onChange={(e) => update(i, "relation", e.target.value)}
            >
              <option value="" style={{ background: "#1e293b" }}>
                —
              </option>
              {RELATIONS.map((r) => (
                <option key={r} value={r} style={{ background: "#1e293b" }}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {list.length < 2 && (
        <button
          type="button"
          onClick={add}
          style={{
            marginTop: 2,
            padding: "8px 14px",
            background: "rgba(129,140,248,0.08)",
            border: "1px dashed rgba(129,140,248,0.3)",
            borderRadius: 8,
            color: "#818cf8",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={13} /> Ajouter un représentant
        </button>
      )}
    </div>
  );
}
