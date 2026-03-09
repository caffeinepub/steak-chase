# Steak Chase

## Current State
- Pac-Man style maze game with wolf player, zombies and skeletons all using BFS chase AI
- Collectibles: steak, pork chop, golden apple (power-up)
- Maze has walls, path tiles, and collectible tiles
- Renderer draws walls, paths, collectibles, wolf pixel-art player, and sprite-based enemies
- Sound effects, mute button, mobile D-pad + swipe controls, leaderboard on splash screen

## Requested Changes (Diff)

### Add
- **Zombie distinct AI**: slow movement speed (already slower), but uses BFS to always follow the player (current behavior — ensure it stays clearly slower than skeleton)
- **Skeleton distinct AI**: fast movement but can only move in straight lines (no turning, picks a direction and goes until hitting a wall, then picks a new straight direction)
- **TILE.EXPLOSION (value 5)**: bomb/explosion pickup tile — when player steps on it, all enemies within a 3-tile radius are killed/sent to respawn; awards bonus score
- **TILE.PORTAL (value 6)**: portal tile pair — two portals placed in the maze; stepping on one teleports the player to the other; animated swirling visual

### Modify
- `constants.ts`: add TILE.EXPLOSION and TILE.PORTAL values, add SCORE.EXPLOSION, add a few explosion/portal tiles to INITIAL_MAZE, adjust ZOMBIE_SPEED to be clearly slower and SKELETON_SPEED clearly faster
- `pathfinding.ts`: add `straightLineStep` function for skeleton AI — continues in current direction if open, otherwise picks a new random open straight direction
- `useGameEngine.ts`: 
  - Track skeleton's current straight-line direction in GameEnemy
  - Update `moveEnemies` to use BFS for zombies, straight-line logic for skeletons
  - Update `movePlayer` to handle TILE.EXPLOSION (clear nearby enemies) and TILE.PORTAL (teleport player to paired portal)
  - Track portal pair positions so teleportation works
- `renderer.ts`: add `drawExplosion` and `drawPortal` functions; render new tile types in the main render loop

### Remove
- Nothing removed

## Implementation Plan
1. Update `constants.ts`: add tile types, scores, adjust speeds, add explosion/portal tiles to maze
2. Update `pathfinding.ts`: add `straightLineStep` for skeleton straight-line movement
3. Update `useGameEngine.ts`: add skeleton direction tracking, explosion logic, portal teleport logic
4. Update `renderer.ts`: draw explosion bomb tile (💣 pixel art) and portal tile (swirling vortex animation)
5. Update `GameScreen.tsx` control hints bar to mention new items
