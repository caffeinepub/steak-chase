import { Leaderboard } from "./Leaderboard";

interface SplashScreenProps {
  onPlay: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export function SplashScreen({
  onPlay,
  muted,
  onToggleMute,
}: SplashScreenProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(40,90,15,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 30% 80%, rgba(20,50,10,0.12) 0%, transparent 60%), #0a0c10",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glowing top line instead of pixel border */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(90,180,40,0.5) 30%, rgba(120,200,50,0.7) 50%, rgba(90,180,40,0.5) 70%, transparent 100%)",
        }}
      />

      {/* Soft atmospheric radial glows — replace pixel stars */}
      <div
        className="atmosphere-glow"
        style={{
          position: "absolute",
          top: "-10%",
          left: "20%",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(80,160,30,1) 0%, transparent 70%)",
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "30%",
          right: "-5%",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(240,180,20,1) 0%, transparent 70%)",
          opacity: 0.04,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "5%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(60,120,20,1) 0%, transparent 70%)",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      />

      {/* Mute button — top right */}
      <button
        type="button"
        data-ocid="splash.mute_toggle"
        onClick={onToggleMute}
        title={muted ? "Unmute sounds" : "Mute sounds"}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: muted ? "rgba(255,255,255,0.05)" : "rgba(90,160,40,0.12)",
          border: muted
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(100,180,50,0.3)",
          borderRadius: "8px",
          cursor: "pointer",
          padding: "6px 10px",
          fontSize: "1.1rem",
          lineHeight: 1,
          color: muted ? "#555" : "#aae060",
          transition: "background 0.2s, border-color 0.2s, color 0.2s",
          zIndex: 10,
          backdropFilter: "blur(8px)",
        }}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Title Image */}
      <div
        style={{ marginTop: "24px", marginBottom: "16px", textAlign: "center" }}
      >
        <img
          src="/assets/generated/steak-chase-title.dim_800x200.png"
          alt="STEAK CHASE"
          className="pixel-art"
          style={{
            maxWidth: "min(680px, 88vw)",
            height: "auto",
            filter:
              "drop-shadow(0 0 28px rgba(240,192,48,0.35)) drop-shadow(0 4px 12px rgba(0,0,0,0.9))",
          }}
          onError={(e) => {
            const parent = e.currentTarget.parentElement;
            if (parent) {
              e.currentTarget.style.display = "none";
              const fallback = document.createElement("h1");
              fallback.textContent = "STEAK CHASE";
              fallback.style.cssText = `
                font-family: 'Outfit', sans-serif;
                font-size: clamp(2.2rem, 7vw, 4.5rem);
                font-weight: 900;
                color: #f0c030;
                text-shadow: 0 0 40px rgba(240,192,48,0.45), 0 2px 0 rgba(0,0,0,0.8);
                letter-spacing: 0.08em;
                margin: 0;
              `;
              parent.appendChild(fallback);
            }
          }}
        />
      </div>

      {/* Byline */}
      <p
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "0.85rem",
          fontWeight: 500,
          color: "#a0b870",
          letterSpacing: "0.1em",
          marginTop: "-8px",
          marginBottom: "24px",
        }}
      >
        by OP_Warden
      </p>

      {/* Main content area */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-start",
          width: "100%",
          maxWidth: "920px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Left panel - Game info */}
        <div
          className="mc-panel"
          style={{
            flex: "1",
            minWidth: "280px",
            maxWidth: "410px",
            padding: "22px",
          }}
        >
          {/* About section */}
          <div style={{ marginBottom: "22px" }}>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#f0c030",
                letterSpacing: "0.1em",
                marginBottom: "10px",
                textShadow: "0 0 10px rgba(240,192,48,0.2)",
              }}
            >
              THE HUNT
            </h2>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.8rem",
                color: "#bbb",
                lineHeight: "1.75",
                letterSpacing: "0.01em",
              }}
            >
              Navigate the maze, eat all the meat to progress, and avoid the
              undead!
            </p>
          </div>

          {/* How to play */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#f0c030",
                letterSpacing: "0.1em",
                marginBottom: "12px",
                textShadow: "0 0 10px rgba(240,192,48,0.2)",
              }}
            >
              HOW TO PLAY
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {[
                { icon: "⌨️", text: "Arrow Keys or WASD to move" },
                { icon: "🥩", text: "Eat Steaks — 10 pts each" },
                { icon: "🍖", text: "Eat Pork Chops — 30 pts each" },
                { icon: "🍎", text: "Golden Apple = Power-Up! (50 pts)" },
                { icon: "⚔️", text: "Defeat undead while powered! (200+ pts)" },
                { icon: "☠️", text: "Avoid Zombies & Skeletons!" },
                { icon: "❤️", text: "3 lives — don't waste them" },
              ].map(({ icon, text }) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    background: "rgba(255,255,255,0.04)",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.95rem",
                      flexShrink: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {icon}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "0.75rem",
                      color: "#c0c0c0",
                      lineHeight: "1.55",
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Enemies section */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#f0c030",
                letterSpacing: "0.1em",
                marginBottom: "12px",
                textShadow: "0 0 10px rgba(240,192,48,0.2)",
              }}
            >
              ENEMIES
            </h2>
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              {[
                {
                  src: "/assets/generated/zombie-enemy-transparent.dim_64x64.png",
                  label: "Zombie",
                  speed: "Slow",
                },
                {
                  src: "/assets/generated/skeleton-enemy-transparent.dim_64x64.png",
                  label: "Skeleton",
                  speed: "Fast",
                },
              ].map(({ src, label, speed }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(0,0,0,0.3)",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(120,120,120,0.12)",
                    flex: 1,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <img
                    src={src}
                    alt={label}
                    className="pixel-art"
                    style={{ width: "38px", height: "38px" }}
                  />
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#ddd",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "0.7rem",
                      color: "#777",
                    }}
                  >
                    {speed}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Play button */}
          <button
            type="button"
            className="mc-button"
            data-ocid="splash.play_button"
            onClick={onPlay}
            style={{
              width: "100%",
              fontSize: "1rem",
              padding: "15px",
              letterSpacing: "0.14em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <svg
              width="14"
              height="16"
              viewBox="0 0 14 16"
              fill="currentColor"
              style={{ flexShrink: 0 }}
              role="img"
              aria-label="Play"
            >
              <title>Play</title>
              <path d="M1 1l12 7-12 7V1z" />
            </svg>
            PLAY GAME
          </button>

          {/* Mobile hint */}
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "0.7rem",
              color: "#555",
              textAlign: "center",
              marginTop: "10px",
              letterSpacing: "0.01em",
            }}
          >
            Best played on desktop with keyboard
          </p>
        </div>

        {/* Right panel - Leaderboard */}
        <div style={{ flex: "1", minWidth: "280px", maxWidth: "360px" }}>
          <Leaderboard />
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: "auto",
          paddingTop: "28px",
          fontFamily: "'Outfit', sans-serif",
          fontSize: "0.7rem",
          color: "#444",
          textAlign: "center",
          letterSpacing: "0.02em",
        }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#5a9030",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
