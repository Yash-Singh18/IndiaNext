import { useEffect, useRef } from "react";
import anime from "animejs/lib/anime.es.js";

/**
 * ScanningOverlay — Full-screen cyber scanning effect with Anime.js
 * Shown when the user triggers a "scan" action.
 */
export function ScanningOverlay({ isScanning, onComplete }) {
  const overlayRef = useRef(null);
  const scanLineRef = useRef(null);
  const progressRef = useRef(null);
  const percentRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    if (!isScanning) return;

    const tl = anime.timeline({
      easing: "easeInOutQuad",
      complete: () => {
        if (onComplete) onComplete();
      },
    });

    // Fade in overlay
    tl.add({
      targets: overlayRef.current,
      opacity: [0, 1],
      duration: 300,
    });

    // Scan line sweep
    tl.add(
      {
        targets: scanLineRef.current,
        translateY: ["0%", "100%"],
        duration: 2000,
        easing: "linear",
        loop: 2,
      },
      300
    );

    // Progress bar fill
    tl.add(
      {
        targets: progressRef.current,
        width: ["0%", "100%"],
        duration: 3500,
        easing: "easeInOutExpo",
      },
      300
    );

    // Percentage counter
    tl.add(
      {
        targets: { val: 0 },
        val: 100,
        round: 1,
        duration: 3500,
        easing: "easeInOutExpo",
        update: (anim) => {
          if (percentRef.current) {
            const val = Math.round(anim.animations[0].currentValue);
            percentRef.current.textContent = `${val}%`;
          }
        },
      },
      300
    );

    // Grid glow pulses
    tl.add(
      {
        targets: ".scan-grid-cell",
        opacity: [0, 1],
        scale: [0.8, 1],
        delay: anime.stagger(50, { grid: [8, 4], from: "center" }),
        duration: 400,
      },
      600
    );

    // Fade out at end
    tl.add({
      targets: overlayRef.current,
      opacity: [1, 0],
      duration: 500,
      delay: 200,
    });

    return () => {
      tl.pause();
    };
  }, [isScanning, onComplete]);

  if (!isScanning) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(5, 8, 18, 0.92)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0,
      }}
    >
      {/* Scan line */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          ref={scanLineRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background:
              "linear-gradient(90deg, transparent, #00f3ff, #b94eff, transparent)",
            boxShadow: "0 0 30px rgba(0, 243, 255, 0.6), 0 0 60px rgba(185, 78, 255, 0.3)",
          }}
        />
      </div>

      {/* Center content */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
        {/* Hexagon grid visualization */}
        <div
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 28px)",
            gap: "6px",
            marginBottom: "2.5rem",
            justifyContent: "center",
          }}
        >
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="scan-grid-cell"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                background:
                  i % 3 === 0
                    ? "rgba(0, 243, 255, 0.15)"
                    : i % 5 === 0
                    ? "rgba(185, 78, 255, 0.15)"
                    : "rgba(0, 255, 136, 0.1)",
                border: `1px solid ${
                  i % 3 === 0
                    ? "rgba(0, 243, 255, 0.3)"
                    : i % 5 === 0
                    ? "rgba(185, 78, 255, 0.3)"
                    : "rgba(0, 255, 136, 0.2)"
                }`,
                opacity: 0,
              }}
            />
          ))}
        </div>

        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.8rem",
            color: "rgba(0, 243, 255, 0.7)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          Scanning for threats...
        </p>

        <span
          ref={percentRef}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "3rem",
            fontWeight: 800,
            color: "#00f3ff",
            textShadow: "0 0 30px rgba(0, 243, 255, 0.5)",
          }}
        >
          0%
        </span>

        {/* Progress bar */}
        <div
          style={{
            width: "320px",
            height: "4px",
            borderRadius: "2px",
            background: "rgba(0, 243, 255, 0.1)",
            marginTop: "1.5rem",
            overflow: "hidden",
          }}
        >
          <div
            ref={progressRef}
            style={{
              width: "0%",
              height: "100%",
              borderRadius: "2px",
              background: "linear-gradient(90deg, #00f3ff, #b94eff)",
              boxShadow: "0 0 20px rgba(0, 243, 255, 0.5)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
