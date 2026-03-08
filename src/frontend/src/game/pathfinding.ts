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
