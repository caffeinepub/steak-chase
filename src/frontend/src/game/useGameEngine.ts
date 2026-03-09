import { useCallback, useEffect, useRef } from "react";
import {
  BOSS_COL,
  BOSS_DURATION,
  BOSS_KILL_DISTANCE,
  BOSS_ROW,
  COLS,
  type Direction,
  ENEMY_STARTS,
  EXPLOSION_RADIUS,
  type EnemyType,
  INITIAL_MAZE,
  PLAYER_SPEED,
  PLAYER_START,
  PORTAL_PAIRS,
  POWER_UP_DURATION,
  POWER_UP_ENEMY_SPEED_MULTIPLIER,
  ROWS,
  SCORE,
  SKELETON_SPEED,
  TILE,
  TILE_SIZE,
  ZOMBIE_SPEED,
} from "./constants";
import {
  bfsNextStep,
  randomAdjacentStep,
  straightLineStep,
} from "./pathfinding";
import { type RenderEnemy, preloadImages, renderFrame } from "./renderer";

export interface GameEnemy {
  id: number;
  col: number;
  row: number;
  type: EnemyType;
  scared: boolean;
  lastMoveTime: number;
  startCol: number;
  startRow: number;
  dead: boolean; // sent back to ghost house
  respawnTimer: number;
  // Skeleton straight-line direction (dc, dr)
  straightDir: { col: number; row: number };
}

export interface GameState {
  maze: number[][];
  player: { col: number; row: number };
  enemies: GameEnemy[];
  score: number;
  lives: number;
  level: number;
  powerUpActive: boolean;
  powerUpEndTime: number;
  enemyEatChain: number; // for increasing eat reward
  pendingDirection: Direction;
  currentDirection: Direction;
  lastPlayerMoveTime: number;
  gameOver: boolean;
  levelComplete: boolean;
  paused: boolean;
  totalCollectibles: number;
  collectedCount: number;
  // Explosion flash effect (timestamp when triggered)
  explosionFlashUntil: number;
  // Boss battle phase
  bossPhase: boolean;
  bossStartTime: number;
  bossDefeated: boolean;
}

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (score: number) => void;
  onPowerUpChange: (active: boolean) => void;
  onCollect?: (
    type: "steak" | "porkChop" | "goldenApple" | "explosion" | "portal",
  ) => void;
  onPowerUp?: () => void;
  onEnemyEat?: () => void;
  onLifeLost?: () => void;
  onLevelComplete?: () => void;
}

function cloneMaze(maze: number[][]): number[][] {
  return maze.map((row) => [...row]);
}

function countCollectibles(maze: number[][]): number {
  let count = 0;
  for (const row of maze) {
    for (const cell of row) {
      if (
        cell === TILE.STEAK ||
        cell === TILE.PORK_CHOP ||
        cell === TILE.GOLDEN_APPLE
      ) {
        count++;
      }
    }
  }
  return count;
}

