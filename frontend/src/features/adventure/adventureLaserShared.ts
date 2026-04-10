import type { Graphics as PixiGraphics } from "pixi.js";
import { getPhaseAtTime } from "./adventureGameShared";

export type AdventureLaserCoverage = "full" | "rightTwoThirds" | "chicoAligned";
export type AdventureLaserHitBehavior =
  | "damage-step-1"
  | "damage-step-2"
  | "chico-save"
  | "instant-gameover";
export type AdventurePlayerSpecialState = "default" | "shock" | "anger";

export type AdventureLaserEvent = {
  id: string;
  phaseId: number;
  fireTime: number;
  warningDuration: number;
  fireDuration: number;
  laneTop: number;
  laneHeight: number;
  warningCoverage?: AdventureLaserCoverage;
  coverage: AdventureLaserCoverage;
  onHitBehavior: AdventureLaserHitBehavior;
  requiresTripleJump: true;
};

export type AdventureLaserState = "warning" | "firing";

export const ADVENTURE_LASER_WARNING_DURATION = 1;
export const ADVENTURE_LASER_FIRE_DURATION = 0.5;
export const PHASE_FOUR_CHICO_SAVE_LASER_FIRE_DURATION =
  ADVENTURE_LASER_FIRE_DURATION + 1;
export const ADVENTURE_LASER_LANE_TOP = 198;
export const ADVENTURE_LASER_LANE_HEIGHT = 110;
export const ADVENTURE_TRIPLE_JUMP_UNLOCK_TIME = 280;
export const CHICO_SAVE_TIME = 275;
export const SHOCK_SPRITE_END_TIME = CHICO_SAVE_TIME + 3;
export const ANGER_SPRITE_END_TIME = SHOCK_SPRITE_END_TIME + 2;
export const PHASE_FIVE_SCROLL_RESUME_TIME = 279;
export const CHICO_SILHOUETTE_CENTER_X_RATIO = 0.42;
export const CHICO_SILHOUETTE_FADE_OUT_DURATION = 0.6;

export const ADVENTURE_LASER_EVENTS: AdventureLaserEvent[] = [
  {
    id: "phase4-laser-1",
    phaseId: 4,
    fireTime: 264,
    warningDuration: ADVENTURE_LASER_WARNING_DURATION,
    fireDuration: ADVENTURE_LASER_FIRE_DURATION,
    laneTop: ADVENTURE_LASER_LANE_TOP,
    laneHeight: ADVENTURE_LASER_LANE_HEIGHT,
    coverage: "full",
    onHitBehavior: "damage-step-1",
    requiresTripleJump: true,
  },
  {
    id: "phase4-laser-2",
    phaseId: 4,
    fireTime: 271,
    warningDuration: ADVENTURE_LASER_WARNING_DURATION,
    fireDuration: ADVENTURE_LASER_FIRE_DURATION,
    laneTop: ADVENTURE_LASER_LANE_TOP,
    laneHeight: ADVENTURE_LASER_LANE_HEIGHT,
    coverage: "full",
    onHitBehavior: "damage-step-2",
    requiresTripleJump: true,
  },
  {
    id: "phase4-laser-3",
    phaseId: 4,
    fireTime: 275,
    warningDuration: ADVENTURE_LASER_WARNING_DURATION,
    fireDuration: PHASE_FOUR_CHICO_SAVE_LASER_FIRE_DURATION,
    laneTop: ADVENTURE_LASER_LANE_TOP,
    laneHeight: ADVENTURE_LASER_LANE_HEIGHT,
    warningCoverage: "full",
    coverage: "chicoAligned",
    onHitBehavior: "chico-save",
    requiresTripleJump: true,
  },
  {
    id: "phase5-laser-1",
    phaseId: 5,
    fireTime: 282,
    warningDuration: ADVENTURE_LASER_WARNING_DURATION,
    fireDuration: ADVENTURE_LASER_FIRE_DURATION,
    laneTop: ADVENTURE_LASER_LANE_TOP,
    laneHeight: ADVENTURE_LASER_LANE_HEIGHT,
    warningCoverage: "full",
    coverage: "full",
    onHitBehavior: "instant-gameover",
    requiresTripleJump: true,
  },
] as const;

export const getLaserStateAtTime = (
  event: AdventureLaserEvent,
  time: number,
): AdventureLaserState | null => {
  if (time >= event.fireTime - event.warningDuration && time < event.fireTime) {
    return "warning";
  }

  if (time >= event.fireTime && time < event.fireTime + event.fireDuration) {
    return "firing";
  }

  return null;
};

