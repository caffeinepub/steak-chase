import { useEffect, useRef, useState } from "react";

interface GameHUDProps {
  score: number;
  lives: number;
  level: number;
  powerUpActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  timeLeft: number; // seconds remaining this level
  lifeLostSignal: number; // increment to trigger life-lost flash+shake
}

interface ScoreDelta {
  id: number;
  value: number;
}

const HIGH_SCORE_KEY = "steakChaseHighScore";

export function GameHUD({
  score,
  lives,
  level,
  powerUpActive,
  muted,
  onToggleMute,
  timeLeft,
  lifeLostSignal,
}: GameHUDProps) {
  // Track previous score to derive delta
  const prevScoreRef = useRef(score);
  // Key trick: changing the key re-mounts the element, re-triggering CSS animation
  const [popKey, setPopKey] = useState(0);
  // Floating delta pop-ups
  const [deltas, setDeltas] = useState<ScoreDelta[]>([]);
  const deltaIdRef = useRef(0);
  // Life-lost shake+flash
  const [lifeLostFlash, setLifeLostFlash] = useState(false);
  const prevLifeLostSignalRef = useRef(lifeLostSignal);
  // Personal best high score
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return (
        Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? "0", 10) || 0
      );
    } catch {
      return 0;
    }
  });

  // Update high score whenever current score exceeds it
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(score));
      } catch {
        // ignore
      }
    }
  }, [score, highScore]);

  // Life-lost flash + shake
  useEffect(() => {
    if (lifeLostSignal !== prevLifeLostSignalRef.current) {
      prevLifeLostSignalRef.current = lifeLostSignal;
      setLifeLostFlash(true);
      setTimeout(() => setLifeLostFlash(false), 600);
    }
  }, [lifeLostSignal]);

  useEffect(() => {
    if (score !== prevScoreRef.current) {
      const diff = score - prevScoreRef.current;
      prevScoreRef.current = score;

      // Trigger pop animation
      setPopKey((k) => k + 1);

      // Add floating delta
      if (diff > 0) {
        const id = ++deltaIdRef.current;
        setDeltas((prev) => [...prev, { id, value: diff }]);
        // Remove after animation completes
        setTimeout(() => {
          setDeltas((prev) => prev.filter((d) => d.id !== id));
        }, 900);
      }
    }
  }, [score]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(8,12,8,0.92)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        borderBottom: "1px solid rgba(80,120,40,0.25)",
        padding: "8px 18px",
        gap: "12px",
      }}
    >
      {/* ── SCORE — premium widget ── */}
      <div
        data-ocid="hud.score"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "0px",
          minWidth: "120px",
          position: "relative",
        }}
      >
        {/* Ambient glow backdrop */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "-6px -10px",
            background:
              "radial-gradient(ellipse at 40% 60%, rgba(240,180,30,0.12) 0%, transparent 70%)",
            borderRadius: "12px",
            pointerEvents: "none",
          }}
        />

        {/* SCORE label */}
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.6rem",
            fontWeight: 800,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(200,150,30,0.75)",
            lineHeight: 1,
            marginBottom: "2px",
          }}
        >
          ✦ SCORE ✦
        </span>

        {/* Score number + delta wrapper */}
        <div style={{ position: "relative", display: "inline-block" }}>
          {/* Score number */}
          <span
            key={popKey}
            className={`score-shimmer score-pop${lifeLostFlash ? " score-life-lost" : ""}`}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "1.6rem",
              fontWeight: 900,
              letterSpacing: "0.03em",
              lineHeight: 1,
              display: "inline-block",
              position: "relative",
              zIndex: 1,
              color: lifeLostFlash ? "#ff4444" : undefined,
              textShadow: lifeLostFlash
                ? "0 0 18px rgba(255,60,60,0.9)"
                : undefined,
              transition: "color 0.15s, text-shadow 0.15s",
            }}
          >
            {score.toLocaleString()}
          </span>

          {/* Floating delta pop-ups */}
          {deltas.map((delta) => (
            <span
              key={delta.id}
              className="score-delta"
              style={{
                position: "absolute",
                top: "-4px",
                left: "100%",
                marginLeft: "6px",
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.72rem",
                fontWeight: 800,
                color:
                  delta.value >= 50
                    ? "#ff8cff"
                    : delta.value >= 30
                      ? "#7aeeff"
                      : "#ffe060",
                textShadow:
                  delta.value >= 50
                    ? "0 0 10px rgba(255,100,255,0.8)"
                    : delta.value >= 30
                      ? "0 0 10px rgba(80,220,255,0.8)"
                      : "0 0 8px rgba(255,220,60,0.8)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              +{delta.value}
            </span>
          ))}
        </div>

        {/* Thin gold underline accent */}
        <div
          aria-hidden="true"
          style={{
            height: "2px",
            width: "100%",
            marginTop: "3px",
            background:
              "linear-gradient(90deg, rgba(240,180,30,0.8) 0%, rgba(255,220,80,0.4) 60%, transparent 100%)",
            borderRadius: "2px",
          }}
        />

        {/* Personal best line */}
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.58rem",
            fontWeight: 600,
            color:
              highScore > 0 && score >= highScore
                ? "#ff8cff"
                : "rgba(140,110,20,0.7)",
            letterSpacing: "0.12em",
            marginTop: "3px",
            textShadow:
              highScore > 0 && score >= highScore
                ? "0 0 8px rgba(255,100,255,0.5)"
                : "none",
            transition: "color 0.3s, text-shadow 0.3s",
            whiteSpace: "nowrap",
          }}
        >
          {highScore > 0 && score >= highScore
            ? "★ NEW BEST!"
            : `BEST: ${highScore.toLocaleString()}`}
        </span>
      </div>

      {/* Lives */}
      <div
        data-ocid="hud.lives"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "#6a7a60",
            letterSpacing: "0.1em",
          }}
        >
          LIVES
        </span>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {(["life-1", "life-2", "life-3"] as const).map((lifeId, idx) => (
            <div
              key={lifeId}
              style={{
                width: "24px",
                height: "24px",
                overflow: "hidden",
                borderRadius: "5px",
                opacity: idx < lives ? 1 : 0.18,
                transition: "opacity 0.25s",
                border:
                  idx < lives
                    ? "1px solid rgba(80,140,30,0.5)"
                    : "1px solid rgba(60,60,60,0.3)",
                background:
                  idx < lives ? "rgba(70,120,30,0.18)" : "transparent",
              }}
            >
              <img
                src="/assets/generated/wolf-player-transparent.dim_64x64.png"
                alt="life"
                className="pixel-art"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Level Timer */}
      <div
        data-ocid="hud.timer"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          minWidth: "52px",
        }}
      >
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "#6a7a60",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          TIME
        </span>
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1.05rem",
            fontWeight: 800,
            color:
              timeLeft <= 10
                ? "#ff4444"
                : timeLeft <= 20
                  ? "#ff9900"
                  : "#68e0e0",
            textShadow:
              timeLeft <= 10
                ? "0 0 10px rgba(255,60,60,0.5)"
                : timeLeft <= 20
                  ? "0 0 10px rgba(255,150,0,0.4)"
                  : "0 0 8px rgba(80,220,220,0.3)",
            letterSpacing: "0.03em",
            transition: "color 0.3s",
          }}
        >
          {timeLeft}s
        </span>
      </div>

      {/* Power-up indicator */}
      {powerUpActive && (
        <div
          className="powerup-active"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(50,100,220,0.12)",
            border: "1px solid rgba(80,140,255,0.35)",
            borderRadius: "8px",
            padding: "5px 12px",
            backdropFilter: "blur(4px)",
          }}
        >
          <span style={{ fontSize: "1rem" }}>🍎</span>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#80c0ff",
              letterSpacing: "0.1em",
            }}
          >
            POWER!
          </span>
        </div>
      )}

      {/* Level + Mute */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          data-ocid="hud.level"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "2px",
            minWidth: "52px",
          }}
        >
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#6a7a60",
              letterSpacing: "0.1em",
            }}
          >
            LEVEL
          </span>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "1.05rem",
              fontWeight: 800,
              color: "#68e068",
              letterSpacing: "0.02em",
            }}
          >
            {level} / 10
          </span>
        </div>

        {/* Mute toggle */}
        <button
          type="button"
          data-ocid="hud.mute_toggle"
          onClick={onToggleMute}
          title={muted ? "Unmute sounds" : "Mute sounds"}
          style={{
            background: muted
              ? "rgba(255,255,255,0.05)"
              : "rgba(90,160,40,0.1)",
            border: muted
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(100,180,50,0.3)",
            borderRadius: "7px",
            cursor: "pointer",
            padding: "5px 8px",
            fontSize: "1rem",
            lineHeight: 1,
            color: muted ? "#555" : "#aae060",
            transition: "background 0.2s, border-color 0.2s, color 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
    </div>
  );
}
