import React, { useState, useMemo, useEffect } from "react";
import { CheckCircle, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../lib/supabase";

const JERSEY_COLORS = [
  { label: "Rouge", value: "#e63946" },
  { label: "Bleu", value: "#2196f3" },
  { label: "Vert", value: "#4caf50" },
  { label: "Jaune", value: "#f9c74f" },
  { label: "Orange", value: "#ff9800" },
  { label: "Violet", value: "#9c27b0" },
  { label: "Noir", value: "#1a1a2e" },
  { label: "Blanc", value: "#f1f5f9" },
  { label: "Rose", value: "#e91e8c" },
  { label: "Cyan", value: "#a3e635" },
];

function RegistrationCard({
  reg,
  team,
  arrived,
  fee,
  onMarkPaid,
  onToggleArrived,
  onUpdateReg,
}) {
  const [expanded, setExpanded] = useState(false);
  const [jerseyColor, setJerseyColor] = useState(reg.jersey_color || null);
  const [saving, setSaving] = useState(false);
  const [localCoach, setLocalCoach] = useState(reg.contact_name || "");
  const [localPhone, setLocalPhone] = useState(reg.contact_phone || "");
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ first_name: '', last_name: '', birth_date: '', license_number: '', category: '', level: '' });
  const [addingPlayer, setAddingPlayer] = useState(null);
  const [savingPlayer, setSavingPlayer] = useState(false);

  async function handleAddPlayer() {
    if (!newPlayer.first_name.trim() || !newPlayer.last_name.trim()) return;
    setSavingPlayer(true);
    const { data } = await supabase.from('players').insert({
      registration_id: reg.id,
      tournament_id: reg.tournament_id,
      first_name: newPlayer.first_name.trim(),
      last_name: newPlayer.last_name.trim(),
      birth_date: newPlayer.birth_date || null,
      license_number: newPlayer.license_number.trim() || null,
      category: newPlayer.category || null,
      level: newPlayer.level ? parseInt(newPlayer.level) : null,
    }).select();
    if (data?.[0]) setPlayers(prev => [...prev, data[0]]);
    setNewPlayer({ first_name: '', last_name: '', birth_date: '', license_number: '', category: '', level: '' });
    setAddingPlayer(false);
    setSavingPlayer(false);
  }
  useEffect(() => {
    if (!expanded || players.length > 0) return;
    setLoadingPlayers(true);
    supabase.from("players").select("*").eq("registration_id", reg.id).order("category").order("level").order("last_name")
      .then(({ data }) => { setPlayers(data || []); setLoadingPlayers(false); });
  }, [expanded]);

  async function handleJerseyColor(value) {
    setJerseyColor(value);
    await supabase
      .from("registrations")
      .update({ jersey_color: value })
      .eq("id", reg.id);
    onUpdateReg(reg.id, { jersey_color: value });
  }

  async function saveCoach() {
    setSaving(true);
    await supabase
      .from("registrations")
      .update({ contact_name: localCoach, contact_phone: localPhone })
      .eq("id", reg.id);
    onUpdateReg(reg.id, {
      contact_name: localCoach,
      contact_phone: localPhone,
    });
    setSaving(false);
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        marginBottom: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "48px 1fr 100px 110px 150px 180px 120px 110px",
          alignItems: "center",
          padding: "12px 8px",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={onToggleArrived}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
            }}
          >
            {arrived ? (
              <CheckCircle size={24} color="#34d399" />
            ) : (
              <Circle size={24} color="#334155" strokeWidth={1.5} />
            )}
          </button>
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>
          {reg.team_name || reg.contact_name}
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>
          {team ? team.category : reg.category || "—"}
        </div>
        <div>
          {team ? (
            <span
              style={{
                fontSize: 12,
                padding: "3px 10px",
                borderRadius: 20,
                fontWeight: 600,
                background:
                  team.level === 1
                    ? "rgba(34,211,238,0.1)"
                    : "rgba(255,255,255,0.05)",
                color: team.level === 1 ? "#a3e635" : "#94a3b8",
                border:
                  team.level === 1
                    ? "1px solid rgba(34,211,238,0.2)"
                    : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Équipe {team.level}
            </span>
          ) : (
            <span style={{ color: "#334155" }}>—</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: jerseyColor || "#1e293b",
              border: "2px solid rgba(255,255,255,0.15)",
            }}
          />
          <span
            style={{ fontSize: 13, color: jerseyColor ? "#f1f5f9" : "#475569" }}
          >
            {jerseyColor
              ? JERSEY_COLORS.find((c) => c.value === jerseyColor)?.label ||
                "Autre"
              : "Non défini"}
          </span>
        </div>
        <div>
          {(reg.status === "payment_pending" || reg.status === "approved") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {fee > 0 && (
                <div
                  style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}
                >
                  💰 {fee}€ dû
                </div>
              )}
              <button
                onClick={onMarkPaid}
                style={{
                  fontSize: 12,
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #34d399, #059669)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ✓ Marquer payé
              </button>
            </div>
          )}
          {reg.status === "paid" && (
            <span style={{ fontSize: 13, color: "#34d399", fontWeight: 700 }}>
              ✓ Payé
            </span>
          )}
        </div>
        <div>
          <span
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 20,
              fontWeight: 600,
              background: arrived
                ? "rgba(16,185,129,0.12)"
                : "rgba(245,158,11,0.1)",
              color: arrived ? "#34d399" : "#f59e0b",
              border: arrived
                ? "1px solid rgba(16,185,129,0.25)"
                : "1px solid rgba(245,158,11,0.2)",
            }}
          >
            {arrived ? "✓ Arrivée" : "Attendue"}
          </span>
        </div>
        <div>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              cursor: "pointer",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {expanded ? (
              <>
                <ChevronUp size={13} />
                Fermer
              </>
            ) : (
              <>
                <ChevronDown size={13} />
                Détails
              </>
            )}
          </button>
        </div>
      </div>
      {expanded && (
        <div
          style={{
            padding: "20px 24px",
            background: "#0d1829",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-end",
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div style={{ flex: 1, minWidth: 180 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#475569",
                  marginBottom: 6,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Coach / Responsable
              </div>
              <input
                value={localCoach}
                onChange={(e) => setLocalCoach(e.target.value)}
                placeholder="Nom du responsable"
                style={{
                  width: "100%",
                  fontSize: 13,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#f1f5f9",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#475569",
                  marginBottom: 6,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Téléphone
              </div>
              <input
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
                placeholder="06 xx xx xx xx"
                style={{
                  width: "100%",
                  fontSize: 13,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#f1f5f9",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              onClick={saveCoach}
              disabled={saving}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "1px solid rgba(34,211,238,0.3)",
                background: "rgba(34,211,238,0.08)",
                color: "#a3e635",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {saving ? "..." : "Enregistrer"}
            </button>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#475569",
                marginBottom: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Couleur du maillot
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {JERSEY_COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => handleJerseyColor(c.value)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: c.value,
                    border: "none",
                    cursor: "pointer",
                    outline:
                      jerseyColor === c.value
                        ? "3px solid white"
                        : "3px solid transparent",
                    outlineOffset: 3,
                  }}
                />
              ))}
            </div>
          </div>
          {reg.contact_email && (
            <div style={{ marginTop: 16, fontSize: 13, color: "#475569" }}>
              ✉️ {reg.contact_email}
            </div>
          )}
          {reg.message && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#475569", fontStyle: "italic" }}>
              "{reg.message}"
            </div>
          )}
          <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Joueurs {players.length > 0 ? '(' + players.length + ')' : ''}
            </div>
            {loadingPlayers && <div style={{ fontSize: 12, color: '#475569' }}>Chargement...</div>}
            {!loadingPlayers && (() => {
              const teamsList = reg.teams_list && reg.teams_list.length > 0
                ? reg.teams_list
                : [{ category: reg.category || '', level: null }];
              return teamsList.map((t, ti) => {
                const teamKey = (t.category || '') + '_' + (t.level || '');
                const teamPlayers = players.filter(p => p.category === t.category && p.level === t.level);
                const isAddingHere = addingPlayer === teamKey;
                return (
                  <div key={ti} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#a3e635', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.category} {t.level ? 'Équipe ' + t.level : ''}
                      <span style={{ fontSize: 11, color: '#475569', fontWeight: 400 }}>{teamPlayers.length} joueur{teamPlayers.length > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                      {teamPlayers.map((p, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{p.first_name} {p.last_name}</div>
                          <div style={{ fontSize: 11, color: '#475569' }}>
                            {p.birth_date && <span style={{ marginRight: 8 }}>🎂 {new Date(p.birth_date).toLocaleDateString('fr-FR')}</span>}
                            {p.license_number && <span>🪪 {p.license_number}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {isAddingHere ? (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <input value={newPlayer.first_name} onChange={e => setNewPlayer(p => ({...p, first_name: e.target.value}))} placeholder="Prénom *" style={{ fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9' }} />
                          <input value={newPlayer.last_name} onChange={e => setNewPlayer(p => ({...p, last_name: e.target.value}))} placeholder="Nom *" style={{ fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          <input type="date" value={newPlayer.birth_date} onChange={e => setNewPlayer(p => ({...p, birth_date: e.target.value}))} style={{ fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9' }} />
                          <input value={newPlayer.license_number} onChange={e => setNewPlayer(p => ({...p, license_number: e.target.value}))} placeholder="N° licence" style={{ fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={async () => {
                            if (!newPlayer.first_name.trim() || !newPlayer.last_name.trim()) return;
                            setSavingPlayer(true);
                            const { data } = await supabase.from('players').insert({
                              registration_id: reg.id,
                              tournament_id: reg.tournament_id,
                              first_name: newPlayer.first_name.trim(),
                              last_name: newPlayer.last_name.trim(),
                              birth_date: newPlayer.birth_date || null,
                              license_number: newPlayer.license_number.trim() || null,
                              category: t.category || null,
                              level: t.level || null,
                            }).select();
                            if (data?.[0]) setPlayers(prev => [...prev, data[0]]);
                            setNewPlayer({ first_name: '', last_name: '', birth_date: '', license_number: '' });
                            setAddingPlayer(null);
                            setSavingPlayer(false);
                          }} disabled={savingPlayer} style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #34d399, #059669)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                            {savingPlayer ? '...' : 'Ajouter'}
                          </button>
                          <button onClick={() => setAddingPlayer(null)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingPlayer(teamKey); setNewPlayer({ first_name: '', last_name: '', birth_date: '', license_number: '' }); }} style={{ width: '100%', padding: '6px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, color: '#475569', cursor: 'pointer', fontSize: 12 }}>
                        + Joueur
                      </button>
                    )}
                  </div>
                );
              });
            })()}
          </div>

        </div>
      )}
    </div>
  );
}
export function CheckInView({ tournament }) {
  const [registrations, setRegistrations] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    setRegistrations([]);
    setActiveCategory(null);
    if (!tournament || !tournament.id) return;
    supabase
      .from("registrations")
      .select("*")
      .eq("tournament_id", tournament.id)
      .then(({ data }) => setRegistrations(data || []));
  }, [tournament && tournament.id]);

  const categories = useMemo(() => {
    const cats = registrations
      .flatMap((r) => {
        const tl = r.teams_list || [];
        return tl.length > 0 ? tl.map((t) => t.category) : [r.category];
      })
      .filter(Boolean);
    return [...new Set(cats)].sort();
  }, [registrations]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory)
      setActiveCategory(categories[0]);
  }, [categories]);

  const validRegs = registrations.filter(
    (r) => r.status !== "rejected" && r.status !== "pending",
  );

  const filteredRegs = validRegs.filter((r) => {
    if (!activeCategory) return true;
    const tl = r.teams_list || [];
    return tl.length > 0
      ? tl.some((t) => t.category === activeCategory)
      : r.category === activeCategory;
  });

  const fee = tournament?.registrationFee || tournament?.registration_fee || 0;

  const rows = [];
  filteredRegs.forEach((reg) => {
    const tl = (reg.teams_list || []).filter(
      (t) => !activeCategory || t.category === activeCategory,
    );
    if (tl.length > 0) {
      tl.forEach((t) => {
        const key = t.category + "_" + t.level;
        const at = reg.arrived_teams || [];
        rows.push({ reg, team: t, key, arrived: at.includes(key) });
      });
    } else {
      const at = reg.arrived_teams || [];
      rows.push({
        reg,
        team: null,
        key: "default",
        arrived: at.includes("default"),
      });
    }
  });

  const totalArrived = rows.filter((r) => r.arrived).length;
  const totalUnpaid = filteredRegs.filter(
    (r) => r.status === "payment_pending" || r.status === "approved",
  ).length;

  function handleUpdateReg(id, patch) {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }
  return (
    <div style={{ padding: "24px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <h2
          style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0 }}
        >
          Table de marque — Accueil
        </h2>
        <span style={{ fontSize: 13, color: "#475569" }}>
          {tournament?.name}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 16,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Équipes arrivées
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#34d399" }}>
            {totalArrived} / {rows.length}
          </div>
        </div>
        <div
          style={{
            background:
              totalUnpaid > 0
                ? "rgba(245,158,11,0.08)"
                : "rgba(255,255,255,0.03)",
            border:
              totalUnpaid > 0
                ? "1px solid rgba(245,158,11,0.2)"
                : "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Paiements en attente
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: totalUnpaid > 0 ? "#f59e0b" : "#475569",
            }}
          >
            {totalUnpaid}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {activeCategory || "Catégorie"}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#f1f5f9" }}>
            {rows.length} équipes
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 28,
            flexWrap: "wrap",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            paddingBottom: 20,
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 24px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                fontFamily: "inherit",
                background:
                  activeCategory === cat ? "#a3e635" : "rgba(255,255,255,0.05)",
                color: activeCategory === cat ? "#060a12" : "#94a3b8",
                boxShadow:
                  activeCategory === cat
                    ? "0 2px 12px rgba(34,211,238,0.3)"
                    : "none",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{activeCategory}</span>
              <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #334155', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>✓</span> non arrivée
                <span style={{ marginLeft: 8, width: 14, height: 14, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '1.5px solid #34d399', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#34d399' }}>✓</span> présente
              </span>
            </div>
            <span
              style={{
                fontSize: 13,
                color: "#34d399",
                fontWeight: 600,
                background: "rgba(16,185,129,0.1)",
                padding: "4px 12px",
                borderRadius: 20,
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              {totalArrived} / {rows.length} arrivées
            </span>
          </div>
          <div
            style={{
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "8px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "48px 1fr 120px 140px 180px 200px 140px 120px",
                padding: "8px 8px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                marginBottom: 4,
              }}
            >
              {[
                "",
                "Club",
                "Catégorie",
                "Niveau",
                "Maillot",
                "Paiement",
                "Statut",
                "",
              ].map((h, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            {rows.map(({ reg, team, key, arrived }) => (
              <RegistrationCard
                key={reg.id + "_" + key}
                reg={reg}
                team={team}
                arrived={arrived}
                fee={fee}
                onUpdateReg={handleUpdateReg}
                onToggleArrived={async () => {
                  const current = reg.arrived_teams || [];
                  const newArr = arrived
                    ? current.filter((k) => k !== key)
                    : [...current, key];
                  await supabase
                    .from("registrations")
                    .update({ arrived_teams: newArr })
                    .eq("id", reg.id);
                  setRegistrations((prev) =>
                    prev.map((r) =>
                      r.id === reg.id ? { ...r, arrived_teams: newArr } : r,
                    ),
                  );
                }}
                onMarkPaid={async () => {
                  await supabase
                    .from("registrations")
                    .update({
                      status: "paid",
                      reviewed_at: new Date().toISOString(),
                    })
                    .eq("id", reg.id);
                  setRegistrations((prev) =>
                    prev.map((r) =>
                      r.id === reg.id ? { ...r, status: "paid" } : r,
                    ),
                  );
                }}
              />
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "#334155",
            padding: "60px 0",
            fontSize: 15,
          }}
        >
          Aucune inscription validée pour cette catégorie.
        </div>
      )}
    </div>
  );
}
