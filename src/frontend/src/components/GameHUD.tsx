interface GameHUDProps {
  score: number;
  lives: number;
  level: number;
  powerUpActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
}

export function GameHUD({
  score,
  lives,
  level,
  powerUpActive,
  muted,
  onToggleMute,
}: GameHUDProps) {
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
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "#6a7a60",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          SCORE
        </span>
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1.05rem",
            fontWeight: 800,
            color: "#f0c030",
            textShadow: "0 0 10px rgba(240,192,48,0.35)",
            letterSpacing: "0.03em",
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
