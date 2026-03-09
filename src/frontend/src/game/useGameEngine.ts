import { useCallback, useEffect, useRef } from "react";
import {
  BOSS_COL,
  BOSS_DURATION,
  BOSS_KILL_DISTANCE,
  BOSS_LEVELS,
  BOSS_ROW,
  COLS,
  COMPASS_DURATION,
  type Direction,
  ENEMY_STARTS,
  EXPLOSION_RADIUS,
  type EnemyType,
  FREEZE_DURATION,
  GHOST_MODE_DURATION,
  INITIAL_MAZE,
  MAX_LEVELS,
  NETHER_STAR_DURATION,
  PLAYER_SPEED,
  PLAYER_START,
  PORTAL_PAIRS,
  POWER_UP_DURATION,
  POWER_UP_ENEMY_SPEED_MULTIPLIER,
  RARE_ITEM_LIFESPAN,
  RARE_TILES,
  ROWS,
  SCORE,
  SKELETON_SPEED,
  SPEED_BOOST_DURATION,
  SPEED_BOOST_MULTIPLIER,
  TILE,
  TILE_SIZE,
  ZOMBIE_SPEED,
} from "./constants";
import {
  bfsNextStep,
  bfsSafePath,
  randomAdjacentStep,
  straightLineStep,
} from "./pathfinding";
import type { Point } from "./pathfinding";
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
  // Game won (all levels complete)
  gameWon: boolean;
  // Ghost mode — walk through walls
  ghostModeActive: boolean;
  ghostModeEndTime: number;
  // Freeze — enemies stop moving
  freezeActive: boolean;
  freezeEndTime: number;
  // Speed boost — faster movement
  speedBoostActive: boolean;
  speedBoostEndTime: number;
  // Nether Star — invincible (enemies can't kill player)
  netherStarActive: boolean;
  netherStarEndTime: number;
  // Diamond Sword — used (one-shot clear, no timer needed)
  diamondSwordFlashUntil: number;
  // Compass — safe path overlay
  compassActive: boolean;
  compassEndTime: number;
  compassPath: Point[];
  compassUpdateTimer: number; // refresh path every N ms
  // Rare item — expires after 20 seconds
  rareItemExpireTime: number; // 0 = no rare item active, otherwise timestamp
  rareItemSpawned: boolean; // flag so UI can show "find it!" once
  // Session stats
  statsEnemiesDefeated: number;
  statsRareItemsCollected: number;
  statsBossesDefeated: number;
}

