import type { Graphics as PixiGraphics } from "pixi.js";
import type { AdventureGameOverReason } from "../../types/adventure";
import {
  ADVENTURE_PHASES,
  TOTAL_DURATION,
  clamp,
  getPhaseAtTime,
} from "./adventureGameShared";

// ─── Physics constants ────────────────────────────────────────────────────────
export const WORLD_WIDTH = 400;
export const GROUND_Y = 318;
export const PLAYER_X = 75;
export const GRAVITY = 1000;
export const JUMP_FORCES = [300, 250, 200];
export const MAX_JUMPS = 2;
export const PHASE_FIVE_MAX_JUMPS = 3;
export const COYOTE_TIME_SECONDS = 0.12;
export const PLAYER_ANIMATION_FPS = 10;
export const PLAYER_RENDER_SIZE = 156;
export const PLAYER_SOURCE_FRAME_SIZE = 2000;
export const PLAYER_RENDER_SCALE = PLAYER_RENDER_SIZE / PLAYER_SOURCE_FRAME_SIZE;
export const PLAYER_SUPPORT_HALF_WIDTH = 6;
export const PLAYER_COLLISION_HALF_WIDTH = 18;
export const PLAYER_COLLISION_HEIGHT = 92;
export const SCROLL_SPEED = 260;
export const HOLE_MIN_WIDTH = 144;
export const HOLE_MAX_WIDTH = 220;
export const HOLE_SPAWN_DISTANCE = 300;
export const CLEAR_SLOWDOWN_START_SECONDS = 404;
export const FALL_OUT_THRESHOLD = 252;
export const SCORE_TICK_INTERVAL_SECONDS = 1;
export const SCORE_STEP = 10;
export const PHASE_ONE_HAZARD_DELAY_SECONDS = 20;
export const PHASE_TRANSITION_SAFE_SECONDS = 2;
export const HAZARD_GAP_MULTIPLIER = 0.5;
export const PHASE_SPEED_MULTIPLIERS = [
  0.88, 0.96, 1.04, 1.1, 1.16, 1.22, 1.28,
] as const;

// ─── Mobile layout ────────────────────────────────────────────────────────────
export const GROUND_Y_RATIO = 0.5;
export const MOBILE_PLAYER_SCALE = 1;

// ─── Types ────────────────────────────────────────────────────────────────────
export type HoleKind = "pit" | "spike" | "lava" | "slime" | "magic";

export type Hole = {
  id: number;
  x: number;
  width: number;
  gapAfter: number;
  kind: HoleKind;
  height?: number;
  y?: number;
};

const MAGIC_HAZARD_WIDTH_MIN = 58;
const MAGIC_HAZARD_WIDTH_MAX = 74;
const MAGIC_HAZARD_HEIGHT_MIN = 44;
const MAGIC_HAZARD_HEIGHT_MAX = 56;
const MAGIC_HITBOX_INSET_X = 8;
const MAGIC_HITBOX_INSET_Y = 6;
const MAGIC_LOW_LANE_TOP = GROUND_Y - 96;
const MAGIC_HIGH_LANE_TOP = GROUND_Y - 164;

// ─── Pure helpers ─────────────────────────────────────────────────────────────
export const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const getMinimumHazardGapForPhase = (phaseId: number) =>
  phaseId === 1
    ? 140
    : phaseId === 2
      ? 120
      : phaseId === 3
        ? 92
        : phaseId === 4
          ? 70
          : phaseId === 5
            ? 56
            : phaseId === 6
              ? 44
              : 36;

const scaleHazardGap = (gapAfter: number, phaseId: number) =>
  Math.max(
    getMinimumHazardGapForPhase(phaseId),
    Math.round(gapAfter * HAZARD_GAP_MULTIPLIER),
  );

export const randomizeHazardGapForPhase = (
  phaseId: number,
  min: number,
  max: number,
) =>
  scaleHazardGap(
    Math.round(randomBetween(min, max) * randomBetween(0.65, 1.45)),
    phaseId,
  );

export const isHazardLockedAtTime = (time: number) =>
  time < PHASE_ONE_HAZARD_DELAY_SECONDS ||
  ADVENTURE_PHASES.some(
    (phase) =>
      phase.id > 2 &&
      time >= phase.start - PHASE_TRANSITION_SAFE_SECONDS &&
      time < phase.start + PHASE_TRANSITION_SAFE_SECONDS,
  );

