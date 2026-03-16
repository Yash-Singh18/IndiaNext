import { useState } from "react";
import { Navbar } from "../../components/Navbar.jsx";
import "./ServicesPage.css";

export function ServicesPage({
  session,
  profile,
  authLoading,
  onHome,
  onChat,
  onDashboard,
  onLogin,
  onLogout,
  onSubscription,
  onDeepfake,
  onApplyExpert,
  onExpertDashboard,
  onCommunityChat,
  onServices,
}) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  function copyKey() {
    navigator.clipboard.writeText("ent_demo_northstar");
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  return (
    <div className="sp-page">
      <Navbar
        variant="dark"
        activePage="services"
        session={session}
        profile={profile}
        authLoading={authLoading}
        onHome={onHome}
        onChat={onChat}
        onDashboard={onDashboard}
        onLogin={onLogin}
        onLogout={onLogout}
        onSubscription={onSubscription}
        onDeepfake={onDeepfake}
        onApplyExpert={onApplyExpert}
        onExpertDashboard={onExpertDashboard}
        onCommunityChat={onCommunityChat}
        onServices={onServices}
      />

      <div className="sp-content">
        <div className="sp-hero">
          <div className="sp-hero-tag">What We Build</div>
          <h1 className="sp-hero-title">Our Services</h1>
          <p className="sp-hero-sub">
            Enterprise-grade cybersecurity tools — from real-time browser protection to AI firewall APIs.
          </p>
        </div>

        <div className="sp-cards">
          {/* ── Service 1: Chrome Extension ── */}
          <div className="sp-card">
            <div className="sp-card-icon">🛡️</div>
            <span className="sp-badge sp-badge-free">Free for all plans</span>
            <h2 className="sp-card-title">Chrome Shield Extension</h2>
            <p className="sp-card-desc">
              Real-time browser protection that detects and flags malicious websites as you browse.
              Blocks phishing pages, malware hosts, and suspicious redirects before they can cause harm.
            </p>
            <ul className="sp-features">
              <li>Runtime website risk scoring</li>
              <li>Phishing &amp; malware detection</li>
              <li>Instant block + visual warnings</li>
              <li>Works on all Chromium-based browsers</li>
              <li>No sensitive data ever leaves your device</li>
            </ul>
            <div className="sp-card-actions">
              <a
                className="sp-btn sp-btn-primary"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                ↓ Download Extension
              </a>
              <span className="sp-note">Available on Chrome Web Store</span>
            </div>
          </div>

          {/* ── Service 2: Prompt Guard API ── */}
          <div className="sp-card sp-card-featured">
            <div className="sp-card-icon">🔥</div>
            <span className="sp-badge sp-badge-api">API Service</span>
            <h2 className="sp-card-title">Prompt Guard Firewall</h2>
            <p className="sp-card-desc">
              An intelligent LLM firewall that intercepts user prompts before they reach your AI model.
              Detects prompt injection, jailbreaks, and data-extraction attacks using a hybrid
              heuristic + Llama 3.3 70B classification pipeline.
            </p>
            <ul className="sp-features">
              <li>19-pattern heuristic pre-filter</li>
              <li>LLM-based intent classification</li>
              <li>Weighted risk score (0–100)</li>
              <li>ALLOW / FLAG / BLOCK policy engine</li>
              <li>Audit log of suspicious prompts</li>
            </ul>

            {/* API key + docs */}
            <div className="sp-api-box">
              <div className="sp-api-key-row">
                <span className="sp-api-label">Demo API Key</span>
                <div className="sp-api-key-wrap">
                  <code className="sp-api-key">ent_demo_northstar</code>
                  <button className="sp-copy-btn" onClick={copyKey}>
                    {copiedKey ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <button
                className="sp-docs-toggle"
                onClick={() => setDocsOpen((o) => !o)}
              >
                {docsOpen ? "▲ Hide" : "▼ Show"} Integration Guide
              </button>

              {docsOpen && (
                <div className="sp-docs">
                  <div className="sp-doc-section">
                    <div className="sp-doc-label">Endpoint</div>
                    <code className="sp-doc-code">POST /api/v1/prompt-security/analyze</code>
                  </div>
                  <div className="sp-doc-section">
                    <div className="sp-doc-label">Request</div>
                    <pre className="sp-doc-code sp-doc-pre">{`{
  "api_key": "ent_demo_northstar",
  "prompt":  "<user input>",
  "context": "customer support chatbot"
}`}</pre>
                  </div>
                  <div className="sp-doc-section">
                    <div className="sp-doc-label">Response</div>
                    <pre className="sp-doc-code sp-doc-pre">{`{
  "status":      "SUSPICIOUS",
  "action":      "BLOCK",   // ALLOW | FLAG | BLOCK
  "risk_score":  94,        // 0 – 100
  "category":    "Jailbreak",
  "explanation": "..."
}`}</pre>
                  </div>
                </div>
              )}
            </div>

            <div className="sp-card-actions">
              <button
                className="sp-btn sp-btn-demo"
                onClick={() => window.open(import.meta.env.VITE_VULNERABLE_DEMO_URL || "http://localhost:8004", "_blank")}
              >
                ▶ Live Demo
              </button>
            </div>
          </div>

          {/* ── Service 3: Login Anomaly Detection ── */}
          <div className="sp-card">
            <div className="sp-card-icon">📍</div>
            <span className="sp-badge sp-badge-enterprise">Enterprise</span>
            <h2 className="sp-card-title">Login Anomaly Detection</h2>
            <p className="sp-card-desc">
              Impossible-travel detection for enterprise authentication systems.
              Flags suspicious logins by comparing geolocation and timing of
              consecutive login events — catches compromised credentials in real time.
            </p>
            <ul className="sp-features">
              <li>IP-based geolocation per login</li>
              <li>Haversine distance + speed analysis</li>
              <li>Impossible travel (&gt;900 km/h) flagging</li>
              <li>Telegram bot alerts on HIGH risk</li>
              <li>Full login audit trail in Supabase</li>
            </ul>
            <div className="sp-card-actions">
              <button
                className="sp-btn sp-btn-demo"
                onClick={() => window.open(import.meta.env.VITE_LOGIN_ANOMALY_URL || "http://localhost:8005", "_blank")}
              >
                ▶ Live Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
