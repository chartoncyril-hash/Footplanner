import React, { useState, useMemo } from "react";
import { X, Search, Check } from "lucide-react";
import { useFffSearch } from "../hooks/useFffSearch";

// Normalise une chaîne pour la recherche : minuscules + sans accents
function normalize(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ============================================================
// TeamsLibraryPicker — sélecteur d'équipes à 2 onglets
//   • Mes clubs   : bibliothèque persistante (avec compteur 1/2/3)
//   • Base nationale : recherche dans les clubs nationaux
//     → ajout = enregistré en bibliothèque ET engagé dans le tournoi
// ============================================================
export function TeamsLibraryPicker(props) {
  const teamsLibrary = props.teamsLibrary || [];
  const teamsInCategory = props.teamsInCategory || [];
  const activeCategory = props.activeCategory;
  const onClose = props.onClose;
  const onConfirm = props.onConfirm; // (imports[]) => Promise — engage des équipes de la biblio
  const onAddNationalClub = props.onAddNationalClub; // (club) => Promise<libraryId> — ajoute à la biblio + renvoie l'id

  const [tab, setTab] = useState("library"); // 'library' | 'national'
  const [query, setQuery] = useState("");
  const [selections, setSelections] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [addingClubId, setAddingClubId] = useState(null);
  const [addedClubIds, setAddedClubIds] = useState([]);

  // Recherche nationale (activée uniquement quand l'onglet est ouvert)
  const fff = useFffSearch({ enabled: tab === "national" });

  // Rangs déjà pris par club dans la catégorie active
  const ranksInCategory = useMemo(() => {
    const map = {};
    teamsInCategory.forEach((t) => {
      const key = normalize(t.name);
      if (!map[key]) map[key] = [];
      if (t.level) map[key].push(t.level);
    });
    return map;
  }, [teamsInCategory]);

  // Filtre la bibliothèque
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return teamsLibrary;
    return teamsLibrary.filter((t) => normalize(t.name).includes(q));
  }, [query, teamsLibrary]);

  const totalSelected = Object.values(selections).reduce((s, n) => s + n, 0);

  const updateCount = (libId, delta) => {
    setSelections((prev) => {
      const current = prev[libId] || 0;
      const next = Math.max(0, Math.min(3, current + delta));
      const newMap = { ...prev };
      if (next === 0) delete newMap[libId];
      else newMap[libId] = next;
      return newMap;
    });
  };

  const setCount = (libId, value) => {
    const n = Math.max(0, Math.min(3, parseInt(value, 10) || 0));
    setSelections((prev) => {
      const newMap = { ...prev };
      if (n === 0) delete newMap[libId];
      else newMap[libId] = n;
      return newMap;
    });
  };

  const handleConfirm = async () => {
    if (totalSelected === 0 || submitting) return;
    setSubmitting(true);
    try {
      const imports = [];
      Object.entries(selections).forEach(([libId, count]) => {
        const lib = teamsLibrary.find((t) => (t.libraryId || t.id) === libId);
        if (!lib) return;
        const existingRanks = ranksInCategory[normalize(lib.name)] || [];
        let rank = 1;
        for (let i = 0; i < count; i++) {
          while (existingRanks.includes(rank)) rank++;
          if (rank > 3) break;
          imports.push({
            libraryId: lib.libraryId || lib.id,
            libraryItem: lib,
            level: rank,
          });
          existingRanks.push(rank);
          rank++;
        }
      });
      await onConfirm(imports);
      setSubmitting(false);
    } catch (e) {
      console.error("Library picker confirm failed", e);
      setSubmitting(false);
    }
  };

  // Ajout d'un club national : enregistré en biblio + engagé immédiatement
  const handleAddNational = async (club) => {
    if (addingClubId || !onAddNationalClub) return;
    setAddingClubId(club.cl_no);
    try {
      await onAddNationalClub(club);
      setAddedClubIds((prev) => [...prev, club.cl_no]);
    } catch (e) {
      console.error("Ajout club national échoué", e);
    } finally {
      setAddingClubId(null);
    }
  };

  const inputBase = {
    width: "100%",
    padding: "9px 12px",
    background: "#1e293b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#f1f5f9",
    fontSize: 12,
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const tabBtn = (active, color) => ({
    flex: 1,
    padding: "10px",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: active ? `${color}26` : "transparent",
    border: active
      ? `1px solid ${color}66`
      : "1px solid rgba(255,255,255,0.05)",
    color: active ? color : "#64748b",
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          background: "#0a0e1a",
          border: "1px solid rgba(34,211,238,0.25)",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#f1f5f9",
                letterSpacing: 1,
              }}
            >
              AJOUTER DES ÉQUIPES{activeCategory ? " — " + activeCategory : ""}
            </div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
              Depuis vos clubs enregistrés ou la base nationale.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 6,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 7,
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Onglets */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button
            onClick={() => setTab("library")}
            style={tabBtn(tab === "library", "#22d3ee")}
          >
            📋 MES CLUBS ({teamsLibrary.length})
          </button>
          <button
            onClick={() => setTab("national")}
            style={tabBtn(tab === "national", "#a3e635")}
          >
            🏆 BASE NATIONALE
          </button>
        </div>

        {/* ───────────── ONGLET MES CLUBS ───────────── */}
        {tab === "library" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                marginBottom: 12,
                background: "#0f172a",
                border: "1px solid rgba(34,211,238,0.25)",
                borderRadius: 8,
              }}
            >
              <Search size={14} color="#64748b" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher dans mes clubs..."
                autoFocus
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "#f1f5f9",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                marginBottom: 12,
                minHeight: 200,
              }}
            >
              {filtered.length === 0 && (
                <div
                  style={{
                    padding: 24,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px dashed rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: 12,
                  }}
                >
                  {teamsLibrary.length === 0
                    ? "Aucun club enregistré. Ajoutez-en depuis la base nationale (onglet à droite)."
                    : "Aucun club ne correspond à la recherche."}
                </div>
              )}
              {filtered.map((lib) => {
                const libId = lib.libraryId || lib.id;
                const count = selections[libId] || 0;
                const existingRanks =
                  ranksInCategory[normalize(lib.name)] || [];
                const alreadyInCategory = existingRanks.length > 0;
                return (
                  <div
                    key={libId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      marginBottom: 4,
                      background:
                        count > 0 ? "rgba(34,211,238,0.06)" : "transparent",
                      border:
                        count > 0
                          ? "1px solid rgba(34,211,238,0.25)"
                          : "1px solid rgba(255,255,255,0.04)",
                      borderRadius: 8,
                      opacity: alreadyInCategory && count === 0 ? 0.6 : 1,
                    }}
                  >
                    {lib.logo ? (
                      <img
                        src={lib.logo}
                        alt=""
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          objectFit: "contain",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 4,
                          background: lib.color || "#a3e635",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#f1f5f9",
                        }}
                      >
                        {lib.name}
                      </div>
                      {alreadyInCategory && (
                        <div
                          style={{
                            fontSize: 9,
                            color: "#fb923c",
                            marginTop: 2,
                          }}
                        >
                          Déjà engagée :{" "}
                          {existingRanks.map((r) => "Équipe " + r).join(", ")}
                        </div>
                      )}
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <button
                        onClick={() => updateCount(libId, -1)}
                        disabled={count === 0}
                        style={{
                          width: 26,
                          height: 26,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6,
                          color: count === 0 ? "#475569" : "#94a3b8",
                          fontSize: 14,
                          fontWeight: 800,
                          cursor: count === 0 ? "not-allowed" : "pointer",
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={count}
                        onChange={(e) => setCount(libId, e.target.value)}
                        style={{
                          width: 36,
                          height: 26,
                          background: "#0f172a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6,
                          color: "#f1f5f9",
                          fontSize: 12,
                          fontWeight: 700,
                          textAlign: "center",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => updateCount(libId, 1)}
                        style={{
                          width: 26,
                          height: 26,
                          background: "rgba(34,211,238,0.15)",
                          border: "1px solid rgba(34,211,238,0.4)",
                          borderRadius: 6,
                          color: "#a3e635",
                          fontSize: 14,
                          fontWeight: 800,
                          cursor: "pointer",
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#94a3b8",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  cursor: "pointer",
                }}
              >
                ANNULER
              </button>
              <div style={{ flex: 1 }} />
              <button
                onClick={handleConfirm}
                disabled={totalSelected === 0 || submitting}
                style={{
                  padding: "10px 22px",
                  background:
                    totalSelected === 0 || submitting
                      ? "rgba(34,211,238,0.3)"
                      : "#a3e635",
                  border: "none",
                  borderRadius: 8,
                  color: "#0a0e1a",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  cursor:
                    totalSelected === 0 || submitting
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Check size={13} />
                {submitting
                  ? "AJOUT..."
                  : totalSelected === 0
                    ? "AJOUTER"
                    : "AJOUTER " +
                      totalSelected +
                      " ÉQUIPE" +
                      (totalSelected > 1 ? "S" : "")}
              </button>
            </div>
          </>
        )}

        {/* ───────────── ONGLET BASE NATIONALE ───────────── */}
        {tab === "national" && (
          <>
            <input
              style={{ ...inputBase, marginBottom: 8 }}
              placeholder="🔍 Rechercher un club (ex: US Feillens, Bourg...)"
              value={fff.search}
              onChange={(e) => fff.setSearch(e.target.value)}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  list="picker-districts"
                  style={inputBase}
                  placeholder="🗺️ District..."
                  value={fff.district}
                  onChange={(e) => fff.setDistrict(e.target.value)}
                />
                <datalist id="picker-districts">
                  {fff.districts.map((d) => (
                    <option key={d.district_short} value={d.district_short} />
                  ))}
                </datalist>
                {fff.district && (
                  <button
                    onClick={() => fff.setDistrict("")}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  list="picker-cities"
                  style={inputBase}
                  placeholder="🏙️ Ville..."
                  value={fff.city}
                  onChange={(e) => fff.setCity(e.target.value)}
                />
                <datalist id="picker-cities">
                  {fff.cities.map((c) => (
                    <option key={c.city} value={c.city} />
                  ))}
                </datalist>
                {fff.city && (
                  <button
                    onClick={() => fff.setCity("")}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                marginBottom: 12,
                minHeight: 200,
              }}
            >
              {fff.loading && (
                <div style={{ color: "#64748b", fontSize: 13, padding: 8 }}>
                  Recherche...
                </div>
              )}
              {!fff.loading &&
                fff.results.length === 0 &&
                (fff.search.length >= 2 || fff.district || fff.city) && (
                  <div style={{ color: "#475569", fontSize: 13, padding: 8 }}>
                    Aucun club trouvé
                  </div>
                )}
              {!fff.search && !fff.district && !fff.city && (
                <div
                  style={{
                    color: "#475569",
                    fontSize: 13,
                    padding: "20px 8px",
                    textAlign: "center",
                  }}
                >
                  Sélectionnez un district, une ville ou tapez le nom d'un club
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {fff.results.map((club) => {
                  const isInLib = teamsLibrary.some(
                    (t) =>
                      t &&
                      (t.fffClNo === club.cl_no || t.fff_cl_no === club.cl_no),
                  );
                  const justAdded = addedClubIds.includes(club.cl_no);
                  const isAdding = addingClubId === club.cl_no;
                  const done = isInLib || justAdded;
                  return (
                    <div
                      key={club.cl_no}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 10,
                      }}
                    >
                      {club.logo_url ? (
                        <img
                          src={club.logo_url}
                          alt=""
                          style={{
                            width: 36,
                            height: 36,
                            objectFit: "contain",
                            borderRadius: 6,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 6,
                            background: "rgba(163,230,53,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                          }}
                        >
                          ⚽
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#f1f5f9",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {club.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#475569" }}>
                          {club.location}{" "}
                          {club.postal_code ? "(" + club.postal_code + ")" : ""}{" "}
                          · {club.district_short}
                        </div>
                      </div>
                      {done ? (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#34d399",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Check size={12} /> Engagé
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddNational(club)}
                          disabled={isAdding}
                          style={{
                            padding: "6px 12px",
                            background: "rgba(163,230,53,0.1)",
                            border: "1px solid rgba(163,230,53,0.2)",
                            borderRadius: 8,
                            color: "#a3e635",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isAdding ? "wait" : "pointer",
                          }}
                        >
                          {isAdding ? "⏳" : "+ Engager"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer national */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#94a3b8",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  cursor: "pointer",
                }}
              >
                FERMER
              </button>
              <div style={{ flex: 1 }} />
              {addedClubIds.length > 0 && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#34d399",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Check size={13} /> {addedClubIds.length} club
                  {addedClubIds.length > 1 ? "s" : ""} engagé
                  {addedClubIds.length > 1 ? "s" : ""}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
