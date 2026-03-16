import { useState, useEffect, useRef, useCallback } from "react";
import {
  getChatRoom,
  getChatMessages,
  saveChatMessage,
  resolveQuery,
} from "../../services/community/communityService.js";
import "./CommunityChatPage.css";

const WS_BASE = (() => {
  const raw = import.meta.env.VITE_AI_SERVICE_WS_URL ?? "ws://localhost:8000/ws/chat";
  const idx = raw.indexOf("/ws/");
  return idx !== -1 ? raw.slice(0, idx) : "ws://localhost:8000";
})();

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function CommunityChatPage({ roomId, session, profile, onBack }) {
  const [room, setRoom]       = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(true);
  const [wsReady, setWsReady] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved]   = useState(false);
  const [error, setError]     = useState("");

  const wsRef          = useRef(null);
  const bottomRef      = useRef(null);
  const reconnectTimer = useRef(null);
  const myIdRef        = useRef(profile?.id);
  useEffect(() => { myIdRef.current = profile?.id; }, [profile?.id]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load room + history
  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    Promise.all([getChatRoom(roomId), getChatMessages(roomId)])
      .then(([r, msgs]) => {
        setRoom(r);
        setMessages(msgs.map(normalizeStoredMsg));
        if (r.expert_queries?.status === "resolved") setResolved(true);
      })
      .catch((err) => setError(err.message || "Failed to load chat."))
      .finally(() => setLoading(false));
  }, [roomId]);

  // WebSocket connection
  const connectWs = useCallback(() => {
    if (!roomId) return;
    const ws = new WebSocket(`${WS_BASE}/ws/community/${roomId}`);
    wsRef.current = ws;

    ws.onopen  = () => setWsReady(true);
    ws.onclose = () => {
      setWsReady(false);
      reconnectTimer.current = setTimeout(connectWs, 3000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        // Already added optimistically — drop echoes from our own connections
        if (msg.sender_id === myIdRef.current) return;
        setMessages((prev) => [...prev, { ...msg, incoming: true }]);
      } catch {}
    };
  }, [roomId]);

  useEffect(() => {
    connectWs();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connectWs]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !wsReady || resolved) return;

    const outMsg = {
      sender_id: profile.id,
      sender:    profile.username,
      message:   text,
      timestamp: new Date().toISOString(),
    };

    // Optimistic UI
    setMessages((prev) => [...prev, { ...outMsg, incoming: false }]);
    setInput("");

    // Relay via WS to other participant
    wsRef.current?.send(JSON.stringify(outMsg));

    // Persist to Supabase
    saveChatMessage(roomId, profile.id, text).catch(() => {});
  }

  async function handleResolve() {
    if (!confirm("Mark this query as resolved? Your social score will increase by 1.")) return;
    setResolving(true);
    try {
      await resolveQuery(room.expert_queries.id, profile.id);
      setResolved(true);
    } catch (err) {
      setError(err.message || "Failed to resolve.");
    } finally {
      setResolving(false);
    }
  }

  const isExpert = profile?.id === room?.expert?.id;
  const otherUser = isExpert ? room?.user : room?.expert;

  if (loading) {
    return (
      <div className="cc-root cc-loading-root">
        <div className="cc-spinner" />
        Loading chat…
      </div>
    );
  }

  return (
    <div className="cc-root">
      {/* Header */}
      <header className="cc-header">
        <button className="cc-back" onClick={onBack}>← Back</button>
        <div className="cc-header-info">
          <span className="cc-header-title">{room?.expert_queries?.title ?? "Chat"}</span>
          <span className="cc-header-sub">
            with @{otherUser?.username ?? "—"}
            {isExpert && <span className="cc-expert-label"> · Expert</span>}
          </span>
        </div>
        <div className="cc-header-right">
          <span className={`cc-ws-dot ${wsReady ? "cc-ws-live" : "cc-ws-off"}`} title={wsReady ? "Live" : "Connecting…"} />
          {isExpert && !resolved && (
            <button className="cc-resolve-btn" onClick={handleResolve} disabled={resolving}>
              {resolving ? "…" : "Resolve"}
            </button>
          )}
          {resolved && <span className="cc-resolved-badge">Resolved</span>}
        </div>
      </header>

      {error && <div className="cc-error">{error}</div>}

      {/* Messages */}
      <div className="cc-messages">
        {messages.length === 0 && (
          <div className="cc-empty-msgs">No messages yet. Say hello!</div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === profile?.id || msg.sender === profile?.username;
          return (
            <div key={msg.id ?? i} className={`cc-msg-row ${isMine ? "cc-mine" : "cc-theirs"}`}>
              <div className={`cc-bubble ${isMine ? "cc-bubble-mine" : "cc-bubble-theirs"}`}>
                {!isMine && (
                  <span className="cc-sender">
                    @{msg.sender ?? msg["profiles"]?.username ?? "?"}
                  </span>
                )}
                <p>{msg.message}</p>
                <span className="cc-ts">
                  {formatTime(msg.timestamp ?? msg.created_at)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="cc-input-row" onSubmit={handleSend}>
        <input
          className="cc-input"
          type="text"
          placeholder={resolved ? "This query has been resolved." : "Type a message…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!wsReady || resolved}
        />
        <button className="cc-send-btn" type="submit" disabled={!input.trim() || !wsReady || resolved}>
          Send
        </button>
      </form>
    </div>
  );
}

// Normalize messages from DB (have `profiles` join) to match our internal format
function normalizeStoredMsg(m) {
  return {
    ...m,
    sender: m.profiles?.username,
    timestamp: m.created_at,
    incoming: false,
  };
}
