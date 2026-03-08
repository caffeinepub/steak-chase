import { COLS, type EnemyType, ROWS, TILE, TILE_SIZE } from "./constants";

// ─── Colors (literal values for Canvas API) ──────────────────────────────────
const COLOR = {
  DIRT_PATH: "#2a1d12",
  WALL_TOP: "#5a7a2a",
  WALL_MID: "#4a4a4a",
  WALL_DARK: "#2a2a2a",
  WALL_OUTLINE: "#1a1a1a",
  STEAK: "#c04a2a",
  PORK_CHOP: "#e8a070",
  GOLD_APPLE: "#f0c030",
  GOLD_GLOW: "rgba(240,192,48,0.25)",
  ENEMY_SCARED: "#4080ff",
  WOLF_TINT: "rgba(180,200,255,0.3)",
  POWER_BAR: "#f0c030",
  GHOST_HOUSE_BG: "#1a1a2a",
};

export interface RenderEnemy {
  col: number;
  row: number;
  type: EnemyType;
  scared: boolean;
  visible: boolean;
}

export interface RenderState {
  maze: number[][];
  player: { col: number; row: number };
  playerDirection: import("./constants").Direction;
  enemies: RenderEnemy[];
  powerUpActive: boolean;
  powerUpTimeLeft: number;
  totalPowerUpDuration: number;
}

// Image cache
const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): HTMLImageElement {
  if (imageCache.has(src)) return imageCache.get(src)!;
  const img = new Image();
  img.src = src;
  imageCache.set(src, img);
  return img;
}

// Preload all game images
export function preloadImages(): void {
  loadImage("/assets/generated/wolf-player-transparent.dim_64x64.png");
  loadImage("/assets/generated/zombie-enemy-transparent.dim_64x64.png");
  loadImage("/assets/generated/skeleton-enemy-transparent.dim_64x64.png");
}

function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const s = TILE_SIZE;

  // Base stone fill
  ctx.fillStyle = COLOR.WALL_MID;
  ctx.fillRect(x, y, s, s);

  // Grass top strip
  ctx.fillStyle = COLOR.WALL_TOP;
  ctx.fillRect(x, y, s, 5);

  // Darker lower half for depth
  ctx.fillStyle = COLOR.WALL_DARK;
  ctx.fillRect(x, y + s * 0.6, s, s * 0.4);

  // Subtle stone texture lines
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  // Horizontal cracks
  ctx.beginPath();
  ctx.moveTo(x + 2, y + s * 0.35);
  ctx.lineTo(x + s - 2, y + s * 0.35);
  ctx.stroke();
  // Vertical cracks
  ctx.beginPath();
  ctx.moveTo(x + s * 0.5, y + s * 0.35);
  ctx.lineTo(x + s * 0.5, y + s * 0.7);
  ctx.stroke();

  // Highlight top-left
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + s, y);
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + s);
  ctx.stroke();

  // Dark outline
  ctx.strokeStyle = COLOR.WALL_OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
}

function drawPath(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = COLOR.DIRT_PATH;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
}

function drawSteak(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Minecraft-style pixel art steak — 10x8 logical pixels at 2px each = 20x16 canvas px
  // Centered in 28px tile: offset = (28-20)/2=4 horiz, (28-16)/2=6 vert
  const p = 2;
  const ox = x + 4;
  const oy = y + 6;

  const B = "#3d1a00"; // dark crust border
  const D = "#7a2800"; // dark meat
  const M = "#b03818"; // mid meat
  const R = "#c84820"; // red-brown meat surface
  const L = "#d8603a"; // lighter highlight
  const G = "#2a0e00"; // grill marks

  // 10 cols × 8 rows of logical pixels
  const steak: string[][] = [
    [".", B, B, B, B, B, B, B, B, "."],
    [B, D, D, D, D, D, D, D, D, B],
    [B, D, L, R, G, R, L, R, D, B],
    [B, D, R, L, R, G, R, L, D, B],
    [B, D, M, R, L, R, G, M, D, B],
    [B, D, G, M, R, L, R, G, D, B],
    [B, D, D, D, D, D, D, D, D, B],
    [".", B, B, B, B, B, B, B, B, "."],
  ];

  for (let row = 0; row < steak.length; row++) {
    for (let col = 0; col < steak[row].length; col++) {
      const color = steak[row][col];
      if (color === ".") continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + col * p, oy + row * p, p, p);
    }
  }
}

