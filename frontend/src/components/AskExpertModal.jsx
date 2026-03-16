import { useState } from "react";
import { createQuery } from "../services/community/communityService.js";
import "./AskExpertModal.css";

export function AskExpertModal({ isOpen, session, profile, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  function handleClose() {
    setTitle("");
    setDescription("");
    setError("");
    setDone(false);
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (!profile?.id) {
      setError("Profile not loaded. Please try again.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await createQuery(profile.id, title.trim(), description.trim());
      setDone(true);
    } catch (err) {
      setError(err.message || "Failed to submit query.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="aem-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="aem-modal" role="dialog" aria-modal="true">
        <button className="aem-close" onClick={handleClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {done ? (
          <div className="aem-success">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2">
              <path d="M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <h3>Query submitted!</h3>
            <p>A verified expert will review and accept your query soon. You'll find "Open Active Chat" in your profile when they do.</p>
            <button className="aem-btn-primary" onClick={handleClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="aem-header">
              <h3>Ask the Community</h3>
              <p>Describe your cybersecurity concern. A verified expert will respond.</p>
            </div>

            <form className="aem-form" onSubmit={handleSubmit}>
              <label className="aem-label">
                Title
                <input
                  className="aem-input"
                  type="text"
                  placeholder="e.g. Suspicious email asking for bank details"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  autoFocus
                />
              </label>

              <label className="aem-label">
                Description
                <textarea
                  className="aem-textarea"
                  placeholder="Describe the situation in detail…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </label>

              {error && <div className="aem-error">{error}</div>}

              <button className="aem-btn-primary" type="submit" disabled={loading}>
                {loading ? "Submitting…" : "Submit"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
