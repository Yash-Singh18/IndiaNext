import { useState, useEffect, useCallback } from "react";
import {
  getOpenQueries,
  acceptQuery,
  subscribeToQueries,
} from "../../services/community/communityService.js";
import "./ExpertDashboardPage.css";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function ExpertDashboardPage({ session, profile, onBack, onCommunityChat }) {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null); // queryId being accepted
  const [dismissed, setDismissed] = useState(new Set()); // locally rejected
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOpenQueries();
      setQueries(data);
    } catch (err) {
      setError(err.message || "Failed to load queries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // Real-time: when any query changes status, refresh the list
    const unsub = subscribeToQueries((payload) => {
      const { eventType, new: row, old } = payload;
      if (eventType === "INSERT") {
        // New query — add to list if still open
        if (row.status === "open") {
          setQueries((prev) => [row, ...prev]);
        }
      } else if (eventType === "UPDATE") {
        // If it moved out of 'open' (someone else accepted), remove it immediately
        setQueries((prev) => prev.filter((q) => q.id !== row.id || row.status === "open"));
      } else if (eventType === "DELETE") {
        setQueries((prev) => prev.filter((q) => q.id !== old.id));
      }
    });

    return unsub;
  }, [load]);

  async function handleAccept(queryId) {
    setAccepting(queryId);
    setError("");
    try {
      const result = await acceptQuery(queryId, profile.id);
      if (result.success) {
        // Navigate to the chat room
        onCommunityChat?.(result.room_id);
      } else {
        setError("This query was just accepted by another expert.");
        // Remove from list — it's gone
        setQueries((prev) => prev.filter((q) => q.id !== queryId));
      }
    } catch (err) {
      setError(err.message || "Failed to accept query.");
    } finally {
      setAccepting(null);
    }
  }

  function handleReject(queryId) {
    // Locally dismiss — does not change DB status (still open for others)
    setDismissed((prev) => new Set([...prev, queryId]));
  }

  const visible = queries.filter((q) => !dismissed.has(q.id));

  return (
    <div className="ep-root">
      <header className="ep-topbar">
        <button className="ep-back" onClick={onBack}>← Back</button>
        <div className="ep-topbar-title">
          <span className="ep-topbar-badge">Expert Panel</span>
          <span className="ep-topbar-sub">@{profile?.username}</span>
        </div>
        <button className="ep-refresh" onClick={load}>Refresh</button>
      </header>

      <main className="ep-main">
        <div className="ep-header">
          <h1>Open Queries</h1>
          <p>Accept a query to start a private chat session with the user.</p>
        </div>

        {error && <div className="ep-error">{error}</div>}

        {loading ? (
          <div className="ep-loading">
            <div className="ep-spinner" />
            Loading queries…
          </div>
        ) : visible.length === 0 ? (
          <div className="ep-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5z" />
            </svg>
            <p>No open queries right now.</p>
            <span>New queries will appear here automatically.</span>
          </div>
        ) : (
          <div className="ep-list">
            {visible.map((q) => (
              <div key={q.id} className="ep-card">
                <div className="ep-card-meta">
                  <span className="ep-card-user">
                    @{q.profiles?.username ?? "unknown"}
                  </span>
                  <span className="ep-card-time">{timeAgo(q.created_at)}</span>
                </div>
                <h3 className="ep-card-title">{q.title}</h3>
                <p className="ep-card-desc">{q.description}</p>
                <div className="ep-card-actions">
                  <button
                    className="ep-btn ep-btn-accept"
                    onClick={() => handleAccept(q.id)}
                    disabled={accepting === q.id}
                  >
                    {accepting === q.id ? "Accepting…" : "Accept"}
                  </button>
                  <button
                    className="ep-btn ep-btn-reject"
                    onClick={() => handleReject(q.id)}
                    disabled={accepting === q.id}
                  >
                    Pass
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
