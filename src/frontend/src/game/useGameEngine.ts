import { useCallback, useEffect, useRef } from "react";
import {
  COLS,
  type Direction,
  ENEMY_STARTS,
  type EnemyType,
  INITIAL_MAZE,
  PLAYER_SPEED,
  PLAYER_START,
  POWER_UP_DURATION,
  POWER_UP_ENEMY_SPEED_MULTIPLIER,
  ROWS,
  SCORE,
  SKELETON_SPEED,
  TILE,
  TILE_SIZE,
  ZOMBIE_SPEED,
} from "./constants";
import { bfsNextStep, randomAdjacentStep } from "./pathfinding";
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
}

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (score: number) => void;
  onPowerUpChange: (active: boolean) => void;
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
    };
  }, []);

  const resetPositions = useCallback((state: GameState): void => {
    state.player = { ...PLAYER_START };
    state.currentDirection = "none";
    state.pendingDirection = "none";
    for (const e of state.enemies) {
      e.col = e.startCol;
      e.row = e.startRow;
      e.scared = false;
      e.dead = false;
      e.respawnTimer = 0;
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
    } else if (cell === TILE.PORK_CHOP) {
      maze[player.row][player.col] = TILE.PATH;
      state.score += SCORE.PORK_CHOP;
      state.collectedCount++;
      callbacksRef.current?.onScoreChange(state.score);
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

      let next: { col: number; row: number } | null = null;
      if (state.powerUpActive && enemy.scared) {
        // Flee randomly
        next = randomAdjacentStep(
          state.maze,
          { col: enemy.col, row: enemy.row },
          ROWS,
          COLS,
        );
      } else {
        // Chase player via BFS
        next = bfsNextStep(
          state.maze,
          { col: enemy.col, row: enemy.row },
          { col: state.player.col, row: state.player.row },
          ROWS,
          COLS,
        );
      }

      if (next !== null) {
        enemy.col = next.col;
        enemy.row = next.row;
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
            enemy.dead = true;
            enemy.respawnTimer = 3000;
          } else {
            // Player dies
            state.lives--;
            callbacksRef.current?.onLivesChange(state.lives);
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

  const checkLevelComplete = useCallback((state: GameState): void => {
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
      // Level complete bonus
      state.score += state.level * 500;
      callbacksRef.current?.onScoreChange(state.score);
      state.levelComplete = true;
    }
  }, []);

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
      } else {
        movePlayer(state, now);
        moveEnemies(state, now);
        checkCollisions(state);
        checkLevelComplete(state);
      }

      // Render
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
          },
          now - startTimeRef.current,
        );
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
