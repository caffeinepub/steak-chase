import { TILE } from "./constants";

export interface Point {
  col: number;
  row: number;
}

/**
 * BFS pathfinding - returns next step toward target, or null if unreachable.
 */
export function bfsNextStep(
  maze: number[][],
  from: Point,
  to: Point,
  rows: number,
  cols: number,
): Point | null {
  if (from.col === to.col && from.row === to.row) return null;

  const queue: Array<{ point: Point; parent: Point | null }> = [
    { point: from, parent: null },
  ];
  const visited = new Set<string>();
  visited.add(`${from.col},${from.row}`);

  const cameFrom = new Map<string, Point | null>();
  cameFrom.set(`${from.col},${from.row}`, null);

  const dirs: Point[] = [
    { col: 0, row: -1 },
    { col: 0, row: 1 },
    { col: -1, row: 0 },
    { col: 1, row: 0 },
  ];

  while (queue.length > 0) {
    const { point } = queue.shift()!;
    const key = `${point.col},${point.row}`;

    if (point.col === to.col && point.row === to.row) {
      // Backtrack to find first step
      let cur: Point | null = point;
      let prev: Point | null = cameFrom.get(`${cur.col},${cur.row}`) ?? null;

      while (prev !== null) {
        const prevPrev = cameFrom.get(`${prev.col},${prev.row}`) ?? null;
        if (prevPrev === null) {
          // prev is the first step
          return prev;
        }
        cur = prev;
        prev = prevPrev;
      }
      return point;
    }

    for (const dir of dirs) {
      const nc = point.col + dir.col;
      const nr = point.row + dir.row;

      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      if (maze[nr][nc] === TILE.WALL) continue;

      const nk = `${nc},${nr}`;
      if (!visited.has(nk)) {
        visited.add(nk);
        cameFrom.set(nk, point);
        queue.push({ point: { col: nc, row: nr }, parent: point });
      }
    }

    void key; // suppress unused warning
  }

  return null;
}

/**
 * BFS full path from `from` to nearest collectible tile (STEAK/PORK_CHOP/GOLDEN_APPLE),
 * avoiding cells occupied by enemies.
 * Returns array of Points (including from but excluding destination), or empty array.
 */
export function bfsSafePath(
  maze: number[][],
  from: Point,
  enemyPositions: Point[],
  rows: number,
  cols: number,
): Point[] {
  const enemySet = new Set(enemyPositions.map((p) => `${p.col},${p.row}`));
  const collectibles = new Set([TILE.STEAK, TILE.PORK_CHOP, TILE.GOLDEN_APPLE]);

  const queue: Point[] = [from];
  const cameFrom = new Map<string, Point | null>();
  cameFrom.set(`${from.col},${from.row}`, null);

  const dirs: Point[] = [
    { col: 0, row: -1 },
    { col: 0, row: 1 },
    { col: -1, row: 0 },
    { col: 1, row: 0 },
  ];

  let goal: Point | null = null;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (
      collectibles.has(maze[cur.row][cur.col] as 2 | 3 | 4) &&
      !(cur.col === from.col && cur.row === from.row)
    ) {
      goal = cur;
      break;
    }
    for (const dir of dirs) {
      const nc = cur.col + dir.col;
      const nr = cur.row + dir.row;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      if (maze[nr][nc] === TILE.WALL) continue;
      const nk = `${nc},${nr}`;
      if (cameFrom.has(nk)) continue;
      // skip cells right next to an enemy (soft danger avoidance)
      if (enemySet.has(nk)) continue;
      cameFrom.set(nk, cur);
      queue.push({ col: nc, row: nr });
    }
  }

  if (!goal) return [];

  // Backtrack to build path
  const path: Point[] = [];
  let cur: Point | null = goal;
  while (cur !== null) {
    path.unshift(cur);
    cur = cameFrom.get(`${cur.col},${cur.row}`) ?? null;
  }
  return path;
}

/**
 * Get a random adjacent non-wall cell (for scared/powered-up flee behavior)
 */
export function randomAdjacentStep(
  maze: number[][],
  from: Point,
  rows: number,
  cols: number,
): Point | null {
  const dirs: Point[] = [
    { col: 0, row: -1 },
    { col: 0, row: 1 },
    { col: -1, row: 0 },
    { col: 1, row: 0 },
  ];

  const valid: Point[] = [];
  for (const dir of dirs) {
    const nc = from.col + dir.col;
    const nr = from.row + dir.row;
    if (
      nc >= 0 &&
      nr >= 0 &&
      nc < cols &&
      nr < rows &&
      maze[nr][nc] !== TILE.WALL
    ) {
      valid.push({ col: nc, row: nr });
    }
  }

  if (valid.length === 0) return null;
  return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * Skeleton straight-line movement:
 * - Continues in currentDir if the next cell is open.
 * - If blocked (wall or out of bounds), picks a random new open direction.
 * Returns { next: Point, newDir: Point } or null if fully stuck.
 */
export function straightLineStep(
  maze: number[][],
  from: Point,
  currentDir: Point,
  rows: number,
  cols: number,
): { next: Point; newDir: Point } | null {
  const allDirs: Point[] = [
    { col: 0, row: -1 },
    { col: 0, row: 1 },
    { col: -1, row: 0 },
    { col: 1, row: 0 },
  ];

  const canMove = (dir: Point): boolean => {
    const nc = from.col + dir.col;
    const nr = from.row + dir.row;
    return (
      nc >= 0 && nr >= 0 && nc < cols && nr < rows && maze[nr][nc] !== TILE.WALL
    );
  };

  // Try current direction first
  if (canMove(currentDir)) {
    return {
      next: { col: from.col + currentDir.col, row: from.row + currentDir.row },
      newDir: currentDir,
    };
  }

  // Blocked — pick a random new direction (excluding reverse if possible)
  const reverse = { col: -currentDir.col, row: -currentDir.row };
  const options = allDirs.filter((d) => {
    if (d.col === reverse.col && d.row === reverse.row) return false;
    return canMove(d);
  });

  // If no forward options, allow reverse
  const choices = options.length > 0 ? options : allDirs.filter(canMove);

  if (choices.length === 0) return null;
  const chosen = choices[Math.floor(Math.random() * choices.length)];
  return {
    next: { col: from.col + chosen.col, row: from.row + chosen.row },
    newDir: chosen,
  };
}
