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
            <p className="modal-eyebrow">
              <span style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--neon-green)",
                boxShadow: "0 0 8px rgba(0,255,136,0.5)",
                marginRight: "6px",
                verticalAlign: "middle",
              }} />
              Secure Access
            </p>
            <h3 id="auth-choice-title" className="modal-title">
              Choose how to continue
            </h3>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={onClose}
            disabled={isLoading}
            style={{ width: "auto", padding: "0.5rem 1rem" }}
          >
            Close
          </button>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onGoogleLogin}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
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
            {isLoading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <span style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid rgba(0,243,255,0.2)",
                  borderTopColor: "var(--neon-cyan)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                Sending link...
              </span>
            ) : (
              "Send email link"
            )}
          </button>
        </form>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </section>
    </div>
  );
}
