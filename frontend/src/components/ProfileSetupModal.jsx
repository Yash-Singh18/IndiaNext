import { useState } from "react";
import "./ProfileSetupModal.css";

export function ProfileSetupModal({ isSaving, error, onSubmit }) {
  const [form, setForm] = useState({ name: "", username: "", dob: "" });

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <div className="psm-backdrop">
      <div className="psm-card" role="dialog" aria-modal="true" aria-labelledby="psm-title">
        <div className="psm-header">
          <span className="psm-eyebrow">Welcome to NorthStar</span>
          <h2 id="psm-title" className="psm-title">Complete your profile</h2>
          <p className="psm-sub">Just a few details to get you started on your journey.</p>
        </div>

        {error && <p className="psm-error">{error}</p>}

        <form className="psm-form" onSubmit={handleSubmit}>
          <div className="psm-field">
            <label className="psm-label" htmlFor="psm-name">Full Name</label>
            <input
              id="psm-name"
              className="psm-input"
              type="text"
              name="name"
              placeholder="Raju Sharma"
              value={form.name}
              onChange={handleChange}
              required
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div className="psm-field">
            <label className="psm-label" htmlFor="psm-username">Username</label>
            <div className="psm-input-wrap">
              <span className="psm-at">@</span>
              <input
                id="psm-username"
                className="psm-input psm-input--prefixed"
                type="text"
                name="username"
                placeholder="raju_sharma"
                value={form.username}
                onChange={handleChange}
                required
                disabled={isSaving}
              />
            </div>
            <span className="psm-hint">Lowercase letters, numbers, underscores · 3–24 chars</span>
          </div>

          <div className="psm-field">
            <label className="psm-label" htmlFor="psm-dob">Date of Birth</label>
            <input
              id="psm-dob"
              className="psm-input"
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              required
              disabled={isSaving}
            />
          </div>

          <button className="psm-submit" type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save & Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}
