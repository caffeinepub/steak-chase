import { Leaderboard } from "./Leaderboard";

interface SplashScreenProps {
  onPlay: () => void;
}

export function SplashScreen({ onPlay }: SplashScreenProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #0d1a06 0%, #1a2f0a 40%, #0d1a06 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grass/dirt decorative border at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "8px",
          background:
            "repeating-linear-gradient(90deg, #5a7a2a 0px, #5a7a2a 28px, #3d6a18 28px, #3d6a18 56px)",
        }}
      />

      {/* Decorative star particles */}
      {[
        { id: "s1", opacity: 0.3, left: "10%", top: "5%" },
        { id: "s2", opacity: 0.4, left: "24%", top: "18%" },
        { id: "s3", opacity: 0.5, left: "38%", top: "7%" },
        { id: "s4", opacity: 0.3, left: "52%", top: "22%" },
        { id: "s5", opacity: 0.6, left: "66%", top: "9%" },
        { id: "s6", opacity: 0.4, left: "80%", top: "15%" },
        { id: "s7", opacity: 0.3, left: "92%", top: "28%" },
        { id: "s8", opacity: 0.5, left: "5%", top: "40%" },
        { id: "s9", opacity: 0.4, left: "17%", top: "55%" },
        { id: "s10", opacity: 0.3, left: "31%", top: "48%" },
        { id: "s11", opacity: 0.6, left: "45%", top: "62%" },
        { id: "s12", opacity: 0.4, left: "59%", top: "35%" },
        { id: "s13", opacity: 0.3, left: "73%", top: "70%" },
        { id: "s14", opacity: 0.5, left: "87%", top: "42%" },
        { id: "s15", opacity: 0.4, left: "95%", top: "58%" },
        { id: "s16", opacity: 0.3, left: "12%", top: "72%" },
        { id: "s17", opacity: 0.5, left: "26%", top: "78%" },
        { id: "s18", opacity: 0.4, left: "40%", top: "65%" },
        { id: "s19", opacity: 0.3, left: "54%", top: "80%" },
        { id: "s20", opacity: 0.6, left: "68%", top: "88%" },
      ].map(({ id, opacity, left, top }) => (
        <div
          key={id}
          style={{
            position: "absolute",
            width: "2px",
            height: "2px",
            background: "#f0c030",
            opacity,
            left,
            top,
            borderRadius: "0",
          }}
        />
      ))}

      {/* Title Image */}
      <div
        style={{ marginTop: "16px", marginBottom: "20px", textAlign: "center" }}
      >
        <img
          src="/assets/generated/steak-chase-title.dim_800x200.png"
          alt="STEAK CHASE"
          className="pixel-art"
          style={{
            maxWidth: "min(700px, 90vw)",
            height: "auto",
            filter:
              "drop-shadow(0 0 20px rgba(240,192,48,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.8))",
          }}
          onError={(e) => {
            // Fallback title if image fails
            const parent = e.currentTarget.parentElement;
            if (parent) {
              e.currentTarget.style.display = "none";
              const fallback = document.createElement("h1");
              fallback.textContent = "STEAK CHASE";
              fallback.style.cssText = `
                font-family: 'JetBrains Mono', monospace;
                font-size: clamp(2rem, 6vw, 4rem);
                font-weight: 900;
                color: #f0c030;
                text-shadow: 4px 4px 0 #5a4000, 0 0 40px rgba(240,192,48,0.5);
                letter-spacing: 0.1em;
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
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.65rem",
          color: "#8aaa50",
          letterSpacing: "0.08em",
          marginTop: "-12px",
          marginBottom: "20px",
          textShadow: "1px 1px 0 #1a3000",
        }}
      >
        by OP_Warden
      </p>

      {/* Main content area */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          alignItems: "flex-start",
          width: "100%",
          maxWidth: "900px",
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
            maxWidth: "400px",
            padding: "20px",
          }}
        >
          {/* About section */}
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#f0c030",
                letterSpacing: "0.1em",
                marginBottom: "10px",
                textShadow: "1px 1px 0 #5a4000",
              }}
            >
              THE HUNT
            </h2>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.6rem",
                color: "#ccc",
                lineHeight: "1.8",
                letterSpacing: "0.03em",
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
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#f0c030",
                letterSpacing: "0.1em",
                marginBottom: "12px",
                textShadow: "1px 1px 0 #5a4000",
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
                    gap: "8px",
                    background: "rgba(255,255,255,0.03)",
                    padding: "6px 8px",
                    border: "1px solid rgba(90,90,90,0.3)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      flexShrink: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {icon}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.55rem",
                      color: "#bbb",
                      lineHeight: "1.5",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Collectibles legend */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#f0c030",
                letterSpacing: "0.1em",
                marginBottom: "10px",
                textShadow: "1px 1px 0 #5a4000",
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
                    gap: "4px",
                    background: "rgba(0,0,0,0.3)",
                    padding: "8px",
                    border: "1px solid #3a3a3a",
                    flex: 1,
                  }}
                >
                  <img
                    src={src}
                    alt={label}
                    className="pixel-art"
                    style={{ width: "36px", height: "36px" }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.55rem",
                      color: "#ccc",
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.5rem",
                      color: "#888",
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
              padding: "14px",
              letterSpacing: "0.15em",
            }}
          >
            ▶ PLAY GAME
          </button>

          {/* Mobile warning */}
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.5rem",
              color: "#666",
              textAlign: "center",
              marginTop: "10px",
              letterSpacing: "0.03em",
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
          paddingTop: "24px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.5rem",
          color: "#555",
          textAlign: "center",
          letterSpacing: "0.05em",
        }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#5a8a2c", textDecoration: "none" }}
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