export const getActiveLaserEventAtTime = (time: number) =>
  ADVENTURE_LASER_EVENTS.find((event) => getLaserStateAtTime(event, time));

export const getLaserCoverageBounds = (
  coverage: AdventureLaserCoverage,
  worldWidth: number,
) =>
  coverage === "rightTwoThirds"
    ? { x: worldWidth / 3, width: (worldWidth * 2) / 3 }
    : coverage === "chicoAligned"
      ? {
          x: worldWidth * CHICO_SILHOUETTE_CENTER_X_RATIO,
          width: worldWidth * (1 - CHICO_SILHOUETTE_CENTER_X_RATIO),
        }
      : { x: 0, width: worldWidth };

export const getPlayerSpecialStateAtTime = (
  time: number,
): AdventurePlayerSpecialState => {
  if (time >= CHICO_SAVE_TIME && time < SHOCK_SPRITE_END_TIME) {
    return "shock";
  }

  if (time >= SHOCK_SPRITE_END_TIME && time < ANGER_SPRITE_END_TIME) {
    return "anger";
  }

  const phaseId = getPhaseAtTime(time).id;
  if (phaseId === 5 && time < CHICO_SAVE_TIME) {
    return "default";
  }
  if (phaseId === 5 || phaseId === 6) {
    return "anger";
  }

  return "default";
};

// ── Phase 5 scripted magic traps ─────────────────────────────────────────────
const MAGIC_LOW_LANE_TOP = 222; // GROUND_Y(318) - 96
const MAGIC_HIGH_LANE_TOP = 154; // GROUND_Y(318) - 164
const PHASE5_MAGIC_TRAP_HEIGHT = 50;
const PHASE5_MAGIC_TRAP_WIDTH = 68;
const PHASE5_TRAP_DELAY_AFTER_LASER = 0.1;
const PHASE5_LASER_DELAY_AFTER_TRAP = 3.5;

export type Phase5TrapEvent = {
  id: string;
  holeId: number; // negative IDs reserved for phase 5 traps
  injectTime: number;
  laneTop: number;
  height: number;
  width: number;
};

export const generatePhase5CombatSchedule = (): {
  lasers: AdventureLaserEvent[];
  traps: Phase5TrapEvent[];
} => {
  const anchor = ADVENTURE_LASER_EVENTS.find((e) => e.id === "phase5-laser-1")!;
  const cycleCount = Math.random() < 0.5 ? 2 : 3;

  const lasers: AdventureLaserEvent[] = [];
  const traps: Phase5TrapEvent[] = [];
  let holeId = -1;
  let prevLaserEnd = anchor.fireTime + anchor.fireDuration;

  for (let i = 0; i < cycleCount; i++) {
    // Trap spawns shortly after the previous laser ends.
    const injectTime = prevLaserEnd + PHASE5_TRAP_DELAY_AFTER_LASER;
    const laneTop =
      Math.random() < 0.5 ? MAGIC_HIGH_LANE_TOP : MAGIC_LOW_LANE_TOP;
    traps.push({
      id: `p5-dyn-trap-${i}`,
      holeId: holeId--,
      injectTime,
      laneTop,
      height: PHASE5_MAGIC_TRAP_HEIGHT,
      width: PHASE5_MAGIC_TRAP_WIDTH,
    });

    // Keep the next laser fully off-screen until the spawned magic trap
    // has had time to scroll out of view, so the two hazards never overlap.
    const fireTime = injectTime + PHASE5_LASER_DELAY_AFTER_TRAP;
    lasers.push({
      id: `p5-dyn-laser-${i}`,
      phaseId: 5,
      fireTime,
      warningDuration: ADVENTURE_LASER_WARNING_DURATION,
      fireDuration: ADVENTURE_LASER_FIRE_DURATION,
      laneTop: ADVENTURE_LASER_LANE_TOP,
      laneHeight: ADVENTURE_LASER_LANE_HEIGHT,
      warningCoverage: "full",
      coverage: "full",
      onHitBehavior: "instant-gameover",
      requiresTripleJump: true,
    });
    prevLaserEnd = fireTime + ADVENTURE_LASER_FIRE_DURATION;
  }

  return { lasers, traps };
};

// ── Sword aura (phase 5 background effect at 291s) ───────────────────────────
export const SWORD_AURA_START_TIME = 296;
export const SWORD_AURA_SPAWN_X_OFFSET = 150; // world units to the right of player
export const SWORD_AURA_FADE_IN_DURATION = 5; // seconds
export const SWORD_AURA_EXIT_SPEED = 350; // world units/second after fade-in
export const SWORD_AURA_IMPACT_X_OFFSET = 36;
export const SWORD_AURA_IMPACT_DURATION = 1.8;
export const SWORD_AURA_WHITE_HOLD_END_TIME = 310;
export const SWORD_AURA_WHITE_FADE_START_TIME =
  SWORD_AURA_WHITE_HOLD_END_TIME - 10;

