import { useState, useCallback } from "react";
import { AuthChoiceModal } from "../../components/AuthChoiceModal.jsx";
import { ProfileSetupModal } from "../../components/ProfileSetupModal.jsx";
import { ChatPanel } from "../../components/ChatPanel.jsx";
import { CyberBackground } from "../../components/CyberBackground.jsx";
import { CyberDashboard } from "../../components/CyberDashboard.jsx";
import { ScanningOverlay } from "../../components/ScanningOverlay.jsx";
import { ThreatResultCard } from "../../components/ThreatResultCard.jsx";
import "./LandingPage.css";

const NAV_LINKS = ["Features", "Dashboard", "About", "Docs"];

const FEATURES = [
  {
    icon: "🛡️",
    title: "Real-Time Threat Detection",
    desc: "AI-powered scanning identifies phishing, malware, and zero-day vulnerabilities in milliseconds.",
    color: "#00f3ff",
  },
  {
    icon: "🧠",
    title: "Explainable AI",
    desc: "Every detection includes clear reasoning, highlighted keywords, and confidence scores.",
    color: "#b94eff",
  },
  {
    icon: "⚡",
    title: "Instant Response",
    desc: "Automated threat mitigation and incident response, powered by advanced ML models.",
    color: "#00ff88",
  },
  {
    icon: "📊",
    title: "Security Analytics",
    desc: "Live dashboards with threat timelines, risk scores, and organizational risk posture.",
    color: "#ffdd00",
  },
];

// Demo threat result for demonstration
const DEMO_THREAT_RESULT = {
  riskScore: 78,
  confidence: 0.92,
  keywords: ["password", "urgent", "verify", "suspended", "click here", "login"],
  explanations: [
    { text: "Email contains multiple social engineering trigger words commonly found in phishing attempts.", weight: "0.85" },
    { text: "Sender domain does not match the claimed organization — DNS mismatch detected.", weight: "0.72" },
    { text: "URL analysis reveals a redirecting link to an unverified domain registered 2 days ago.", weight: "0.91" },
  ],
};

const SOCIAL_ICONS = {
  GitHub: (
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
  ),
  X: (
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  ),
  LinkedIn: (
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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
  const [chatOpen, setChatOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showThreatResult, setShowThreatResult] = useState(false);

  const handleScanComplete = useCallback(() => {
    setScanning(false);
    setShowThreatResult(true);
  }, []);

  const handleScan = useCallback(() => {
    setShowThreatResult(false);
    setScanning(true);
  }, []);

  return (
    <div className="lp-root">
      {/* Three.js Cyber Background */}
      <CyberBackground />

      {/* Scanning Animation Overlay */}
      <ScanningOverlay isScanning={scanning} onComplete={handleScanComplete} />

      {/* ── Floating Navbar ──────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#" className="lp-brand">
            <span className="lp-brand-star">◆</span>
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

      {/* Profile setup */}
      {state.session && !state.authLoading && !state.profileLoading && !state.profile && (
        <ProfileSetupModal
          isSaving={state.profileSaving}
          error={state.errorMessage}
          onSubmit={actions.onProfileSubmit}
        />
      )}

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-grid-overlay" aria-hidden="true" />
        <div className="lp-hero-content">
          <span className="lp-hero-eyebrow">
            <span className="lp-eyebrow-dot" />
            AI-Powered Cybersecurity
          </span>
          <h1 className="lp-hero-h1">
            Protect.<br />Detect.<br />
            <span className="lp-hero-gradient-text">Respond.</span>
          </h1>
          <p className="lp-hero-sub">
            Next-generation threat intelligence powered by explainable AI —<br />
            real-time protection for India's digital future.
          </p>
          <div className="lp-hero-cta">
            <button className="lp-btn-primary" onClick={handleScan}>
              <span className="lp-btn-icon">⚡</span>
              Run Threat Scan
            </button>
            <button className="lp-btn-outline" onClick={actions.onOpenLogin}>
              Get Started
            </button>
          </div>

          {/* Floating stats */}
          <div className="lp-hero-stats">
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-value">99.7%</span>
              <span className="lp-hero-stat-label">Detection Rate</span>
            </div>
            <div className="lp-hero-stat-divider" />
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-value">&lt;50ms</span>
              <span className="lp-hero-stat-label">Response Time</span>
            </div>
            <div className="lp-hero-stat-divider" />
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-value">24/7</span>
              <span className="lp-hero-stat-label">Monitoring</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Threat Result Showcase ──────────────────────────────────── */}
      <section className="lp-section">
        <ThreatResultCard result={DEMO_THREAT_RESULT} visible={showThreatResult} />
      </section>

      {/* ── Features Section ────────────────────────────────────────── */}
      <section className="lp-section" id="features-section">
        <div className="lp-section-header">
          <span className="lp-section-eyebrow">Core Capabilities</span>
          <h2 className="lp-section-title">Enterprise-Grade Security</h2>
          <p className="lp-section-sub">
            Built on cutting-edge AI models trained on millions of threat signatures
          </p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="lp-feature-card glass-card">
              <div className="lp-feature-icon" style={{ color: f.color }}>
                {f.icon}
              </div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
              <div className="lp-feature-glow" style={{
                background: `radial-gradient(circle at center, ${f.color}15, transparent 70%)`,
              }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Dashboard Section ───────────────────────────────────────── */}
      <section className="lp-section" id="dashboard">
        <CyberDashboard />
      </section>

      {/* ── CTA Section ─────────────────────────────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-cta-bg-grid" aria-hidden="true" />
        <div className="lp-cta-content">
          <h2 className="lp-cta-title">
            Ready to Secure<br />Your Digital Future?
          </h2>
          <p className="lp-cta-desc">
            Deploy NorthStar AI and protect your organization with next-generation threat intelligence.
          </p>
          <button className="lp-btn-primary lp-cta-btn" onClick={actions.onOpenLogin}>
            Get Started Free →
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <span className="lp-footer-star">◆</span>
            <span className="lp-footer-brandname">NorthStar</span>
          </div>
          <blockquote className="lp-footer-quote">
            "Protecting India's digital infrastructure<br />
            with AI that you can trust."
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

      {/* ── Chat Panel ──────────────────────────────────────────────── */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onExpand={() => { setChatOpen(false); onOpenChatPage(); }}
        chat={chat}
      />

      {/* ── Floating AI Chat Icon ───────────────────────────────────── */}
      <button
        className="lp-floating-chat-btn"
        aria-label="Open AI Chat"
        onClick={() => setChatOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
}
