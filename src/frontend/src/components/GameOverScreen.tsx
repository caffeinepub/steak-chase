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
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
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
          padding: "30px 26px",
          textAlign: "center",
        }}
      >
        {/* Game Over title */}
        <div style={{ marginBottom: "22px" }}>
          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "1.6rem",
              fontWeight: 900,
              color: "#d05030",
              textShadow:
                "0 0 24px rgba(200,70,40,0.45), 0 2px 4px rgba(0,0,0,0.8)",
              letterSpacing: "0.08em",
              margin: "0 0 8px 0",
            }}
          >
            GAME OVER
          </h1>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "0.8rem",
              color: "#666",
              margin: 0,
            }}
          >
            The undead have won... this time.
          </p>
        </div>

        {/* Score display */}
        <div
          style={{
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "18px 16px",
            marginBottom: "22px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <div>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#666",
                  margin: "0 0 6px 0",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Final Score
              </p>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "1.75rem",
                  fontWeight: 900,
                  color: "#f0c030",
                  textShadow: "0 0 16px rgba(240,192,48,0.4)",
                  margin: 0,
                  letterSpacing: "0.02em",
                }}
              >
                {score.toLocaleString()}
              </p>
            </div>
            <div
              style={{
                width: "1px",
                background: "rgba(255,255,255,0.07)",
                margin: "0 8px",
              }}
            />
            <div>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#666",
                  margin: "0 0 6px 0",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Level
              </p>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "1.75rem",
                  fontWeight: 900,
                  color: "#68e068",
                  margin: 0,
                  letterSpacing: "0.02em",
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
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.78rem",
                color: "#aaa",
                marginBottom: "12px",
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
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#f0c030",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                padding: "11px 14px",
                outline: "none",
                textAlign: "center",
                boxSizing: "border-box",
                marginBottom: "12px",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            />
            {isError && (
              <p
                data-ocid="gameover.error_state"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.72rem",
                  color: "#d05030",
                  marginBottom: "10px",
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
                fontSize: "0.78rem",
                padding: "13px",
                letterSpacing: "0.1em",
              }}
            >
              {isPending ? "SAVING..." : "SAVE SCORE"}
            </button>
          </div>
        ) : (
          <div
            data-ocid="gameover.success_state"
            style={{
              background: "rgba(80,140,30,0.12)",
              border: "1px solid rgba(100,180,40,0.3)",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "18px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#7dc845",
                margin: 0,
              }}
            >
              ✓ SCORE SAVED!
            </p>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.72rem",
                color: "#777",
                margin: "5px 0 0 0",
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
            fontSize: "0.78rem",
            padding: "13px",
            letterSpacing: "0.08em",
          }}
        >
          MAIN MENU
        </button>
      </div>
    </div>
  );
}
