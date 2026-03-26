import type { TutorialSlide } from "../../components/common/TutorialBanner";

export const PUZZLE_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "퍼즐 맞추기",
    titleIcon: "Puzzle",
    lines: ["조각을 꾸~욱 눌러 퍼즐을 맞추자", "알맞은 위치에 놓아줘!"],
    showArrows: false,
  },
  {
    title: "탭하면 회전",
    titleIcon: "RefreshCw",
    lines: ["조각을 탭해서 올바른 방향으로 바꾸자"],
    showArrows: false,
  },
  {
    title: "어떤 그림일까?",
    lines: ["제한 시간은 없으니", "여유롭게 즐겨줘!"],
    showArrows: false,
  },
];

export const ROWS = 10;
export const COLS = 10;
export const PIECE_SIZE = 100;
export const CONNECTOR_NECK = 16;
export const CONNECTOR_DEPTH = 16;
export const BOARD_SIZE = {
  width: COLS * PIECE_SIZE,
  height: ROWS * PIECE_SIZE,
};
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
