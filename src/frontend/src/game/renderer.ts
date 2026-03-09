import {
  BOSS_COL,
  BOSS_ROW,
  COLS,
  type EnemyType,
  PORTAL_PAIRS,
  ROWS,
  TILE,
  TILE_SIZE,
} from "./constants";

// ─── Colors (literal values for Canvas API) ──────────────────────────────────
const COLOR = {
  DIRT_PATH: "#0f1a0a",
  WALL_TOP: "#5a7a2a",
  WALL_MID: "#1a1f14",
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
  explosionFlash?: boolean;
  bossPhase?: boolean;
  bossTimeLeft?: number;
  bossTotalTime?: number;
  ghostModeActive?: boolean;
  ghostModeTimeLeft?: number;
  freezeActive?: boolean;
  freezeTimeLeft?: number;
  speedBoostActive?: boolean;
  speedBoostTimeLeft?: number;
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

  // Base dark charcoal fill
  ctx.fillStyle = COLOR.WALL_MID;
  ctx.fillRect(x, y, s, s);

  // Bright grass cap — gradient from vivid green at top to darker green at bottom of cap (4px)
  const grassGrad = ctx.createLinearGradient(x, y, x, y + 4);
  grassGrad.addColorStop(0, "#55cc22");
  grassGrad.addColorStop(1, "#2d6e0a");
  ctx.fillStyle = grassGrad;
  ctx.fillRect(x, y, s, 4);

  // Neon top-edge glow line at very top (y) — bright green 0.6 alpha
  ctx.strokeStyle = "rgba(136,255,68,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.5);
  ctx.lineTo(x + s, y + 0.5);
  ctx.stroke();

  // Stone body: horizontal mortar lines
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(x, y + 10, s, 1);
  ctx.fillRect(x, y + 18, s, 1);

  // Stone body: vertical center mortar
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(x + Math.floor(s / 2), y + 4, 1, s - 4);

  // Left edge highlight
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x, y, 1, s);

  // Bottom shadow
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x, y + s - 1, s, 1);

  // Right shadow
  ctx.fillRect(x + s - 1, y, 1, s);

  // Thin outer stroke
  ctx.strokeStyle = "rgba(0,0,0,0.8)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
}

function drawPath(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const s = TILE_SIZE;

  // Dark base fill
  ctx.fillStyle = COLOR.DIRT_PATH;
  ctx.fillRect(x, y, s, s);

  // Subtle crosshatch grid — thin right edge + bottom edge per tile
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + s - 0.5, y);
  ctx.lineTo(x + s - 0.5, y + s);
  ctx.moveTo(x, y + s - 0.5);
  ctx.lineTo(x + s, y + s - 0.5);
  ctx.stroke();

  // Very faint radial bioluminescent moss glow centered on tile
  const cx = x + s / 2;
  const cy = y + s / 2;
  const mossGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.7);
  mossGrad.addColorStop(0, "rgba(80,180,40,0.04)");
  mossGrad.addColorStop(1, "rgba(80,180,40,0)");
  ctx.fillStyle = mossGrad;
  ctx.fillRect(x, y, s, s);
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

function drawExplosionTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;

  // Pulsing outer glow
  const pulse = 1 + 0.2 * Math.sin(time * 0.006);

  // Orange-red glow
  const glow = ctx.createRadialGradient(
    cx,
    cy,
    2,
    cx,
    cy,
    TILE_SIZE * 0.9 * pulse,
  );
  glow.addColorStop(0, "rgba(255,140,0,0.5)");
  glow.addColorStop(0.5, "rgba(255,60,0,0.25)");
  glow.addColorStop(1, "rgba(255,60,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, TILE_SIZE * 0.9 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Bomb body — dark sphere
  const r = 7;
  const bodyGrad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, r);
  bodyGrad.addColorStop(0, "#555");
  bodyGrad.addColorStop(1, "#111");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(cx, cy + 1, r, 0, Math.PI * 2);
  ctx.fill();

  // Bomb shine
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.arc(cx - 2, cy - 1, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Fuse line
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - r + 1);
  ctx.quadraticCurveTo(cx + 6, cy - r - 4, cx + 5, cy - r - 7);
  ctx.stroke();

  // Spark at fuse tip — flickers
  const sparkBright = Math.sin(time * 0.02) > 0;
  ctx.fillStyle = sparkBright ? "#ffee00" : "#ff8800";
  ctx.beginPath();
  ctx.arc(cx + 5, cy - r - 7, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPortalTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  const r = 10;

  // Swirling background glow
  const angle = (time * 0.003) % (Math.PI * 2);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Outer ring glow
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const gx = Math.cos(a) * r * 0.5;
    const gy = Math.sin(a) * r * 0.5;
    const sg = ctx.createRadialGradient(gx, gy, 0, gx, gy, r * 0.8);
    sg.addColorStop(0, "rgba(160,60,255,0.5)");
    sg.addColorStop(1, "rgba(160,60,255,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(gx, gy, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Portal swirl rings
  ctx.save();
  ctx.translate(cx, cy);
  for (let ring = 0; ring < 3; ring++) {
    const ringR = r - ring * 3;
    const alpha = 0.6 + ring * 0.1;
    const hue = (time * 0.1 + ring * 40) % 360;
    ctx.strokeStyle = `hsla(${270 + hue * 0.3}, 100%, 70%, ${alpha})`;
    ctx.lineWidth = 1.5 - ring * 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Dark center void
  const voidGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.45);
  voidGrad.addColorStop(0, "rgba(10,0,20,0.95)");
  voidGrad.addColorStop(1, "rgba(80,0,140,0.3)");
  ctx.fillStyle = voidGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Star sparkles
  const sparkCount = 4;
  for (let i = 0; i < sparkCount; i++) {
    const sa = angle + (i / sparkCount) * Math.PI * 2;
    const sr = r * 0.7;
    const sx = Math.cos(sa) * sr;
    const sy = Math.sin(sa) * sr;
    ctx.fillStyle = "rgba(220,180,255,0.9)";
    ctx.beginPath();
    ctx.arc(sx, sy, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGhostModeTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  const pulse = 1 + 0.18 * Math.sin(time * 0.005);
  const r = 8 * pulse;

  // Ghostly white-blue glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 2);
  glow.addColorStop(0, "rgba(200,220,255,0.45)");
  glow.addColorStop(1, "rgba(180,200,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
  ctx.fill();

  // Ghost body — rounded top, wavy bottom
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);
  const ghostR = 7;
  ctx.beginPath();
  ctx.arc(0, -2, ghostR, Math.PI, 0); // top dome
  // Wavy bottom
  ctx.lineTo(ghostR, ghostR - 1);
  ctx.quadraticCurveTo(ghostR * 0.65, ghostR + 3, ghostR * 0.33, ghostR - 1);
  ctx.quadraticCurveTo(0, ghostR + 3, -ghostR * 0.33, ghostR - 1);
  ctx.quadraticCurveTo(-ghostR * 0.65, ghostR + 3, -ghostR, ghostR - 1);
  ctx.closePath();
  const bodyGrad = ctx.createLinearGradient(0, -ghostR, 0, ghostR);
  bodyGrad.addColorStop(0, "rgba(220,235,255,0.95)");
  bodyGrad.addColorStop(1, "rgba(150,180,255,0.7)");
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Eyes
  ctx.fillStyle = "rgba(60,80,160,0.9)";
  ctx.beginPath();
  ctx.ellipse(-3, -2, 2, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(3, -2, 2, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFreezeTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  const spin = time * 0.002;

  // Icy blue glow
  const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, TILE_SIZE * 0.9);
  glow.addColorStop(0, "rgba(100,220,255,0.5)");
  glow.addColorStop(1, "rgba(60,160,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, TILE_SIZE * 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Snowflake — 6 arms
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  const armLen = 8;
  ctx.strokeStyle = "rgba(180,240,255,0.9)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -armLen);
    ctx.stroke();
    // Side ticks
    ctx.beginPath();
    ctx.moveTo(0, -armLen * 0.55);
    ctx.lineTo(-3, -armLen * 0.75);
    ctx.moveTo(0, -armLen * 0.55);
    ctx.lineTo(3, -armLen * 0.75);
    ctx.stroke();
    ctx.restore();
  }
  // Center dot
  ctx.fillStyle = "rgba(220,250,255,0.9)";
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpeedBoostTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
): void {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  const pulse = 1 + 0.15 * Math.abs(Math.sin(time * 0.007));

  // Yellow-electric glow
  const glow = ctx.createRadialGradient(
    cx,
    cy,
    1,
    cx,
    cy,
    TILE_SIZE * 0.9 * pulse,
  );
  glow.addColorStop(0, "rgba(255,240,40,0.55)");
  glow.addColorStop(0.5, "rgba(255,180,0,0.25)");
  glow.addColorStop(1, "rgba(255,180,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, TILE_SIZE * 0.9 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Lightning bolt (⚡ pixel art)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);
  ctx.beginPath();
  // Top half angled right, bottom half angled left — classic bolt
  ctx.moveTo(3, -9);
  ctx.lineTo(-2, -1);
  ctx.lineTo(2, -1);
  ctx.lineTo(-3, 9);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  const boltGrad = ctx.createLinearGradient(0, -9, 0, 9);
  boltGrad.addColorStop(0, "#fff880");
  boltGrad.addColorStop(0.5, "#ffe000");
  boltGrad.addColorStop(1, "#ff9900");
  ctx.fillStyle = boltGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(180,120,0,0.6)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
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

// Draw a giant boss skeleton (centred at tile BOSS_COL, BOSS_ROW), ~2.5x tile size
function drawBossSkeleton(
  ctx: CanvasRenderingContext2D,
  frameTime: number,
): void {
  const cx = BOSS_COL * TILE_SIZE + TILE_SIZE / 2;
  const cy = BOSS_ROW * TILE_SIZE + TILE_SIZE / 2;
  const scale = 2.6;
  const s = TILE_SIZE * scale; // ~72px

  // Pulse scale
  const pulse = 1 + 0.06 * Math.sin(frameTime * 0.004);
  const ps = s * pulse;

  // Red aura glow
  const auraR = ps * 1.1;
  const aura = ctx.createRadialGradient(cx, cy, auraR * 0.1, cx, cy, auraR);
  aura.addColorStop(0, "rgba(220,30,30,0.45)");
  aura.addColorStop(0.5, "rgba(180,0,0,0.2)");
  aura.addColorStop(1, "rgba(180,0,0,0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);

  const hw = ps / 2 / pulse;

  // --- Shadow beneath
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, hw * 0.9, hw * 0.55, hw * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Pixel-art skeleton (scaled)
  // Bone white palette
  const W = "#e8e0d0"; // white bone
  const G = "#9a9080"; // grey shading
  const D = "#3a3030"; // dark outline
  const R = "#cc2020"; // glowing red eyes

  // Unit for drawing (scaled from unit pixels)
  const u = ps / 16 / pulse; // 1 "logical pixel" width

  function fillPx(lx: number, ly: number, w: number, h: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(-hw + lx * u, -hw + ly * u, w * u, h * u);
  }

  // Body (torso) — rows 6..11, cols 4..11
  fillPx(4, 6, 8, 6, W);
  fillPx(5, 7, 6, 4, G); // rib shading
  // Ribs
  for (let rib = 0; rib < 3; rib++) {
    fillPx(4, 7 + rib * 1.5, 2, 1, D);
    fillPx(10, 7 + rib * 1.5, 2, 1, D);
  }

  // Pelvis
  fillPx(4, 11, 8, 2, W);
  fillPx(5, 11, 6, 1, G);

  // Skull — rows 0..5, cols 4..11
  fillPx(3, 0, 10, 6, W);
  fillPx(4, 1, 8, 4, G); // shadow
  // Eye sockets
  fillPx(4, 2, 3, 3, D);
  fillPx(9, 2, 3, 3, D);
  // Glowing red pupils
  fillPx(5, 3, 1, 1, R);
  fillPx(10, 3, 1, 1, R);
  // Teeth / jaw
  fillPx(5, 5, 2, 1, W);
  fillPx(8, 5, 2, 1, W);
  fillPx(6, 5, 1, 1, D);
  fillPx(9, 5, 1, 1, D);

  // Neck
  fillPx(7, 5, 2, 2, W);

  // Left arm — cols 1..4, rows 6..13
  fillPx(1, 6, 3, 8, W);
  fillPx(1, 6, 1, 8, G);
  // Left hand
  fillPx(0, 13, 4, 2, W);

  // Right arm — cols 12..15, rows 6..13
  fillPx(12, 6, 3, 8, W);
  fillPx(14, 6, 1, 8, G);
  // Right hand
  fillPx(12, 13, 4, 2, W);

  // Left leg — cols 4..7, rows 13..16
  fillPx(4, 13, 3, 4, W);
  fillPx(4, 13, 1, 4, G);
  // Left foot
  fillPx(3, 16, 4, 2, W);

  // Right leg — cols 9..12, rows 13..16
  fillPx(9, 13, 3, 4, W);
  fillPx(11, 13, 1, 4, G);
  // Right foot
  fillPx(9, 16, 4, 2, W);

  // Red eye glow particles
  const eyeGlow = ctx.createRadialGradient(
    -hw + 5.5 * u,
    -hw + 3 * u,
    0,
    -hw + 5.5 * u,
    -hw + 3 * u,
    u * 3,
  );
  eyeGlow.addColorStop(0, "rgba(255,60,60,0.7)");
  eyeGlow.addColorStop(1, "rgba(255,60,60,0)");
  ctx.fillStyle = eyeGlow;
  ctx.fillRect(-hw + 3 * u, -hw, u * 6, u * 6);

  const eyeGlow2 = ctx.createRadialGradient(
    -hw + 10.5 * u,
    -hw + 3 * u,
    0,
    -hw + 10.5 * u,
    -hw + 3 * u,
    u * 3,
  );
  eyeGlow2.addColorStop(0, "rgba(255,60,60,0.7)");
  eyeGlow2.addColorStop(1, "rgba(255,60,60,0)");
  ctx.fillStyle = eyeGlow2;
  ctx.fillRect(-hw + 8 * u, -hw, u * 6, u * 6);

  ctx.restore();
}

function drawBossOverlay(
  ctx: CanvasRenderingContext2D,
  bossTimeLeft: number,
  bossTotalTime: number,
  frameTime: number,
): void {
  const W = COLS * TILE_SIZE;
  const H = ROWS * TILE_SIZE;

  // Red vignette
  const vigPulse = 0.18 + 0.08 * Math.abs(Math.sin(frameTime * 0.005));
  const vig = ctx.createRadialGradient(
    W / 2,
    H / 2,
    H * 0.25,
    W / 2,
    H / 2,
    H * 0.85,
  );
  vig.addColorStop(0, "rgba(180,0,0,0)");
  vig.addColorStop(1, `rgba(180,0,0,${vigPulse})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // "BOSS BATTLE!" title
  const titleFlash = Math.sin(frameTime * 0.008) > 0;
  ctx.save();
  ctx.font = `bold ${TILE_SIZE * 1.05}px 'Outfit', sans-serif`;
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillText("☠ BOSS BATTLE! ☠", W / 2 + 2, TILE_SIZE * 1.6 + 2);
  // Text
  ctx.fillStyle = titleFlash ? "#ff4444" : "#ff8888";
  ctx.fillText("☠ BOSS BATTLE! ☠", W / 2, TILE_SIZE * 1.6);
  ctx.restore();

  // Countdown bar background
  const barH = 10;
  const barY = TILE_SIZE * 2.2;
  const barPad = TILE_SIZE * 1.5;
  const barW = W - barPad * 2;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.beginPath();
  ctx.roundRect(barPad, barY, barW, barH, 5);
  ctx.fill();

  // Countdown bar fill
  const fraction = bossTimeLeft / bossTotalTime;
  const barColor =
    fraction > 0.5 ? "#ff4444" : fraction > 0.25 ? "#ff8800" : "#ffcc00";
  const grad = ctx.createLinearGradient(barPad, 0, barPad + barW, 0);
  grad.addColorStop(0, barColor);
  grad.addColorStop(1, "#ff0000");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(barPad, barY, barW * fraction, barH, 5);
  ctx.fill();

  // Timer text
  const secs = Math.ceil(bossTimeLeft / 1000);
  ctx.save();
  ctx.font = `bold ${TILE_SIZE * 0.75}px 'Outfit', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillText(
    `Survive ${secs}s!`,
    W / 2 + 1,
    barY + barH + TILE_SIZE * 0.85 + 1,
  );
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`Survive ${secs}s!`, W / 2, barY + barH + TILE_SIZE * 0.85);
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
    explosionFlash,
    bossPhase,
    bossTimeLeft,
    bossTotalTime,
    ghostModeActive,
    ghostModeTimeLeft,
    freezeActive,
    freezeTimeLeft,
    speedBoostActive,
    speedBoostTimeLeft,
  } = state;

  // Clear — darker, more atmospheric base
  ctx.fillStyle = "#0a110a";
  ctx.fillRect(0, 0, COLS * TILE_SIZE, ROWS * TILE_SIZE);

  // Draw tiles (path + walls first pass)
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

  // Ambient wall glow pass — subtle green glow bleeding from walls into paths
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = maze[row][col];
      if (cell !== TILE.WALL) continue;
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      const cx = x + TILE_SIZE / 2;
      const cy = y + TILE_SIZE / 2;
      const wallGlow = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        TILE_SIZE * 1.1,
      );
      wallGlow.addColorStop(0, "rgba(60,160,20,0.06)");
      wallGlow.addColorStop(1, "rgba(60,160,20,0)");
      ctx.fillStyle = wallGlow;
      ctx.fillRect(x - TILE_SIZE, y - TILE_SIZE, TILE_SIZE * 3, TILE_SIZE * 3);
    }
  }

  // Tiny glowing dot for plain PATH tiles (value 0) — skip ghost house center (rows 8–12, cols 6–12)
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (maze[row][col] !== TILE.PATH) continue;
      if (row >= 8 && row <= 12 && col >= 6 && col <= 12) continue;
      const cx = col * TILE_SIZE + TILE_SIZE / 2;
      const cy = row * TILE_SIZE + TILE_SIZE / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,220,80,0.5)";
      ctx.fill();
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
      } else if (cell === TILE.EXPLOSION) {
        drawExplosionTile(ctx, x, y, frameTime);
      } else if (cell === TILE.PORTAL) {
        drawPortalTile(ctx, x, y, frameTime);
      } else if (cell === TILE.GHOST_MODE) {
        drawGhostModeTile(ctx, x, y, frameTime);
      } else if (cell === TILE.FREEZE) {
        drawFreezeTile(ctx, x, y, frameTime);
      } else if (cell === TILE.SPEED_BOOST) {
        drawSpeedBoostTile(ctx, x, y, frameTime);
      }
    }
  }

  // Portal connection lines between paired portals
  for (const [a, b] of PORTAL_PAIRS) {
    if (
      maze[a.row][a.col] === TILE.PORTAL &&
      maze[b.row][b.col] === TILE.PORTAL
    ) {
      const ax = a.col * TILE_SIZE + TILE_SIZE / 2;
      const ay = a.row * TILE_SIZE + TILE_SIZE / 2;
      const bx = b.col * TILE_SIZE + TILE_SIZE / 2;
      const by = b.row * TILE_SIZE + TILE_SIZE / 2;
      const alpha = 0.08 + 0.05 * Math.sin(frameTime * 0.003);
      ctx.strokeStyle = `rgba(160,60,255,${alpha})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 8]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Power-up timer bar — gradient from lime-green to gold
  if (powerUpActive && powerUpTimeLeft > 0) {
    const barWidth =
      COLS * TILE_SIZE * (powerUpTimeLeft / totalPowerUpDuration);
    const powerBarGrad = ctx.createLinearGradient(0, 0, COLS * TILE_SIZE, 0);
    powerBarGrad.addColorStop(0, "#aaff44");
    powerBarGrad.addColorStop(1, "#f0c030");
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, COLS * TILE_SIZE, 4);
    ctx.fillStyle = powerBarGrad;
    ctx.fillRect(0, 0, barWidth, 4);
  }

  // Ghost mode timer bar — white-blue, bottom of canvas
  if (
    ghostModeActive &&
    ghostModeTimeLeft !== undefined &&
    ghostModeTimeLeft > 0
  ) {
    const fraction = ghostModeTimeLeft / 5000;
    const W = COLS * TILE_SIZE;
    const barY = ROWS * TILE_SIZE - 5;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, barY, W, 4);
    const ghostBarGrad = ctx.createLinearGradient(0, 0, W, 0);
    ghostBarGrad.addColorStop(0, "#c0d8ff");
    ghostBarGrad.addColorStop(1, "#8090ff");
    ctx.fillStyle = ghostBarGrad;
    ctx.fillRect(0, barY, W * fraction, 4);
    // Label
    ctx.save();
    ctx.font = `bold ${TILE_SIZE * 0.55}px 'Outfit', sans-serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(200,220,255,0.85)";
    ctx.fillText("👻 GHOST", 4, barY - 2);
    ctx.restore();
  }

  // Freeze timer bar — cyan, bottom
  if (freezeActive && freezeTimeLeft !== undefined && freezeTimeLeft > 0) {
    const fraction = freezeTimeLeft / 4000;
    const W = COLS * TILE_SIZE;
    const barY = ROWS * TILE_SIZE - (ghostModeActive ? 14 : 5);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, barY, W, 4);
    const freezeBarGrad = ctx.createLinearGradient(0, 0, W, 0);
    freezeBarGrad.addColorStop(0, "#80f8ff");
    freezeBarGrad.addColorStop(1, "#00b0d8");
    ctx.fillStyle = freezeBarGrad;
    ctx.fillRect(0, barY, W * fraction, 4);
    ctx.save();
    ctx.font = `bold ${TILE_SIZE * 0.55}px 'Outfit', sans-serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(120,240,255,0.85)";
    ctx.fillText("🧊 FREEZE", 4, barY - 2);
    ctx.restore();
  }

  // Speed boost timer bar — yellow, bottom
  if (
    speedBoostActive &&
    speedBoostTimeLeft !== undefined &&
    speedBoostTimeLeft > 0
  ) {
    const fraction = speedBoostTimeLeft / 5000;
    const W = COLS * TILE_SIZE;
    const stackOffset = (ghostModeActive ? 9 : 0) + (freezeActive ? 9 : 0);
    const barY = ROWS * TILE_SIZE - 5 - stackOffset;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, barY, W, 4);
    const speedBarGrad = ctx.createLinearGradient(0, 0, W, 0);
    speedBarGrad.addColorStop(0, "#fff060");
    speedBarGrad.addColorStop(1, "#ff9900");
    ctx.fillStyle = speedBarGrad;
    ctx.fillRect(0, barY, W * fraction, 4);
    ctx.save();
    ctx.font = `bold ${TILE_SIZE * 0.55}px 'Outfit', sans-serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,240,80,0.85)";
    ctx.fillText("⚡ SPEED", 4, barY - 2);
    ctx.restore();
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

  // Draw boss skeleton (before player so player renders on top)
  if (bossPhase) {
    drawBossSkeleton(ctx, frameTime);
  }

  // Draw player (with ghost overlay if active)
  if (ghostModeActive) {
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.15 * Math.sin(frameTime * 0.012);
  }
  drawPlayer(
    ctx,
    player.col * TILE_SIZE,
    player.row * TILE_SIZE,
    playerDirection,
    frameTime,
  );
  if (ghostModeActive) {
    ctx.restore();
    // Extra ghost glow around player tile
    const px = player.col * TILE_SIZE + TILE_SIZE / 2;
    const py = player.row * TILE_SIZE + TILE_SIZE / 2;
    const glowR = TILE_SIZE * 1.1;
    const ghostGlow = ctx.createRadialGradient(px, py, 0, px, py, glowR);
    ghostGlow.addColorStop(0, "rgba(180,200,255,0.35)");
    ghostGlow.addColorStop(1, "rgba(180,200,255,0)");
    ctx.fillStyle = ghostGlow;
    ctx.beginPath();
    ctx.arc(px, py, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Speed boost motion trail
  if (speedBoostActive) {
    const px = player.col * TILE_SIZE + TILE_SIZE / 2;
    const py = player.row * TILE_SIZE + TILE_SIZE / 2;
    const trailGlow = ctx.createRadialGradient(
      px,
      py,
      0,
      px,
      py,
      TILE_SIZE * 1.2,
    );
    trailGlow.addColorStop(0, "rgba(255,230,0,0.25)");
    trailGlow.addColorStop(1, "rgba(255,150,0,0)");
    ctx.fillStyle = trailGlow;
    ctx.beginPath();
    ctx.arc(px, py, TILE_SIZE * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Freeze overlay — icy blue screen tint
  if (freezeActive) {
    ctx.fillStyle = "rgba(60,180,255,0.10)";
    ctx.fillRect(0, 0, COLS * TILE_SIZE, ROWS * TILE_SIZE);
  }

  // Explosion flash overlay
  if (explosionFlash) {
    ctx.fillStyle = "rgba(255,120,0,0.35)";
    ctx.fillRect(0, 0, COLS * TILE_SIZE, ROWS * TILE_SIZE);
  }

  // Boss overlay HUD (on top of everything)
  if (bossPhase && bossTimeLeft !== undefined && bossTotalTime !== undefined) {
    drawBossOverlay(ctx, bossTimeLeft, bossTotalTime, frameTime);
  }
}