export interface SessionStats {
  enemiesDefeated: number;
  rareItemsCollected: number;
  bossesDefeated: number;
}

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (score: number, stats: SessionStats) => void;
  onPowerUpChange: (active: boolean) => void;
  onCollect?: (
    type:
      | "steak"
      | "porkChop"
      | "goldenApple"
      | "explosion"
      | "portal"
      | "ghostMode"
      | "freeze"
      | "speedBoost"
      | "netherStar"
      | "diamondSword"
      | "compass",
  ) => void;
  onPowerUp?: () => void;
  onEnemyEat?: () => void;
  onLifeLost?: () => void;
  onLevelComplete?: () => void;
  onBossDefeated?: () => void;
  onBossKilled?: () => void;
  onGameWon?: (score: number, stats: SessionStats) => void;
  onBossPhaseChange?: (active: boolean) => void;
  onRareItemSpawned?: () => void;
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

    // Rare items: collect all positions that have a rare tile, then strip them
    // all out and place exactly ONE randomly chosen rare item back.
    const rarePositions: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < maze.length; r++) {
      for (let c = 0; c < maze[r].length; c++) {
        if ((RARE_TILES as readonly number[]).includes(maze[r][c])) {
          rarePositions.push({ row: r, col: c });
          maze[r][c] = TILE.PATH; // clear all rare slots first
        }
      }
    }
    let hasRareItem = false;
    if (rarePositions.length > 0) {
      // Pick one random position and one random rare tile type
      const pos =
        rarePositions[Math.floor(Math.random() * rarePositions.length)];
      const tileType =
        RARE_TILES[Math.floor(Math.random() * RARE_TILES.length)];
      maze[pos.row][pos.col] = tileType;
      hasRareItem = true;
    }

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
      gameWon: false,
      ghostModeActive: false,
      ghostModeEndTime: 0,
      freezeActive: false,
      freezeEndTime: 0,
      speedBoostActive: false,
      speedBoostEndTime: 0,
      netherStarActive: false,
      netherStarEndTime: 0,
      diamondSwordFlashUntil: 0,
      compassActive: false,
      compassEndTime: 0,
      compassPath: [],
      compassUpdateTimer: 0,
      rareItemExpireTime: hasRareItem ? 0 : 0, // set after start via callback
      rareItemSpawned: hasRareItem,
      statsEnemiesDefeated: stateRef.current?.statsEnemiesDefeated ?? 0,
      statsRareItemsCollected: stateRef.current?.statsRareItemsCollected ?? 0,
      statsBossesDefeated: stateRef.current?.statsBossesDefeated ?? 0,
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
    state.ghostModeActive = false;
    state.ghostModeEndTime = 0;
    state.freezeActive = false;
    state.freezeEndTime = 0;
    state.speedBoostActive = false;
    state.speedBoostEndTime = 0;
    state.netherStarActive = false;
    state.netherStarEndTime = 0;
    state.diamondSwordFlashUntil = 0;
    state.compassActive = false;
    state.compassEndTime = 0;
    state.compassPath = [];
    state.compassUpdateTimer = 0;
    // Don't reset rareItemExpireTime here — rare item persists on map
  }, []);

  const movePlayer = useCallback((state: GameState, now: number): void => {
    const speedMs = state.speedBoostActive
      ? PLAYER_SPEED * SPEED_BOOST_MULTIPLIER
      : PLAYER_SPEED;
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
      // Ghost mode: can pass through walls
      if (!state.ghostModeActive && maze[nr][nc] === TILE.WALL) return false;
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
      state.statsEnemiesDefeated += killed;
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
    } else if (cell === TILE.GHOST_MODE) {
      maze[player.row][player.col] = TILE.PATH;
      state.ghostModeActive = true;
      state.ghostModeEndTime = now + GHOST_MODE_DURATION;
      callbacksRef.current?.onCollect?.("ghostMode");
    } else if (cell === TILE.FREEZE) {
      maze[player.row][player.col] = TILE.PATH;
      state.freezeActive = true;
      state.freezeEndTime = now + FREEZE_DURATION;
      callbacksRef.current?.onCollect?.("freeze");
    } else if (cell === TILE.SPEED_BOOST) {
      maze[player.row][player.col] = TILE.PATH;
      state.speedBoostActive = true;
      state.speedBoostEndTime = now + SPEED_BOOST_DURATION;
      callbacksRef.current?.onCollect?.("speedBoost");
    } else if (cell === TILE.NETHER_STAR) {
      maze[player.row][player.col] = TILE.PATH;
      state.netherStarActive = true;
      state.netherStarEndTime = now + NETHER_STAR_DURATION;
      state.statsRareItemsCollected++;
      callbacksRef.current?.onCollect?.("netherStar");
    } else if (cell === TILE.DIAMOND_SWORD) {
      maze[player.row][player.col] = TILE.PATH;
      state.statsRareItemsCollected++;
      // Instantly destroy all living enemies
      let swordKills = 0;
      for (const e of state.enemies) {
        if (!e.dead) {
          e.dead = true;
          e.respawnTimer = 5000;
          swordKills++;
        }
      }
      state.statsEnemiesDefeated += swordKills;
      state.score += state.enemies.length * SCORE.ENEMY_BASE;
      state.diamondSwordFlashUntil = now + 500;
      callbacksRef.current?.onScoreChange(state.score);
      callbacksRef.current?.onCollect?.("diamondSword");
      callbacksRef.current?.onEnemyEat?.();
    } else if (cell === TILE.COMPASS) {
      maze[player.row][player.col] = TILE.PATH;
      state.compassActive = true;
      state.compassEndTime = now + COMPASS_DURATION;
      state.compassUpdateTimer = 0; // trigger immediate path calc
      state.statsRareItemsCollected++;
      callbacksRef.current?.onCollect?.("compass");
    }
  }, []);

  const moveEnemies = useCallback((state: GameState, now: number): void => {
    // Freeze: all enemies stop moving
    if (state.freezeActive) return;

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
          // Nether Star: completely invincible — enemies pass through harmlessly
          if (state.netherStarActive) continue;
          if (state.powerUpActive && enemy.scared) {
            // Eat enemy
            const reward = SCORE.ENEMY_BASE * 2 ** state.enemyEatChain;
            state.score += reward;
            state.enemyEatChain++;
            state.statsEnemiesDefeated++;
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
              callbacksRef.current?.onGameOver(state.score, {
                enemiesDefeated: state.statsEnemiesDefeated,
                rareItemsCollected: state.statsRareItemsCollected,
                bossesDefeated: state.statsBossesDefeated,
              });
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
        if (BOSS_LEVELS.has(state.level)) {
          // Trigger boss phase for boss levels (1, 3, 5)
          state.bossPhase = true;
          state.bossStartTime = now;
          state.bossDefeated = false;
          callbacksRef.current?.onBossPhaseChange?.(true);
          // Hide normal enemies during boss phase
          for (const e of state.enemies) {
            e.dead = true;
            e.respawnTimer = 999999;
          }
        } else {
          // Non-boss level: complete immediately
          callbacksRef.current?.onLevelComplete?.();
          state.levelComplete = true;
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

      // Rare item spawn timer: set expiry on first frame it's seen
      if (state.rareItemSpawned && state.rareItemExpireTime === 0) {
        state.rareItemExpireTime = now + RARE_ITEM_LIFESPAN;
        callbacksRef.current?.onRareItemSpawned?.();
        state.rareItemSpawned = false;
      }
      // Rare item expiry: remove it from the maze
      if (state.rareItemExpireTime > 0 && now > state.rareItemExpireTime) {
        state.rareItemExpireTime = 0;
        // Remove any remaining rare tile from the maze
        for (let r = 0; r < state.maze.length; r++) {
          for (let c = 0; c < state.maze[r].length; c++) {
            if ((RARE_TILES as readonly number[]).includes(state.maze[r][c])) {
              state.maze[r][c] = TILE.PATH;
            }
          }
        }
      }

      // Check power-up expiry
      if (state.powerUpActive && now > state.powerUpEndTime) {
        state.powerUpActive = false;
        for (const e of state.enemies) {
          e.scared = false;
        }
        callbacksRef.current?.onPowerUpChange(false);
      }
      if (state.ghostModeActive && now > state.ghostModeEndTime) {
        state.ghostModeActive = false;
      }
      if (state.freezeActive && now > state.freezeEndTime) {
        state.freezeActive = false;
      }
      if (state.speedBoostActive && now > state.speedBoostEndTime) {
        state.speedBoostActive = false;
      }
      if (state.netherStarActive && now > state.netherStarEndTime) {
        state.netherStarActive = false;
      }
      if (state.compassActive && now > state.compassEndTime) {
        state.compassActive = false;
        state.compassPath = [];
      }
      // Refresh compass path every 300ms (stay ahead of player movement)
      if (state.compassActive && now > state.compassUpdateTimer) {
        state.compassUpdateTimer = now + 300;
        const enemyPositions = state.enemies
          .filter((e) => !e.dead)
          .map((e) => ({ col: e.col, row: e.row }));
        state.compassPath = bfsSafePath(
          state.maze,
          state.player,
          enemyPositions,
          ROWS,
          COLS,
        );
      }

      // Handle level complete transition
      if (state.levelComplete) {
        if (state.level >= MAX_LEVELS) {
          // All 10 levels complete — game won!
          state.gameWon = true;
          callbacksRef.current?.onGameWon?.(state.score, {
            enemiesDefeated: state.statsEnemiesDefeated,
            rareItemsCollected: state.statsRareItemsCollected,
            bossesDefeated: state.statsBossesDefeated,
          });
          return; // stop the loop
        }
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
          // Boss kills player — notify UI first, then restart
          callbacksRef.current?.onBossPhaseChange?.(false);
          callbacksRef.current?.onLifeLost?.();
          callbacksRef.current?.onBossKilled?.();
          // Full restart after a short delay to let the overlay show
          setTimeout(() => {
            levelRef.current = 1;
            // Clear persisted stats before full restart
            if (stateRef.current) {
              stateRef.current.statsEnemiesDefeated = 0;
              stateRef.current.statsRareItemsCollected = 0;
              stateRef.current.statsBossesDefeated = 0;
            }
            const restartState = initState(1);
            restartState.score = 0;
            restartState.lives = 3;
            restartState.statsEnemiesDefeated = 0;
            restartState.statsRareItemsCollected = 0;
            restartState.statsBossesDefeated = 0;
            stateRef.current = restartState;
            callbacksRef.current?.onScoreChange(0);
            callbacksRef.current?.onLivesChange(3);
            callbacksRef.current?.onLevelChange(1);
          }, 2500);
        } else if (bossTimeLeft <= 0) {
          // Survived the boss!
          state.bossDefeated = true;
          state.bossPhase = false;
          state.score += state.level * 500;
          state.statsBossesDefeated++;
          callbacksRef.current?.onScoreChange(state.score);
          callbacksRef.current?.onBossPhaseChange?.(false);
          callbacksRef.current?.onBossDefeated?.();
          if (state.level >= MAX_LEVELS) {
            // Last level boss defeated — win the game
            state.gameWon = true;
            callbacksRef.current?.onGameWon?.(state.score, {
              enemiesDefeated: state.statsEnemiesDefeated,
              rareItemsCollected: state.statsRareItemsCollected,
              bossesDefeated: state.statsBossesDefeated,
            });
          } else {
            callbacksRef.current?.onLevelComplete?.();
            state.levelComplete = true;
          }
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
              level: state.level,
              explosionFlash: false,
              bossPhase: true,
              bossLevel: state.level,
              bossTimeLeft,
              bossTotalTime: BOSS_DURATION,
              ghostModeActive: state.ghostModeActive,
              ghostModeTimeLeft: state.ghostModeActive
                ? Math.max(0, state.ghostModeEndTime - now)
                : 0,
              freezeActive: false,
              freezeTimeLeft: 0,
              speedBoostActive: state.speedBoostActive,
              speedBoostTimeLeft: state.speedBoostActive
                ? Math.max(0, state.speedBoostEndTime - now)
                : 0,
              netherStarActive: state.netherStarActive,
              netherStarTimeLeft: state.netherStarActive
                ? Math.max(0, state.netherStarEndTime - now)
                : 0,
              diamondSwordFlash: now < state.diamondSwordFlashUntil,
              compassActive: state.compassActive,
              compassPath: state.compassActive ? state.compassPath : [],
              compassTimeLeft: state.compassActive
                ? Math.max(0, state.compassEndTime - now)
                : 0,
              rareItemTimeLeft:
                state.rareItemExpireTime > 0
                  ? Math.max(0, state.rareItemExpireTime - now)
                  : 0,
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
            scared: e.scared || state.freezeActive,
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
              level: state.level,
              explosionFlash: now < state.explosionFlashUntil,
              bossPhase: false,
              bossTimeLeft: 0,
              bossTotalTime: BOSS_DURATION,
              ghostModeActive: state.ghostModeActive,
              ghostModeTimeLeft: state.ghostModeActive
                ? Math.max(0, state.ghostModeEndTime - now)
                : 0,
              freezeActive: state.freezeActive,
              freezeTimeLeft: state.freezeActive
                ? Math.max(0, state.freezeEndTime - now)
                : 0,
              speedBoostActive: state.speedBoostActive,
              speedBoostTimeLeft: state.speedBoostActive
                ? Math.max(0, state.speedBoostEndTime - now)
                : 0,
              netherStarActive: state.netherStarActive,
              netherStarTimeLeft: state.netherStarActive
                ? Math.max(0, state.netherStarEndTime - now)
                : 0,
              diamondSwordFlash: now < state.diamondSwordFlashUntil,
              compassActive: state.compassActive,
              compassPath: state.compassActive ? state.compassPath : [],
              compassTimeLeft: state.compassActive
                ? Math.max(0, state.compassEndTime - now)
                : 0,
              rareItemTimeLeft:
                state.rareItemExpireTime > 0
                  ? Math.max(0, state.rareItemExpireTime - now)
                  : 0,
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
