import { useEffect, useState } from "react";

export function AuthChoiceModal({
  isOpen,
  isLoading,
  onClose,
  onGoogleLogin,
  onEmailLogin,
}) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    await onEmailLogin(email);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-choice-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Sign in</p>
            <h3 id="auth-choice-title" className="modal-title">
              Choose how to continue
            </h3>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={onClose}
            disabled={isLoading}
          >
            Close
          </button>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Starting sign-in..." : "Continue with Google"}
        </button>

        <div className="modal-divider">
          <span>or use email</span>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="field-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              disabled={isLoading}
              onChange={(e) => setEmail(e.target.value)}
            />
            <span className="field-helper">
              We&apos;ll send a magic link to this address.
            </span>
          </label>

          <button type="submit" className="secondary-button" disabled={isLoading}>
            {isLoading ? "Sending link..." : "Send email link"}
          </button>
        </form>
      </section>
    </div>
  );
}
