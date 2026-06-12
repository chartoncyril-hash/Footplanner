import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Lock, LockOpen, Check, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";

// ============================================================
// NewGroupModal — création de groupe avec ciblage fin :
//   - chips de sélection rapide : catégorie entière (U11)
//     ou équipe précise (U11 · Équipe 1)
//   - sélection individuelle de licenciés (recherche + cases)
// Les participants sont stockés par licencie_id : le parent
// accède automatiquement via family_licencies, même s'il
// s'inscrit après la création du groupe.
// ============================================================

const GROUP_EMOJIS = ["💬", "⚽", "🏆", "🎓", "📣", "🧤", "🥅", "🍊"];

export function NewGroupModal({
  clubOwnerId,
  user,
  accent,
  onClose,
  onCreated,
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💬");
  const [writeMode, setWriteMode] = useState("open");
  const [licencies, setLicencies] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("licencies")
        .select("id, first_name, last_name, category, team")
        .eq("owner_id", clubOwnerId)
        .order("last_name");
      setLicencies(data || []);
    })();
  }, [clubOwnerId]);

  // Chips : catégories + sous-ensembles catégorie·équipe
  const chips = useMemo(() => {
    const cats = {};
    licencies.forEach((l) => {
      const cat = l.category || "Sans catégorie";
      if (!cats[cat]) cats[cat] = { ids: [], teams: {} };
      cats[cat].ids.push(l.id);
      if (l.team) {
        if (!cats[cat].teams[l.team]) cats[cat].teams[l.team] = [];
        cats[cat].teams[l.team].push(l.id);
      }
    });
    const out = [];
    Object.keys(cats)
      .sort()
      .forEach((cat) => {
        out.push({ label: cat, ids: cats[cat].ids });
        Object.keys(cats[cat].teams)
          .sort()
          .forEach((team) => {
            out.push({
              label: cat + " · " + team,
              ids: cats[cat].teams[team],
              sub: true,
            });
          });
      });
    return out;
  }, [licencies]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return licencies;
    return licencies.filter((l) =>
      ((l.first_name || "") + " " + (l.last_name || ""))
        .toLowerCase()
        .includes(s),
    );
  }, [q, licencies]);

  const toggleOne = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleChip = (chip) => {
    setSelected((prev) => {
      const n = new Set(prev);
      const allIn = chip.ids.every((id) => n.has(id));
      chip.ids.forEach((id) => (allIn ? n.delete(id) : n.add(id)));
      return n;
    });
  };

  const create = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({
        club_owner_id: clubOwnerId,
        name: name.trim(),
        type: "custom",
        write_mode: writeMode,
        emoji,
        created_by: user?.id,
      })
      .select()
      .single();
    if (!error && conv && selected.size > 0) {
      const rows = [...selected].map((licId) => ({
        conversation_id: conv.id,
        licencie_id: licId,
      }));
      await supabase.from("conversation_participants").insert(rows);
    }
    setSaving(false);
    onCreated();
  };

  const inp = {
    width: "100%",
    padding: "10px 13px",
    background: "#1e293b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9,
    color: "#f1f5f9",
    fontSize: 13.5,
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
  };
  const lbl = {
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    display: "block",
    marginBottom: 6,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#0a0e1a",
          border: "1px solid rgba(34,211,238,0.25)",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>
            Nouveau groupe
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <label style={lbl}>Nom du groupe</label>
        <input
          style={{ ...inp, marginBottom: 12 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : U11 Équipe 1, Tournoi de Pâques, Bureau…"
          autoFocus
        />

        <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Icône</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {GROUP_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    fontSize: 15,
                    cursor: "pointer",
                    background:
                      emoji === e ? accent + "22" : "rgba(255,255,255,0.04)",
                    border:
                      "1px solid " +
                      (emoji === e ? accent + "66" : "rgba(255,255,255,0.08)"),
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label style={lbl}>Qui peut écrire ?</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[
            { v: "open", l: "Tout le monde", I: LockOpen },
            { v: "staff_only", l: "Staff uniquement", I: Lock },
          ].map(({ v, l, I }) => (
            <button
              key={v}
              onClick={() => setWriteMode(v)}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: 9,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                background:
                  writeMode === v ? accent + "1c" : "rgba(255,255,255,0.04)",
                border:
                  "1px solid " +
                  (writeMode === v ? accent + "55" : "rgba(255,255,255,0.08)"),
                color: writeMode === v ? accent : "#94a3b8",
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              <I size={13} /> {l}
            </button>
          ))}
        </div>

        {/* ── Participants ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <label style={{ ...lbl, marginBottom: 0 }}>
            Participants (licenciés)
          </label>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: selected.size ? accent : "#475569",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Users size={12} /> {selected.size} sélectionné
            {selected.size > 1 ? "s" : ""}
          </span>
        </div>

        {/* Chips sélection rapide */}
        {chips.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {chips.map((chip) => {
              const allIn =
                chip.ids.length > 0 && chip.ids.every((id) => selected.has(id));
              return (
                <button
                  key={chip.label}
                  onClick={() => toggleChip(chip)}
                  style={{
                    padding: "5px 11px",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 11.5,
                    fontWeight: 700,
                    background: allIn
                      ? accent + "22"
                      : "rgba(255,255,255,0.04)",
                    border:
                      "1px solid " +
                      (allIn ? accent + "66" : "rgba(255,255,255,0.1)"),
                    color: allIn ? accent : chip.sub ? "#94a3b8" : "#cbd5e1",
                  }}
                >
                  {allIn ? "✓ " : "+ "}
                  {chip.label} ({chip.ids.length})
                </button>
              );
            })}
          </div>
        )}

        {/* Recherche + liste */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 11px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 9,
            marginBottom: 8,
          }}
        >
          <Search size={13} color="#475569" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un licencié…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#f1f5f9",
              fontSize: 12.5,
              fontFamily: "inherit",
            }}
          />
        </div>
        <div
          style={{
            maxHeight: 180,
            overflowY: "auto",
            marginBottom: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
          }}
        >
          {filtered.length === 0 && (
            <div
              style={{
                padding: 14,
                fontSize: 12,
                color: "#475569",
                textAlign: "center",
              }}
            >
              Aucun licencié
            </div>
          )}
          {filtered.map((l) => {
            const on = selected.has(l.id);
            return (
              <div
                key={l.id}
                onClick={() => toggleOne(l.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                  background: on ? accent + "0d" : "transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    width: 17,
                    height: 17,
                    borderRadius: 5,
                    flexShrink: 0,
                    border: "2px solid " + (on ? accent : "#475569"),
                    background: on ? accent : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {on && <Check size={11} color="#060a12" strokeWidth={3.5} />}
                </div>
                <span
                  style={{
                    flex: 1,
                    fontSize: 12.5,
                    color: "#f1f5f9",
                    fontWeight: 600,
                  }}
                >
                  {l.first_name} {l.last_name}
                </span>
                <span style={{ fontSize: 10.5, color: "#64748b" }}>
                  {[l.category, l.team].filter(Boolean).join(" · ")}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 10.5, color: "#475569", marginBottom: 12 }}>
          Le staff du club a toujours accès au groupe. Sans participant
          sélectionné, le groupe est réservé au staff.
        </div>

        <button
          onClick={create}
          disabled={!name.trim() || saving}
          style={{
            width: "100%",
            padding: 12,
            background: name.trim() ? accent : "rgba(163,230,53,0.25)",
            border: "none",
            borderRadius: 10,
            color: "#060a12",
            fontSize: 13.5,
            fontWeight: 800,
            cursor: name.trim() ? "pointer" : "default",
            fontFamily: "inherit",
          }}
        >
          {saving
            ? "Création…"
            : "Créer le groupe" +
              (selected.size
                ? " (" +
                  selected.size +
                  " participant" +
                  (selected.size > 1 ? "s" : "") +
                  ")"
                : "")}
        </button>
      </div>
    </div>
  );
}
