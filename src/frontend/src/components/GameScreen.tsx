import { useCallback, useEffect, useRef, useState } from "react";
import { LEVEL_DURATION_SECONDS } from "../game/constants";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type SessionStats,
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
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  // Scale factor for the canvas CSS transform
  const [canvasScale, setCanvasScale] = useState(1);

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
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    enemiesDefeated: 0,
    rareItemsCollected: 0,
    bossesDefeated: 0,
  });
  const [isBossPhase, setIsBossPhase] = useState(false);
  // Life-lost signal: incremented each time a life is lost to trigger HUD flash
  const [lifeLostSignal, setLifeLostSignal] = useState(0);
  // Level countdown timer
  const [timeLeft, setTimeLeft] = useState(LEVEL_DURATION_SECONDS);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Rare item notification popup
  const [showRarePopup, setShowRarePopup] = useState(false);
  const rarePopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Slow spin: once per level for 4 seconds
  const [slowSpinUsed, setSlowSpinUsed] = useState(false);
  const [slowSpinActive, setSlowSpinActive] = useState(false);
  const slowSpinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Spin delay: spin doesn't start immediately; level 1 waits 5s, others wait 10s
  const [spinReady, setSpinReady] = useState(false);
  const spinDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sounds = useSoundManager(muted);
  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;

  const { startGame, stopGame, handleKeyDown, handleKeyUp } =
    useGameEngine(canvasRef);

  // ── Canvas scale via ResizeObserver ──────────────────────────────────────
  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const recalcScale = () => {
      const { width, height } = wrapper.getBoundingClientRect();
      if (width === 0) return;
      // Reserve ~65px for HUD and ~150px for bottom controls
      const viewportBudget = window.innerHeight - 65 - 150;
      const effectiveH = Math.min(
        height > 0 ? height : viewportBudget,
        viewportBudget,
      );
      const scale = Math.min(
        width / CANVAS_WIDTH,
        effectiveH / CANVAS_HEIGHT,
        1, // never scale up
      );
      setCanvasScale(scale);
    };

    const ro = new ResizeObserver(recalcScale);
    ro.observe(wrapper);
    recalcScale(); // initial calculation

    return () => ro.disconnect();
  }, []);

  // Start/reset the per-level countdown
  const startLevelTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimeLeft(LEVEL_DURATION_SECONDS);
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  const handleReturnToMenu = useCallback(() => {
    stopGame();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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

  // Start the delay before spin kicks in.
  const startSpinDelay = useCallback((lvl: number) => {
    setSpinReady(false);
    if (spinDelayRef.current) clearTimeout(spinDelayRef.current);
    const delay = lvl === 1 ? 5000 : 10000;
    spinDelayRef.current = setTimeout(() => {
      setSpinReady(true);
    }, delay);
  }, []);

  useEffect(() => {
    startGame({
      onScoreChange: setScore,
      onLivesChange: setLives,
      onLevelChange: (lvl) => {
        setLevel(lvl);
        setSlowSpinUsed(false);
        setSlowSpinActive(false);
        if (slowSpinTimerRef.current) clearTimeout(slowSpinTimerRef.current);
        startLevelTimer();
        startSpinDelay(lvl);
      },
      onGameOver: (finalSc, stats) => {
        soundsRef.current.playGameOver();
        setFinalScore(finalSc);
        setSessionStats(stats);
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
      onLifeLost: () => {
        soundsRef.current.playLifeLost();
        setLifeLostSignal((s) => s + 1);
      },
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
      onGameWon: (finalSc, stats) => {
        soundsRef.current.playLevelComplete();
        setWonScore(finalSc);
        setSessionStats(stats);
        setGameWon(true);
      },
      onBossPhaseChange: (active) => {
        setIsBossPhase(active);
      },
      onRareItemSpawned: () => {
        setShowRarePopup(true);
        if (rarePopupTimerRef.current) clearTimeout(rarePopupTimerRef.current);
        rarePopupTimerRef.current = setTimeout(() => {
          setShowRarePopup(false);
        }, 3500);
      },
    });

    startLevelTimer();
    startSpinDelay(1);

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      stopGame();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (spinDelayRef.current) clearTimeout(spinDelayRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    startGame,
    stopGame,
    handleKeyDown,
    handleKeyUp,
    startLevelTimer,
    startSpinDelay,
  ]);

  // Pause / resume timer based on boss phase, game over, win
  useEffect(() => {
    if (isBossPhase || isGameOver || gameWon) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [isBossPhase, isGameOver, gameWon]);

  const handleSlowSpin = useCallback(() => {
    if (slowSpinUsed || isBossPhase) return;
    setSlowSpinUsed(true);
    setSlowSpinActive(true);
    slowSpinTimerRef.current = setTimeout(() => {
      setSlowSpinActive(false);
    }, 5000);
  }, [slowSpinUsed, isBossPhase]);

  const spinPaused =
    isBossPhase || isGameOver || gameWon || bossResult !== null;

  // The canvas visually occupies canvasScale * CANVAS dimensions.
  // We set the spinning wrapper to that exact size so the layout box matches
  // the visual footprint. The canvas inside is also sized to scaledW x scaledH
  // (CSS dimensions) while keeping its pixel resolution at CANVAS_WIDTH x CANVAS_HEIGHT.
  // The spin animation only rotates — no scale() in keyframes — and uses
  // transformOrigin: "center center" so it spins around its own centre.
  const scaledW = CANVAS_WIDTH * canvasScale;
  const scaledH = CANVAS_HEIGHT * canvasScale;

  return (
    <>
      <style>{`
      @keyframes mazeSpin {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes mazeSpin2 {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes rarePopIn {
        0%   { opacity: 0; transform: translateX(-50%) scale(0.7); }
        100% { opacity: 1; transform: translateX(-50%) scale(1); }
      }
      @keyframes rarePulseText {
        0%   { text-shadow: 0 0 18px rgba(255,200,0,0.9), 0 0 6px rgba(255,120,0,0.6); }
        100% { text-shadow: 0 0 30px rgba(255,220,0,1), 0 0 14px rgba(255,180,0,0.9), 0 0 4px rgba(255,60,200,0.5); }
      }
      @keyframes scoreShake {
        0%   { transform: translateX(0); }
        15%  { transform: translateX(-6px) rotate(-2deg); }
        30%  { transform: translateX(6px) rotate(2deg); }
        45%  { transform: translateX(-5px) rotate(-1deg); }
        60%  { transform: translateX(5px) rotate(1deg); }
        75%  { transform: translateX(-3px); }
        90%  { transform: translateX(3px); }
        100% { transform: translateX(0); }
      }
      .score-life-lost {
        animation: scoreShake 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both !important;
      }
      /* Hide hints bar on small screens to save vertical space */
      @media (max-height: 700px), (max-width: 500px) {
        .desktop-hints {
          display: none !important;
        }
      }
    `}</style>
      {/* Root: full viewport, flex column, no scrolling */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          height: "100dvh",
          maxHeight: "100dvh",
          width: "100vw",
          maxWidth: "100vw",
          overflow: "hidden",
          background: "linear-gradient(180deg, #0d1a06 0%, #1a2f0a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        {/* HUD — fixed height, never shrinks out of view */}
        <div
          style={{
            width: "100%",
            maxWidth: "100%",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <GameHUD
            score={score}
            lives={lives}
            level={level}
            powerUpActive={powerUpActive}
            muted={muted}
            onToggleMute={onToggleMute}
            timeLeft={timeLeft}
            lifeLostSignal={lifeLostSignal}
          />
        </div>

        {/* Canvas area — flex:1 so it takes all remaining space */}
        <div
          ref={canvasWrapperRef}
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            maxWidth: "100%",
            maxHeight: "calc(100dvh - 65px - 150px)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/*
           * Spinning wrapper:
           * - Width/height are set to the SCALED dimensions so the layout box
           *   matches the visual footprint exactly.
           * - transformOrigin: "center center" ensures rotation happens around
           *   the centre of the element, not the top-left corner.
           * - The spin animation ONLY rotates — no scale() in keyframes.
           *   Scale is handled by the explicit width/height above.
           * - When not spinning, transform: "none" (NOT scale()) since the
           *   wrapper dimensions already account for scaling.
           */}
          <div
            style={{
              position: "relative",
              lineHeight: 0,
              width: scaledW,
              height: scaledH,
              flexShrink: 0,
              transformOrigin: "center center",
              animation:
                spinPaused || !spinReady
                  ? "none"
                  : slowSpinActive
                    ? "mazeSpin2 100s linear infinite"
                    : "mazeSpin2 25s linear infinite",
              transform: spinPaused || !spinReady ? "none" : undefined,
            }}
          >
            {/*
             * Canvas: CSS width/height match the scaled dimensions so it fills
             * the wrapper exactly. The width/height HTML attributes remain at
             * CANVAS_WIDTH x CANVAS_HEIGHT to preserve pixel resolution.
             * No transform: scale() here — the wrapper handles sizing.
             */}
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              data-ocid="game.canvas_target"
              style={{
                display: "block",
                imageRendering: "pixelated",
                width: scaledW,
                height: scaledH,
              }}
            />
          </div>

          {/* Game Over overlay — positioned over the canvas area */}
          {isGameOver && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 60,
              }}
            >
              <GameOverScreen
                score={finalScore}
                level={level}
                stats={sessionStats}
                onReturnToMenu={handleReturnToMenu}
              />
            </div>
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
                gap: "12px",
                padding: "16px",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "clamp(1.4rem, 5vw, 3rem)",
                  fontWeight: 900,
                  color: "#ffd700",
                  textShadow:
                    "0 0 40px rgba(255,215,0,0.8), 0 0 12px rgba(255,215,0,0.5)",
                  letterSpacing: "0.08em",
                  textAlign: "center",
                  animation: "popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)",
                }}
              >
                🏆 YOU WIN! 🏆
              </div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "clamp(0.75rem, 2.5vw, 1.2rem)",
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
                  fontSize: "clamp(0.9rem, 3vw, 1.5rem)",
                  fontWeight: 700,
                  color: "#68e068",
                  letterSpacing: "0.06em",
                }}
              >
                Final Score: {wonScore.toLocaleString()}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: "4px",
                }}
              >
                {[
                  {
                    icon: "☠️",
                    label: "Enemies Defeated",
                    value: sessionStats.enemiesDefeated,
                  },
                  {
                    icon: "⭐",
                    label: "Rare Items",
                    value: sessionStats.rareItemsCollected,
                  },
                  {
                    icon: "💀",
                    label: "Bosses Beaten",
                    value: sessionStats.bossesDefeated,
                  },
                ].map(({ icon, label, value }) => (
                  <div
                    key={label}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,215,0,0.2)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      textAlign: "center",
                      minWidth: "70px",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <div style={{ fontSize: "1rem", marginBottom: "2px" }}>
                      {icon}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "1.1rem",
                        fontWeight: 900,
                        color: "#ffd700",
                        textShadow: "0 0 10px rgba(255,215,0,0.4)",
                        lineHeight: 1,
                      }}
                    >
                      {value}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "0.55rem",
                        fontWeight: 600,
                        color: "#888",
                        letterSpacing: "0.06em",
                        marginTop: "3px",
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="mc-button"
                data-ocid="game.win.button"
                onClick={handleReturnToMenu}
                style={{
                  marginTop: "8px",
                  fontSize: "0.8rem",
                  padding: "8px 20px",
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
                      fontSize: "clamp(1.4rem, 5vw, 2.6rem)",
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
                      marginTop: "10px",
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "0.8rem",
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
                      fontSize: "clamp(1.4rem, 5vw, 2.6rem)",
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
                      marginTop: "10px",
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "0.8rem",
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

          {/* Rare item spawn notification */}
          {showRarePopup && (
            <div
              style={{
                position: "absolute",
                top: "12%",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 35,
                pointerEvents: "none",
                animation:
                  "rarePopIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(0.65rem, 2.5vw, 1rem)",
                  letterSpacing: "0.06em",
                  textAlign: "center",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  background: "rgba(10,5,20,0.82)",
                  border: "1.5px solid rgba(255,200,60,0.7)",
                  color: "#ffd700",
                  textShadow:
                    "0 0 18px rgba(255,200,0,0.9), 0 0 6px rgba(255,120,0,0.6)",
                  boxShadow:
                    "0 0 22px rgba(255,180,0,0.35), 0 0 6px rgba(255,80,200,0.2)",
                  whiteSpace: "nowrap",
                  animation:
                    "rarePulseText 0.7s ease-in-out infinite alternate",
                }}
              >
                ⭐ Find the rare item before it disappears! ⭐
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom controls section — flex-shrink:0, always visible ── */}
        <div
          style={{
            flexShrink: 0,
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
            background: "rgba(0,0,0,0.5)",
            borderTop: "1px solid #2a2a2a",
          }}
        >
          {/* Mobile D-pad — hidden on desktop pointer devices */}
          <div className="mobile-only">
            <MobileControls
              onDirection={handleMobileDirection}
              onRelease={handleMobileRelease}
            />
          </div>

          {/* Slow spin button */}
          <div
            style={{
              padding: "3px 12px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              data-ocid="game.slow_spin.button"
              onClick={handleSlowSpin}
              disabled={slowSpinUsed || isBossPhase}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "0.55rem",
                letterSpacing: "0.07em",
                padding: "2px 10px",
                borderRadius: "6px",
                border: "1px solid",
                cursor: slowSpinUsed || isBossPhase ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                background: slowSpinActive
                  ? "rgba(100,200,255,0.18)"
                  : slowSpinUsed
                    ? "rgba(60,60,60,0.4)"
                    : "rgba(240,192,48,0.12)",
                borderColor: slowSpinActive
                  ? "rgba(100,200,255,0.6)"
                  : slowSpinUsed
                    ? "rgba(80,80,80,0.5)"
                    : "rgba(240,192,48,0.45)",
                color: slowSpinActive
                  ? "#a0e8ff"
                  : slowSpinUsed
                    ? "#555"
                    : "#f0c030",
              }}
            >
              {slowSpinActive
                ? "🌀 SLOWING..."
                : slowSpinUsed
                  ? "🌀 USED"
                  : "🌀 SLOW SPIN (once)"}
            </button>
          </div>

          {/* Control hints bar — hidden on mobile/small screens */}
          <div
            className="desktop-hints"
            style={{
              padding: "3px 8px 5px",
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "5px",
              overflowX: "auto",
            }}
          >
            {[
              { key: "WASD/↑↓←→", desc: "Move" },
              { key: "🍎", desc: "Power" },
              { key: "🥩", desc: "10pt" },
              { key: "🍖", desc: "30pt" },
              { key: "💣", desc: "Blast" },
              { key: "🌀", desc: "Port" },
              { key: "👻", desc: "Ghost" },
              { key: "🧊", desc: "Freeze" },
              { key: "⚡", desc: "Speed" },
              { key: "🟣", desc: "Invinc" },
              { key: "🔷", desc: "Destroy" },
              { key: "🧭", desc: "Path" },
            ].map(({ key, desc }) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.55rem",
                    color: "#f0c030",
                    background: "rgba(240,192,48,0.08)",
                    border: "1px solid rgba(240,192,48,0.25)",
                    borderRadius: "4px",
                    padding: "1px 4px",
                  }}
                >
                  {key}
                </span>
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "0.55rem",
                    color: "#555",
                  }}
                >
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