export type SwordAuraState = {
  auraWorldX: number;
  alpha: number;
  scale: number;
  impactProgress: number;
  whiteFade: number;
  animationRate: number;
  shakeIntensity: number;
};

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

export const getSwordAuraState = (
  time: number,
  playerX: number,
  worldWidth: number,
): SwordAuraState | null => {
  if (time < SWORD_AURA_START_TIME - 5) {
    return null;
  }

  const elapsed = time - (SWORD_AURA_START_TIME - 5);
  const alpha = Math.min(elapsed / SWORD_AURA_FADE_IN_DURATION, 1);
  const exitElapsed = Math.max(elapsed - SWORD_AURA_FADE_IN_DURATION, 0);
  const spawnX = playerX + SWORD_AURA_SPAWN_X_OFFSET;
  const auraWorldX = spawnX + exitElapsed * SWORD_AURA_EXIT_SPEED;
  const travelRatio = Math.min(
    1,
    Math.max(0, (auraWorldX - spawnX) / Math.max(worldWidth - spawnX, 1)),
  );
  const scale = 1 + easeOutCubic(travelRatio) * 1.1;
  const impactStartX = worldWidth + SWORD_AURA_IMPACT_X_OFFSET;
  const impactProgress = Math.min(
    1,
    Math.max(
      0,
      (auraWorldX - impactStartX) /
        (SWORD_AURA_EXIT_SPEED * SWORD_AURA_IMPACT_DURATION),
    ),
  );
  const impactElapsed = Math.max(
    0,
    (auraWorldX - impactStartX) / SWORD_AURA_EXIT_SPEED,
  );
  const impactHoldActive =
    impactProgress >= 1 && time < SWORD_AURA_WHITE_HOLD_END_TIME;
  if (impactProgress >= 1 && !impactHoldActive) {
    return null;
  }
  const whiteFadeProgress = Math.min(
    1,
    Math.max(
      0,
      (time - SWORD_AURA_WHITE_FADE_START_TIME) /
        (SWORD_AURA_WHITE_HOLD_END_TIME - SWORD_AURA_WHITE_FADE_START_TIME),
    ),
  );
  const whiteFade = Math.pow(whiteFadeProgress, 1.9) * 0.92;
  const animationRate =
    impactProgress > 0
      ? impactProgress >= 1
        ? 0.22
        : 1 - Math.pow(impactProgress, 1.45) * 0.78
      : 1;
  const whiteFadeRatio = Math.min(1, whiteFade / 0.92);
  const shakeIntensity =
    impactProgress > 0
      ? whiteFadeProgress > 0
        ? Math.max(0, 1 - Math.pow(whiteFadeRatio, 0.72))
        : impactElapsed <= 1
        ? Math.min(1, Math.pow(impactProgress, 0.78))
        : 1
      : 0;

  return {
    auraWorldX,
    alpha,
    scale,
    impactProgress: impactHoldActive ? 1 : impactProgress,
    whiteFade,
    animationRate,
    shakeIntensity,
  };
};

