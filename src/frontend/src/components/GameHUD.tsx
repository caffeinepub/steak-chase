interface GameHUDProps {
  score: number;
  lives: number;
  level: number;
  powerUpActive: boolean;
}

export function GameHUD({ score, lives, level, powerUpActive }: GameHUDProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(0,0,0,0.85)",
        borderBottom: "3px solid #3a3a3a",
        padding: "8px 16px",
        gap: "12px",
      }}
    >
      {/* Score */}
      <div
        data-ocid="hud.score"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "2px",
          minWidth: "100px",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.45rem",
            color: "#888",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          SCORE
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "1rem",
            fontWeight: 700,
            color: "#f0c030",
            textShadow: "1px 1px 0 #5a4000",
            letterSpacing: "0.05em",
          }}
        >
          {score.toLocaleString()}
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
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.45rem",
            color: "#888",
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
                opacity: idx < lives ? 1 : 0.2,
                transition: "opacity 0.2s",
                border: idx < lives ? "1px solid #5a7a2a" : "1px solid #3a3a3a",
                background: idx < lives ? "rgba(90,122,42,0.2)" : "transparent",
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

      {/* Power-up indicator */}
      {powerUpActive && (
        <div
          className="powerup-active"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(64,128,255,0.2)",
            border: "1px solid #4080ff",
            padding: "4px 10px",
          }}
        >
          <span style={{ fontSize: "1rem" }}>🍎</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.55rem",
              color: "#80c0ff",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            POWER!
          </span>
        </div>
      )}

      {/* Level */}
      <div
        data-ocid="hud.level"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "2px",
          minWidth: "80px",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.45rem",
            color: "#888",
            letterSpacing: "0.1em",
          }}
        >
          LEVEL
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "1rem",
            fontWeight: 700,
            color: "#5adf5a",
            letterSpacing: "0.05em",
          }}
        >
          {level}
        </span>
      </div>
    </div>
  );
}
