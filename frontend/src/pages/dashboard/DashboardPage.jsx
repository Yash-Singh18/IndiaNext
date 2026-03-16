import { useState, useEffect } from "react";
import {
  scanEmail,
  scanEmlFile,
  scanUrl,
  scanMessage,
  getUserScans,
} from "../../services/phishing/phishingService.js";
import { Navbar } from "../../components/Navbar.jsx";
import "./DashboardPage.css";

function classificationColor(c) {
  if (c === "safe") return "#22c55e";
  if (c === "suspicious") return "#f59e0b";
  return "#ef4444";
}

function classificationLabel(c) {
  if (c === "safe") return "SAFE";
  if (c === "suspicious") return "SUSPICIOUS";
  return "PHISHING";
}

function RiskGauge({ score }) {
  const s = Number(score) || 0;
  const color = s < 30 ? "#22c55e" : s < 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="dash-gauge">
      <svg viewBox="0 0 120 70" width="120" height="70">
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(s / 100) * 157} 157`}
        />
        <text
          x="60"
          y="55"
          textAnchor="middle"
          fill={color}
          fontSize="22"
          fontWeight="800"
        >
          {s}
        </text>
      </svg>
      <span className="dash-gauge-label">Risk Score</span>
    </div>
  );
}

function ThreatBar({ label, value }) {
  const v = Number(value) || 0;
  const pct = Math.min(100, v);
  const color = v < 30 ? "#22c55e" : v < 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="dash-threat-bar">
      <div className="dash-threat-bar-header">
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <div className="dash-threat-bar-track">
        <div
          className="dash-threat-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function DashboardPage({ session, profile, authLoading, onBack, onLogout, onOpenChat, onLogin, onSubscription, onAdmin }) {
  const [tab, setTab] = useState("paste");
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [emlFile, setEmlFile] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [started, setStarted] = useState(false);
  const userId = session?.user?.id;

  function loadHistory() {
    if (!userId) return;
    setHistoryLoading(true);
    getUserScans(userId)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }

  useEffect(() => {
    loadHistory();
  }, [userId]);

  async function handleScan() {
    setError("");
    setResult(null);
    setScanning(true);
    try {
      let res;
      if (tab === "paste") {
        if (!body.trim() && !subject.trim()) {
          setError("Enter at least a subject or body.");
          setScanning(false);
          return;
        }
        res = await scanEmail({ sender, subject, body, userId });
      } else if (tab === "eml") {
        if (!emlFile) {
          setError("Select a .eml file.");
          setScanning(false);
          return;
        }
        res = await scanEmlFile(emlFile, userId);
      } else if (tab === "url") {
        if (!urlInput.trim()) {
          setError("Enter a URL to check.");
          setScanning(false);
          return;
        }
        res = await scanUrl({ url: urlInput.trim(), userId });
      } else if (tab === "message") {
        if (!messageInput.trim()) {
          setError("Enter a message to check.");
          setScanning(false);
          return;
        }
        res = await scanMessage({ message: messageInput.trim(), userId });
      }
      setResult(res);
      loadHistory();
    } catch (err) {
      setError(err.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="dash-root">
      <Navbar
        variant="dark"
        activePage="dashboard"
        session={session}
        profile={profile}
        authLoading={authLoading}
        onHome={onBack}
        onChat={onOpenChat}
        onDashboard={() => {}}
        onLogin={onLogin}
        onLogout={onLogout}
        onSubscription={onSubscription}
        onAdmin={onAdmin}
      />

      {!started ? (
        <div className="dash-intro">
          <div className="dash-intro-card">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="dash-intro-icon">
              <path d="M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5z" />
            </svg>
            <h2>AI Phishing Detection</h2>
            <p>Paste an email, check a URL, scan a suspicious message, or upload a .eml file. Our two-tier AI pipeline analyzes content for phishing indicators, malicious links, domain spoofing, and social engineering tactics.</p>
            <div className="dash-intro-features">
              <div className="dash-intro-feat"><strong>Llama 8B</strong><span>Fast triage</span></div>
              <div className="dash-intro-feat"><strong>Llama 70B</strong><span>Deep analysis</span></div>
              <div className="dash-intro-feat"><strong>VirusTotal</strong><span>URL reputation</span></div>
              <div className="dash-intro-feat"><strong>Safe Browsing</strong><span>Threat lookup</span></div>
            </div>
            <button className="dash-scan-button" onClick={() => setStarted(true)}>
              Start Scanning
            </button>
          </div>
        </div>
      ) : (
      <div className="dash-content">
        <div className="dash-left">
          <section className="dash-scan-card">
            <div className="dash-tabs">
              <button
                className={`dash-tab ${tab === "paste" ? "dash-tab-active" : ""}`}
                onClick={() => setTab("paste")}
              >
                Email
              </button>
              <button
                className={`dash-tab ${tab === "eml" ? "dash-tab-active" : ""}`}
                onClick={() => setTab("eml")}
              >
                .eml File
              </button>
              <button
                className={`dash-tab ${tab === "url" ? "dash-tab-active" : ""}`}
                onClick={() => setTab("url")}
              >
                URL
              </button>
              <button
                className={`dash-tab ${tab === "message" ? "dash-tab-active" : ""}`}
                onClick={() => setTab("message")}
              >
                Message
              </button>
            </div>

            {tab === "paste" && (
              <div className="dash-form">
                <input
                  className="dash-input"
                  placeholder="Sender (e.g. security@paypa1.com)"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                />
                <input
                  className="dash-input"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <textarea
                  className="dash-textarea"
                  placeholder="Paste email body here..."
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
            )}

            {tab === "eml" && (
              <div className="dash-form">
                <label className="dash-file-label">
                  <input
                    type="file"
                    accept=".eml"
                    className="dash-file-input"
                    onChange={(e) => setEmlFile(e.target.files?.[0] || null)}
                  />
                  <span className="dash-file-text">
                    {emlFile ? emlFile.name : "Choose .eml file..."}
                  </span>
                </label>
              </div>
            )}

            {tab === "url" && (
              <div className="dash-form">
                <input
                  className="dash-input"
                  placeholder="Enter URL (e.g. https://paypa1-login.com/verify)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
            )}

            {tab === "message" && (
              <div className="dash-form">
                <textarea
                  className="dash-textarea"
                  placeholder="Paste a suspicious message (SMS, WhatsApp, DM, etc.)..."
                  rows={6}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
              </div>
            )}

            {error && <div className="dash-error">{error}</div>}

            <button
              className="dash-scan-button"
              onClick={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                <span className="dash-spinner" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5z" />
                </svg>
              )}
              {scanning ? "Analyzing..." : "Scan for Phishing"}
            </button>
          </section>

          {result && (
            <section className="dash-result-card">
              <div className="dash-result-header">
                <span
                  className="dash-badge"
                  style={{
                    background: classificationColor(result.classification || "suspicious"),
                  }}
                >
                  {classificationLabel(result.classification || "suspicious")}
                </span>
                <RiskGauge score={result.risk_score ?? 0} />
              </div>

              <div className="dash-result-meta">
                <div>
                  <strong>From:</strong> {result.sender || "N/A"}
                </div>
                <div>
                  <strong>Subject:</strong> {result.subject || "N/A"}
                </div>
              </div>

              {result.threat_breakdown && (
                <div className="dash-threat-section">
                  <h4>Threat Breakdown</h4>
                  <ThreatBar
                    label="LLM Analysis"
                    value={result.threat_breakdown.llm_score ?? 0}
                  />
                  <ThreatBar
                    label="URL Reputation"
                    value={result.threat_breakdown.url_score ?? 0}
                  />
                  <ThreatBar
                    label="Domain Analysis"
                    value={result.threat_breakdown.domain_score ?? 0}
                  />
                  <ThreatBar
                    label="Language Signals"
                    value={result.threat_breakdown.language_score ?? 0}
                  />
                </div>
              )}

              {Array.isArray(result.reasons) && result.reasons.length > 0 && (
                <div className="dash-reasons">
                  <h4>Findings</h4>
                  <ul>
                    {result.reasons.map((r, i) => (
                      <li key={i}>{typeof r === "string" ? r : JSON.stringify(r)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(result.url_reports) && result.url_reports.length > 0 && (
                <div className="dash-urls">
                  <h4>URL Analysis</h4>
                  {result.url_reports.map((u, i) => (
                    <div key={i} className="dash-url-item">
                      <span
                        className={`dash-url-dot ${u.is_malicious ? "dash-url-bad" : "dash-url-ok"}`}
                      />
                      <span className="dash-url-text">{u.url || "unknown"}</span>
                      {u.virustotal_score != null && (
                        <span className="dash-url-tag">
                          VT: {u.virustotal_score}
                        </span>
                      )}
                      {u.safe_browsing_threat && (
                        <span className="dash-url-tag dash-url-tag-bad">
                          {u.safe_browsing_threat}
                        </span>
                      )}
                      {u.is_homoglyph && (
                        <span className="dash-url-tag dash-url-tag-bad">
                          Homoglyph
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {result.recommended_action && (
                <div className="dash-action">
                  <h4>Recommended Action</h4>
                  <p>{result.recommended_action}</p>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="dash-right">
          <section className="dash-history-card">
            <h3>Scan History</h3>
            {historyLoading ? (
              <div className="dash-history-empty">Loading...</div>
            ) : history.length === 0 ? (
              <div className="dash-history-empty">
                No scans yet. Analyze an email to get started.
              </div>
            ) : (
              <div className="dash-history-list">
                {history.map((scan) => (
                  <div key={scan.id} className="dash-history-item">
                    <span
                      className="dash-history-badge"
                      style={{
                        background: classificationColor(scan.classification),
                      }}
                    >
                      {scan.risk_score}
                    </span>
                    <div className="dash-history-info">
                      <span className="dash-history-subject">
                        {scan.subject || "(no subject)"}
                      </span>
                      <span className="dash-history-sender">
                        {scan.sender || "unknown"}
                      </span>
                    </div>
                    <span className="dash-history-date">
                      {new Date(scan.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      )}
    </div>
  );
}
