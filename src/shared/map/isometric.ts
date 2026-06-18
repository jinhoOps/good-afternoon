import type { GridPosition, ScreenPosition } from '../types/graph';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

export function projectIso(position: GridPosition): ScreenPosition {
  return {
    x: (position.q - position.r) * TILE_WIDTH / 2,
    y: (position.q + position.r) * TILE_HEIGHT / 2 - (position.elevation ?? 0)
  };
}
