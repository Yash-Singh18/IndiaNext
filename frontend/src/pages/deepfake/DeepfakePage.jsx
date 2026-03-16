import { useState, useRef, useCallback } from "react";
import { Navbar } from "../../components/Navbar.jsx";
import { detectDeepfake } from "../../services/deepfake/deepfakeService.js";
import "./DeepfakePage.css";

/* ── helpers ─────────────────────────────────────────────────────── */

function mediaTypeFromFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "bmp"].includes(ext)) return "image";
  if (["mp4", "avi", "mov", "mkv", "webm"].includes(ext)) return "video";
  if (["wav", "mp3", "ogg", "flac", "m4a"].includes(ext)) return "audio";
  return "unknown";
}

const ACCEPT =
  "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,audio/wav,audio/mpeg,audio/ogg";

function scoreColor(s) {
  if (s < 25) return "#22c55e";
  if (s < 50) return "#eab308";
  if (s < 75) return "#f97316";
  return "#ef4444";
}

function riskColor(r) {
  return (
    { LOW: "#22c55e", MEDIUM: "#eab308", HIGH: "#f97316", CRITICAL: "#ef4444" }[
      r
    ] || "#6b7280"
  );
}

/* ── component ───────────────────────────────────────────────────── */

export function DeepfakePage({
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
}) {
  const [status, setStatus] = useState("idle");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  /* ── file handling ─────────────────────────────────────────────── */

  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
    setStatus("idle");

    const mt = mediaTypeFromFile(f);
    if (mt === "image") {
      const r = new FileReader();
      r.onload = (e) => setPreview({ type: "image", src: e.target.result });
      r.readAsDataURL(f);
    } else if (mt === "video") {
      setPreview({ type: "video", src: URL.createObjectURL(f) });
    } else if (mt === "audio") {
      setPreview({ type: "audio", src: URL.createObjectURL(f) });
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("processing");
    setError("");
    try {
      const data = await detectDeepfake(file);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err.message || "Analysis failed");
      setStatus("error");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    setStatus("idle");
  };

  /* ── render ────────────────────────────────────────────────────── */

  return (
    <div className="df-page">
      <Navbar
        variant="dark"
        activePage="deepfake"
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
      />

      <div className="df-container">
        <header className="df-header">
          <h1>Deepfake Detector</h1>
          <p>
            Upload an image, video, or audio file to detect AI-generated
            manipulations with Grad-CAM heatmap visualization.
          </p>
        </header>

        {/* ────── Upload zone ────── */}
        {!result && (
          <div className="df-upload-section">
            <div
              className={`df-dropzone${dragOver ? " df-dropzone-active" : ""}${file ? " df-dropzone-has-file" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                onChange={(e) => handleFile(e.target.files[0])}
                hidden
              />

              {!file ? (
                <>
                  <div className="df-drop-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="df-drop-title">Drop your file here</p>
                  <p className="df-drop-sub">
                    or click to browse &middot; Image, Video, or Audio
                  </p>
                </>
              ) : (
                <div className="df-file-info">
                  <span className="df-file-badge">
                    {mediaTypeFromFile(file).toUpperCase()}
                  </span>
                  <span className="df-file-name">{file.name}</span>
                  <span className="df-file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>

            {preview && (
              <div className="df-preview">
                {preview.type === "image" && (
                  <img src={preview.src} alt="preview" />
                )}
                {preview.type === "video" && (
                  <video src={preview.src} controls muted />
                )}
                {preview.type === "audio" && (
                  <audio src={preview.src} controls />
                )}
              </div>
            )}

            <div className="df-actions">
              <button
                className="df-btn df-btn-primary"
                disabled={!file || status === "processing"}
                onClick={handleAnalyze}
              >
                {status === "processing"
                  ? "Analyzing..."
                  : "Analyze for Deepfake"}
              </button>
              {file && (
                <button className="df-btn df-btn-ghost" onClick={reset}>
                  Clear
                </button>
              )}
            </div>

            {status === "processing" && (
              <div className="df-processing">
                <div className="df-spinner" />
                <p>Running deepfake detection pipeline...</p>
                <p className="df-processing-sub">
                  This may take a moment for video files
                </p>
              </div>
            )}

            {error && (
              <div className="df-error">
                <p>{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ────── Results ────── */}
        {result && (
          <div className="df-results">
            {/* Score ring */}
            <div className="df-score-hero">
              <div
                className="df-score-ring"
                style={{ "--sc": scoreColor(result.fake_score) }}
              >
                <svg viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="var(--sc)"
                    strokeWidth="8"
                    strokeDasharray={`${(result.fake_score / 100) * 339.3} 339.3`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <span className="df-score-num">
                  {Math.round(result.fake_score)}
                </span>
                <span className="df-score-lbl">FakeScore</span>
              </div>

              <span
                className="df-risk-badge"
                style={{ background: riskColor(result.risk_level) }}
              >
                {result.risk_level} RISK
              </span>
              <p className="df-media-tag">
                Analyzed as <strong>{result.media_type}</strong>
              </p>
            </div>

            {/* Grad-CAM heatmap */}
            {result.heatmap && (
              <section className="df-card">
                <h2>Grad-CAM Heatmap</h2>
                <p className="df-card-sub">
                  Red regions indicate areas the model found most suspicious
                </p>
                <div className="df-heatmap-grid">
                  <div className="df-hm-panel">
                    <h3>Original</h3>
                    <img
                      src={`data:image/png;base64,${result.original_image || result.top_frame}`}
                      alt="original"
                    />
                    {result.top_frame_index != null && (
                      <span className="df-frame-tag">
                        Frame #{result.top_frame_index + 1} (most suspicious)
                      </span>
                    )}
                  </div>
                  <div className="df-hm-panel">
                    <h3>Heatmap Overlay</h3>
                    <img
                      src={`data:image/png;base64,${result.heatmap}`}
                      alt="Grad-CAM heatmap"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Indicators */}
            {result.indicators?.length > 0 && (
              <section className="df-card">
                <h2>Detection Indicators</h2>
                <div className="df-ind-list">
                  {result.indicators.map((ind, i) => (
                    <div
                      key={i}
                      className={`df-ind${ind.detected ? " df-ind-hit" : " df-ind-ok"}`}
                    >
                      <span className="df-ind-icon">
                        {ind.detected ? "\u26A0" : "\u2713"}
                      </span>
                      <div>
                        <strong>{ind.label}</strong>
                        {ind.detail && <p>{ind.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* LLM explanation */}
            {result.explanation && (
              <section className="df-card">
                <h2>AI Analysis</h2>
                <p className="df-explanation-text">{result.explanation}</p>
              </section>
            )}

            {/* Frame scores bar chart (video) */}
            {result.frame_scores && (
              <section className="df-card">
                <h2>Frame-by-Frame Analysis</h2>
                <div className="df-bars">
                  {result.frame_scores.map((s, i) => (
                    <div key={i} className="df-bar-col">
                      <div
                        className="df-bar"
                        style={{ height: `${s}%`, background: scoreColor(s) }}
                      />
                      <span className="df-bar-lbl">F{i + 1}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Audio sub-result (video with audio track) */}
            {(result.audio_result || result.audio_warning) && (
              <section className="df-card">
                <h2>Audio Analysis</h2>
                {result.audio_result && (
                  <p className="df-audio-line">
                    Audio FakeScore:{" "}
                    <strong
                      style={{
                        color: scoreColor(result.audio_result.fake_score),
                      }}
                    >
                      {result.audio_result.fake_score} / 100
                    </strong>
                  </p>
                )}
                {result.audio_warning && (
                  <p className="df-audio-line">{result.audio_warning}</p>
                )}
              </section>
            )}

            <button className="df-btn df-btn-primary" onClick={reset}>
              Analyze Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
