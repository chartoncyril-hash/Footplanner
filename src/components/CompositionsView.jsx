import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

const FORMATS = {
  5: {
    name: "Futsal / 5v5",
    formations: {
      "1-2-1": [
        { x: 200, y: 490, r: "GK" },
        { x: 120, y: 380, r: "DEF" },
        { x: 280, y: 380, r: "DEF" },
        { x: 200, y: 260, r: "MID" },
        { x: 200, y: 150, r: "ATT" },
      ],
      "2-2": [
        { x: 200, y: 490, r: "GK" },
        { x: 130, y: 370, r: "DEF" },
        { x: 270, y: 370, r: "DEF" },
        { x: 130, y: 220, r: "ATT" },
        { x: 270, y: 220, r: "ATT" },
      ],
    },
  },
  8: {
    name: "Foot à 8",
    formations: {
      "3-3-1": [
        { x: 200, y: 500, r: "GK" },
        { x: 100, y: 400, r: "DEF" },
        { x: 200, y: 390, r: "DEF" },
        { x: 300, y: 400, r: "DEF" },
        { x: 100, y: 280, r: "MID" },
        { x: 200, y: 270, r: "MID" },
        { x: 300, y: 280, r: "MID" },
        { x: 200, y: 160, r: "ATT" },
      ],
      "2-3-2": [
        { x: 200, y: 500, r: "GK" },
        { x: 140, y: 410, r: "DEF" },
        { x: 260, y: 410, r: "DEF" },
        { x: 100, y: 295, r: "MID" },
        { x: 200, y: 285, r: "MID" },
        { x: 300, y: 295, r: "MID" },
        { x: 140, y: 175, r: "ATT" },
        { x: 260, y: 175, r: "ATT" },
      ],
      "3-2-2": [
        { x: 200, y: 500, r: "GK" },
        { x: 100, y: 410, r: "DEF" },
        { x: 200, y: 400, r: "DEF" },
        { x: 300, y: 410, r: "DEF" },
        { x: 150, y: 295, r: "MID" },
        { x: 250, y: 295, r: "MID" },
        { x: 140, y: 175, r: "ATT" },
        { x: 260, y: 175, r: "ATT" },
      ],
    },
  },
  11: {
    name: "Foot à 11",
    formations: {
      "4-3-3": [
        { x: 200, y: 510, r: "GK" },
        { x: 80, y: 420, r: "DEF" },
        { x: 150, y: 415, r: "DEF" },
        { x: 250, y: 415, r: "DEF" },
        { x: 320, y: 420, r: "DEF" },
        { x: 110, y: 305, r: "MID" },
        { x: 200, y: 300, r: "MID" },
        { x: 290, y: 305, r: "MID" },
        { x: 100, y: 185, r: "ATT" },
        { x: 200, y: 175, r: "ATT" },
        { x: 300, y: 185, r: "ATT" },
      ],
      "4-4-2": [
        { x: 200, y: 510, r: "GK" },
        { x: 80, y: 420, r: "DEF" },
        { x: 150, y: 415, r: "DEF" },
        { x: 250, y: 415, r: "DEF" },
        { x: 320, y: 420, r: "DEF" },
        { x: 70, y: 310, r: "MID" },
        { x: 150, y: 305, r: "MID" },
        { x: 250, y: 305, r: "MID" },
        { x: 330, y: 310, r: "MID" },
        { x: 150, y: 185, r: "ATT" },
        { x: 250, y: 185, r: "ATT" },
      ],
      "4-2-3-1": [
        { x: 200, y: 510, r: "GK" },
        { x: 80, y: 420, r: "DEF" },
        { x: 150, y: 415, r: "DEF" },
        { x: 250, y: 415, r: "DEF" },
        { x: 320, y: 420, r: "DEF" },
        { x: 150, y: 335, r: "MID" },
        { x: 250, y: 335, r: "MID" },
        { x: 90, y: 235, r: "MID" },
        { x: 200, y: 225, r: "MID" },
        { x: 310, y: 235, r: "MID" },
        { x: 200, y: 155, r: "ATT" },
      ],
      "3-5-2": [
        { x: 200, y: 510, r: "GK" },
        { x: 110, y: 420, r: "DEF" },
        { x: 200, y: 415, r: "DEF" },
        { x: 290, y: 420, r: "DEF" },
        { x: 70, y: 325, r: "MID" },
        { x: 145, y: 310, r: "MID" },
        { x: 200, y: 305, r: "MID" },
        { x: 255, y: 310, r: "MID" },
        { x: 330, y: 325, r: "MID" },
        { x: 150, y: 185, r: "ATT" },
        { x: 250, y: 185, r: "ATT" },
      ],
    },
  },
};