export const drawCloud = (
  graphics: PixiGraphics,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha: number,
) => {
  graphics
    .roundRect(x, y, width, height * 0.5, height * 0.25)
    .fill({ color: 0xffffff, alpha });
  graphics
    .circle(x + width * 0.24, y + height * 0.2, height * 0.34)
    .fill({ color: 0xffffff, alpha });
  graphics
    .circle(x + width * 0.48, y + height * 0.1, height * 0.42)
    .fill({ color: 0xffffff, alpha });
  graphics
    .circle(x + width * 0.76, y + height * 0.2, height * 0.3)
    .fill({ color: 0xffffff, alpha });
};

export const drawStar = (
  graphics: PixiGraphics,
  x: number,
  y: number,
  radius: number,
  alpha: number,
) => {
  graphics.circle(x, y, radius).fill({ color: 0xfff3b0, alpha });
};

export const getJumpForce = (jumpCount: number) =>
  JUMP_FORCES[jumpCount - 1] ??
  Math.max(
    380,
    JUMP_FORCES[JUMP_FORCES.length - 1] - (jumpCount - JUMP_FORCES.length) * 55,
  );

export const getMaxJumpsForTime = (time: number) =>
  getPhaseAtTime(time).id === 5 ? PHASE_FIVE_MAX_JUMPS : MAX_JUMPS;

export const isGapHazard = (hole: Hole) =>
  hole.kind === "pit" || hole.kind === "spike" || hole.kind === "lava";

export const getGameOverReasonForHoleKind = (
  kind: HoleKind,
): AdventureGameOverReason =>
  kind === "magic" || kind === "slime" || kind === "lava" || kind === "spike"
    ? kind
    : "pit";

export const isPlayerOverHole = (holes: Hole[], halfWidth: number) => {
  const playerLeft = PLAYER_X - halfWidth;
  const playerRight = PLAYER_X + halfWidth;
  return holes.some(
    (hole) =>
      isGapHazard(hole) &&
      playerRight > hole.x &&
      playerLeft < hole.x + hole.width,
  );
};

export const hasGroundSupport = (holes: Hole[]) =>
  !isPlayerOverHole(holes, PLAYER_SUPPORT_HALF_WIDTH);

export const getGapHazardUnderPlayer = (holes: Hole[], halfWidth: number) => {
  const playerLeft = PLAYER_X - halfWidth;
  const playerRight = PLAYER_X + halfWidth;
  return (
    holes.find(
      (hole) =>
        isGapHazard(hole) &&
        playerRight > hole.x &&
        playerLeft < hole.x + hole.width,
    ) ?? null
  );
};

export const getPlayerBounds = (playerY: number) => ({
  left: PLAYER_X - PLAYER_COLLISION_HALF_WIDTH,
  right: PLAYER_X + PLAYER_COLLISION_HALF_WIDTH,
  bottom: GROUND_Y - playerY,
  top: GROUND_Y - playerY - PLAYER_COLLISION_HEIGHT,
});

export const getSolidHazardTouchingPlayer = (holes: Hole[], playerY: number) => {
  const playerBounds = getPlayerBounds(playerY);

  return (
    holes.find((hole) => {
      if (hole.kind !== "slime" && hole.kind !== "magic") {
        return false;
      }

      const rawHazardTop = hole.y ?? GROUND_Y - (hole.height ?? 0);
      const rawHazardBottom = rawHazardTop + (hole.height ?? 0);
      const hazardLeft =
        hole.kind === "magic" ? hole.x + MAGIC_HITBOX_INSET_X : hole.x;
      const hazardRight =
        hole.kind === "magic"
          ? hole.x + hole.width - MAGIC_HITBOX_INSET_X
          : hole.x + hole.width;
      const hazardTop =
        hole.kind === "magic"
          ? rawHazardTop + MAGIC_HITBOX_INSET_Y
          : rawHazardTop;
      const hazardBottom =
        hole.kind === "magic"
          ? rawHazardBottom - MAGIC_HITBOX_INSET_Y
          : rawHazardBottom;

      return (
        playerBounds.right > hazardLeft &&
        playerBounds.left < hazardRight &&
        playerBounds.bottom > hazardTop &&
        playerBounds.top < hazardBottom
      );
    }) ?? null
  );
};

