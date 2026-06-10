cat > (src / components / TournamentFileUpload.jsx) << "TFUEOF";
import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  ExternalLink,
} from "lucide-react";
import { supabase } from "../lib/supabase";

// ============================================================
// TournamentFileUpload — drag & drop d'un fichier (PDF ou image)
// vers le bucket Supabase 'tournament-docs'.
//   props:
//     - tournamentId : pour nommer le fichier
//     - kind : 'pdf' | 'image'
//     - currentUrl : URL déjà uploadée (affichage + suppression)
//     - onUploaded(url) : callback avec la nouvelle URL (ou null si retiré)
//     - label : libellé affiché
// ============================================================
export function TournamentFileUpload({
  tournamentId,
  kind,
  currentUrl,
  onUploaded,
  label,
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const accept = kind === "pdf" ? "application/pdf" : "image/*";
  const Icon = kind === "pdf" ? FileText : ImageIcon;

  const doUpload = async (file) => {
    setError("");
    if (!file) return;
    // Validation type
    if (kind === "pdf" && file.type !== "application/pdf") {
      setError("Fichier PDF attendu");
      return;
    }
    if (kind === "image" && !file.type.startsWith("image/")) {
      setError("Image attendue");
      return;
    }
    // Limite 10 Mo
    if (file.size > 10 * 1024 * 1024) {
      setError("Fichier trop lourd (max 10 Mo)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      const path = `${tournamentId}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("tournament-docs")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage
        .from("tournament-docs")
        .getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch (e) {
      setError(e.message || "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#94a3b8",
            marginBottom: 8,
          }}
        >
          {label}
        </div>
      )}

      {currentUrl ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            background: "rgba(163,230,53,0.06)",
            border: "1px solid rgba(163,230,53,0.25)",
            borderRadius: 10,
          }}
        >
          {kind === "image" ? (
            <img
              src={currentUrl}
              alt=""
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: "rgba(163,230,53,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={22} color="#a3e635" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
              {kind === "pdf" ? "Document PDF" : "Image"} ajouté
              {kind === "image" ? "e" : ""}
            </div>
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 11,
                color: "#a3e635",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <ExternalLink size={10} /> Aperçu
            </a>
          </div>
          <button
            onClick={() => onUploaded(null)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(251,113,133,0.12)",
              border: "1px solid rgba(251,113,133,0.3)",
              color: "#fb7185",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "24px 16px",
            borderRadius: 12,
            cursor: "pointer",
            background: dragging
              ? "rgba(34,211,238,0.08)"
              : "rgba(255,255,255,0.02)",
            border: `2px dashed ${dragging ? "#22d3ee" : "rgba(255,255,255,0.12)"}`,
            transition: "all 0.15s",
            textAlign: "center",
          }}
        >
          {uploading ? (
            <div style={{ fontSize: 13, color: "#22d3ee", fontWeight: 700 }}>
              Envoi en cours…
            </div>
          ) : (
            <>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(34,211,238,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Upload size={20} color="#22d3ee" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>
                Glissez votre {kind === "pdf" ? "PDF" : "image"} ici
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                ou cliquez pour parcourir · max 10 Mo
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            hidden
            onChange={(e) => doUpload(e.target.files?.[0])}
          />
        </div>
      )}

      {error && (
        <div style={{ fontSize: 11, color: "#fb7185", marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  );
}
TFUEOF;
