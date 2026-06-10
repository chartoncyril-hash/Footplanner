cat > (src / components / InfoView.jsx) << "INFOEOF";
import React, { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  FileText,
  Phone,
  Mail,
  Navigation,
  Utensils,
  Clock,
  Info,
  ExternalLink,
  X,
} from "lucide-react";

// ============================================================
// InfoView — page "Infos" de la vue spectateur
// Affiche tout ce que l'organisateur a renseigné dans les réglages :
// règlement (texte + PDF), infos pratiques, plan, contact, Maps,
// buvette, horaires clés.
// ============================================================

export function InfoView({ tournament, onBack }) {
  const [mapZoom, setMapZoom] = useState(false);
  const t = tournament || {};

  const hasContact = t.contactPhone || t.contactEmail || t.venueAddress;
  const mapsUrl = t.venueAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.venueAddress)}`
    : t.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.location)}`
      : null;

  return (
    <div style={{ padding: "24px 16px 60px", maxWidth: 600, margin: "0 auto" }}>
      <button onClick={onBack} style={S.back}>
        <ArrowLeft size={15} /> Retour
      </button>

      {/* En-tête */}
      <h1
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: "#f1f5f9",
          marginBottom: 6,
          letterSpacing: -0.5,
        }}
      >
        {t.name || "Tournoi"}
      </h1>
      {t.date && (
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>
          📅{" "}
          {new Date(t.date).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
      {t.location && (
        <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24 }}>
          📍 {t.location}
        </p>
      )}

      {/* Bouton itinéraire */}
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noreferrer" style={S.mapsBtn}>
          <Navigation size={16} /> Y aller (itinéraire)
        </a>
      )}

      {/* Horaires clés */}
      {t.scheduleInfo && (
        <Block icon={Clock} color="#22d3ee" title="Horaires clés">
          <Text value={t.scheduleInfo} />
        </Block>
      )}

      {/* Règlement */}
      {(t.rules || t.rulesPdfUrl) && (
        <Block icon={FileText} color="#a3e635" title="Règlement">
          {t.rules && <Text value={t.rules} />}
          {t.rulesPdfUrl && (
            <a
              href={t.rulesPdfUrl}
              target="_blank"
              rel="noreferrer"
              style={{ ...S.docBtn, marginTop: t.rules ? 12 : 0 }}
            >
              <FileText size={15} /> Ouvrir le règlement (PDF){" "}
              <ExternalLink size={12} />
            </a>
          )}
        </Block>
      )}

      {/* Informations pratiques */}
      {t.practicalInfo && (
        <Block icon={Info} color="#818cf8" title="Informations pratiques">
          <Text value={t.practicalInfo} />
        </Block>
      )}

      {/* Plan du stade */}
      {t.venueMapUrl && (
        <Block icon={MapPin} color="#34d399" title="Plan du site">
          <img
            src={t.venueMapUrl}
            alt="Plan du site"
            onClick={() => setMapZoom(true)}
            style={{
              width: "100%",
              borderRadius: 10,
              cursor: "zoom-in",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
          <div
            style={{
              fontSize: 11,
              color: "#475569",
              marginTop: 6,
              textAlign: "center",
            }}
          >
            Touchez pour agrandir
          </div>
        </Block>
      )}

      {/* Buvette / restauration */}
      {t.foodInfo && (
        <Block icon={Utensils} color="#f59e0b" title="Restauration / buvette">
          <Text value={t.foodInfo} />
        </Block>
      )}

      {/* Contact */}
      {hasContact && (
        <Block icon={Phone} color="#f472b6" title="Contact & accès">
          {t.contactPhone && (
            <a
              href={`tel:${t.contactPhone.replace(/\s/g, "")}`}
              style={S.contactRow}
            >
              <Phone size={15} color="#f472b6" /> {t.contactPhone}
            </a>
          )}
          {t.contactEmail && (
            <a href={`mailto:${t.contactEmail}`} style={S.contactRow}>
              <Mail size={15} color="#f472b6" /> {t.contactEmail}
            </a>
          )}
          {t.venueAddress && (
            <div style={{ ...S.contactRow, cursor: "default" }}>
              <MapPin size={15} color="#f472b6" /> {t.venueAddress}
            </div>
          )}
        </Block>
      )}

      {/* Aucune info */}
      {!t.scheduleInfo &&
        !t.rules &&
        !t.rulesPdfUrl &&
        !t.practicalInfo &&
        !t.venueMapUrl &&
        !t.foodInfo &&
        !hasContact && (
          <div
            style={{
              padding: 24,
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.1)",
              borderRadius: 12,
              textAlign: "center",
              color: "#64748b",
              fontSize: 14,
            }}
          >
            Les informations pratiques de ce tournoi seront bientôt disponibles.
          </div>
        )}

      {/* Footer */}
      <div
        style={{
          padding: "16px",
          marginTop: 24,
          background: "rgba(163,230,53,0.05)",
          border: "1px solid rgba(163,230,53,0.1)",
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>
          Suivi en direct sur{" "}
          <strong style={{ color: "#a3e635" }}>FootPlanner</strong>
        </div>
      </div>

      {/* Lightbox plan */}
      {mapZoom && t.venueMapUrl && (
        <div onClick={() => setMapZoom(false)} style={S.lightbox}>
          <button onClick={() => setMapZoom(false)} style={S.lightboxClose}>
            <X size={20} />
          </button>
          <img
            src={t.venueMapUrl}
            alt="Plan"
            style={{
              maxWidth: "95%",
              maxHeight: "90%",
              borderRadius: 10,
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Sous-composants ──
function Block({ icon: Icon, color, title, children }) {
  return (
    <div
      style={{
        padding: "16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={15} color={color} />
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#94a3b8",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

function Text({ value }) {
  return (
    <div
      style={{
        fontSize: 14,
        color: "#cbd5e1",
        lineHeight: 1.7,
        whiteSpace: "pre-wrap",
      }}
    >
      {value}
    </div>
  );
}

// ── Styles ──
const S = {
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 24,
    fontFamily: "inherit",
  },
  mapsBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "13px",
    background: "rgba(34,211,238,0.1)",
    border: "1px solid rgba(34,211,238,0.3)",
    borderRadius: 12,
    color: "#22d3ee",
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "none",
    marginBottom: 20,
  },
  docBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 16px",
    background: "rgba(163,230,53,0.1)",
    border: "1px solid rgba(163,230,53,0.3)",
    borderRadius: 10,
    color: "#a3e635",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
  },
  contactRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    fontSize: 14,
    color: "#f1f5f9",
    textDecoration: "none",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  lightbox: {
    position: "fixed",
    inset: 0,
    zIndex: 2000,
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  lightboxClose: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
INFOEOF;
