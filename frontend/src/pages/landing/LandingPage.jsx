import { useState } from "react";
import { AuthChoiceModal } from "../../components/AuthChoiceModal.jsx";
import { ProfileSetupModal } from "../../components/ProfileSetupModal.jsx";
import { ChatPanel } from "../../components/ChatPanel.jsx";
import herobg from "../../assets/herobg.png";
import "./LandingPage.css";

const NAV_LINKS = ["Features", "Solutions", "About", "Blog"];

const TIMELINE_EVENTS = [
  { year: "2020", label: "The Seed" },
  { year: "2022", label: "First Pilot" },
  { year: "2023", label: "AI Launch" },
  { year: "2025", label: "10K Users" },
  {
    year: "2026",
    label: "The Future",
    active: true,
    desc: "We are no longer just building fintech. We are defining rural India's financial future. One gaon at a time.",
  },
];

const MARQUEE_TEXT = "NorthStar \u2022 Gaon. Dhan. Udaan. \u2022 \u0917\u093E\u0935. \u0927\u0928. \u0909\u0921\u094D\u0921\u093E\u0923. \u2022 ";

const SOCIAL_ICONS = {
  GitHub: (
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
  ),
  Instagram: (
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  ),
  X: (
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  ),
  LinkedIn: (
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  ),
  Mail: (
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  ),
};

function SocialIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      {SOCIAL_ICONS[name]}
    </svg>
  );
}

export function LandingPage({ state, actions, chat, onOpenChatPage }) {
  const [dark, setDark] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className={`lp-root${dark ? " lp-dark" : ""}`}>
      {/* ── Floating Navbar ─────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#" className="lp-brand">
            <span className="lp-brand-star">✦</span>
            <span className="lp-brand-name">NorthStar</span>
          </a>

          <div className="lp-nav-links">
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" className="lp-nav-link">
                {link}
              </a>
            ))}
          </div>

          <div className="lp-nav-actions">
            <button
              className="lp-theme-btn"
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle dark mode"
            >
              {dark ? "☀" : "☾"}
            </button>
            {state.session ? (
              <>
                <span className="lp-user-chip">
                  @{state.profile?.username ?? "…"}
                </span>
                <button
                  className="lp-logout-btn"
                  onClick={actions.onLogout}
                  disabled={state.authActionLoading}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                className="lp-login-btn"
                onClick={actions.onOpenLogin}
                disabled={state.authLoading}
              >
                {state.authLoading ? "…" : "Login"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthChoiceModal
        isOpen={state.authModalOpen}
        isLoading={state.authActionLoading}
        onClose={actions.onCloseLogin}
        onGoogleLogin={actions.onLogin}
        onEmailLogin={actions.onEmailLogin}
      />

      {/* Profile setup — shown automatically for new users with no profile */}
      {state.session && !state.authLoading && !state.profileLoading && !state.profile && (
        <ProfileSetupModal
          isSaving={state.profileSaving}
          error={state.errorMessage}
          onSubmit={actions.onProfileSubmit}
        />
      )}

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <img src={herobg} alt="" className="lp-hero-bg" aria-hidden="true" />
        <div className="lp-hero-overlay" />
        <div className="lp-hero-content">
          <span className="lp-hero-eyebrow">Rural Finance · Reimagined</span>
          <h1 className="lp-hero-h1">
            Gaon. Dhan.<br />Udaan.
          </h1>
          <p className="lp-hero-sub">
            AI-powered financial tools for rural India —<br />
            in your language, at your fingertips.
          </p>
          <div className="lp-hero-cta">
            <button className="lp-btn-primary" onClick={actions.onOpenLogin}>
              Get Started
            </button>
            <button className="lp-btn-outline">Learn More</button>
          </div>
        </div>
      </section>

      {/* ── Legacy Timeline Section ──────────────────────────────────────── */}
      <section className="lp-legacy">
        <div className="lp-legacy-bg-glyph" aria-hidden="true">LEGACY</div>
        <div className="lp-legacy-inner">
          <p className="lp-legacy-eyebrow">Our Journey</p>
          <h2 className="lp-legacy-title">THE LEGACY</h2>
          <p className="lp-legacy-subtitle">A TIMELINE OF GROWTH AND IMPACT.</p>

          <div className="lp-timeline">
            <div className="lp-timeline-track" />
            {TIMELINE_EVENTS.map((ev) => (
              <div
                key={ev.year}
                className={`lp-tl-item${ev.active ? " lp-tl-active" : ""}`}
              >
                <div className="lp-tl-card">
                  <span className="lp-tl-card-year">{ev.year}</span>
                  <span className="lp-tl-card-label">{ev.label}</span>
                  {ev.desc && <p className="lp-tl-card-desc">{ev.desc}</p>}
                </div>
                <div className="lp-tl-dot" />
                <span className="lp-tl-year">{ev.year}</span>
              </div>
            ))}
          </div>

          <button className="lp-legacy-btn">LEARN MORE</button>
        </div>
      </section>

      {/* ── Contact / CTA Section ───────────────────────────────────────── */}
      <section className="lp-contact">
        <div className="lp-marquee" aria-hidden="true">
          {[...Array(6)].map((_, rowIndex) => (
            <div 
              key={rowIndex} 
              className="lp-marquee-track" 
              style={{ animationDirection: rowIndex % 2 === 0 ? "normal" : "reverse" }}
            >
              {Array(16)
                .fill(MARQUEE_TEXT)
                .map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
            </div>
          ))}
        </div>
        <div className="lp-contact-overlay">
          <div className="lp-contact-card">
            <h2 className="lp-contact-name">Want NorthStar<br />in your Gaon?</h2>
            <p className="lp-contact-desc">Launch our AI-powered financial tools to empower your rural community with real economic growth.</p>
            <button className="lp-contact-btn" onClick={actions.onOpenLogin}>
              Get In Touch →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <span className="lp-footer-star">✦</span>
            <span className="lp-footer-brandname">NorthStar</span>
          </div>
          <blockquote className="lp-footer-quote">
            "We don't just give you access to finance.<br />
            We give you wings to fly."
          </blockquote>
        </div>

        <hr className="lp-footer-hr" />

        <div className="lp-footer-bottom">
          <span className="lp-footer-copy">
            2026 NORTHSTAR // ALL RIGHTS RESERVED.
          </span>
          <div className="lp-footer-socials">
            {Object.keys(SOCIAL_ICONS).map((name) => (
              <a
                key={name}
                href="https://github.com/Yash-Singh18"
                target="_blank"
                rel="noreferrer"
                className="lp-footer-icon"
                aria-label={name}
              >
                <SocialIcon name={name} />
              </a>
            ))}
          </div>
        </div>
      </footer>
      {/* ── Chat Panel ────────────────────────────────────────────────── */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onExpand={() => { setChatOpen(false); onOpenChatPage(); }}
        chat={chat}
      />

      {/* ── Floating AI Chat Icon ───────────────────────────────────────── */}
      <button
        className="lp-floating-chat-btn"
        aria-label="Open AI Chat"
        onClick={() => setChatOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <path d="M12 7v0"></path>
          <path d="M8 11v0"></path>
          <path d="M16 11v0"></path>
          <path d="M12 15v0"></path>
        </svg>
      </button>
    </div>
  );
}
