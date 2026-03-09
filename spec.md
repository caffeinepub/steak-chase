# Steak Chase

## Current State
Full Pac-Man style maze game with wolf player, zombie and skeleton enemies, collectibles (steaks, pork chops, golden apples), explosions, portals, leaderboard, and mobile controls. When all collectibles are eaten the level is marked complete and the game immediately transitions to the next level.

## Requested Changes (Diff)

### Add
- **Boss Battle phase**: Triggered when the last collectible is eaten (before the level actually completes).
- **Giant Boss Skeleton**: Rendered much larger than normal enemies (~2.5x tile size), centred in the maze, pulsing red glow. Does not follow the player — it just looms in place visually (intimidation effect).
- **5-second survival timer**: A countdown bar/overlay drawn on the canvas showing time remaining. The player must stay alive (not touch the boss) for 5 seconds.
- **Boss hitbox**: If the wolf walks into any tile adjacent to or occupied by the boss, the player loses — restart level 1 (lives reset to 3, score resets to 0).
- **Boss win condition**: Survive 5 seconds → boss explodes (flash effect) → advance to next level (existing level-complete path).
- **Boss phase state**: New fields in `GameState`: `bossPhase: boolean`, `bossStartTime: number`.
- **Boss overlay UI**: Semi-transparent red vignette + "BOSS BATTLE!" text + countdown bar rendered directly on the canvas during boss phase.
- Sound: reuse `playLifeLost` on boss hit, `playLevelComplete` on surviving the boss.

### Modify
- `checkLevelComplete` (useGameEngine.ts): Instead of setting `levelComplete = true` directly, set `bossPhase = true` and record `bossStartTime`.
- `gameLoop` (useGameEngine.ts): Add boss-phase tick — check if player overlaps boss (within 1 tile Manhattan distance), decrement timer, transition on win/loss.
- `GameState` interface: Add `bossPhase`, `bossStartTime`, `bossDefeated` fields.
- `initState`: Initialise new fields to false/0.
- `renderer.ts` `renderFrame`: Accept optional boss-phase data and render the giant skeleton + countdown overlay.
- `RenderState` interface: Add `bossPhase`, `bossTimeLeft`, `bossTotalTime` fields.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `bossPhase`, `bossStartTime`, `bossDefeated` to `GameState` in `useGameEngine.ts` and initialise in `initState`.
2. Modify `checkLevelComplete` to enter boss phase instead of completing the level.
3. In the game loop, add a boss-phase branch: check player proximity to centre (cols 9, row 10), on death reset to level 1 with lives=3 score=0, on survive 5s set `levelComplete = true`.
4. Pass boss render data through `RenderState` to `renderFrame`.
5. In `renderer.ts`, add `drawBossSkeleton` function (giant pixel-art skeleton, red glow, slow pulse).
6. Render boss countdown bar + red vignette + "BOSS BATTLE!" text overlay in `renderFrame` when `bossPhase` is true.
