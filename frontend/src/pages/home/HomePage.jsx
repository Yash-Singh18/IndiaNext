import { useState } from "react";
import { AuthChoiceModal } from "../../components/AuthChoiceModal.jsx";
import { AskExpertModal } from "../../components/AskExpertModal.jsx";
import { ChatPanel } from "../../components/ChatPanel.jsx";
import { Navbar } from "../../components/Navbar.jsx";
import { ProfileSetupModal } from "../../components/ProfileSetupModal.jsx";
import { StatusBanner } from "../../components/StatusBanner.jsx";
import "./HomePage.css";

const MARQUEE_LINES = [
  "THREAT SCANNER • VERIFIED SIGNALS • EXPLAINABLE ALERTS • SAFE ACTIONS • ",
  "PHISHING DEFENSE • URL ANALYSIS • PROMPT SAFETY • INCIDENT RESPONSE • ",
  "RISK SCORING • ALERT LOGS • SECURITY TEAMS • DEFENSIVE INTELLIGENCE • ",
  "THREAT SCANNER • VERIFIED SIGNALS • EXPLAINABLE ALERTS • SAFE ACTIONS • ",
];

const FEATURE_SECTIONS = [
  {
    id: "scanner",
    eyebrow: "Threat Scanner",
    title: "Inspect emails, URLs, prompts, and suspicious content.",
    copy:
      "NorthStar is built around the problem statement's threat input and detection modules. It helps surface phishing attempts, malicious links, prompt injection patterns, deepfake indicators, and deceptive AI-generated content.",
    cta: "Open Scanner",
  },
  {
    id: "dashboard",
    eyebrow: "Dashboard",
    title: "Turn model output into evidence users can understand.",
    copy:
      "Every alert is paired with explainability, severity, confidence, and recommended next steps so users, admins, and security teams know why something was flagged and what to do next.",
    cta: "Review Insights",
  },
  {
    id: "deepfake",
    eyebrow: "Deepfake Detector",
    title: "Detect AI-generated images, videos, and audio with Grad-CAM visualization.",
    copy:
      "Upload media to analyze it for deepfake manipulation. NorthStar uses CNN-based detection with Grad-CAM heatmaps to show exactly which regions triggered suspicion, backed by an LLM-powered forensic explanation.",
    cta: "Detect Deepfake",
  },
  {
    id: "community",
    eyebrow: "Ask Community",
    title: "Get help from verified cybersecurity experts in real time.",
    copy:
      "Unsure about a suspicious link, scam call, or phishing attempt? Post your question and connect directly with a NorthStar-verified Cyber Expert via live private chat.",
    cta: "Ask an Expert",
  },
];

const FOOTER_ICONS = {
  Instagram: (
    <path d="M12 2.2c3.2 0 3.6 0 4.9 0.1 3.2 0.1 4.8 1.7 4.9 4.9 0.1 1.3 0.1 1.6 0.1 4.8s0 3.6-0.1 4.9c-0.1 3.2-1.7 4.8-4.9 4.9-1.3 0.1-1.6 0.1-4.9 0.1-3.2 0-3.6 0-4.8-0.1-3.3-0.1-4.8-1.7-5-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6 0.1-4.8c0.1-3.3 1.7-4.8 4.9-5C8.5 2.2 8.8 2.2 12 2.2zm0 1.6c-3.1 0-3.5 0-4.7 0.1-2.5 0.1-3.7 1.3-3.8 3.8-0.1 1.2-0.1 1.6-0.1 4.3s0 3.1 0.1 4.3c0.1 2.5 1.3 3.7 3.8 3.8 1.2 0.1 1.5 0.1 4.7 0.1s3.5 0 4.7-0.1c2.5-0.1 3.7-1.3 3.8-3.8 0.1-1.2 0.1-1.6 0.1-4.3s0-3.1-0.1-4.3c-0.1-2.5-1.3-3.7-3.8-3.8-1.2-0.1-1.5-0.1-4.7-0.1zm0 3.7A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 1.6A2.9 2.9 0 1 0 14.9 12 2.9 2.9 0 0 0 12 9.1zm5.7-2a1 1 0 1 0 1 1 1 1 0 0 0-1-1z" />
  ),
  Mail: (
    <path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 2-8 5L4 7zm0 10H4V9l8 5 8-5z" />
  ),
  Shield: (
    <path d="M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5zm0 3.2L6 7.5V11c0 3.9 2.5 7.6 6 8.8 3.5-1.2 6-4.9 6-8.8V7.5z" />
  ),
  GitHub: (
    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1 .6-1.3-2.2-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.2-.4-1.2.1-2.6 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.6.6.7 1 1.6 1 2.7 0 3.8-2.3 4.7-4.6 4.9.4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 22 12c0-5.5-4.5-10-10-10z" />
  ),
  Chat: (
    <path d="M4 4h16v10H7l-3 3zM7 8h10M7 11h7" />
  ),
};

