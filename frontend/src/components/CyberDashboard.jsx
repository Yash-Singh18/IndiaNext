import { useEffect, useRef } from "react";
import anime from "animejs/lib/anime.es.js";

/**
 * CyberDashboard — Animated dashboard section with threat metrics,
 * alert log, activity timeline, and risk visualization
 */
export function CyberDashboard() {
  const dashRef = useRef(null);

  useEffect(() => {
    // Animate dashboard cards on mount
    anime({
      targets: ".dash-card",
      opacity: [0, 1],
      translateY: [25, 0],
      delay: anime.stagger(100),
      duration: 700,
      easing: "easeOutExpo",
    });

    // Animate bar chart heights
    anime({
      targets: ".dash-bar",
      scaleY: [0, 1],
      delay: anime.stagger(60),
      duration: 800,
      easing: "easeOutElastic(1, .8)",
    });

    // Animate metric counters
    document.querySelectorAll("[data-count-to]").forEach((el) => {
      const target = parseInt(el.dataset.countTo, 10);
      anime({
        targets: { val: 0 },
        val: target,
        round: 1,
        duration: 1500,
        delay: 400,
        easing: "easeInOutExpo",
        update: (anim) => {
          el.textContent = Math.round(anim.animations[0].currentValue).toLocaleString();
        },
      });
    });
  }, []);

  const metrics = [
    { label: "Threats Blocked", value: 2847, color: "#ff5252", icon: "🛡️" },
    { label: "Scans Today", value: 156, color: "#00f3ff", icon: "🔍" },
    { label: "Models Active", value: 12, color: "#b94eff", icon: "🤖" },
    { label: "Uptime", value: 99, color: "#00ff88", icon: "⚡", suffix: "%" },
  ];

  const alerts = [
    { time: "2 min ago", msg: "Phishing URL detected in email scan", level: "high" },
    { time: "8 min ago", msg: "Suspicious file hash matched threat DB", level: "medium" },
    { time: "15 min ago", msg: "Brute force attempt blocked — 192.168.1.42", level: "high" },
    { time: "32 min ago", msg: "SSL certificate validation passed", level: "low" },
    { time: "1 hr ago", msg: "Malware signature updated", level: "low" },
  ];

  const timelineEvents = [
    { time: "14:32", event: "AI model retrained on new threat vectors", type: "info" },
    { time: "13:15", event: "Zero-day vulnerability patched", type: "success" },
    { time: "12:48", event: "DDoS mitigation activated — Layer 7", type: "warning" },
    { time: "11:20", event: "Anomalous traffic pattern detected", type: "danger" },
    { time: "10:05", event: "Firewall rules updated", type: "info" },
  ];

  // Bar chart data (last 7 days threat count)
  const barData = [42, 28, 55, 71, 38, 63, 47];
  const barMax = Math.max(...barData);

  return (
    <section ref={dashRef} style={{ padding: "2rem 0" }} id="dashboard-section">
      <div style={{ marginBottom: "2rem" }}>
        <p style={{
          margin: 0, fontSize: "0.72rem", fontFamily: "var(--font-mono)",
          color: "var(--neon-cyan)", letterSpacing: "0.2em", textTransform: "uppercase",
          textShadow: "0 0 10px rgba(0, 243, 255, 0.3)",
        }}>
          Real-Time Intelligence
        </p>
        <h2 style={{
          margin: "0.5rem 0 0", fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
          fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em",
        }}>
          Security Dashboard
        </h2>
      </div>

      {/* Metric Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}>
        {metrics.map((m, i) => (
          <div
            key={i}
            className="dash-card glass-card"
            style={{
              padding: "1.2rem",
              opacity: 0,
              cursor: "default",
              transition: "transform 200ms, box-shadow 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 20px ${m.color}22`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-card)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "1.5rem" }}>{m.icon}</span>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: m.color,
                boxShadow: `0 0 8px ${m.color}88`,
                animation: "cyber-pulse 2s infinite",
              }} />
            </div>
            <p style={{
              margin: 0, fontSize: "2rem", fontWeight: 900,
              fontFamily: "var(--font-mono)", color: m.color,
              textShadow: `0 0 15px ${m.color}44`,
            }}>
              <span data-count-to={m.value}>0</span>{m.suffix || ""}
            </p>
            <p style={{
              margin: "0.2rem 0 0", fontSize: "0.75rem",
              color: "var(--text-muted)", fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              {m.label}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column: Chart + Alert Log */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}>
        {/* Bar Chart */}
        <div className="dash-card glass-card" style={{ padding: "1.2rem", opacity: 0 }}>
          <p style={{
            margin: "0 0 1rem", fontSize: "0.72rem", fontFamily: "var(--font-mono)",
            color: "var(--neon-purple)", letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Threat Activity (7 Days)
          </p>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: "8px", height: "120px",
          }}>
            {barData.map((val, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div
                  className="dash-bar"
                  style={{
                    width: "100%",
                    height: `${(val / barMax) * 100}%`,
                    borderRadius: "4px 4px 0 0",
                    background: `linear-gradient(180deg, ${val > 50 ? "#ff5252" : val > 30 ? "#ffdd00" : "#00ff88"}, transparent)`,
                    transformOrigin: "bottom",
                    scaleY: 0,
                    minHeight: "4px",
                  }}
                />
                <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {["M", "T", "W", "T", "F", "S", "S"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Log */}
        <div className="dash-card glass-card" style={{ padding: "1.2rem", opacity: 0 }}>
          <p style={{
            margin: "0 0 0.8rem", fontSize: "0.72rem", fontFamily: "var(--font-mono)",
            color: "var(--neon-cyan)", letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Recent Alerts
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "140px", overflowY: "auto" }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                display: "flex", gap: "0.6rem", alignItems: "flex-start",
                padding: "0.5rem 0.6rem", borderRadius: "6px",
                background: "rgba(10, 14, 26, 0.5)",
              }}>
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%", marginTop: "6px", flexShrink: 0,
                  background: a.level === "high" ? "#ff5252" : a.level === "medium" ? "#ffdd00" : "#00ff88",
                  boxShadow: `0 0 6px ${a.level === "high" ? "#ff525288" : a.level === "medium" ? "#ffdd0088" : "#00ff8888"}`,
                }} />
                <div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
                    {a.msg}
                  </p>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {a.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="dash-card glass-card" style={{ padding: "1.2rem", opacity: 0 }}>
        <p style={{
          margin: "0 0 1rem", fontSize: "0.72rem", fontFamily: "var(--font-mono)",
          color: "var(--neon-green)", letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          Threat Activity Timeline
        </p>
        <div style={{ position: "relative", paddingLeft: "24px" }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute", left: "7px", top: 0, bottom: 0, width: "2px",
            background: "linear-gradient(180deg, rgba(0, 243, 255, 0.3), rgba(185, 78, 255, 0.1), transparent)",
          }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {timelineEvents.map((evt, i) => {
              const dotColor =
                evt.type === "danger" ? "#ff5252" :
                evt.type === "warning" ? "#ffdd00" :
                evt.type === "success" ? "#00ff88" : "#00f3ff";

              return (
                <div key={i} style={{ position: "relative", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    position: "absolute", left: "-20px", top: "4px",
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: dotColor,
                    boxShadow: `0 0 8px ${dotColor}88`,
                  }} />
                  <span style={{
                    fontSize: "0.72rem", fontFamily: "var(--font-mono)",
                    color: "var(--text-muted)", minWidth: "3.5rem", flexShrink: 0,
                  }}>
                    {evt.time}
                  </span>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                    {evt.event}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 720px) {
          [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
