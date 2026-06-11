import React, { useState } from "react";
import { Mail, X, Send, Check } from "lucide-react";
import { supabase } from "../lib/supabase";

// ============================================================
// ContactWidget — bouton flottant "Nous contacter" (bas droite)
// Ouvre un panneau motif + message, envoyé par email via
// l'Edge Function send-contact-message (Resend).
// ============================================================

const MOTIFS = [
  "Question",
  "Bug / problème technique",
  "Suggestion",
  "Facturation",
  "Autre",
];

export function ContactWidget({ user, profile }) {
  const [open, setOpen] = useState(false);
  const [motif, setMotif] = useState("Question");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "send-contact-message",
        {
          body: {
            motif,
            message: message.trim(),
            fromEmail: user?.email || "",
            clubName: profile?.club_name || "",
          },
        },
      );
      if (fnError || (data && data.error)) throw new Error("Envoi impossible");
      setSent(true);
      setMessage("");
      setTimeout(() => {
        setSent(false);
        setOpen(false);
      }, 2500);
    } catch (e) {
      setError(
        "L'envoi a échoué. Réessayez ou écrivez à contact@footplanner.fr",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(!open)}
        title="Nous contacter"
        style={{
          position: "fixed",
          bottom: 22,
          right: 22,
          zIndex: 900,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: open ? "rgba(255,255,255,0.08)" : "#a3e635",
          border: open ? "1px solid rgba(255,255,255,0.15)" : "none",
          color: open ? "#f1f5f9" : "#060a12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
          transition: "all 0.2s",
        }}
      >
        {open ? <X size={22} /> : <Mail size={22} />}
      </button>

      {/* Panneau */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 86,
            right: 22,
            zIndex: 900,
            width: "min(360px, calc(100vw - 44px))",
            background: "#0a0e1a",
            border: "1px solid rgba(34,211,238,0.25)",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#f1f5f9",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Nous contacter
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
            Une question, un bug, une idée ? On vous répond par email.
          </div>

          {sent ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 14px",
                background: "rgba(52,211,153,0.08)",
                border: "1px solid rgba(52,211,153,0.3)",
                borderRadius: 10,
                color: "#34d399",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Check size={16} /> Message envoyé, merci !
            </div>
          ) : (
            <>
              <label
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Motif
              </label>
              <select
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  marginBottom: 12,
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#f1f5f9",
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              >
                {MOTIFS.map((m) => (
                  <option key={m} value={m} style={{ background: "#1e293b" }}>
                    {m}
                  </option>
                ))}
              </select>

              <label
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Votre message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre demande…"
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginBottom: 12,
                  boxSizing: "border-box",
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#f1f5f9",
                  fontSize: 13,
                  fontFamily: "inherit",
                  resize: "vertical",
                  minHeight: 90,
                }}
              />

              {error && (
                <div
                  style={{ fontSize: 11, color: "#fb7185", marginBottom: 10 }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={send}
                disabled={!message.trim() || sending}
                style={{
                  width: "100%",
                  padding: "11px",
                  background:
                    !message.trim() || sending
                      ? "rgba(163,230,53,0.3)"
                      : "#a3e635",
                  border: "none",
                  borderRadius: 9,
                  color: "#060a12",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  cursor:
                    !message.trim() || sending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "inherit",
                }}
              >
                <Send size={14} /> {sending ? "Envoi…" : "Envoyer"}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
