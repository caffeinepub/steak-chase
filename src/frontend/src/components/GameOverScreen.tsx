import { useState } from "react";
import { useAddScore } from "../hooks/useLeaderboard";

interface GameOverScreenProps {
  score: number;
  level: number;
  onReturnToMenu: () => void;
}

export function GameOverScreen({
  score,
  level,
  onReturnToMenu,
}: GameOverScreenProps) {
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { mutate: addScore, isPending, isError } = useAddScore();

  const handleSubmit = () => {
    const trimmed = playerName.trim();
    if (!trimmed || trimmed.length > 16) return;

    addScore(
      { playerName: trimmed, score },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitted) {
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "20px",
      }}
    >
      <div
        className="mc-panel"
        style={{
          maxWidth: "380px",
          width: "100%",
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        {/* Game Over title */}
        <div style={{ marginBottom: "20px" }}>
          <h1
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "1.4rem",
              fontWeight: 900,
              color: "#c04a2a",
              textShadow: "2px 2px 0 #5a0000, 0 0 20px rgba(192,74,42,0.5)",
              letterSpacing: "0.1em",
              margin: "0 0 4px 0",
            }}
          >
            GAME OVER
          </h1>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.55rem",
              color: "#888",
              margin: 0,
              letterSpacing: "0.05em",
            }}
          >
            The undead have won... this time.
          </p>
        </div>

        {/* Score display */}
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "2px solid #5a5a5a",
            borderTop: "2px solid #8a8a8a",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <div>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.5rem",
                  color: "#888",
                  margin: "0 0 4px 0",
                  letterSpacing: "0.1em",
                }}
              >
                FINAL SCORE
              </p>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "1.6rem",
                  fontWeight: 900,
                  color: "#f0c030",
                  textShadow: "2px 2px 0 #5a4000",
                  margin: 0,
                }}
              >
                {score.toLocaleString()}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.5rem",
                  color: "#888",
                  margin: "0 0 4px 0",
                  letterSpacing: "0.1em",
                }}
              >
                LEVEL
              </p>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "1.6rem",
                  fontWeight: 900,
                  color: "#5adf5a",
                  margin: 0,
                }}
              >
                {level}
              </p>
            </div>
          </div>
        </div>

        {/* Score submission */}
        {!submitted ? (
          <div style={{ marginBottom: "16px" }}>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.6rem",
                color: "#ccc",
                marginBottom: "10px",
                letterSpacing: "0.05em",
              }}
            >
              Enter your name for the leaderboard:
            </p>
            <input
              data-ocid="gameover.name_input"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
              onKeyDown={handleKeyDown}
              placeholder="YOUR NAME"
              maxLength={16}
              style={{
                width: "100%",
                background: "#1a1a1a",
                border: "2px solid #5a5a5a",
                borderTop: "2px solid #2a2a2a",
                color: "#f0c030",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                padding: "10px 12px",
                outline: "none",
                textAlign: "center",
                boxSizing: "border-box",
                marginBottom: "10px",
              }}
            />
            {isError && (
              <p
                data-ocid="gameover.error_state"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.5rem",
                  color: "#c04a2a",
                  marginBottom: "8px",
                }}
              >
                Failed to save score. Try again.
              </p>
            )}
            <button
              type="button"
              data-ocid="gameover.submit_button"
              className="mc-button mc-button-gold"
              onClick={handleSubmit}
              disabled={isPending || !playerName.trim()}
              style={{
                width: "100%",
                fontSize: "0.75rem",
                padding: "12px",
                letterSpacing: "0.1em",
                opacity: !playerName.trim() ? 0.5 : 1,
                cursor: !playerName.trim() ? "not-allowed" : "pointer",
              }}
            >
              {isPending ? "SAVING..." : "⭐ SAVE SCORE"}
            </button>
          </div>
        ) : (
          <div
            data-ocid="gameover.success_state"
            style={{
              background: "rgba(90,138,44,0.2)",
              border: "2px solid #5a8a2c",
              padding: "12px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                color: "#7dc845",
                fontWeight: 700,
                margin: 0,
                letterSpacing: "0.05em",
              }}
            >
              ✓ SCORE SAVED!
            </p>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.5rem",
                color: "#888",
                margin: "4px 0 0 0",
              }}
            >
              Your score has been added to the leaderboard.
            </p>
          </div>
        )}

        {/* Return to menu */}
        <button
          type="button"
          data-ocid="gameover.menu_button"
          className="mc-button"
          onClick={onReturnToMenu}
          style={{
            width: "100%",
            fontSize: "0.7rem",
            padding: "12px",
            letterSpacing: "0.1em",
          }}
        >
          ← MAIN MENU
        </button>
      </div>
    </div>
  );
}
