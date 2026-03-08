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
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  const r = 4;

  // Meat shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(cx + 1, cy + 1, r, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  // Meat body
  ctx.fillStyle = COLOR.STEAK;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = "rgba(255,120,80,0.6)";
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy - 1, r * 0.5, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPorkChop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(cx + 1, cy + 1, 7, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Pork chop body (larger pinkish oval)
  ctx.fillStyle = COLOR.PORK_CHOP;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 7, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Fat white streak
  ctx.fillStyle = "rgba(255,255,220,0.7)";
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy - 1, 3, 2, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Bone nub
  ctx.fillStyle = "#f0e8d0";
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy, 3, 2, 0.4, 0, Math.PI * 2);
  ctx.fill();
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

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const src = "/assets/generated/wolf-player-transparent.dim_64x64.png";
  const img = loadImage(src);
  const pad = 1;

  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(
      img,
      x + pad,
      y + pad,
      TILE_SIZE - pad * 2,
      TILE_SIZE - pad * 2,
    );
  } else {
    // Placeholder wolf shape
    ctx.fillStyle = "#b0b0b0";
    ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.fillStyle = "#808080";
    ctx.fillRect(x + 8, y + 2, TILE_SIZE - 16, 8);
  }
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  frameTime: number,
): void {
  const {
    maze,
    player,
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
  drawPlayer(ctx, player.col * TILE_SIZE, player.row * TILE_SIZE);
}
