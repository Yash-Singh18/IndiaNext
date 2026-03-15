import { useEffect, useState } from "react";

function resolveInitialName(user) {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    ""
  );
}

function resolveInitialUsername(user) {
  const seed =
    user.email?.split("@")[0] || user.user_metadata?.preferred_username || "";
  return seed
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 24);
}

export function ProfileFormCard({ user, isSaving, onSubmit }) {
  const [name, setName] = useState(resolveInitialName(user));
  const [username, setUsername] = useState(resolveInitialUsername(user));
  const [dob, setDob] = useState("");

  useEffect(() => {
    setName(resolveInitialName(user));
    setUsername(resolveInitialUsername(user));
    setDob("");
  }, [user.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit({ name, username, dob });
  }

  return (
    <section className="card profile-card">
      <h3 className="card-title">Profile details</h3>
      <p className="card-copy">
        Store these values in the profiles table, separate from Supabase auth.
      </p>
      <form className="profile-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Name</span>
          <input
            className="field-input"
            name="name"
            type="text"
            required
            placeholder="Enter full name"
            value={name}
            disabled={isSaving}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Username</span>
          <input
            className="field-input"
            name="username"
            type="text"
            required
            placeholder="lowercase_username"
            value={username}
            disabled={isSaving}
            onChange={(e) => setUsername(e.target.value)}
          />
          <span className="field-helper">
            Use 3-24 lowercase letters, numbers, or underscores.
          </span>
        </label>

        <label className="field">
          <span className="field-label">Date of birth</span>
          <input
            className="field-input"
            name="dob"
            type="date"
            required
            disabled={isSaving}
            max={new Date().toISOString().split("T")[0]}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </label>

        <button type="submit" className="primary-button" disabled={isSaving}>
          {isSaving ? "Saving profile..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}
