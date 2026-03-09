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
  GHOST_MODE: 7, // walk through walls briefly
  FREEZE: 8, // freeze enemies for 4s
  SPEED_BOOST: 9, // move super fast for 5s
  NETHER_STAR: 10, // invincible for 10s — rare
  DIAMOND_SWORD: 11, // instantly destroy all enemies — rare
  COMPASS: 12, // shows safest path for 8s — rare
} as const;

export const SCORE = {
  STEAK: 10,
  PORK_CHOP: 30,
  GOLDEN_APPLE: 50,
  ENEMY_BASE: 200,
  EXPLOSION: 150,
} as const;

export const POWER_UP_DURATION = 8000; // ms
export const GHOST_MODE_DURATION = 5000; // ms
export const FREEZE_DURATION = 4000; // ms
export const SPEED_BOOST_DURATION = 5000; // ms
export const SPEED_BOOST_MULTIPLIER = 0.35; // fraction of normal PLAYER_SPEED (faster)
export const NETHER_STAR_DURATION = 10000; // ms — invincible
export const COMPASS_DURATION = 8000; // ms — safe path shown
export const RARE_ITEM_LIFESPAN = 20000; // ms — rare item disappears after this
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

// Level configuration
export const MAX_LEVELS = 10;
export const BOSS_LEVELS = new Set([1, 3, 5]); // levels that end with a boss battle

// Rare items: only ONE appears per level, chosen randomly
export const RARE_TILES = [
  TILE.NETHER_STAR,
  TILE.DIAMOND_SWORD,
  TILE.COMPASS,
] as const;

// Portal tile positions (paired): [A, B] — stepping on A teleports to B and vice versa
export const PORTAL_PAIRS: Array<
  [{ col: number; row: number }, { col: number; row: number }]
> = [
  [
    { col: 1, row: 6 },
    { col: 17, row: 6 },
  ],
];

// Tile values key:
//  0=PATH 1=WALL 2=STEAK 3=GOLDEN_APPLE 4=PORK_CHOP
//  5=EXPLOSION 6=PORTAL 7=GHOST_MODE 8=FREEZE 9=SPEED_BOOST
// 10=NETHER_STAR(rare) 11=DIAMOND_SWORD(rare) 12=COMPASS(rare)
export const INITIAL_MAZE: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 3, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 8, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 5, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 6, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 6, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 0, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 10, 0, 0, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 11, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 5, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 3, 2, 1, 9, 2, 2, 2, 2, 0, 2, 2, 2, 2, 9, 1, 2, 3, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 7, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 12, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
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

// Level timer — how many seconds the player has per level
export const LEVEL_DURATION_SECONDS = 90;

// Per-level maze palette: [grassCapHex, neonGlowRgb, floorHex]
// 10 entries — one for each level, cycling if needed
export const LEVEL_PALETTES: Array<{
  grassCap: [string, string]; // [top colour, bottom of cap]
  neonGlow: string; // rgba string for wall glow
  wallMid: string; // wall body colour
  floorBase: string; // floor fill colour
  dotColor: string; // corridor dot colour rgba
}> = [
  // Level 1 — original green
  {
    grassCap: ["#55cc22", "#2d6e0a"],
    neonGlow: "rgba(136,255,68,0.6)",
    wallMid: "#1a1f14",
    floorBase: "#0f1a0a",
    dotColor: "rgba(255,220,80,0.5)",
  },
  // Level 2 — teal/cyan
  {
    grassCap: ["#22ccaa", "#0a6e5a"],
    neonGlow: "rgba(68,255,210,0.6)",
    wallMid: "#0f1f1c",
    floorBase: "#0a191a",
    dotColor: "rgba(80,255,220,0.5)",
  },
  // Level 3 — electric blue
  {
    grassCap: ["#2255cc", "#0a2e6e"],
    neonGlow: "rgba(68,136,255,0.65)",
    wallMid: "#0f141f",
    floorBase: "#0a0f1a",
    dotColor: "rgba(80,160,255,0.55)",
  },
  // Level 4 — violet/purple
  {
    grassCap: ["#8822cc", "#400a6e"],
    neonGlow: "rgba(180,68,255,0.65)",
    wallMid: "#171020",
    floorBase: "#100a1a",
    dotColor: "rgba(200,100,255,0.55)",
  },
  // Level 5 — crimson red
  {
    grassCap: ["#cc2222", "#6e0a0a"],
    neonGlow: "rgba(255,68,68,0.65)",
    wallMid: "#1f0f0f",
    floorBase: "#1a0a0a",
    dotColor: "rgba(255,80,80,0.55)",
  },
  // Level 6 — orange lava
  {
    grassCap: ["#cc6622", "#6e2e0a"],
    neonGlow: "rgba(255,140,68,0.65)",
    wallMid: "#1f160a",
    floorBase: "#1a100a",
    dotColor: "rgba(255,160,60,0.55)",
  },
  // Level 7 — golden amber
  {
    grassCap: ["#ccaa22", "#6e5a0a"],
    neonGlow: "rgba(255,220,68,0.65)",
    wallMid: "#1f1c0a",
    floorBase: "#1a180a",
    dotColor: "rgba(255,240,80,0.55)",
  },
  // Level 8 — hot pink
  {
    grassCap: ["#cc2288", "#6e0a40"],
    neonGlow: "rgba(255,68,180,0.65)",
    wallMid: "#1f0f18",
    floorBase: "#1a0a12",
    dotColor: "rgba(255,80,200,0.55)",
  },
  // Level 9 — ice white/silver
  {
    grassCap: ["#aacccc", "#5a7a7a"],
    neonGlow: "rgba(180,240,255,0.65)",
    wallMid: "#161e1e",
    floorBase: "#0f1616",
    dotColor: "rgba(180,240,255,0.5)",
  },
  // Level 10 — neon green (boss finale, brighter original)
  {
    grassCap: ["#44ff44", "#1a8a1a"],
    neonGlow: "rgba(80,255,80,0.75)",
    wallMid: "#0f1f0a",
    floorBase: "#081208",
    dotColor: "rgba(100,255,100,0.6)",
  },
];