const ROLE_COLORS = {
  GK: "#f59e0b",
  DEF: "#3b82f6",
  MID: "#10b981",
  ATT: "#ef4444",
};

const S = {
  page: { padding: "0 0 60px" },
  title: { fontSize: 22, fontWeight: 900, color: "#f1f5f9", marginBottom: 4 },
  sub: { fontSize: 13, color: "#64748b", marginBottom: 24 },
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
    padding: "8px 16px",
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
function Pitch({ format, formation, players, onMove }) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const slots = FORMATS[format]?.formations[formation] || [];

  function getSVGPoint(e) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const scaleX = vb.width / rect.width;
    const scaleY = vb.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function onMouseDown(e, idx) {
    e.preventDefault();
    const pt = getSVGPoint(e);
    dragRef.current = {
      idx,
      offsetX: pt.x - players[idx].x,
      offsetY: pt.y - players[idx].y,
    };
  }

  function onMouseMove(e) {
    if (!dragRef.current) return;
    const pt = getSVGPoint(e);
    const newPlayers = [...players];
    newPlayers[dragRef.current.idx] = {
      ...newPlayers[dragRef.current.idx],
      x: Math.max(25, Math.min(375, pt.x - dragRef.current.offsetX)),
      y: Math.max(25, Math.min(535, pt.y - dragRef.current.offsetY)),
    };
    onMove(newPlayers);
  }

  function onMouseUp() {
    dragRef.current = null;
  }

  const pitchColor = format === 5 ? "#1a3a5c" : "#2d5a27";
  const lineColor = "rgba(255,255,255,0.4)";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 560"
      style={{
        width: "100%",
        maxWidth: 420,
        display: "block",
        margin: "0 auto",
        borderRadius: 12,
        cursor: "default",
        touchAction: "none",
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={(e) => {
        e.preventDefault();
        onMouseMove(e);
      }}
      onTouchEnd={onMouseUp}
    >
      <rect width="400" height="560" rx="8" fill={pitchColor} />
      {format === 11 && (
        <>
          <rect
            x="10"
            y="10"
            width="380"
            height="540"
            rx="4"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <line
            x1="10"
            y1="280"
            x2="390"
            y2="280"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <circle
            cx="200"
            cy="280"
            r="40"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <circle cx="200" cy="280" r="3" fill={lineColor} />
          <rect
            x="120"
            y="10"
            width="160"
            height="65"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <rect
            x="155"
            y="10"
            width="90"
            height="30"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <rect
            x="120"
            y="485"
            width="160"
            height="65"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <rect
            x="155"
            y="530"
            width="90"
            height="30"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <rect
            x="175"
            y="548"
            width="50"
            height="12"
            rx="2"
            fill="rgba(255,255,255,0.15)"
          />
          <rect
            x="175"
            y="0"
            width="50"
            height="12"
            rx="2"
            fill="rgba(255,255,255,0.15)"
          />
        </>
      )}
      {format === 8 && (
        <>
          <rect
            x="10"
            y="10"
            width="380"
            height="540"
            rx="4"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <line
            x1="10"
            y1="280"
            x2="390"
            y2="280"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <circle
            cx="200"
            cy="280"
            r="35"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <rect
            x="130"
            y="10"
            width="140"
            height="55"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <rect
            x="130"
            y="495"
            width="140"
            height="55"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <rect
            x="175"
            y="548"
            width="50"
            height="12"
            rx="2"
            fill="rgba(255,255,255,0.15)"
          />
          <rect
            x="175"
            y="0"
            width="50"
            height="12"
            rx="2"
            fill="rgba(255,255,255,0.15)"
          />
        </>
      )}
      {format === 5 && (
        <>
          <rect
            x="10"
            y="10"
            width="380"
            height="540"
            rx="4"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <line
            x1="10"
            y1="280"
            x2="390"
            y2="280"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <circle
            cx="200"
            cy="280"
            r="30"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <rect
            x="140"
            y="10"
            width="120"
            height="50"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <rect
            x="140"
            y="500"
            width="120"
            height="50"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
          />
          <circle
            cx="200"
            cy="100"
            r="25"
            fill="none"
            stroke={lineColor}
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <circle
            cx="200"
            cy="460"
            r="25"
            fill="none"
            stroke={lineColor}
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        </>
      )}
      {players.map((p, i) => {
        const color = ROLE_COLORS[slots[i]?.r || "MID"] || "#818cf8";
        return (
          <g
            key={i}
            style={{ cursor: "grab" }}
            onMouseDown={(e) => onMouseDown(e, i)}
            onTouchStart={(e) => {
              e.preventDefault();
              onMouseDown(e, i);
            }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r="22"
              fill={color}
              stroke="white"
              strokeWidth="2"
            />
            {p.photo_url ? (
              <image
                href={p.photo_url}
                x={p.x - 20}
                y={p.y - 20}
                width="40"
                height="40"
                clipPath={`circle(20px at ${p.x}px ${p.y}px)`}
                style={{ borderRadius: "50%" }}
              />
            ) : (
              <text
                x={p.x}
                y={p.y - 3}
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="600"
              >
                {p.initials}
              </text>
            )}
            <rect
              x={p.x - 12}
              y={p.y + 7}
              width="24"
              height="12"
              rx="3"
              fill="rgba(0,0,0,0.5)"
            />
            <text
              x={p.x}
              y={p.y + 17}
              textAnchor="middle"
              fill="white"
              fontSize="8"
            >
              {slots[i]?.r || "MID"}
            </text>
            <text
              x={p.x}
              y={p.y + 36}
              textAnchor="middle"
              fill="white"
              fontSize="9.5"
            >
              {p.short_name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
function CompositionEditor({ licencies, onSave, onCancel, initial }) {
  const [name, setName] = useState(initial?.name || "Composition J1");
  const [format, setFormat] = useState(initial?.format || 11);
  const [formation, setFormation] = useState(initial?.formation || "4-3-3");
  const [selectedIds, setSelectedIds] = useState(
    initial?.players?.map((p) => p.id) || [],
  );
  const [playerPositions, setPlayerPositions] = useState([]);
  const [step, setStep] = useState("select");
  const [filterCat, setFilterCat] = useState("");
  const [filterTeam, setFilterTeam] = useState("");

  const maxPlayers = format;
  const categories = [
    ...new Set(licencies.map((l) => l.category).filter(Boolean)),
  ].sort();
  const teams = [
    ...new Set(licencies.map((l) => l.team).filter(Boolean)),
  ].sort();

  const filteredLicencies = licencies.filter((l) => {
    const matchCat = !filterCat || l.category === filterCat;
    const matchTeam = !filterTeam || l.team === filterTeam;
    return matchCat && matchTeam;
  });

  function togglePlayer(id) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < maxPlayers
          ? [...prev, id]
          : prev,
    );
  }

  function goToPlace() {
    const slots = FORMATS[format]?.formations[formation] || [];
    const selected = licencies.filter((l) => selectedIds.includes(l.id));
    setPlayerPositions(
      selected.map((p, i) => ({
        ...p,
        initials: p.first_name[0] + p.last_name[0],
        short_name: p.last_name.substring(0, 8),
        x: slots[i]?.x || 200,
        y: slots[i]?.y || 280,
      })),
    );
    setStep("place");
  }

  function handleSave() {
    onSave({ name, format, formation, players: playerPositions });
  }

  if (step === "place")
    return (
      <div style={{ ...S.card, border: "1px solid rgba(163,230,53,0.2)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
            {name}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btnGhost} onClick={() => setStep("select")}>
              ← Modifier la sélection
            </button>
            <button style={S.btnPrimary} onClick={handleSave}>
              💾 Sauvegarder
            </button>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {Object.keys(FORMATS[format]?.formations || {}).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFormation(f);
                const slots = FORMATS[format].formations[f];
                setPlayerPositions((prev) =>
                  prev.map((p, i) => ({
                    ...p,
                    x: slots[i]?.x || p.x,
                    y: slots[i]?.y || p.y,
                  })),
                );
              }}
              style={{
                ...S.btnGhost,
                ...(formation === f
                  ? { background: "#a3e635", color: "#060a12", border: "none" }
                  : {}),
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <Pitch
          format={format}
          formation={formation}
          players={playerPositions}
          onMove={setPlayerPositions}
        />
        <div
          style={{
            fontSize: 11,
            color: "#475569",
            textAlign: "center",
            marginTop: 8,
          }}
        >
          Glissez les joueurs pour ajuster leur position
        </div>
      </div>
    );

  return (
    <div style={{ ...S.card, border: "1px solid rgba(163,230,53,0.2)" }}>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#f1f5f9",
          marginBottom: 16,
        }}
      >
        Nouvelle composition
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <label style={S.label}>Nom</label>
          <input
            style={S.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label style={S.label}>Format</label>
          <select
            style={S.input}
            value={format}
            onChange={(e) => {
              setFormat(parseInt(e.target.value));
              setFormation(
                Object.keys(
                  FORMATS[parseInt(e.target.value)]?.formations || {},
                )[0] || "",
              );
            }}
          >
            {Object.entries(FORMATS).map(([k, v]) => (
              <option key={k} value={k} style={{ background: "#1e293b" }}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={S.label}>Formation</label>
          <select
            style={S.input}
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
          >
            {Object.keys(FORMATS[format]?.formations || {}).map((f) => (
              <option key={f} value={f} style={{ background: "#1e293b" }}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
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
            Toutes équipes
          </option>
          {teams.map((t) => (
            <option key={t} value={t} style={{ background: "#1e293b" }}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div
        style={{
          fontSize: 12,
          color: selectedIds.length === maxPlayers ? "#a3e635" : "#64748b",
          marginBottom: 10,
          fontWeight: 600,
        }}
      >
        {selectedIds.length}/{maxPlayers} joueurs sélectionnés
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 8,
          maxHeight: 320,
          overflowY: "auto",
          marginBottom: 16,
        }}
      >
        {filteredLicencies.map((l) => {
          const isSelected = selectedIds.includes(l.id);
          const isDisabled = !isSelected && selectedIds.length >= maxPlayers;
          return (
            <div
              key={l.id}
              onClick={() => !isDisabled && togglePlayer(l.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                background: isSelected
                  ? "rgba(163,230,53,0.12)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${isSelected ? "rgba(163,230,53,0.3)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10,
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.4 : 1,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isSelected
                    ? "rgba(163,230,53,0.2)"
                    : "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: isSelected ? "#a3e635" : "#64748b",
                  flexShrink: 0,
                }}
              >
                {l.first_name[0]}
                {l.last_name[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isSelected ? "#f1f5f9" : "#94a3b8",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {l.first_name} {l.last_name}
                </div>
                <div style={{ fontSize: 10, color: "#475569" }}>
                  {l.category} {l.position && `· ${l.position}`}
                </div>
              </div>
              {isSelected && (
                <span
                  style={{ color: "#a3e635", fontSize: 14, marginLeft: "auto" }}
                >
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          style={S.btnPrimary}
          onClick={goToPlace}
          disabled={selectedIds.length === 0}
        >
          Placer sur le terrain →
        </button>
        <button style={S.btnGhost} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </div>
  );
}
export function CompositionsView() {
  const [compositions, setCompositions] = useState([]);
  const [licencies, setLicencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: comp }, { data: lic }] = await Promise.all([
      supabase
        .from("compositions")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("licencies")
        .select("*")
        .eq("owner_id", user.id)
        .order("last_name"),
    ]);
    setCompositions(comp || []);
    setLicencies(lic || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (data) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("compositions").insert({
      owner_id: user.id,
      name: data.name,
      format: data.format,
      formation: data.formation,
      players: data.players,
    });
    setShowEditor(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette composition ?")) return;
    await supabase.from("compositions").delete().eq("id", id);
    load();
  };

  if (loading)
    return <div style={{ padding: 40, color: "#64748b" }}>Chargement...</div>;

  if (viewing)
    return (
      <div style={S.page}>
        <button
          onClick={() => setViewing(null)}
          style={{ ...S.btnGhost, marginBottom: 20 }}
        >
          ← Retour
        </button>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#f1f5f9",
            marginBottom: 4,
          }}
        >
          {viewing.name}
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          {FORMATS[viewing.format]?.name} · {viewing.formation} ·{" "}
          {viewing.players?.length} joueurs
        </div>
        <Pitch
          format={viewing.format}
          formation={viewing.formation}
          players={viewing.players || []}
          onMove={() => {}}
        />
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}
        >
          {(viewing.players || []).map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background:
                    ROLE_COLORS[
                      FORMATS[viewing.format]?.formations[viewing.formation]?.[
                        i
                      ]?.r || "MID"
                    ],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {p.first_name?.[0]}
                {p.last_name?.[0]}
              </div>
              <span style={{ color: "#f1f5f9" }}>
                {p.first_name} {p.last_name}
              </span>
              <span style={{ color: "#64748b" }}>
                ·{" "}
                {p.position ||
                  FORMATS[viewing.format]?.formations[viewing.formation]?.[i]
                    ?.r}
              </span>
            </div>
          ))}
        </div>
      </div>
    );

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
          <div style={S.title}>Compositions & Tactique</div>
          <div style={S.sub}>Créez et gérez vos compositions d'équipe</div>
        </div>
        <button style={S.btnPrimary} onClick={() => setShowEditor(true)}>
          + Nouvelle composition
        </button>
      </div>

      {showEditor && (
        <CompositionEditor
          licencies={licencies}
          onSave={handleSave}
          onCancel={() => setShowEditor(false)}
        />
      )}

      {compositions.length === 0 && !showEditor && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#475569",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
            Aucune composition
          </div>
          <div style={{ fontSize: 13 }}>
            Créez votre première composition d'équipe
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {compositions.map((c) => (
          <div key={c.id} style={S.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#f1f5f9",
                    marginBottom: 4,
                  }}
                >
                  {c.name}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {FORMATS[c.format]?.name} · {c.formation} ·{" "}
                  {c.players?.length} joueurs
                </div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>
                  {new Date(c.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={S.btnGhost} onClick={() => setViewing(c)}>
                  👁️
                </button>
                <button style={S.btnDanger} onClick={() => handleDelete(c.id)}>
                  🗑️
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {(c.players || []).slice(0, 6).map((p, i) => (
                <div
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(163,230,53,0.15)",
                    border: "1px solid rgba(163,230,53,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#a3e635",
                  }}
                >
                  {p.first_name?.[0]}
                  {p.last_name?.[0]}
                </div>
              ))}
              {(c.players?.length || 0) > 6 && (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: "#64748b",
                  }}
                >
                  +{c.players.length - 6}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
