export type RunState = "ready" | "running" | "paused" | "gameover";

export const ADVENTURE_BEST_SCORE_KEY = "birthday-cafe-adventure-best";
export const R_GEND_HERO_CODE = "R-GEND-HERO";

export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 480;
export const GROUND_HEIGHT = 100;

export const PLAYER_X = 122;
export const PLAYER_WIDTH = 200;
export const PLAYER_HEIGHT = 200;
export const MOBILE_WORLD_SCALE = 1.5;
export const PLAYER_MOBILE_SCALE = MOBILE_WORLD_SCALE;
export const PLAYER_HITBOX_WIDTH_RATIO = 0.1;
export const PLAYER_HITBOX_HEIGHT_RATIO = 0.55;
export const PLAYER_HITBOX_BOTTOM_OFFSET_RATIO = 0.1;
export const PLAYER_GROUND_OFFSET = -14;
export const TRAP_MOBILE_SCALE = MOBILE_WORLD_SCALE;
export const TRAP_HITBOX_HORIZONTAL_INSET_RATIO = 0.075;
export const TRAP_HITBOX_BOTTOM_OFFSET_RATIO = 0.06;
export const TRAP_HITBOX_HEIGHT_RATIO = 0.744;
// Mobile hitbox — smaller area for more lenient collision feel
export const TRAP_HITBOX_HORIZONTAL_INSET_RATIO_MOBILE = 0.16;
export const TRAP_HITBOX_BOTTOM_OFFSET_RATIO_MOBILE = 0.13;
export const TRAP_HITBOX_HEIGHT_RATIO_MOBILE = 0.56;

export const getEffectiveGroundHeight = (_isMobile: boolean): number =>
  GROUND_HEIGHT;

export const getPlayAreaHeight = (isMobile: boolean): number =>
  WORLD_HEIGHT - getEffectiveGroundHeight(isMobile);

export const BASE_SCROLL_SPEED = 320;
export const SCROLL_SPEED_STEP = 60;
export const BASE_FRAME_DURATION_MS = 120;
export const MIN_FRAME_DURATION_MS = 60;
export const FRAME_DURATION_STEP_MS = 6;
export const SCORE_PER_SECOND = 10;

export const JUMP_VELOCITY = 500;
export const JUMP_HOLD_BOOST = 1400;
export const JUMP_HOLD_MAX_MS = 280;
export const GRAVITY = 2000;
export const MAX_JUMPS = 2;
