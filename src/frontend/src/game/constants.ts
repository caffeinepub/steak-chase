export const TILE_SIZE = 28;
export const COLS = 19;
export const ROWS = 21;
export const CANVAS_WIDTH = COLS * TILE_SIZE; // 532
export const CANVAS_HEIGHT = ROWS * TILE_SIZE; // 588

export const TILE = {
  WALL: 1,
  PATH: 0,
  STEAK: 2,
  GOLDEN_APPLE: 3,
  PORK_CHOP: 4,
  EXPLOSION: 5,
  PORTAL: 6,
} as const;

export const SCORE = {
  STEAK: 10,
  PORK_CHOP: 30,
  GOLDEN_APPLE: 50,
  ENEMY_BASE: 200,
  EXPLOSION: 150,
} as const;

export const POWER_UP_DURATION = 8000; // ms
export const PLAYER_SPEED = 200; // ms per tile
export const ZOMBIE_SPEED = 420; // ms per tile (base) — slow but tracks player via BFS
export const SKELETON_SPEED = 180; // ms per tile (base) — fast but straight-line only
export const POWER_UP_ENEMY_SPEED_MULTIPLIER = 2.2;
export const EXPLOSION_RADIUS = 3; // tiles

// Boss battle
export const BOSS_DURATION = 5000; // ms player must survive
export const BOSS_COL = 9; // centre column of the maze
export const BOSS_ROW = 10; // centre row of the maze
export const BOSS_KILL_DISTANCE = 2; // Manhattan distance at which boss kills player

// Portal tile positions (paired): [A, B] — stepping on A teleports to B and vice versa
export const PORTAL_PAIRS: Array<
  [{ col: number; row: number }, { col: number; row: number }]
> = [
  [
    { col: 1, row: 6 },
    { col: 17, row: 6 },
  ],
];

export const INITIAL_MAZE: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 3, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 5, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 6, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 6, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 0, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 5, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const PLAYER_START = { col: 9, row: 16 };

export const ENEMY_STARTS = [
  { col: 8, row: 9, type: "zombie" as const },
  { col: 10, row: 9, type: "zombie" as const },
  { col: 8, row: 11, type: "skeleton" as const },
  { col: 10, row: 11, type: "skeleton" as const },
];

export type EnemyType = "zombie" | "skeleton";
export type Direction = "up" | "down" | "left" | "right" | "none";