export const getRunSpeedMultiplier = (courseTime: number) => {
  const phaseId = getPhaseAtTime(courseTime).id;
  const phaseSpeedMultiplier =
    PHASE_SPEED_MULTIPLIERS[phaseId - 1] ??
    PHASE_SPEED_MULTIPLIERS[PHASE_SPEED_MULTIPLIERS.length - 1];

  if (courseTime <= CLEAR_SLOWDOWN_START_SECONDS) {
    return phaseSpeedMultiplier;
  }
  return (
    phaseSpeedMultiplier *
    clamp(
      (TOTAL_DURATION - courseTime) /
        (TOTAL_DURATION - CLEAR_SLOWDOWN_START_SECONDS),
      0,
      1,
    )
  );
};

export const createHole = (id: number, startX: number, courseTime: number): Hole => {
  const phaseId = getPhaseAtTime(courseTime).id;
  const roll = Math.random();

  if (phaseId === 2) {
    if (roll < 0.42) {
      const height = Math.round(randomBetween(26, 38));
      return {
        id,
        x: startX,
        width: Math.round(randomBetween(60, 86)),
        gapAfter: randomizeHazardGapForPhase(phaseId, 180, 340),
        kind: "slime",
        height,
        y: GROUND_Y - height,
      };
    }

    return {
      id,
      x: startX,
      width: Math.round(randomBetween(126, 164)),
      gapAfter: randomizeHazardGapForPhase(phaseId, 140, 260),
      kind: "pit",
    };
  }

  if (phaseId === 3) {
    if (roll < 0.42) {
      const height = Math.round(randomBetween(26, 38));
      return {
        id,
        x: startX,
        width: Math.round(randomBetween(60, 86)),
        gapAfter: randomizeHazardGapForPhase(phaseId, 180, 340),
        kind: "slime",
        height,
        y: GROUND_Y - height,
      };
    }

    return {
      id,
      x: startX,
      width: Math.round(randomBetween(132, 176)),
      gapAfter: randomizeHazardGapForPhase(phaseId, 140, 250),
      kind: "pit",
    };
  }

  if (phaseId === 4 || phaseId === 5) {
    if (roll < 0.34) {
      const height = Math.round(
        randomBetween(MAGIC_HAZARD_HEIGHT_MIN, MAGIC_HAZARD_HEIGHT_MAX),
      );
      const top = Math.random() < 0.5 ? MAGIC_LOW_LANE_TOP : MAGIC_HIGH_LANE_TOP;
      return {
        id,
        x: startX,
        width: Math.round(
          randomBetween(MAGIC_HAZARD_WIDTH_MIN, MAGIC_HAZARD_WIDTH_MAX),
        ),
        gapAfter: randomizeHazardGapForPhase(phaseId, 200, 340),
        kind: "magic",
        height,
        y: top,
      };
    }
  }

  if (roll < 0.25) {
    return {
      id,
      x: startX,
      width: Math.round(randomBetween(118, 146)),
      gapAfter: randomizeHazardGapForPhase(phaseId, 120, 220),
      kind: phaseId >= 4 ? "spike" : "pit",
    };
  }
  if (roll < 0.55) {
    return {
      id,
      x: startX,
      width: Math.round(randomBetween(HOLE_MIN_WIDTH, HOLE_MAX_WIDTH)),
      gapAfter: randomizeHazardGapForPhase(
        phaseId,
        HOLE_SPAWN_DISTANCE - 30,
        HOLE_SPAWN_DISTANCE + 80,
      ),
      kind: phaseId === 4 || phaseId === 5 ? "lava" : "pit",
    };
  }
  if (roll < 0.8) {
    return {
      id,
      x: startX,
      width: Math.round(randomBetween(210, 286)),
      gapAfter: randomizeHazardGapForPhase(phaseId, 200, 330),
      kind: phaseId >= 4 ? "spike" : "pit",
    };
  }
  return {
    id,
    x: startX,
    width: Math.round(randomBetween(132, 178)),
    gapAfter: randomizeHazardGapForPhase(phaseId, 110, 190),
    kind: phaseId === 4 || phaseId === 5 ? "lava" : "pit",
  };
};