function FooterIcon({ name, href, onClick }) {
  const isLink = href || onClick;
  const Tag = isLink ? "a" : "span";
  const extraProps = href
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : onClick
      ? { onClick, style: { cursor: "pointer" } }
      : {};
  return (
    <Tag className="home-footer-icon" aria-label={name} {...extraProps}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="18"
        height="18"
      >
        {FOOTER_ICONS[name]}
      </svg>
    </Tag>
  );
}

export function HomePage({ state, actions, chat, onOpenChatPage, onOpenDashboard, onSubscription, onAdmin, onDeepfake, onApplyExpert, onExpertDashboard, onCommunityChat, onServices }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [askExpertOpen, setAskExpertOpen] = useState(false);

  return (
    <div className="home-root">
      <Navbar
        variant="light"
        activePage="home"
        session={state.session}
        profile={state.profile}
        authLoading={state.authLoading}
        onHome={() => {}}
        onChat={onOpenChatPage}
        onDashboard={onOpenDashboard}
        onLogin={actions.onOpenLogin}
        onLogout={actions.onLogout}
        onSubscription={onSubscription}
        onAdmin={onAdmin}
        onDeepfake={onDeepfake}
        onApplyExpert={onApplyExpert}
        onExpertDashboard={onExpertDashboard}
        onCommunityChat={onCommunityChat}
        onServices={onServices}
      />

      <AuthChoiceModal
        isOpen={state.authModalOpen}
        isLoading={state.authActionLoading}
        onClose={actions.onCloseLogin}
        onGoogleLogin={actions.onLogin}
        onEmailLogin={actions.onEmailLogin}
      />

      {state.session && !state.authLoading && !state.profileLoading && !state.profile && (
        <ProfileSetupModal
          isSaving={state.profileSaving}
          error={state.errorMessage}
          onSubmit={actions.onProfileSubmit}
        />
      )}

      <main className="home-main">
        {(state.errorMessage || state.successMessage) && (
          <div className="home-status-stack">
            {state.errorMessage ? (
              <StatusBanner message={state.errorMessage} tone="error" />
            ) : null}
            {state.successMessage ? (
              <StatusBanner message={state.successMessage} tone="success" />
            ) : null}
          </div>
        )}

        <section className="home-hero" id="home">
          <div className="home-hero-copy">
            <span className="home-eyebrow">AI Cyber Defense Platform</span>
            <h1 className="home-title">
              Detect emerging threats and explain every alert.
            </h1>
            <p className="home-summary">
              NorthStar helps users, admins, and security teams analyze
              phishing, suspicious URLs, prompt injection attempts, anomalous
              login patterns, and deceptive AI content with clear evidence,
              severity scoring, and recommended response actions.
            </p>
            <div className="home-hero-actions">
              <button className="home-primary-button" onClick={onOpenChatPage}>
                Open Threat Scanner
              </button>
              <button
                className="home-secondary-button"
                onClick={state.session ? () => setAskExpertOpen(true) : actions.onOpenLogin}
              >
                Ask Community
              </button>
            </div>
          </div>

          <div className="home-hero-panel">
            <div className="home-panel-header">
              <span className="home-panel-chip">Live Defense Flow</span>
              <span className="home-panel-chip home-panel-chip-muted">
                Explainable AI
              </span>
            </div>
            <div className="home-panel-list">
              <article className="home-signal-card">
                <span className="home-signal-label">Input</span>
                <h2>Email, URL, prompt, log, or media sample</h2>
                <p>
                  Accept realistic cyber threat inputs instead of opaque demo
                  data.
                </p>
              </article>
              <article className="home-signal-card">
                <span className="home-signal-label">Detection</span>
                <h2>Threat reasoning and severity scoring</h2>
                <p>
                  Flag suspicious patterns with context rather than a binary
                  yes-or-no output.
                </p>
              </article>
              <article className="home-signal-card">
                <span className="home-signal-label">Response</span>
                <h2>Evidence, confidence, and safe next steps</h2>
                <p>
                  Turn every alert into a defensible recommendation for the
                  user or team handling it.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="home-platform">
          <div className="home-section-header">
            <span className="home-section-kicker">Platform Areas</span>
            <h2>Built around scanner, dashboard, and incident visibility.</h2>
            <p>
              The homepage stays simple, but the core product areas remain easy
              to discover from the first screen.
            </p>
          </div>

          <div className="home-feature-grid">
            {FEATURE_SECTIONS.map((section) => (
              <article
                key={section.id}
                className="home-feature-card"
                id={section.id}
              >
                <span className="home-feature-kicker">{section.eyebrow}</span>
                <h3>{section.title}</h3>
                <p>{section.copy}</p>
                <button
                  className="home-feature-button"
                  onClick={
                    section.id === "dashboard"
                      ? (state.session ? onOpenDashboard : actions.onOpenLogin)
                      : section.id === "deepfake"
                        ? onDeepfake
                        : section.id === "community"
                          ? (state.session ? () => setAskExpertOpen(true) : actions.onOpenLogin)
                          : state.session || section.id === "scanner"
                            ? onOpenChatPage
                            : actions.onOpenLogin
                  }
                >
                  {section.cta}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="home-about" id="about">
          <div className="home-marquee" aria-hidden="true">
            {MARQUEE_LINES.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className={`home-marquee-track${index % 2 === 1 ? " home-marquee-track-reverse" : ""}`}
              >
                {Array(10)
                  .fill(line)
                  .map((item, itemIndex) => (
                    <span key={`${itemIndex}-${index}`}>{item}</span>
                  ))}
              </div>
            ))}
          </div>

          <div className="home-about-card">
            <span className="home-section-kicker">About Us</span>
            <h2>NorthStar was designed for modern cyber defense, not black-box alerts.</h2>
            <p>
              Based on the IndiaNext problem statement, NorthStar focuses on
              detecting real threat scenarios and making the decision process
              understandable. The goal is not only to identify malicious or
              suspicious behavior, but to explain why it was risky, how severe
              it is, and what safe action should follow.
            </p>
            <p>
              That makes the platform useful for users, administrators, and
              security teams who need explainable AI, actionable mitigation, and
              a workflow that is ready for live demos and real investigation
              paths.
            </p>
            <button
              className="home-primary-button"
              onClick={state.session ? onOpenChatPage : actions.onOpenLogin}
            >
              Get In Touch
            </button>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-footer-top">
          <div className="home-footer-brand">
            <span className="home-footer-mark">N</span>
            <span className="home-footer-name">NorthStar</span>
          </div>
          <blockquote className="home-footer-quote">
            "We do not just detect cyber threats. We explain them clearly enough
            to act on them."
          </blockquote>
        </div>

        <div className="home-footer-divider" />

        <div className="home-footer-bottom">
          <span className="home-footer-copy">
            2026 NORTHSTAR // ALL RIGHTS RESERVED.
          </span>
          <div className="home-footer-icons" aria-hidden="true">
            {Object.keys(FOOTER_ICONS).map((name) => (
              <FooterIcon key={name} name={name} href={name === "Instagram" ? "#admin" : undefined} />
            ))}
          </div>
        </div>
      </footer>

      <AskExpertModal
        isOpen={askExpertOpen}
        session={state.session}
        profile={state.profile}
        onClose={() => setAskExpertOpen(false)}
      />

      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onExpand={() => {
          setChatOpen(false);
          onOpenChatPage();
        }}
        chat={chat}
      />

      <button
        className="home-chat-toggle"
        type="button"
        aria-label="Open AI chat"
        onClick={() => setChatOpen((open) => !open)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="22"
          height="22"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
        </svg>
      </button>
    </div>
  );
}