function drawPorkChop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  // Minecraft-style pixel art pork chop — 12x8 logical pixels at 2px each = 24x16 canvas px
  // Centered in 28px tile: offset = (28-24)/2=2 horiz, (28-16)/2=6 vert
  const p = 2;
  const ox = x + 2;
  const oy = y + 6;

  const B = "#5a2010"; // dark border/crust
  const P = "#e07050"; // cooked pink meat
  const K = "#c05040"; // darker pink
  const H = "#f09878"; // highlight pink
  const F = "#f0e8c0"; // fat/marbling streak
  const N = "#e8ddb0"; // bone (ivory)
  const NB = "#b0a060"; // bone shadow

  // 12 cols × 8 rows — meat body (cols 0-8) + bone nub (cols 9-11) on right middle rows
  const chop: string[][] = [
    [".", B, B, B, B, B, B, B, B, ".", ".", "."],
    [B, P, P, P, P, P, P, P, B, NB, NB, "."],
    [B, H, H, F, P, P, P, P, B, N, N, NB],
    [B, H, P, F, F, P, K, P, B, N, N, NB],
    [B, P, P, P, F, K, P, P, B, N, N, NB],
    [B, P, K, P, P, P, P, P, B, NB, NB, "."],
    [B, P, P, P, K, P, P, P, B, ".", ".", "."],
    [".", B, B, B, B, B, B, B, ".", ".", ".", "."],
  ];

  for (let row = 0; row < chop.length; row++) {
    for (let col = 0; col < chop[row].length; col++) {
      const color = chop[row][col];
      if (color === ".") continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + col * p, oy + row * p, p, p);
    }
  }
}

function drawGoldenApple(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  const pulse = 1 + 0.15 * Math.sin(time * 0.004);
  const r = 7 * pulse;

  // Outer glow
  const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2);
  grad.addColorStop(0, "rgba(240,192,48,0.4)");
  grad.addColorStop(1, "rgba(240,192,48,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
  ctx.fill();

  // Apple body
  ctx.fillStyle = COLOR.GOLD_APPLE;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Shine
  ctx.fillStyle = "rgba(255,255,200,0.8)";
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  ctx.strokeStyle = "#5a3a10";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy - r - 3);
  ctx.stroke();
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  scared: boolean,
  frameTime?: number,
): void {
  const img = loadImage(src);
  const pad = 2;

  if (scared) {
    // Blue tint for scared enemies
    ctx.save();
    ctx.globalAlpha = 0.85;

    // Flash warning when time is almost up
    if (frameTime && frameTime % 600 < 300) {
      ctx.globalAlpha = 0.4;
    }

    ctx.drawImage(
      img,
      x + pad,
      y + pad,
      TILE_SIZE - pad * 2,
      TILE_SIZE - pad * 2,
    );

    // Blue overlay
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "#4080ff";
    ctx.fillRect(x + pad, y + pad, TILE_SIZE - pad * 2, TILE_SIZE - pad * 2);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  } else if (img.complete) {
    ctx.drawImage(
      img,
      x + pad,
      y + pad,
      TILE_SIZE - pad * 2,
      TILE_SIZE - pad * 2,
    );
  } else {
    // Placeholder while loading
    ctx.fillStyle = "#888";
    ctx.fillRect(x + pad, y + pad, TILE_SIZE - pad * 2, TILE_SIZE - pad * 2);
  }
}