export const drawSwordAura = ({
  graphics,
  cx,
  cy,
  ss,
  alpha,
  scale,
  impactProgress,
  backgroundColor,
}: {
  graphics: PixiGraphics;
  cx: number;
  cy: number;
  ss: (v: number) => number;
  alpha: number;
  scale: number;
  impactProgress: number;
  backgroundColor: number;
}) => {
  const radius = ss(62 * scale);
  const centerOffset = radius * 0.5;
  const impactEase = easeOutCubic(impactProgress);
  const rightCx = cx + centerOffset;
  const leftCx = cx - centerOffset;

  // Outer glow
  graphics
    .circle(rightCx, cy, ss((96 + impactEase * 36) * scale))
    .fill({ color: 0xc7ff5a, alpha: 0.1 * alpha });
  graphics
    .circle(rightCx, cy, ss((78 + impactEase * 28) * scale))
    .fill({ color: 0x8cff5f, alpha: 0.2 * alpha });
  graphics
    .circle(rightCx, cy, ss((58 + impactEase * 18) * scale))
    .fill({ color: 0xeaffb7, alpha: 0.16 * alpha });

  // Speed trail
  for (let t = 1; t <= 4; t++) {
    const trailCx = rightCx - ss(26 * scale * t);
    const trailRadius = radius * (1 - t * 0.08);
    graphics.circle(trailCx, cy, trailRadius).fill({
      color: t % 2 === 0 ? 0xd6ff73 : 0x72ff7f,
      alpha: alpha * 0.18 * (1 - t * 0.2),
    });
  }

  graphics
    .circle(rightCx, cy, radius)
    .fill({ color: 0xd9ff83, alpha: 0.94 * alpha });
  graphics
    .circle(rightCx, cy, radius * 0.76)
    .fill({ color: 0x99ff67, alpha: 0.34 * alpha });
  graphics
    .circle(rightCx + radius * 0.14, cy - radius * 0.16, radius * 0.22)
    .fill({ color: 0xfaffdd, alpha: 0.42 * alpha });
  graphics.circle(leftCx, cy, radius).fill({ color: backgroundColor, alpha });
  graphics
    .circle(rightCx, cy, radius)
    .stroke({ color: 0xfaffdd, alpha: 0.95 * alpha, width: ss(2.2 * scale) });

  if (impactProgress > 0) {
    const burstRadius = ss((80 + impactEase * 120) * scale);
    graphics
      .circle(rightCx, cy, burstRadius)
      .fill({ color: 0xf7ffda, alpha: 0.16 * impactEase * alpha });
    for (let ray = 0; ray < 8; ray += 1) {
      const angle = (Math.PI * 2 * ray) / 8;
      const inner = ss((28 + impactEase * 16) * scale);
      const outer = ss((90 + impactEase * 120) * scale);
      graphics
        .poly([
          rightCx + Math.cos(angle - 0.09) * inner,
          cy + Math.sin(angle - 0.09) * inner,
          rightCx + Math.cos(angle) * outer,
          cy + Math.sin(angle) * outer,
          rightCx + Math.cos(angle + 0.09) * inner,
          cy + Math.sin(angle + 0.09) * inner,
        ])
        .fill({ color: 0xf4ffd2, alpha: 0.2 * impactEase * alpha });
    }
  }
};

export const isLaserTouchingPlayer = (
  event: AdventureLaserEvent,
  playerBounds: { left: number; right: number; top: number; bottom: number },
  worldWidth: number,
) => {
  const { x, width } = getLaserCoverageBounds(event.coverage, worldWidth);
  const laserLeft = x;
  const laserRight = x + width;
  const laserTop = event.laneTop;
  const laserBottom = event.laneTop + event.laneHeight;

  return (
    playerBounds.right > laserLeft &&
    playerBounds.left < laserRight &&
    playerBounds.bottom > laserTop &&
    playerBounds.top < laserBottom
  );
};

type LaserDrawParams = {
  graphics: PixiGraphics;
  event: AdventureLaserEvent;
  state: AdventureLaserState;
  worldWidth: number;
  px: (value: number) => number;
  py: (value: number) => number;
  sx: (value: number) => number;
  sy: (value: number) => number;
  ss: (value: number) => number;
};

export const drawLaserOverlay = ({
  graphics,
  event,
  state,
  worldWidth,
  px,
  py,
  sx,
  sy,
  ss: _ss,
}: LaserDrawParams) => {
  const drawCoverage =
    state === "warning"
      ? (event.warningCoverage ?? event.coverage)
      : event.coverage;
  const { x, width } = getLaserCoverageBounds(drawCoverage, worldWidth);
  const top = event.laneTop;
  const height = event.laneHeight;

  if (state === "warning") {
    graphics
      .rect(px(x), py(top), sx(width), sy(height))
      .fill({ color: 0xff3b30, alpha: 0.5 });
    return;
  }

  graphics
    .rect(px(x), py(top - 10), sx(width), sy(height + 20))
    .fill({ color: 0x220409, alpha: 0.32 });
  graphics
    .rect(px(x), py(top - 4), sx(width), sy(height + 8))
    .fill({ color: 0x650a12, alpha: 0.58 });
  graphics
    .rect(px(x), py(top + height * 0.2), sx(width), sy(height * 0.6))
    .fill({ color: 0xb71224, alpha: 0.82 });
  graphics
    .rect(px(x), py(top + height * 0.35), sx(width), sy(height * 0.3))
    .fill({ color: 0xffc1b3, alpha: 0.92 });

  for (let sparkX = x + 14; sparkX < x + width - 10; sparkX += 42) {
    graphics
      .poly([
        px(sparkX),
        py(top + height * 0.5),
        px(sparkX + 8),
        py(top - 4),
        px(sparkX + 16),
        py(top + height * 0.5),
        px(sparkX + 8),
        py(top + height + 4),
      ])
      .fill({ color: 0x2a0206, alpha: 0.44 });
  }
};

