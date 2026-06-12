import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Plus,
  ArrowLeft,
  Users,
  Search,
  BarChart2,
  X,
  Check,
  Settings2,
  Lock,
  LockOpen,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { NewGroupModal } from './NewGroupModal';

// ============================================================
// ChatModule — messagerie club type WhatsApp
//   - Groupes équipe (appartenance dynamique par catégorie)
//   - Groupe staff, groupes personnalisés
//   - Messages texte + sondages, temps réel
//   - write_mode : 'open' | 'staff_only' (réglable par groupe)
// Props :
//   user          : auth user
//   clubOwnerId   : id du club
//   isStaff       : true = owner/membre (côté hub), false = parent
//   senderName    : nom affiché de l'expéditeur
//   familyProfile : (parents) family_profile pour l'identité
//   accent        : couleur d'accent (défaut #a3e635)
// ============================================================

const BG_PATTERN = 'linear-gradient(rgba(8,12,21,0.92), rgba(8,12,21,0.92)), url("https://cmldxjlbxtcfmhzfvnyd.supabase.co/storage/v1/object/public/tchat/ChatGPT%20Image%2012%20juin%202026,%2020_44_47.png")';

export function ChatModule({
  user,
  clubOwnerId,
  isStaff,
  senderName,
  familyProfile,
  accent = "#a3e635",
}) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [unread, setUnread] = useState({});
  const readerKey = familyProfile
    ? "fam_" + familyProfile.id
    : "usr_" + (user?.id || "anon");

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("club_owner_id", clubOwnerId)
      .order("created_at");
    setConversations(data || []);
    setLoading(false);
    // Non-lus : dernier message vs dernière lecture
    if (data && data.length) {
      const ids = data.map((c) => c.id);
      const [{ data: reads }, { data: lastMsgs }] = await Promise.all([
        supabase
          .from("conv_reads")
          .select("*")
          .eq("reader_key", readerKey)
          .in("conversation_id", ids),
        supabase
          .from("conv_messages")
          .select("conversation_id, created_at")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      const lastRead = {};
      (reads || []).forEach((r) => {
        lastRead[r.conversation_id] = r.last_read_at;
      });
      const u = {};
      (lastMsgs || []).forEach((m) => {
        const lr = lastRead[m.conversation_id];
        if (!lr || new Date(m.created_at) > new Date(lr))
          u[m.conversation_id] = (u[m.conversation_id] || 0) + 1;
      });
      setUnread(u);
    }
  }, [clubOwnerId, readerKey]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Génération auto des groupes (staff) : 1 par catégorie de licenciés + groupe Staff
  const generateTeamGroups = async () => {
    const { data: lics } = await supabase
      .from("licencies")
      .select("category")
      .eq("owner_id", clubOwnerId);
    const cats = [
      ...new Set((lics || []).map((l) => l.category).filter(Boolean)),
    ].sort();
    const existing = new Set(
      conversations.filter((c) => c.type === "team").map((c) => c.team_filter),
    );
    const toCreate = cats
      .filter((c) => !existing.has(c))
      .map((cat) => ({
        club_owner_id: clubOwnerId,
        name: "Équipe " + cat,
        type: "team",
        team_filter: cat,
        write_mode: "open",
        emoji: "⚽",
        created_by: user?.id,
      }));
    if (!conversations.some((c) => c.type === "staff")) {
      toCreate.push({
        club_owner_id: clubOwnerId,
        name: "Staff & Éducateurs",
        type: "staff",
        write_mode: "open",
        emoji: "🎓",
        color: "#22d3ee",
        created_by: user?.id,
      });
    }
    if (toCreate.length) await supabase.from("conversations").insert(toCreate);
    loadConversations();
  };

  const openConv = async (conv) => {
    setActiveConv(conv);
    setUnread((prev) => ({ ...prev, [conv.id]: 0 }));
    await supabase
      .from("conv_reads")
      .upsert(
        {
          conversation_id: conv.id,
          reader_key: readerKey,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: "conversation_id,reader_key" },
      );
  };

  const showList = !isMobile || !activeConv;
  const showChat = !isMobile || !!activeConv;

  return (
    <div
      style={{
        display: "flex",
        height: isMobile ? "calc(100vh - 130px)" : "calc(100vh - 120px)",
        minHeight: 420,
        background: "#0a0e1a",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {showList && (
        <ConversationList
          conversations={conversations}
          activeId={activeConv?.id}
          unread={unread}
          loading={loading}
          isStaff={isStaff}
          isMobile={isMobile}
          accent={accent}
          onOpen={openConv}
          onNewGroup={() => setShowNewGroup(true)}
          onGenerate={generateTeamGroups}
        />
      )}
      {showChat &&
        (activeConv ? (
          <ChatWindow
            key={activeConv.id}
            conv={activeConv}
            user={user}
            clubOwnerId={clubOwnerId}
            isStaff={isStaff}
            senderName={senderName}
            familyProfile={familyProfile}
            isMobile={isMobile}
            accent={accent}
            onBack={() => setActiveConv(null)}
            onConvUpdated={(c) => {
              setActiveConv(c);
              loadConversations();
            }}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              color: "#334155",
            }}
          >
            <MessageSquare size={44} strokeWidth={1.2} />
            <div style={{ fontSize: 13 }}>Sélectionnez une conversation</div>
          </div>
        ))}
      {showNewGroup && (
        <NewGroupModal
          clubOwnerId={clubOwnerId}
          user={user}
          accent={accent}
          onClose={() => setShowNewGroup(false)}
          onCreated={() => {
            setShowNewGroup(false);
            loadConversations();
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Liste des conversations
// ─────────────────────────────────────────────
function ConversationList({
  conversations,
  activeId,
  unread,
  loading,
  isStaff,
  isMobile,
  accent,
  onOpen,
  onNewGroup,
  onGenerate,
}) {
  const [q, setQ] = useState("");
  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div
      style={{
        width: isMobile ? "100%" : 320,
        flexShrink: 0,
        borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        background: "#0c1120",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>
          Messages
        </div>
        {isStaff && (
          <button
            onClick={onNewGroup}
            title="Nouveau groupe"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: accent,
              border: "none",
              color: "#060a12",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Plus size={18} />
          </button>
        )}
      </div>
      {/* Recherche */}
      <div style={{ padding: "0 12px 10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 10,
          }}
        >
          <Search size={14} color="#475569" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#f1f5f9",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>
      {/* Liste */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && (
          <div style={{ padding: 20, color: "#475569", fontSize: 13 }}>
            Chargement…
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <div style={{ padding: "28px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
              Aucune conversation pour l'instant.
            </div>
            {isStaff && (
              <button
                onClick={onGenerate}
                style={{
                  padding: "10px 16px",
                  background: "rgba(163,230,53,0.12)",
                  border: "1px solid rgba(163,230,53,0.35)",
                  borderRadius: 10,
                  color: accent,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ⚡ Générer les groupes d'équipe
              </button>
            )}
          </div>
        )}
        {filtered.map((c) => {
          const active = c.id === activeId;
          const nb = unread[c.id] || 0;
          return (
            <div
              key={c.id}
              onClick={() => onOpen(c)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                cursor: "pointer",
                background: active ? "rgba(163,230,53,0.07)" : "transparent",
                borderLeft: active
                  ? "3px solid " + accent
                  : "3px solid transparent",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: (c.color || accent) + "22",
                  border: "1px solid " + (c.color || accent) + "44",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                {c.emoji || "💬"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#f1f5f9",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.name}
                  </span>
                  {c.write_mode === "staff_only" && (
                    <Lock size={11} color="#64748b" style={{ flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                  {c.type === "team"
                    ? "Groupe équipe · " + (c.team_filter || "")
                    : c.type === "staff"
                      ? "Éducateurs & dirigeants"
                      : "Groupe"}
                </div>
              </div>
              {nb > 0 && (
                <div
                  style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    background: accent,
                    color: "#060a12",
                    fontSize: 11,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 6px",
                  }}
                >
                  {nb > 99 ? "99+" : nb}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Fenêtre de conversation
// ─────────────────────────────────────────────
function ChatWindow({
  conv,
  user,
  clubOwnerId,
  isStaff,
  senderName,
  familyProfile,
  isMobile,
  accent,
  onBack,
  onConvUpdated,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [votes, setVotes] = useState({}); // message_id -> [{voter_key, option_id, voter_name}]
  const [showPoll, setShowPoll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const myKey = familyProfile
    ? "fam_" + familyProfile.id
    : "usr_" + (user?.id || "");

  const canWrite = isStaff || conv.write_mode === "open";

  const scrollDown = () =>
    setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
      80,
    );

  const loadVotes = useCallback(async (msgIds) => {
    if (!msgIds.length) return;
    const { data } = await supabase
      .from("poll_votes")
      .select("*")
      .in("message_id", msgIds);
    const map = {};
    (data || []).forEach((v) => {
      (map[v.message_id] = map[v.message_id] || []).push(v);
    });
    setVotes(map);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("conv_messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at")
        .limit(300);
      if (!mounted) return;
      setMessages(data || []);
      loadVotes((data || []).filter((m) => m.kind === "poll").map((m) => m.id));
      scrollDown();
    })();

    // Temps réel : nouveaux messages + votes
    const ch = supabase
      .channel("conv-" + conv.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conv_messages",
          filter: "conversation_id=eq." + conv.id,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === payload.new.id)
              ? prev
              : [...prev, payload.new],
          );
          scrollDown();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes" },
        () => {
          setMessages((prev) => {
            loadVotes(prev.filter((m) => m.kind === "poll").map((m) => m.id));
            return prev;
          });
        },
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [conv.id, loadVotes]);

  const sendText = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase.from("conv_messages").insert({
      conversation_id: conv.id,
      club_owner_id: clubOwnerId,
      sender_kind: isStaff ? "staff" : "family",
      sender_user_id: isStaff ? user?.id : null,
      sender_family_id: familyProfile?.id || null,
      sender_name: senderName || "Membre",
      kind: "text",
      content: t,
    });
    if (error) setText(t);
    setSending(false);
  };

  const sendPoll = async (question, options) => {
    await supabase.from("conv_messages").insert({
      conversation_id: conv.id,
      club_owner_id: clubOwnerId,
      sender_kind: isStaff ? "staff" : "family",
      sender_user_id: isStaff ? user?.id : null,
      sender_family_id: familyProfile?.id || null,
      sender_name: senderName || "Membre",
      kind: "poll",
      content: question,
      poll: {
        question,
        options: options.map((label, i) => ({ id: "o" + i, label })),
      },
    });
    setShowPoll(false);
  };

  const toggleVote = async (msg, optionId) => {
    const mine = (votes[msg.id] || []).find(
      (v) => v.voter_key === myKey && v.option_id === optionId,
    );
    if (mine) {
      await supabase.from("poll_votes").delete().eq("id", mine.id);
    } else {
      await supabase.from("poll_votes").insert({
        message_id: msg.id,
        voter_key: myKey,
        voter_name: senderName || "",
        option_id: optionId,
      });
    }
    loadVotes(messages.filter((m) => m.kind === "poll").map((m) => m.id));
  };

  const toggleWriteMode = async () => {
    const next = conv.write_mode === "open" ? "staff_only" : "open";
    const { data } = await supabase
      .from("conversations")
      .update({ write_mode: next })
      .eq("id", conv.id)
      .select()
      .single();
    if (data) onConvUpdated(data);
  };

  // Regrouper par jour
  const days = [];
  messages.forEach((m) => {
    const d = new Date(m.created_at).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!days.length || days[days.length - 1].label !== d)
      days.push({ label: d, items: [] });
    days[days.length - 1].items.push(m);
  });

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
    >
      {/* Header conversation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          background: "#0c1120",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {isMobile && (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              padding: 4,
            }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: (conv.color || accent) + "22",
            border: "1px solid " + (conv.color || accent) + "44",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
          }}
        >
          {conv.emoji || "💬"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: "#f1f5f9" }}>
            {conv.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {conv.write_mode === "staff_only" ? (
              <>
                <Lock size={10} /> Annonces — seuls les éducateurs écrivent
              </>
            ) : (
              <>
                <Users size={10} /> Discussion ouverte
              </>
            )}
          </div>
        </div>
        {isStaff && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Réglages du groupe"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: showSettings
                ? "rgba(255,255,255,0.08)"
                : "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings2 size={16} />
          </button>
        )}
      </div>

      {/* Réglages */}
      {showSettings && isStaff && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(34,211,238,0.05)",
            borderBottom: "1px solid rgba(34,211,238,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, color: "#94a3b8", flex: 1 }}>
            Qui peut écrire dans ce groupe ?
          </span>
          <button
            onClick={toggleWriteMode}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              background:
                conv.write_mode === "open"
                  ? "rgba(52,211,153,0.12)"
                  : "rgba(251,113,133,0.12)",
              border:
                "1px solid " +
                (conv.write_mode === "open"
                  ? "rgba(52,211,153,0.35)"
                  : "rgba(251,113,133,0.35)"),
              borderRadius: 8,
              color: conv.write_mode === "open" ? "#34d399" : "#fb7185",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {conv.write_mode === "open" ? (
              <>
                <LockOpen size={12} /> Tout le monde
              </>
            ) : (
              <>
                <Lock size={12} /> Staff uniquement
              </>
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 14px",
          backgroundImage: BG_PATTERN,
          backgroundSize: 'auto, 380px', backgroundRepeat: 'repeat',
        }}
      >
        {days.map((day, di) => (
          <div key={di}>
            <div style={{ textAlign: "center", margin: "10px 0 14px" }}>
              <span
                style={{
                  fontSize: 10.5,
                  color: "#475569",
                  background: "rgba(255,255,255,0.05)",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontWeight: 600,
                }}
              >
                {day.label}
              </span>
            </div>
            {day.items.map((m) => {
              const mine =
                (isStaff && m.sender_user_id === user?.id) ||
                (familyProfile && m.sender_family_id === familyProfile.id);
              return m.kind === "poll" ? (
                <PollBubble
                  key={m.id}
                  msg={m}
                  mine={mine}
                  votes={votes[m.id] || []}
                  myKey={myKey}
                  accent={accent}
                  onVote={(oid) => toggleVote(m, oid)}
                />
              ) : (
                <Bubble key={m.id} msg={m} mine={mine} accent={accent} />
              );
            })}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Zone de saisie */}
      {canWrite ? (
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            padding: "10px 12px",
            background: "#0c1120",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <button
            onClick={() => setShowPoll(true)}
            title="Créer un sondage"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BarChart2 size={17} />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            placeholder="Écrivez un message…"
            rows={1}
            style={{
              flex: 1,
              padding: "11px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 22,
              color: "#f1f5f9",
              fontSize: 14,
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
              maxHeight: 110,
            }}
          />
          <button
            onClick={sendText}
            disabled={!text.trim() || sending}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              flexShrink: 0,
              background: text.trim() ? accent : "rgba(163,230,53,0.25)",
              border: "none",
              color: "#060a12",
              cursor: text.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={18} />
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: "13px",
            background: "#0c1120",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            textAlign: "center",
            fontSize: 12,
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Lock size={12} /> Seuls les éducateurs peuvent écrire — vous pouvez
          voter aux sondages.
        </div>
      )}

      {showPoll && (
        <PollComposer clubOwnerId={clubOwnerId} isStaff={isStaff}
          accent={accent}
          onClose={() => setShowPoll(false)}
          onSend={sendPoll}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Bulle texte
// ─────────────────────────────────────────────
const SENDER_COLORS = [
  "#22d3ee",
  "#f472b6",
  "#f59e0b",
  "#818cf8",
  "#34d399",
  "#fb7185",
];
function senderColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++)
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SENDER_COLORS[h % SENDER_COLORS.length];
}

function Bubble({ msg, mine, accent }) {
  const time = new Date(msg.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div
      style={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
        marginBottom: 6,
      }}
    >
      <div
        style={{
          maxWidth: "74%",
          padding: "8px 12px 6px",
          background: mine ? "rgba(163,230,53,0.16)" : "rgba(255,255,255,0.06)",
          border:
            "1px solid " +
            (mine ? "rgba(163,230,53,0.3)" : "rgba(255,255,255,0.07)"),
          borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        }}
      >
        {!mine && (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: senderColor(msg.sender_name),
              marginBottom: 2,
            }}
          >
            {msg.sender_name}
          </div>
        )}
        <div
          style={{
            fontSize: 13.5,
            color: "#f1f5f9",
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {msg.content}
        </div>
        <div
          style={{
            fontSize: 9.5,
            color: "#64748b",
            textAlign: "right",
            marginTop: 3,
          }}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Bulle sondage
// ─────────────────────────────────────────────
function PollBubble({ msg, mine, votes, myKey, accent, onVote }) {
  const time = new Date(msg.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const options = msg.poll?.options || [];
  const total = votes.length;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
        marginBottom: 6,
      }}
    >
      <div
        style={{
          width: "min(330px, 85%)",
          padding: "10px 12px 8px",
          background: mine ? "rgba(163,230,53,0.13)" : "rgba(255,255,255,0.06)",
          border:
            "1px solid " +
            (mine ? "rgba(163,230,53,0.3)" : "rgba(255,255,255,0.09)"),
          borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        }}
      >
        {!mine && (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: senderColor(msg.sender_name),
              marginBottom: 2,
            }}
          >
            {msg.sender_name}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <BarChart2 size={13} color={accent} />
          <span style={{ fontSize: 13.5, fontWeight: 800, color: "#f1f5f9" }}>
            {msg.poll?.question}
          </span>
        </div>
        {options.map((opt) => {
          const optVotes = votes.filter((v) => v.option_id === opt.id);
          const iVoted = optVotes.some((v) => v.voter_key === myKey);
          const pct = total ? Math.round((optVotes.length / total) * 100) : 0;
          return (
            <div
              key={opt.id}
              onClick={() => onVote(opt.id)}
              style={{
                position: "relative",
                marginBottom: 6,
                padding: "8px 10px",
                borderRadius: 9,
                background: "rgba(255,255,255,0.04)",
                cursor: "pointer",
                overflow: "hidden",
                border:
                  "1px solid " +
                  (iVoted ? accent + "66" : "rgba(255,255,255,0.07)"),
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: pct + "%",
                  background: accent + "14",
                  transition: "width 0.3s",
                }}
              />
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    flexShrink: 0,
                    border: "2px solid " + (iVoted ? accent : "#475569"),
                    background: iVoted ? accent : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {iVoted && (
                    <Check size={10} color="#060a12" strokeWidth={3.5} />
                  )}
                </div>
                <span style={{ flex: 1, fontSize: 13, color: "#f1f5f9" }}>
                  {opt.label}
                </span>
                <span
                  style={{ fontSize: 11.5, fontWeight: 800, color: "#94a3b8" }}
                >
                  {optVotes.length}
                </span>
              </div>
            </div>
          );
        })}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 10, color: "#64748b" }}>
            {total} vote{total > 1 ? "s" : ""}
          </span>
          <span style={{ fontSize: 9.5, color: "#64748b" }}>{time}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Composeur de sondage
// ─────────────────────────────────────────────
function PollComposer({ accent, onClose, onSend, clubOwnerId, isStaff }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [existing, setExisting] = useState([]);
  const valid = question.trim() && options.filter(o => o.trim()).length >= 2;

  useEffect(() => {
    if (!isStaff || !clubOwnerId) return;
    (async () => {
      const { data } = await supabase
        .from('surveys')
        .select('id, title, options, closes_at')
        .eq('owner_id', clubOwnerId)
        .order('created_at', { ascending: false })
        .limit(30);
      setExisting(data || []);
    })();
  }, [clubOwnerId, isStaff]);

  const pickExisting = (id) => {
    const s = existing.find(x => String(x.id) === String(id));
    if (!s) return;
    setQuestion(s.title || '');
    const opts = (s.options || []).map(o => o.label || '');
    setOptions(opts.length >= 2 ? opts : [...opts, '', ''].slice(0, Math.max(2, opts.length)));
  };

  const inp = {
    width: '100%', padding: '10px 13px', background: '#1e293b',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9,
    color: '#f1f5f9', fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(420px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#0a0e1a',
        border: '1px solid rgba(34,211,238,0.25)', borderRadius: 16, padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={16} color={accent} /> Nouveau sondage
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>

        {isStaff && existing.length > 0 && (
          <div style={{ marginBottom: 14, padding: '10px 12px', background: 'rgba(244,114,182,0.05)', border: '1px solid rgba(244,114,182,0.18)', borderRadius: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#f472b6', display: 'block', marginBottom: 6 }}>
              📊 Reprendre un sondage des Événements
            </label>
            <select defaultValue="" onChange={e => pickExisting(e.target.value)} style={{ ...inp, background: '#1e293b' }}>
              <option value="" style={{ background: '#1e293b' }}>Choisir un sondage existant…</option>
              {existing.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#1e293b' }}>{s.title}</option>
              ))}
            </select>
          </div>
        )}

        <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Question</label>
        <input style={{ ...inp, marginBottom: 14 }} value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="Ex : Présent à l'entraînement mercredi ?" autoFocus />

        <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Options</label>
        {options.map((o, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input style={inp} value={o} placeholder={'Option ' + (i + 1)}
              onChange={e => setOptions(prev => prev.map((p, j) => j === i ? e.target.value : p))} />
            {options.length > 2 && (
              <button onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))} style={{
                width: 38, borderRadius: 9, background: 'rgba(251,113,133,0.1)',
                border: '1px solid rgba(251,113,133,0.25)', color: '#fb7185', cursor: 'pointer',
              }}>
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        {options.length < 8 && (
          <button onClick={() => setOptions(prev => [...prev, ''])} style={{
            padding: '7px 13px', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 9, color: '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14,
          }}>
            + Ajouter une option
          </button>
        )}

        <button onClick={() => valid && onSend(question.trim(), options.map(o => o.trim()).filter(Boolean))} disabled={!valid} style={{
          width: '100%', padding: 12, background: valid ? accent : 'rgba(163,230,53,0.25)',
          border: 'none', borderRadius: 10, color: '#060a12', fontSize: 13.5, fontWeight: 800,
          cursor: valid ? 'pointer' : 'default', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Send size={14} /> Envoyer le sondage
        </button>
      </div>
    </div>
  );
}