// Draw a Minecraft-style pixel art wolf, top-down, facing direction, with mouth bite animation
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: import("./constants").Direction,
  frameTime: number,
): void {
  const s = TILE_SIZE; // 28px tile

  // Bite animation: mouth opens and closes (0 = closed, 1 = fully open)
  const bitePhase = Math.abs(Math.sin(frameTime * 0.008));

  ctx.save();
  // Translate to center of tile for rotation
  ctx.translate(x + s / 2, y + s / 2);

  // Rotate based on direction
  const rotations: Record<import("./constants").Direction, number> = {
    right: 0,
    down: Math.PI / 2,
    left: Math.PI,
    up: -Math.PI / 2,
    none: 0,
  };
  ctx.rotate(rotations[direction]);

  // Draw wolf body centered at (0,0), facing right by default
  const hw = s / 2; // half-width = 14

  // -- Body: dark grey blocky torso --
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(-hw + 3, -hw + 4, s - 6, s - 8);

  // -- Lighter grey chest stripe --
  ctx.fillStyle = "#7a7a7a";
  ctx.fillRect(-hw + 5, -2, s - 16, 4);

  // -- Darker back --
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(-hw + 3, -hw + 4, s - 16, 5);

  // -- Ears (two small squares at back-top) --
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(-hw + 4, -hw + 4, 4, 4);
  ctx.fillRect(-hw + 4, hw - 8, 4, 4);

  // -- Ear tips (lighter inner) --
  ctx.fillStyle = "#555555";
  ctx.fillRect(-hw + 5, -hw + 5, 2, 2);
  ctx.fillRect(-hw + 5, hw - 7, 2, 2);

  // -- Eyes (yellow-orange, on back half of body) --
  ctx.fillStyle = "#e8a020";
  ctx.fillRect(-hw + 9, -hw + 7, 3, 3);
  ctx.fillRect(-hw + 9, hw - 10, 3, 3);

  // -- Eye pupils --
  ctx.fillStyle = "#1a1000";
  ctx.fillRect(-hw + 10, -hw + 8, 2, 2);
  ctx.fillRect(-hw + 10, hw - 9, 2, 2);

  // -- Snout / head extending right (front) --
  ctx.fillStyle = "#4a4a4a";
  // Upper jaw
  const jawOpen = Math.floor(bitePhase * 5); // 0..5 pixels
  ctx.fillRect(hw - 10, -3 - jawOpen, 9, 3 + jawOpen);
  // Lower jaw
  ctx.fillRect(hw - 10, jawOpen, 9, 3 + jawOpen);

  // -- Nose tip --
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(hw - 2, -1, 2, 2);

  // -- Teeth (white, visible when mouth open) --
  if (bitePhase > 0.15) {
    ctx.fillStyle = "#f0f0f0";
    // Upper teeth
    ctx.fillRect(hw - 9, -jawOpen, 2, 2);
    ctx.fillRect(hw - 6, -jawOpen, 2, 2);
    ctx.fillRect(hw - 3, -jawOpen, 2, 2);
    // Lower teeth
    ctx.fillRect(hw - 9, jawOpen - 2, 2, 2);
    ctx.fillRect(hw - 6, jawOpen - 2, 2, 2);
    ctx.fillRect(hw - 3, jawOpen - 2, 2, 2);
  }

  // -- Tail (small nub at the back) --
  ctx.fillStyle = "#5a5a5a";
  ctx.fillRect(-hw - 2, -2, 4, 4);

  // -- Outline / shadow for depth --
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-hw + 3.5, -hw + 4.5, s - 7, s - 9);

  ctx.restore();
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  frameTime: number,
): void {
  const {
    maze,
    player,
    playerDirection,
    enemies,
    powerUpActive,
    powerUpTimeLeft,
    totalPowerUpDuration,
  } = state;

  // Clear
  ctx.fillStyle = "#1a1008";
  ctx.fillRect(0, 0, COLS * TILE_SIZE, ROWS * TILE_SIZE);

  // Draw tiles
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      const cell = maze[row][col];

      drawPath(ctx, x, y);

      if (cell === TILE.WALL) {
        drawWall(ctx, x, y);
      }
    }
  }

  // Draw collectibles
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      const cell = maze[row][col];

      if (cell === TILE.STEAK) {
        drawSteak(ctx, x, y);
      } else if (cell === TILE.PORK_CHOP) {
        drawPorkChop(ctx, x, y);
      } else if (cell === TILE.GOLDEN_APPLE) {
        drawGoldenApple(ctx, x, y, frameTime);
      }
    }
  }

  // Power-up timer bar
  if (powerUpActive && powerUpTimeLeft > 0) {
    const barWidth =
      COLS * TILE_SIZE * (powerUpTimeLeft / totalPowerUpDuration);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, COLS * TILE_SIZE, 4);
    ctx.fillStyle = COLOR.POWER_BAR;
    ctx.fillRect(0, 0, barWidth, 4);
  }

  // Draw enemies
  for (const enemy of enemies) {
    if (!enemy.visible) continue;
    const x = enemy.col * TILE_SIZE;
    const y = enemy.row * TILE_SIZE;
    const src =
      enemy.type === "zombie"
        ? "/assets/generated/zombie-enemy-transparent.dim_64x64.png"
        : "/assets/generated/skeleton-enemy-transparent.dim_64x64.png";

    drawSprite(
      ctx,
      src,
      x,
      y,
      enemy.scared,
      powerUpActive ? powerUpTimeLeft : undefined,
    );
  }

  // Draw player
  drawPlayer(
    ctx,
    player.col * TILE_SIZE,
    player.row * TILE_SIZE,
    playerDirection,
    frameTime,
  );
}
