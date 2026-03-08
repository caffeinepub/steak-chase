import { useCallback, useEffect, useRef, useState } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  useGameEngine,
} from "../game/useGameEngine";
import { GameHUD } from "./GameHUD";
import { GameOverScreen } from "./GameOverScreen";
import { MobileControls } from "./MobileControls";

const SWIPE_THRESHOLD = 30; // minimum px to register as a swipe

interface GameScreenProps {
  onReturnToMenu: () => void;
}

const DIR_TO_KEY: Record<"up" | "down" | "left" | "right", string> = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
};

export function GameScreen({ onReturnToMenu }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // React state only for UI overlay
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [powerUpActive, setPowerUpActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const { startGame, stopGame, handleKeyDown, handleKeyUp } =
    useGameEngine(canvasRef);

  const handleReturnToMenu = useCallback(() => {
    stopGame();
    onReturnToMenu();
  }, [stopGame, onReturnToMenu]);

  const handleMobileDirection = useCallback(
    (dir: "up" | "down" | "left" | "right") => {
      handleKeyDown(new KeyboardEvent("keydown", { key: DIR_TO_KEY[dir] }));
    },
    [handleKeyDown],
  );

  const handleMobileRelease = useCallback(
    (dir: "up" | "down" | "left" | "right") => {
      handleKeyUp(new KeyboardEvent("keyup", { key: DIR_TO_KEY[dir] }));
    },
    [handleKeyUp],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Only register if swipe distance exceeds threshold
      if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) return;

      let key: string;
      if (absX >= absY) {
        key = deltaX > 0 ? "ArrowRight" : "ArrowLeft";
      } else {
        key = deltaY > 0 ? "ArrowDown" : "ArrowUp";
      }

      handleKeyDown(new KeyboardEvent("keydown", { key }));
      setTimeout(() => {
        handleKeyUp(new KeyboardEvent("keyup", { key }));
      }, 50);
    },
    [handleKeyDown, handleKeyUp],
  );

  useEffect(() => {
    // Start game
    startGame({
      onScoreChange: setScore,
      onLivesChange: setLives,
      onLevelChange: setLevel,
      onGameOver: (finalSc) => {
        setFinalScore(finalSc);
        setIsGameOver(true);
      },
      onPowerUpChange: setPowerUpActive,
    });

    // Keyboard listeners
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      stopGame();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startGame, stopGame, handleKeyDown, handleKeyUp]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0d1a06 0%, #1a2f0a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
      }}
    >
      {/* Game frame */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "#1a1a1a",
          border: "4px solid #5a5a5a",
          borderTop: "4px solid #8a8a8a",
          borderLeft: "4px solid #8a8a8a",
          boxShadow: "6px 6px 0 #000, 0 0 40px rgba(0,0,0,0.8)",
        }}
      >
        {/* HUD */}
        <GameHUD
          score={score}
          lives={lives}
          level={level}
          powerUpActive={powerUpActive}
        />

        {/* Canvas wrapper */}
        <div
          style={{
            position: "relative",
            lineHeight: 0,
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            data-ocid="game.canvas_target"
            style={{
              display: "block",
              imageRendering: "pixelated",
            }}
          />

          {/* Game Over overlay */}
          {isGameOver && (
            <GameOverScreen
              score={finalScore}
              level={level}
              onReturnToMenu={handleReturnToMenu}
            />
          )}
        </div>

        {/* Mobile D-pad controls — hidden on desktop pointer devices */}
        <div className="mobile-only">
          <MobileControls
            onDirection={handleMobileDirection}
            onRelease={handleMobileRelease}
          />
        </div>

        {/* Control hints bar */}
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            borderTop: "2px solid #3a3a3a",
            padding: "6px 12px",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {[
            { key: "WASD / ↑↓←→", desc: "Move" },
            { key: "🍎", desc: "Power-Up" },
            { key: "🥩", desc: "10pts" },
            { key: "🍖", desc: "30pts" },
          ].map(({ key, desc }) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.5rem",
                  color: "#f0c030",
                  background: "rgba(240,192,48,0.1)",
                  border: "1px solid rgba(240,192,48,0.3)",
                  padding: "2px 4px",
                }}
              >
                {key}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.45rem",
                  color: "#666",
                }}
              >
                {desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Back button */}
      <button
        type="button"
        className="mc-button"
        onClick={handleReturnToMenu}
        style={{
          marginTop: "16px",
          fontSize: "0.6rem",
          padding: "8px 16px",
          letterSpacing: "0.1em",
          opacity: 0.8,
        }}
      >
        ← MENU
      </button>

      {/* Footer */}
      <footer
        style={{
          marginTop: "16px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.45rem",
          color: "#444",
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
