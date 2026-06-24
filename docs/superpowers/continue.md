# Continue - Pre-Cyan Tile Movement Brainstorming

## Last Action

Paused during `superpowers:brainstorming` before any implementation. The user said the current game feels requirement-driven and identified the first concrete problem as poor controls, especially mobile controls.

## Agreed Direction

- First improvement target: controls and moment-to-moment feel, not new content.
- Preferred movement model: full tile-based movement, not continuous movement with correction.
- Map should be rebuilt around an isometric diamond grid.
- Mobile control should be a fixed D-pad improved to feel like a joystick: hold a direction to keep moving tile by tile.
- Approved design sections so far:
  - Core direction: Pre-Cyan becomes an isometric tile-grid exploration scene.
  - Input feel: keyboard and mobile D-pad share one direction intent model.
  - Map and interaction: hotspots live on current/front tiles instead of free-coordinate radius checks.

## Next Action

Continue brainstorming from design section 4. Cover visual feedback, state/data architecture, testing/UAT, and migration risk. Then ask for approval section by section before writing the final design spec.

## Why

The current implementation uses free movement in `src/pre-cyan-village/game/objects/Player.ts`, fixed HUD movement buttons in `DeviceHud.ts`, and radius-based hotspots in `map-layout.ts`. The user prefers replacing that model rather than polishing it.

## Open Threads

- Decide exact tile size, movement duration, and map dimensions.
- Decide whether RoomScene also becomes tile-based in the same pass or stays simpler until VillageScene is proven.
- Decide how much of the current `VillageState` can remain unchanged while replacing the rendering/input layer.

## Do Not

- Do not start implementation yet. Brainstorming hard gate is still active.
- Do not write the final design spec until the remaining design sections are presented and approved.
- Do not treat the old root HTML demos or `app/` runtime as the implementation source.
- Do not revert unrelated current work: `AGENTS.md`, `.codegraph/`, and an existing docs plan are already modified/untracked in the worktree.
