import { useEffect, useRef, useState } from "react";
import anime from "animejs/lib/anime.es.js";

/**
 * ThreatResultCard — Displays threat detection results with animated UI
 * Features: animated risk score counter, threat level badge, confidence meter,
 * animated status indicator, and explainable AI visualization
 */
export function ThreatResultCard({ result, visible }) {
  const cardRef = useRef(null);
  const scoreRef = useRef(null);
  const meterRef = useRef(null);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (!visible || !result) return;
    setAnimDone(false);

    const tl = anime.timeline({
      easing: "easeOutExpo",
      complete: () => setAnimDone(true),
    });

    // Card entrance
    tl.add({
      targets: cardRef.current,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
    });

    // Risk score counter
    tl.add(
      {
        targets: { val: 0 },
        val: result.riskScore || 0,
        round: 1,
        duration: 1200,
        easing: "easeInOutExpo",
        update: (anim) => {
          if (scoreRef.current) {
            scoreRef.current.textContent = Math.round(
              anim.animations[0].currentValue
            );
          }
        },
      },
      200
    );

    // Confidence meter fill
    tl.add(
      {
        targets: meterRef.current,
        width: [`0%`, `${(result.confidence || 0) * 100}%`],
        duration: 1000,
        easing: "easeInOutQuart",
      },
      400
    );

    // Keyword highlights stagger
    tl.add(
      {
        targets: ".threat-keyword",
        opacity: [0, 1],
        scale: [0.85, 1],
        delay: anime.stagger(80),
        duration: 400,
      },
      600
    );

    // Explanation cards stagger
    tl.add(
      {
        targets: ".explanation-card",
        opacity: [0, 1],
        translateX: [-20, 0],
        delay: anime.stagger(100),
        duration: 500,
      },
      800
    );

    return () => tl.pause();
  }, [visible, result]);

  if (!visible || !result) return null;

  const threatLevel = getThreatLevel(result.riskScore);
  const threatColors = {
    low: { color: "#00ff88", bg: "rgba(0,255,136,0.1)", border: "rgba(0,255,136,0.25)" },
    medium: { color: "#ffdd00", bg: "rgba(255,221,0,0.1)", border: "rgba(255,221,0,0.25)" },
    high: { color: "#ff5252", bg: "rgba(255,82,82,0.1)", border: "rgba(255,82,82,0.25)" },
  };
  const tc = threatColors[threatLevel];

  return (
    <div
      ref={cardRef}
      className="glass-card"
      style={{
        padding: "1.5rem",
        opacity: 0,
        marginTop: "1rem",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Animated status indicator */}
          <div style={{
            width: "12px", height: "12px", borderRadius: "50%",
            background: tc.color,
            boxShadow: `0 0 12px ${tc.color}66, 0 0 24px ${tc.color}33`,
            animation: "cyber-pulse 2s infinite",
          }} />
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Threat Analysis Complete
          </h3>
        </div>

        {/* Threat level badge */}
        <span style={{
          padding: "0.35rem 1rem",
          borderRadius: "9999px",
          background: tc.bg,
          color: tc.color,
          border: `1px solid ${tc.border}`,
          fontSize: "0.75rem",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textShadow: `0 0 8px ${tc.color}66`,
        }}>
          {threatLevel} risk
        </span>
      </div>

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.2rem" }}>
        {/* Risk Score */}
        <div style={{
          background: "rgba(10, 14, 26, 0.6)",
          border: `1px solid ${tc.border}`,
          borderRadius: "var(--radius-md)",
          padding: "1.2rem",
          textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Risk Score
          </p>
          <span
            ref={scoreRef}
            style={{
              fontSize: "2.4rem",
              fontWeight: 900,
              fontFamily: "var(--font-mono)",
              color: tc.color,
              textShadow: `0 0 20px ${tc.color}55`,
            }}
          >
            0
          </span>
          <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 600 }}>/100</span>
        </div>

        {/* Confidence Meter */}
        <div style={{
          background: "rgba(10, 14, 26, 0.6)",
          border: "1px solid var(--cyber-border)",
          borderRadius: "var(--radius-md)",
          padding: "1.2rem",
        }}>
          <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
            Confidence
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              flex: 1, height: "8px", borderRadius: "4px",
              background: "rgba(0, 243, 255, 0.08)",
              overflow: "hidden",
            }}>
              <div
                ref={meterRef}
                style={{
                  width: "0%",
                  height: "100%",
                  borderRadius: "4px",
                  background: "linear-gradient(90deg, #00f3ff, #b94eff)",
                  boxShadow: "0 0 12px rgba(0, 243, 255, 0.4)",
                }}
              />
            </div>
            <span style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--neon-cyan)",
              minWidth: "3.5em",
            }}>
              {Math.round((result.confidence || 0) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Suspicious Keywords */}
      {result.keywords && result.keywords.length > 0 && (
        <div style={{ marginBottom: "1.2rem" }}>
          <p style={{
            margin: "0 0 0.6rem",
            fontSize: "0.72rem",
            color: "var(--neon-purple)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            Suspicious Keywords Detected
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {result.keywords.map((kw, i) => (
              <span
                key={i}
                className="threat-keyword"
                style={{
                  display: "inline-block",
                  padding: "0.3rem 0.7rem",
                  borderRadius: "6px",
                  background: "rgba(185, 78, 255, 0.1)",
                  border: "1px solid rgba(185, 78, 255, 0.25)",
                  color: "#d4a0ff",
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-mono)",
                  opacity: 0,
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Explanation Cards */}
      {result.explanations && result.explanations.length > 0 && (
        <div>
          <p style={{
            margin: "0 0 0.6rem",
            fontSize: "0.72rem",
            color: "var(--neon-cyan)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            AI Reasoning Breakdown
          </p>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {result.explanations.map((exp, i) => (
              <div
                key={i}
                className="explanation-card"
                style={{
                  display: "flex",
                  gap: "0.7rem",
                  alignItems: "flex-start",
                  padding: "0.8rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(0, 243, 255, 0.04)",
                  border: "1px solid rgba(0, 243, 255, 0.1)",
                  opacity: 0,
                }}
              >
                <span style={{
                  flexShrink: 0,
                  width: "24px", height: "24px",
                  borderRadius: "6px",
                  background: "rgba(0, 243, 255, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "var(--neon-cyan)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {i + 1}
                </span>
                <div>
                  <p style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    color: "var(--text-primary)",
                    lineHeight: 1.5,
                  }}>
                    {exp.text}
                  </p>
                  {exp.weight && (
                    <span style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}>
                      Weight: {exp.weight}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getThreatLevel(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