export function useGameEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const stateRef = useRef<GameState | null>(null);
  const callbacksRef = useRef<GameCallbacks | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const keysHeldRef = useRef<Set<string>>(new Set());
  const levelRef = useRef<number>(1);

  // Preload images once
  useEffect(() => {
    preloadImages();
  }, []);

  const initState = useCallback((level: number): GameState => {
    const maze = cloneMaze(INITIAL_MAZE);
    const total = countCollectibles(maze);
    // Random initial directions for skeletons
    const initDirs = [
      { col: 1, row: 0 },
      { col: -1, row: 0 },
      { col: 0, row: 1 },
      { col: 0, row: -1 },
    ];
    const enemies: GameEnemy[] = ENEMY_STARTS.map((e, i) => ({
      id: i,
      col: e.col,
      row: e.row,
      type: e.type,
      scared: false,
      lastMoveTime: 0,
      startCol: e.col,
      startRow: e.row,
      dead: false,
      respawnTimer: 0,
      straightDir: initDirs[i % initDirs.length],
    }));

    return {
      maze,
      player: { ...PLAYER_START },
      enemies,
      score: stateRef.current?.score ?? 0,
      lives: stateRef.current?.lives ?? 3,
      level,
      powerUpActive: false,
      powerUpEndTime: 0,
      enemyEatChain: 0,
      pendingDirection: "none",
      currentDirection: "none",
      lastPlayerMoveTime: 0,
      gameOver: false,
      levelComplete: false,
      paused: false,
      totalCollectibles: total,
      collectedCount: 0,
      explosionFlashUntil: 0,
      bossPhase: false,
      bossStartTime: 0,
      bossDefeated: false,
    };
  }, []);

  const resetPositions = useCallback((state: GameState): void => {
    state.player = { ...PLAYER_START };
    state.currentDirection = "none";
    state.pendingDirection = "none";
    const initDirs = [
      { col: 1, row: 0 },
      { col: -1, row: 0 },
      { col: 0, row: 1 },
      { col: 0, row: -1 },
    ];
    for (const e of state.enemies) {
      e.col = e.startCol;
      e.row = e.startRow;
      e.scared = false;
      e.dead = false;
      e.respawnTimer = 0;
      e.straightDir = initDirs[e.id % initDirs.length];
    }
    state.powerUpActive = false;
    state.powerUpEndTime = 0;
    state.enemyEatChain = 0;
  }, []);

  const movePlayer = useCallback((state: GameState, now: number): void => {
    const speedMs = PLAYER_SPEED;
    if (now - state.lastPlayerMoveTime < speedMs) return;

    // Check held keys for direction
    const held = keysHeldRef.current;
    if (held.has("ArrowUp") || held.has("w") || held.has("W"))
      state.pendingDirection = "up";
    else if (held.has("ArrowDown") || held.has("s") || held.has("S"))
      state.pendingDirection = "down";
    else if (held.has("ArrowLeft") || held.has("a") || held.has("A"))
      state.pendingDirection = "left";
    else if (held.has("ArrowRight") || held.has("d") || held.has("D"))
      state.pendingDirection = "right";

    const { player, maze } = state;

    const dirVec: Record<Direction, { dc: number; dr: number }> = {
      up: { dc: 0, dr: -1 },
      down: { dc: 0, dr: 1 },
      left: { dc: -1, dr: 0 },
      right: { dc: 1, dr: 0 },
      none: { dc: 0, dr: 0 },
    };

    // Try pending direction first, fall back to current
    const tryMove = (dir: Direction): boolean => {
      if (dir === "none") return false;
      const { dc, dr } = dirVec[dir];
      const nc = player.col + dc;
      const nr = player.row + dr;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) return false;
      if (maze[nr][nc] === TILE.WALL) return false;
      player.col = nc;
      player.row = nr;
      state.currentDirection = dir;
      return true;
    };

    if (!tryMove(state.pendingDirection)) {
      tryMove(state.currentDirection);
    } else {
      state.pendingDirection = "none";
    }

    state.lastPlayerMoveTime = now;

    // Collect item
    const cell = maze[player.row][player.col];
    if (cell === TILE.STEAK) {
      maze[player.row][player.col] = TILE.PATH;
      state.score += SCORE.STEAK;
      state.collectedCount++;
      callbacksRef.current?.onScoreChange(state.score);
      callbacksRef.current?.onCollect?.("steak");
    } else if (cell === TILE.PORK_CHOP) {
      maze[player.row][player.col] = TILE.PATH;
      state.score += SCORE.PORK_CHOP;
      state.collectedCount++;
      callbacksRef.current?.onScoreChange(state.score);
      callbacksRef.current?.onCollect?.("porkChop");
    } else if (cell === TILE.GOLDEN_APPLE) {
      maze[player.row][player.col] = TILE.PATH;
      state.score += SCORE.GOLDEN_APPLE;
      state.collectedCount++;
      state.powerUpActive = true;
      state.powerUpEndTime = now + POWER_UP_DURATION;
      state.enemyEatChain = 0;
      for (const e of state.enemies) {
        if (!e.dead) e.scared = true;
      }
      callbacksRef.current?.onScoreChange(state.score);
      callbacksRef.current?.onPowerUpChange(true);
      callbacksRef.current?.onCollect?.("goldenApple");
    } else if (cell === TILE.EXPLOSION) {
      // Explosion: clear enemies within radius, award score per enemy killed
      maze[player.row][player.col] = TILE.PATH;
      let killed = 0;
      for (const e of state.enemies) {
        if (e.dead) continue;
        const dist =
          Math.abs(e.col - player.col) + Math.abs(e.row - player.row);
        if (dist <= EXPLOSION_RADIUS) {
          e.dead = true;
          e.respawnTimer = 4000;
          killed++;
        }
      }
      state.score += SCORE.EXPLOSION + killed * SCORE.ENEMY_BASE;
      state.explosionFlashUntil = now + 400;
      callbacksRef.current?.onScoreChange(state.score);
      callbacksRef.current?.onCollect?.("explosion");
      if (killed > 0) callbacksRef.current?.onEnemyEat?.();
    } else if (cell === TILE.PORTAL) {
      // Portal: teleport to paired portal
      for (const [a, b] of PORTAL_PAIRS) {
        if (player.col === a.col && player.row === a.row) {
          player.col = b.col;
          player.row = b.row;
          callbacksRef.current?.onCollect?.("portal");
          break;
        }
        if (player.col === b.col && player.row === b.row) {
          player.col = a.col;
          player.row = a.row;
          callbacksRef.current?.onCollect?.("portal");
          break;
        }
      }
    }
  }, []);

  const moveEnemies = useCallback((state: GameState, now: number): void => {
    const speedMultiplier = state.powerUpActive
      ? POWER_UP_ENEMY_SPEED_MULTIPLIER
      : 1;
    const levelSpeedBonus = 1 + (state.level - 1) * 0.12;

    for (const enemy of state.enemies) {
      if (enemy.dead) {
        enemy.respawnTimer -= 16;
        if (enemy.respawnTimer <= 0) {
          enemy.col = enemy.startCol;
          enemy.row = enemy.startRow;
          enemy.dead = false;
          enemy.scared = false;
        }
        continue;
      }

      const baseSpeed = enemy.type === "zombie" ? ZOMBIE_SPEED : SKELETON_SPEED;
      const effectiveSpeed = (baseSpeed * speedMultiplier) / levelSpeedBonus;

      if (now - enemy.lastMoveTime < effectiveSpeed) continue;
      enemy.lastMoveTime = now;

      if (state.powerUpActive && enemy.scared) {
        // Flee randomly (both types)
        const next = randomAdjacentStep(
          state.maze,
          { col: enemy.col, row: enemy.row },
          ROWS,
          COLS,
        );
        if (next !== null) {
          enemy.col = next.col;
          enemy.row = next.row;
        }
      } else if (enemy.type === "zombie") {
        // Zombie: slow but always chases player via BFS
        const next = bfsNextStep(
          state.maze,
          { col: enemy.col, row: enemy.row },
          { col: state.player.col, row: state.player.row },
          ROWS,
          COLS,
        );
        if (next !== null) {
          enemy.col = next.col;
          enemy.row = next.row;
        }
      } else {
        // Skeleton: fast but can only move in straight lines
        const result = straightLineStep(
          state.maze,
          { col: enemy.col, row: enemy.row },
          enemy.straightDir,
          ROWS,
          COLS,
        );
        if (result !== null) {
          enemy.col = result.next.col;
          enemy.row = result.next.row;
          enemy.straightDir = result.newDir;
        }
      }
    }
  }, []);

  const checkCollisions = useCallback(
    (state: GameState): void => {
      for (const enemy of state.enemies) {
        if (enemy.dead) continue;
        if (enemy.col === state.player.col && enemy.row === state.player.row) {
          if (state.powerUpActive && enemy.scared) {
            // Eat enemy
            const reward = SCORE.ENEMY_BASE * 2 ** state.enemyEatChain;
            state.score += reward;
            state.enemyEatChain++;
            callbacksRef.current?.onScoreChange(state.score);
            callbacksRef.current?.onEnemyEat?.();
            enemy.dead = true;
            enemy.respawnTimer = 3000;
          } else {
            // Player dies
            state.lives--;
            callbacksRef.current?.onLivesChange(state.lives);
            callbacksRef.current?.onLifeLost?.();
            if (state.lives <= 0) {
              state.gameOver = true;
              callbacksRef.current?.onGameOver(state.score);
            } else {
              resetPositions(state);
            }
            return;
          }
        }
      }
    },
    [resetPositions],
  );

  const checkLevelComplete = useCallback(
    (state: GameState, now: number): void => {
      // Already in boss or level complete — skip
      if (state.bossPhase || state.levelComplete) return;

      let remaining = 0;
      for (const row of state.maze) {
        for (const cell of row) {
          if (
            cell === TILE.STEAK ||
            cell === TILE.PORK_CHOP ||
            cell === TILE.GOLDEN_APPLE
          ) {
            remaining++;
          }
        }
      }
      if (remaining === 0) {
        // Trigger boss phase instead of immediate level complete
        state.bossPhase = true;
        state.bossStartTime = now;
        state.bossDefeated = false;
        // Hide normal enemies during boss phase
        for (const e of state.enemies) {
          e.dead = true;
          e.respawnTimer = 999999;
        }
      }
    },
    [],
  );

  const gameLoop = useCallback(
    (timestamp: number): void => {
      if (!stateRef.current || !canvasRef.current) return;
      const state = stateRef.current;
      if (state.gameOver) return;

      const now = timestamp;

      // Check power-up expiry
      if (state.powerUpActive && now > state.powerUpEndTime) {
        state.powerUpActive = false;
        for (const e of state.enemies) {
          e.scared = false;
        }
        callbacksRef.current?.onPowerUpChange(false);
      }

      // Handle level complete transition
      if (state.levelComplete) {
        const newLevel = state.level + 1;
        levelRef.current = newLevel;
        const savedScore = state.score;
        const savedLives = state.lives;
        const newState = initState(newLevel);
        newState.score = savedScore;
        newState.lives = savedLives;
        stateRef.current = newState;
        callbacksRef.current?.onLevelChange(newLevel);
      } else if (state.bossPhase) {
        // Boss phase: player must survive BOSS_DURATION ms
        const elapsed = now - state.bossStartTime;
        const bossTimeLeft = Math.max(0, BOSS_DURATION - elapsed);

        // Still allow player movement
        movePlayer(state, now);

        // Check if player gets too close to the boss
        const dist =
          Math.abs(state.player.col - BOSS_COL) +
          Math.abs(state.player.row - BOSS_ROW);
        if (dist <= BOSS_KILL_DISTANCE) {
          // Boss kills player — restart from level 1, reset lives and score
          callbacksRef.current?.onLifeLost?.();
          // Full restart
          levelRef.current = 1;
          const restartState = initState(1);
          restartState.score = 0;
          restartState.lives = 3;
          stateRef.current = restartState;
          callbacksRef.current?.onScoreChange(0);
          callbacksRef.current?.onLivesChange(3);
          callbacksRef.current?.onLevelChange(1);
        } else if (bossTimeLeft <= 0) {
          // Survived! Level complete
          state.bossDefeated = true;
          state.bossPhase = false;
          state.score += state.level * 500;
          callbacksRef.current?.onScoreChange(state.score);
          callbacksRef.current?.onLevelComplete?.();
          state.levelComplete = true;
        }

        // Render with boss
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          renderFrame(
            ctx,
            {
              maze: state.maze,
              player: state.player,
              playerDirection: state.currentDirection,
              enemies: [],
              powerUpActive: false,
              powerUpTimeLeft: 0,
              totalPowerUpDuration: POWER_UP_DURATION,
              explosionFlash: false,
              bossPhase: true,
              bossTimeLeft,
              bossTotalTime: BOSS_DURATION,
            },
            now - startTimeRef.current,
          );
        }
      } else {
        movePlayer(state, now);
        moveEnemies(state, now);
        checkCollisions(state);
        checkLevelComplete(state, now);
      }

      // Render (normal phase — skipped if already rendered above)
      if (!state.bossPhase && !state.levelComplete) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          const renderEnemies: RenderEnemy[] = state.enemies.map((e) => ({
            col: e.col,
            row: e.row,
            type: e.type,
            scared: e.scared,
            visible: !e.dead,
          }));
          renderFrame(
            ctx,
            {
              maze: state.maze,
              player: state.player,
              playerDirection: state.currentDirection,
              enemies: renderEnemies,
              powerUpActive: state.powerUpActive,
              powerUpTimeLeft: state.powerUpActive
                ? Math.max(0, state.powerUpEndTime - now)
                : 0,
              totalPowerUpDuration: POWER_UP_DURATION,
              explosionFlash: now < state.explosionFlashUntil,
              bossPhase: false,
              bossTimeLeft: 0,
              bossTotalTime: BOSS_DURATION,
            },
            now - startTimeRef.current,
          );
        }
      }

      if (!state.gameOver) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
      }
    },
    [
      canvasRef,
      initState,
      movePlayer,
      moveEnemies,
      checkCollisions,
      checkLevelComplete,
    ],
  );

  const startGame = useCallback(
    (callbacks: GameCallbacks): void => {
      callbacksRef.current = callbacks;

      // Cancel any existing loop
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      levelRef.current = 1;
      const state = initState(1);
      stateRef.current = state;
      startTimeRef.current = performance.now();

      // Initial callbacks
      callbacks.onScoreChange(0);
      callbacks.onLivesChange(state.lives);
      callbacks.onLevelChange(1);

      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [initState, gameLoop],
  );

  const stopGame = useCallback((): void => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    stateRef.current = null;
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent): void => {
    keysHeldRef.current.add(e.key);
    // Prevent page scroll on arrow keys
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
    ) {
      e.preventDefault();
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent): void => {
    keysHeldRef.current.delete(e.key);
  }, []);

  return {
    startGame,
    stopGame,
    handleKeyDown,
    handleKeyUp,
    getState: () => stateRef.current,
  };
}

// Utility to get canvas size
export const CANVAS_WIDTH = COLS * TILE_SIZE;
export const CANVAS_HEIGHT = ROWS * TILE_SIZE;
