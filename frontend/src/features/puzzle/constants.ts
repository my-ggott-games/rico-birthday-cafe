export const PIECE_SIZE = 100;
export const CONNECTOR_NECK = 16;
export const CONNECTOR_DEPTH = 16;
export const MIN_DISPLAY_PIECE_SIZE = 24;
export const MOBILE_BOARD_HORIZONTAL_PADDING = 128;
export const DESKTOP_BOARD_HORIZONTAL_PADDING = 96;
export const MOBILE_BOARD_VERTICAL_PADDING = 360;
export const DESKTOP_BOARD_VERTICAL_PADDING = 180;
export const MOUSE_DRAG_DISTANCE_PX = 4;
export const TOUCH_DRAG_ACTIVATION_DELAY_MS = 90;
export const TOUCH_DRAG_TOLERANCE_PX = 10;
export const TAP_ROTATE_MAX_MS = 180;
export const PIECE_RENDER_BLEED = 3;
export const CORNER_PETAL_ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315];

export const PUZZLE_GRID_OPTIONS = [5, 7, 10] as const;

export type PuzzleGridSize = (typeof PUZZLE_GRID_OPTIONS)[number];

export type PuzzleBoardConfig = {
  rows: number;
  cols: number;
  boardWidth: number;
  boardHeight: number;
};

export const getPuzzleBoardConfig = (
  gridSize: PuzzleGridSize,
): PuzzleBoardConfig => ({
  rows: gridSize,
  cols: gridSize,
  boardWidth: gridSize * PIECE_SIZE,
  boardHeight: gridSize * PIECE_SIZE,
});
