import { useCallback, useEffect, useRef, useState } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  useGameEngine,
} from "../game/useGameEngine";
import { useSoundManager } from "../hooks/useSoundManager";
import { GameHUD } from "./GameHUD";
import { GameOverScreen } from "./GameOverScreen";
import { MobileControls } from "./MobileControls";

const SWIPE_THRESHOLD = 30; // minimum px to register as a swipe

interface GameScreenProps {
  onReturnToMenu: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

const DIR_TO_KEY: Record<"up" | "down" | "left" | "right", string> = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
};

export function GameScreen({
  onReturnToMenu,
  muted,
  onToggleMute,
}: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // React state only for UI overlay
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [powerUpActive, setPowerUpActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [bossResult, setBossResult] = useState<"survived" | "died" | null>(
    null,
  );
  const [gameWon, setGameWon] = useState(false);
  const [wonScore, setWonScore] = useState(0);

  const sounds = useSoundManager(muted);
  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;

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
    // Start game with sound callbacks — use soundsRef so muted state is
    // always current without restarting the game loop on every mute toggle
    startGame({
      onScoreChange: setScore,
      onLivesChange: setLives,
      onLevelChange: setLevel,
      onGameOver: (finalSc) => {
        soundsRef.current.playGameOver();
        setFinalScore(finalSc);
        setIsGameOver(true);
      },
      onPowerUpChange: setPowerUpActive,
      onCollect: (type) => {
        if (type === "goldenApple") {
          soundsRef.current.playPowerUp();
        } else {
          soundsRef.current.playCollect();
        }
      },
      onEnemyEat: () => soundsRef.current.playEnemyEat(),
      onLifeLost: () => soundsRef.current.playLifeLost(),
      onLevelComplete: () => soundsRef.current.playLevelComplete(),
      onBossDefeated: () => {
        soundsRef.current.playBossSurvived();
        setBossResult("survived");
        setTimeout(() => setBossResult(null), 2800);
      },
      onBossKilled: () => {
        soundsRef.current.playBossDied();
        setBossResult("died");
        setTimeout(() => setBossResult(null), 2500);
      },
      onGameWon: (finalSc) => {
        soundsRef.current.playLevelComplete();
        setWonScore(finalSc);
        setGameWon(true);
      },
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
    <>
      <style>{`
      @keyframes mazeSpin {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
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
            border: "1px solid #3a3a3a",
            borderRadius: "12px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
            overflow: "hidden",
          }}
        >
          {/* HUD */}
          <GameHUD
            score={score}
            lives={lives}
            level={level}
            powerUpActive={powerUpActive}
            muted={muted}
            onToggleMute={onToggleMute}
          />

          {/* Canvas wrapper */}
          <div
            style={{
              position: "relative",
              lineHeight: 0,
              animation: "mazeSpin 25s linear infinite",
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

            {/* Victory overlay — all 10 levels complete */}
            {gameWon && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,15,0,0.90)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  zIndex: 50,
                  gap: "16px",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "clamp(1.8rem, 6vw, 3rem)",
                    fontWeight: 900,
                    color: "#ffd700",
                    textShadow:
                      "0 0 40px rgba(255,215,0,0.8), 0 0 12px rgba(255,215,0,0.5)",
                    letterSpacing: "0.08em",
                    textAlign: "center",
                    animation:
                      "popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)",
                  }}
                >
                  🏆 YOU WIN! 🏆
                </div>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "clamp(0.9rem, 2.5vw, 1.2rem)",
                    color: "#adf0ad",
                    textAlign: "center",
                    opacity: 0.9,
                    letterSpacing: "0.05em",
                  }}
                >
                  All 10 Levels Complete!
                </div>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "clamp(1rem, 3vw, 1.5rem)",
                    fontWeight: 700,
                    color: "#68e068",
                    letterSpacing: "0.06em",
                  }}
                >
                  Final Score: {wonScore.toLocaleString()}
                </div>
                <button
                  type="button"
                  className="mc-button"
                  data-ocid="game.win.button"
                  onClick={handleReturnToMenu}
                  style={{
                    marginTop: "12px",
                    fontSize: "0.85rem",
                    padding: "10px 24px",
                    letterSpacing: "0.08em",
                  }}
                >
                  BACK TO MENU
                </button>
              </div>
            )}

            {/* Boss result overlay */}
            {bossResult && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    bossResult === "survived"
                      ? "rgba(0,20,0,0.82)"
                      : "rgba(30,0,0,0.85)",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  zIndex: 40,
                  animation: "fadeIn 0.25s ease",
                }}
              >
                {bossResult === "survived" ? (
                  <>
                    <div
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "clamp(1.6rem, 5vw, 2.6rem)",
                        fontWeight: 900,
                        color: "#68e068",
                        textShadow:
                          "0 0 32px rgba(100,230,80,0.7), 0 0 8px rgba(100,230,80,0.4)",
                        letterSpacing: "0.1em",
                        textAlign: "center",
                        padding: "0 12px",
                        animation:
                          "popIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)",
                      }}
                    >
                      YOU SURVIVED!
                    </div>
                    <div
                      style={{
                        marginTop: "12px",
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "0.85rem",
                        color: "#adf0ad",
                        opacity: 0.8,
                        letterSpacing: "0.08em",
                      }}
                    >
                      Advancing to the next level...
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "clamp(1.6rem, 5vw, 2.6rem)",
                        fontWeight: 900,
                        color: "#e05030",
                        textShadow:
                          "0 0 32px rgba(220,70,40,0.7), 0 0 8px rgba(220,70,40,0.4)",
                        letterSpacing: "0.1em",
                        textAlign: "center",
                        padding: "0 12px",
                        animation:
                          "popIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)",
                      }}
                    >
                      YOU DIED
                    </div>
                    <div
                      style={{
                        marginTop: "12px",
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "0.85rem",
                        color: "#f0a090",
                        opacity: 0.8,
                        letterSpacing: "0.08em",
                      }}
                    >
                      The boss got you. Back to level 1...
                    </div>
                  </>
                )}
              </div>
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
              background: "rgba(0,0,0,0.5)",
              borderTop: "1px solid #2a2a2a",
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
              { key: "💣", desc: "Blast enemies" },
              { key: "🌀", desc: "Teleport" },
              { key: "👻", desc: "Ghost 5s" },
              { key: "🧊", desc: "Freeze 4s" },
              { key: "⚡", desc: "Speed 5s" },
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
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.6rem",
                    color: "#f0c030",
                    background: "rgba(240,192,48,0.08)",
                    border: "1px solid rgba(240,192,48,0.25)",
                    borderRadius: "4px",
                    padding: "2px 5px",
                  }}
                >
                  {key}
                </span>
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "0.6rem",
                    color: "#555",
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
            fontSize: "0.7rem",
            padding: "8px 18px",
            letterSpacing: "0.08em",
            opacity: 0.85,
          }}
        >
          ← MENU
        </button>

        {/* Footer */}
        <footer
          style={{
            marginTop: "16px",
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.6rem",
            color: "#444",
            textAlign: "center",
            letterSpacing: "0.03em",
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
    </>
  );
}
