import { extend, useTick } from "@pixi/react";
import {
  Assets,
  Container as PixiContainer,
  Graphics as PixiGraphics,
  Sprite as PixiSprite,
  Text as PixiText,
  Texture,
  Ticker,
} from "pixi.js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RunState } from "../../types/adventure";
import {
  ADVENTURE_PHASES,
  TOTAL_DURATION,
  clamp,
  getPhaseAtTime,
} from "./adventureGameShared";
import { ADVENTURE_PLAYER_FRAME_PATHS } from "./adventureAssets";

extend({
  Container: PixiContainer,
  Graphics: PixiGraphics,
  Sprite: PixiSprite,
  Text: PixiText,
});

// ─── Physics constants (identical to desktop – shared game rules) ───────────
const WORLD_WIDTH = 400;
const GROUND_Y = 318;
const PLAYER_X = 75;
const GRAVITY = 1000;
const JUMP_FORCES = [300, 250, 200];
const MAX_JUMPS = 2;
const PHASE_FIVE_MAX_JUMPS = 3;
const COYOTE_TIME_SECONDS = 0.12;
const PLAYER_ANIMATION_FPS = 10;
const PLAYER_RENDER_SIZE = 156;
const PLAYER_SOURCE_FRAME_SIZE = 2000;
const PLAYER_RENDER_SCALE = PLAYER_RENDER_SIZE / PLAYER_SOURCE_FRAME_SIZE;
const PLAYER_SUPPORT_HALF_WIDTH = 6;
const PLAYER_COLLISION_HALF_WIDTH = 18;
const SCROLL_SPEED = 260;
const HOLE_MIN_WIDTH = 144;
const HOLE_MAX_WIDTH = 220;
const HOLE_SPAWN_DISTANCE = 300;
const CLEAR_SLOWDOWN_START_SECONDS = 404;
const FALL_OUT_THRESHOLD = 252;
const SCORE_TICK_INTERVAL_SECONDS = 1;
const SCORE_STEP = 10;
const PHASE_ONE_HAZARD_DELAY_SECONDS = 20;
const PHASE_TRANSITION_SAFE_SECONDS = 3;

// ─── Mobile layout ───────────────────────────────────────────────────────────
// Keep a little more breathing room below the horizon on mobile so the scene
// reads less tall while preserving the sky/ground separation.
const GROUND_Y_RATIO = 0.5;
// Slightly reduce the mobile player size so the character sits more naturally
// inside the narrower portrait framing.
const MOBILE_PLAYER_SCALE = 1;

// ─── Types ───────────────────────────────────────────────────────────────────
type HoleKind = "pit" | "spike" | "lava";

type Hole = {
  id: number;
  x: number;
  width: number;
  gapAfter: number;
  kind: HoleKind;
};

// ─── Pure helpers (same as desktop) ──────────────────────────────────────────
const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const isHazardLockedAtTime = (time: number) =>
  time < PHASE_ONE_HAZARD_DELAY_SECONDS ||
  ADVENTURE_PHASES.some(
    (phase) =>
      phase.start > 0 &&
      time >= phase.start &&
      time < phase.start + PHASE_TRANSITION_SAFE_SECONDS,
  );

const drawCloud = (
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

const drawStar = (
  graphics: PixiGraphics,
  x: number,
  y: number,
  radius: number,
  alpha: number,
) => {
  graphics.circle(x, y, radius).fill({ color: 0xfff3b0, alpha });
};

const getJumpForce = (jumpCount: number) =>
  JUMP_FORCES[jumpCount - 1] ??
  Math.max(
    380,
    JUMP_FORCES[JUMP_FORCES.length - 1] - (jumpCount - JUMP_FORCES.length) * 55,
  );

const getMaxJumpsForTime = (time: number) =>
  getPhaseAtTime(time).id === 5 ? PHASE_FIVE_MAX_JUMPS : MAX_JUMPS;

const isPlayerOverHole = (holes: Hole[], halfWidth: number) => {
  const playerLeft = PLAYER_X - halfWidth;
  const playerRight = PLAYER_X + halfWidth;
  return holes.some(
    (hole) => playerRight > hole.x && playerLeft < hole.x + hole.width,
  );
};

const hasGroundSupport = (holes: Hole[]) =>
  !isPlayerOverHole(holes, PLAYER_SUPPORT_HALF_WIDTH);

const getRunSpeedMultiplier = (courseTime: number) => {
  if (courseTime <= CLEAR_SLOWDOWN_START_SECONDS) {
    return 1;
  }
  return clamp(
    (TOTAL_DURATION - courseTime) /
      (TOTAL_DURATION - CLEAR_SLOWDOWN_START_SECONDS),
    0,
    1,
  );
};

const createHole = (id: number, startX: number, courseTime: number): Hole => {
  const phaseId = getPhaseAtTime(courseTime).id;
  const roll = Math.random();

  if (roll < 0.25) {
    return {
      id,
      x: startX,
      width: Math.round(randomBetween(118, 146)),
      gapAfter: Math.round(randomBetween(148, 210)),
      kind: phaseId >= 4 ? "spike" : "pit",
    };
  }
  if (roll < 0.55) {
    return {
      id,
      x: startX,
      width: Math.round(randomBetween(HOLE_MIN_WIDTH, HOLE_MAX_WIDTH)),
      gapAfter: Math.round(
        randomBetween(HOLE_SPAWN_DISTANCE - 30, HOLE_SPAWN_DISTANCE + 80),
      ),
      kind: phaseId >= 5 ? "lava" : "pit",
    };
  }
  if (roll < 0.8) {
    return {
      id,
      x: startX,
      width: Math.round(randomBetween(210, 286)),
      gapAfter: Math.round(randomBetween(220, 320)),
      kind: phaseId >= 4 ? "spike" : "pit",
    };
  }
  return {
    id,
    x: startX,
    width: Math.round(randomBetween(132, 178)),
    gapAfter: Math.round(randomBetween(128, 176)),
    kind: phaseId >= 3 ? "lava" : "pit",
  };
};

// ─── Component ───────────────────────────────────────────────────────────────
type RunnerSceneMobileProps = {
  stageWidth: number;
  stageHeight: number;
  runState: RunState;
  jumpNonce: number;
  restartNonce: number;
  currentCourseTime: number;
  onScoreChange: (score: number) => void;
  onGameOver: (score: number) => void;
  onComplete: (score: number) => void;
};

export function RunnerSceneMobile({
  stageWidth,
  stageHeight,
  runState,
  jumpNonce,
  restartNonce,
  currentCourseTime,
  onScoreChange,
  onGameOver,
  onComplete,
}: RunnerSceneMobileProps) {
  const [playerFrames, setPlayerFrames] = useState<Texture[]>([]);
  const backgroundRef = useRef<PixiGraphics | null>(null);
  const worldRef = useRef<PixiGraphics | null>(null);
  const shadowRef = useRef<PixiGraphics | null>(null);
  const playerRef = useRef<PixiSprite | null>(null);
  const courseTimeRef = useRef(currentCourseTime);
  const holesRef = useRef<Hole[]>([]);
  const nextHoleIdRef = useRef(1);
  const playerYRef = useRef(0);
  const velocityRef = useRef(0);
  const rotationRef = useRef(0);
  const jumpCountRef = useRef(0);
  const coyoteTimeRef = useRef(COYOTE_TIME_SECONDS);
  const scoreRef = useRef(0);
  const scoreTickTimerRef = useRef(0);
  const gameOverSentRef = useRef(false);
  const animationElapsedRef = useRef(0);
  const runElapsedRef = useRef(0);
  const fallingHoleRef = useRef(false);

  // ── Mobile camera: fill canvas width, lock ground at GROUND_Y_RATIO ────────
  const uniformScale = stageWidth / WORLD_WIDTH;
  const viewportOffsetX = 0;
  const viewportOffsetY =
    stageHeight * GROUND_Y_RATIO - GROUND_Y * uniformScale;

  const sx = useCallback((v: number) => v * uniformScale, [uniformScale]);
  const sy = useCallback((v: number) => v * uniformScale, [uniformScale]);
  const px = useCallback(
    (v: number) => viewportOffsetX + v * uniformScale,
    [uniformScale, viewportOffsetX],
  );
  const py = useCallback(
    (v: number) => viewportOffsetY + v * uniformScale,
    [uniformScale, viewportOffsetY],
  );
  const ss = useCallback((v: number) => v * uniformScale, [uniformScale]);

  // groundYScaled === stageHeight * GROUND_Y_RATIO exactly
  const groundYScaled = py(GROUND_Y);
  const playerXScaled = px(PLAYER_X);
  const groundSegmentBodyHeight = Math.max(0, stageHeight - py(GROUND_Y + 24));
  const currentPhaseId = getPhaseAtTime(currentCourseTime).id;

  useEffect(() => {
    let mounted = true;
    void Promise.all(
      ADVENTURE_PLAYER_FRAME_PATHS.map((path) =>
        Assets.load<Texture>({ src: path, data: { scaleMode: "nearest" } }),
      ),
    ).then((frames) => {
      if (mounted) setPlayerFrames(frames);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    courseTimeRef.current = currentCourseTime;
  }, [currentCourseTime]);

  // ── Background – portrait-native design ─────────────────────────────────────
  // All elements are positioned in screen space using stageWidth (W) and
  // groundYScaled (gy) so the sky area always fills the top 2/3 of the canvas
  // regardless of device width.
  const drawBackdrop = useCallback(() => {
    const graphics = backgroundRef.current;
    if (!graphics) return;

    const phase = getPhaseAtTime(courseTimeRef.current);
    const gy = groundYScaled;
    const W = stageWidth;
    const H = stageHeight;
    const sceneUnit = Math.min(W, gy);

    graphics.clear();

    switch (phase.id) {
      case 1: {
        // Pastoral dawn – pale custard base, sky-blue sky, sun top-right, clouds
        graphics.rect(0, 0, W, H).fill(0xf7f2e8);
        graphics.rect(0, 0, W, gy * 0.9).fill(0xd9eff3);
        graphics.circle(W * 0.78, gy * 0.18, sceneUnit * 0.11).fill(0xffe08b);
        drawCloud(
          graphics,
          W * 0.04,
          gy * 0.09,
          sceneUnit * 0.4,
          sceneUnit * 0.09,
          0.6,
        );
        drawCloud(
          graphics,
          W * 0.46,
          gy * 0.28,
          sceneUnit * 0.32,
          sceneUnit * 0.07,
          0.5,
        );
        drawCloud(
          graphics,
          W * 0.68,
          gy * 0.06,
          sceneUnit * 0.28,
          sceneUnit * 0.06,
          0.4,
        );
        graphics
          .rect(0, gy * 0.82, W, gy * 0.08)
          .fill({ color: 0xffffff, alpha: 0.18 });
        graphics
          .rect(0, gy * 0.88, W, gy * 0.04)
          .fill({ color: 0x5ec7a5, alpha: 0.24 });
        break;
      }
      case 2: {
        // Afternoon desert – warm amber sky, sun, dune silhouettes
        graphics.rect(0, 0, W, H).fill(0xfff4dc);
        graphics.rect(0, 0, W, gy * 0.78).fill(0xf5c77e);
        graphics.circle(W * 0.8, gy * 0.15, sceneUnit * 0.13).fill(0xfff0ad);
        graphics
          .roundRect(
            W * -0.08,
            gy * 0.6,
            sceneUnit * 0.54,
            sceneUnit * 0.28,
            sceneUnit * 0.1,
          )
          .fill(0xd9b572);
        graphics
          .roundRect(
            W * 0.3,
            gy * 0.68,
            sceneUnit * 0.44,
            sceneUnit * 0.24,
            sceneUnit * 0.09,
          )
          .fill(0xc68b59);
        graphics
          .roundRect(
            W * 0.6,
            gy * 0.58,
            sceneUnit * 0.5,
            sceneUnit * 0.32,
            sceneUnit * 0.1,
          )
          .fill(0xaa714f);
        for (let i = 0; i < 3; i++) {
          graphics
            .rect(W * 0.74 + i * W * 0.055, 0, sceneUnit * 0.016, gy * 0.7)
            .fill({ color: 0xfef3c7, alpha: 0.26 });
        }
        graphics
          .rect(0, gy * 0.86, W, gy * 0.06)
          .fill({ color: 0xffffff, alpha: 0.12 });
        graphics
          .rect(0, gy * 0.9, W, gy * 0.04)
          .fill({ color: 0xf7b267, alpha: 0.22 });
        break;
      }
      case 3: {
        // Forest – green sky, small sun, tree silhouettes in mid-ground
        graphics.rect(0, 0, W, H).fill(0xe8f2de);
        graphics.rect(0, 0, W, gy * 0.72).fill(0x9cc8a1);
        graphics
          .circle(W * 0.18, gy * 0.17, sceneUnit * 0.08)
          .fill({ color: 0xfef3c7, alpha: 0.72 });
        const treeXs = [W * 0.02, W * 0.26, W * 0.52, W * 0.76];
        for (const tx of treeXs) {
          const tw = sceneUnit * 0.048;
          graphics.rect(tx, gy * 0.56, tw, sceneUnit * 0.36).fill(0x5b4636);
          graphics
            .circle(tx + tw / 2, gy * 0.54, sceneUnit * 0.13)
            .fill(0x4c7c59);
          graphics
            .circle(tx + tw / 2 - sceneUnit * 0.03, gy * 0.62, sceneUnit * 0.1)
            .fill(0x5f995f);
          graphics
            .circle(tx + tw / 2 + sceneUnit * 0.03, gy * 0.63, sceneUnit * 0.09)
            .fill(0x6aa56a);
        }
        graphics
          .rect(0, gy * 0.84, W, gy * 0.06)
          .fill({ color: 0xe9f7ef, alpha: 0.12 });
        graphics
          .rect(0, gy * 0.88, W, gy * 0.04)
          .fill({ color: 0x7bb661, alpha: 0.24 });
        break;
      }
      case 4: {
        // Dungeon night – dark sky, stars, moon, building silhouettes
        graphics.rect(0, 0, W, H).fill(0x2d3142);
        graphics.rect(0, 0, W, gy * 0.66).fill(0x4f5d75);
        const stars4: [number, number][] = [
          [0.1, 0.08],
          [0.34, 0.14],
          [0.6, 0.06],
          [0.84, 0.18],
          [0.22, 0.3],
          [0.5, 0.22],
          [0.76, 0.34],
          [0.06, 0.4],
          [0.92, 0.1],
          [0.42, 0.42],
        ];
        for (const [fx, fy] of stars4) {
          drawStar(graphics, W * fx, gy * fy, sceneUnit * 0.016, 0.6);
        }
        graphics
          .circle(W * 0.78, gy * 0.14, sceneUnit * 0.09)
          .fill({ color: 0xfef3c7, alpha: 0.92 });
        graphics
          .roundRect(
            W * 0.04,
            gy * 0.5,
            sceneUnit * 0.18,
            sceneUnit * 0.34,
            sceneUnit * 0.02,
          )
          .fill({ color: 0x232936, alpha: 0.88 });
        graphics
          .roundRect(
            W * 0.28,
            gy * 0.42,
            sceneUnit * 0.22,
            sceneUnit * 0.42,
            sceneUnit * 0.02,
          )
          .fill({ color: 0x232936, alpha: 0.88 });
        graphics
          .roundRect(
            W * 0.62,
            gy * 0.48,
            sceneUnit * 0.18,
            sceneUnit * 0.36,
            sceneUnit * 0.02,
          )
          .fill({ color: 0x232936, alpha: 0.88 });
        graphics
          .circle(W * 0.13, gy * 0.57, sceneUnit * 0.02)
          .fill({ color: 0xffb703, alpha: 0.62 });
        graphics
          .circle(W * 0.39, gy * 0.5, sceneUnit * 0.02)
          .fill({ color: 0xffb703, alpha: 0.58 });
        graphics
          .circle(W * 0.71, gy * 0.55, sceneUnit * 0.02)
          .fill({ color: 0xffb703, alpha: 0.56 });
        graphics
          .rect(0, gy * 0.84, W, gy * 0.06)
          .fill({ color: 0xffffff, alpha: 0.08 });
        graphics
          .rect(0, gy * 0.88, W, gy * 0.04)
          .fill({ color: 0x8d99ae, alpha: 0.22 });
        break;
      }
      case 5: {
        // Inferno / boss – crimson sky, blazing sun, smoke, spike silhouettes
        graphics.rect(0, 0, W, H).fill(0x28090f);
        graphics.rect(0, 0, W, gy * 0.74).fill(0x8d1c31);
        graphics
          .circle(W * 0.72, gy * 0.17, sceneUnit * 0.22)
          .fill({ color: 0xff8c42, alpha: 0.14 });
        graphics
          .circle(W * 0.72, gy * 0.17, sceneUnit * 0.14)
          .fill({ color: 0xff8c42, alpha: 0.88 });
        const smokeXs = [0.06, 0.22, 0.44, 0.64, 0.86];
        for (let i = 0; i < smokeXs.length; i++) {
          graphics
            .circle(
              W * smokeXs[i],
              gy * (0.28 + (i % 3) * 0.08),
              sceneUnit * 0.062,
            )
            .fill({ color: 0x2b2d42, alpha: 0.24 });
        }
        for (let i = 0; i < 7; i++) {
          const spX = W * (i / 7);
          graphics
            .poly([
              spX,
              gy * 0.8,
              spX + sceneUnit * 0.036,
              gy * 0.62,
              spX + sceneUnit * 0.072,
              gy * 0.8,
            ])
            .fill({ color: 0x5a0c20, alpha: 0.3 });
        }
        graphics
          .rect(0, gy * 0.86, W, gy * 0.06)
          .fill({ color: 0xfef3c7, alpha: 0.08 });
        graphics
          .rect(0, gy * 0.9, W, gy * 0.04)
          .fill({ color: 0xff8c42, alpha: 0.22 });
        break;
      }
      case 6: {
        // Victory / spring – bright blue sky, sun, clouds, flowers on horizon
        graphics.rect(0, 0, W, H).fill(0xf1fbf8);
        graphics.rect(0, 0, W, gy * 0.82).fill(0xbde0fe);
        graphics
          .circle(W * 0.18, gy * 0.18, sceneUnit * 0.09)
          .fill({ color: 0xfff4b6, alpha: 0.82 });
        drawCloud(
          graphics,
          W * 0.08,
          gy * 0.1,
          sceneUnit * 0.36,
          sceneUnit * 0.08,
          0.52,
        );
        drawCloud(
          graphics,
          W * 0.52,
          gy * 0.24,
          sceneUnit * 0.32,
          sceneUnit * 0.07,
          0.44,
        );
        const flowerXs = [0.04, 0.15, 0.27, 0.39, 0.51, 0.63, 0.75, 0.87, 0.96];
        for (const fx of flowerXs) {
          graphics
            .rect(W * fx, gy * 0.8, sceneUnit * 0.01, sceneUnit * 0.1)
            .fill(0x4d7c0f);
          graphics.circle(W * fx, gy * 0.78, sceneUnit * 0.024).fill(0xf472b6);
          graphics
            .circle(W * fx - sceneUnit * 0.014, gy * 0.8, sceneUnit * 0.018)
            .fill(0xfef08a);
          graphics
            .circle(W * fx + sceneUnit * 0.014, gy * 0.8, sceneUnit * 0.018)
            .fill(0x86efac);
        }
        graphics
          .rect(0, gy * 0.84, W, gy * 0.06)
          .fill({ color: 0xffffff, alpha: 0.16 });
        graphics
          .rect(0, gy * 0.88, W, gy * 0.04)
          .fill({ color: 0x7dd3c7, alpha: 0.24 });
        break;
      }
      default: {
        // Epilogue / ending – deep navy, moon, stars, city silhouette
        graphics.rect(0, 0, W, H).fill(0x152238);
        graphics.rect(0, 0, W, gy * 0.7).fill(0x243b53);
        graphics
          .circle(W * 0.8, gy * 0.16, gy * 0.07)
          .fill({ color: 0xf8fafc, alpha: 0.88 });
        const stars7: [number, number][] = [
          [0.1, 0.1],
          [0.28, 0.06],
          [0.5, 0.16],
          [0.66, 0.08],
          [0.18, 0.24],
          [0.42, 0.2],
          [0.62, 0.3],
          [0.9, 0.14],
          [0.34, 0.36],
          [0.76, 0.26],
        ];
        for (const [fx, fy] of stars7) {
          drawStar(graphics, W * fx, gy * fy, sceneUnit * 0.013, 0.6);
        }
        graphics
          .roundRect(
            W * -0.04,
            gy * 0.5,
            sceneUnit * 0.42,
            sceneUnit * 0.3,
            sceneUnit * 0.02,
          )
          .fill(0x324a5f);
        graphics
          .roundRect(
            W * 0.26,
            gy * 0.44,
            sceneUnit * 0.38,
            sceneUnit * 0.36,
            sceneUnit * 0.02,
          )
          .fill(0x243b53);
        graphics
          .roundRect(
            W * 0.56,
            gy * 0.48,
            sceneUnit * 0.5,
            sceneUnit * 0.32,
            sceneUnit * 0.02,
          )
          .fill(0x1b2a41);
        graphics
          .rect(0, gy * 0.84, W, gy * 0.06)
          .fill({ color: 0xffffff, alpha: 0.1 });
        graphics
          .rect(0, gy * 0.88, W, gy * 0.04)
          .fill({ color: 0x90cdf4, alpha: 0.2 });
        break;
      }
    }
  }, [groundYScaled, stageHeight, stageWidth]);

  // ── Terrain (identical logic to desktop – uses world-coord helpers) ──────────
  const drawTerrain = useCallback(() => {
    const graphics = worldRef.current;
    if (!graphics) return;

    const phase = getPhaseAtTime(courseTimeRef.current);
    graphics.clear();

    const sortedHoles = [...holesRef.current].sort((a, b) => a.x - b.x);
    let segmentStart = 0;

    for (const hole of sortedHoles) {
      const clampedLeft = clamp(hole.x, 0, WORLD_WIDTH);
      const clampedRight = clamp(hole.x + hole.width, 0, WORLD_WIDTH);
      const holeLeft = px(clampedLeft);
      const holeRight = px(clampedRight);

      if (clampedRight > clampedLeft) {
        graphics
          .rect(
            holeLeft,
            py(GROUND_Y - 4),
            holeRight - holeLeft,
            stageHeight - py(GROUND_Y - 4),
          )
          .fill(hole.kind === "lava" ? 0x5a0c20 : 0x3d2b2c);

        if (hole.kind === "spike") {
          for (
            let spikeX = clampedLeft;
            spikeX <= clampedRight - 16;
            spikeX += 18
          ) {
            graphics
              .poly([
                px(spikeX),
                py(GROUND_Y - 4),
                px(spikeX + 8),
                py(GROUND_Y - 24),
                px(spikeX + 16),
                py(GROUND_Y - 4),
              ])
              .fill({ color: 0xd9d9d9, alpha: 0.9 });
          }
        }

        if (hole.kind === "lava") {
          graphics
            .rect(
              px(clampedLeft + 8),
              py(GROUND_Y + 14),
              sx(Math.max(clampedRight - clampedLeft - 16, 0)),
              sy(12),
            )
            .fill({ color: 0xff8c42, alpha: 0.72 });
          graphics
            .rect(
              px(clampedLeft + 18),
              py(GROUND_Y + 28),
              sx(Math.max(clampedRight - clampedLeft - 36, 0)),
              sy(8),
            )
            .fill({ color: 0xffbe0b, alpha: 0.5 });
        }

        graphics
          .rect(
            px(clampedLeft + 12),
            py(GROUND_Y + 28),
            sx(Math.max(clampedRight - clampedLeft - 24, 0)),
            sy(10),
          )
          .fill({ color: 0x000000, alpha: 0.16 });
      }

      if (hole.x > segmentStart) {
        const segmentWidth = hole.x - segmentStart;
        graphics
          .rect(px(segmentStart), py(GROUND_Y - 16), sx(segmentWidth), sy(40))
          .fill(
            phase.id === 4
              ? 0x7d8597
              : phase.id === 5
                ? 0x9c6644
                : phase.id === 7
                  ? 0x8892b0
                  : 0xf0d3ae,
          );
        graphics
          .rect(px(segmentStart), py(GROUND_Y - 18), sx(segmentWidth), sy(14))
          .fill(
            phase.id === 2
              ? 0xf7b267
              : phase.id === 3
                ? 0x7bb661
                : phase.id === 4
                  ? 0xa9b4c2
                  : phase.id === 5
                    ? 0xff8c42
                    : phase.id === 6
                      ? 0x7dd3c7
                      : phase.id === 7
                        ? 0x90cdf4
                        : 0x5ec7a5,
          );
        graphics
          .rect(
            px(segmentStart),
            py(GROUND_Y + 24),
            sx(segmentWidth),
            groundSegmentBodyHeight,
          )
          .fill(
            phase.id === 4
              ? 0x7d8597
              : phase.id === 5
                ? 0x9c6644
                : phase.id === 7
                  ? 0x8892b0
                  : 0xf0d3ae,
          );
        graphics
          .rect(px(segmentStart), py(GROUND_Y + 24), sx(segmentWidth), sy(9))
          .fill({ color: 0xffffff, alpha: 0.18 });
      }

      segmentStart = Math.max(segmentStart, hole.x + hole.width);
    }

    if (segmentStart < WORLD_WIDTH) {
      const segmentWidth = WORLD_WIDTH - segmentStart;
      graphics
        .rect(px(segmentStart), py(GROUND_Y - 16), sx(segmentWidth), sy(40))
        .fill(
          phase.id === 4
            ? 0x7d8597
            : phase.id === 5
              ? 0x9c6644
              : phase.id === 7
                ? 0x8892b0
                : 0xf0d3ae,
        );
      graphics
        .rect(px(segmentStart), py(GROUND_Y - 18), sx(segmentWidth), sy(14))
        .fill(
          phase.id === 2
            ? 0xf7b267
            : phase.id === 3
              ? 0x7bb661
              : phase.id === 4
                ? 0xa9b4c2
                : phase.id === 5
                  ? 0xff8c42
                  : phase.id === 6
                    ? 0x7dd3c7
                    : phase.id === 7
                      ? 0x90cdf4
                      : 0x5ec7a5,
        );
      graphics
        .rect(
          px(segmentStart),
          py(GROUND_Y + 24),
          sx(segmentWidth),
          groundSegmentBodyHeight,
        )
        .fill(
          phase.id === 4
            ? 0x7d8597
            : phase.id === 5
              ? 0x9c6644
              : phase.id === 7
                ? 0x8892b0
                : 0xf0d3ae,
        );
      graphics
        .rect(px(segmentStart), py(GROUND_Y + 24), sx(segmentWidth), sy(9))
        .fill({ color: 0xffffff, alpha: 0.18 });
    }
  }, [groundSegmentBodyHeight, px, py, stageHeight, sx, sy]);

  // ── Player visuals ────────────────────────────────────────────────────────────
  const syncPlayerVisuals = useCallback(() => {
    const player = playerRef.current;
    const shadow = shadowRef.current;
    if (!player || !shadow) return;

    player.x = playerXScaled;
    player.y = groundYScaled - ss(playerYRef.current);
    player.rotation = rotationRef.current;
    player.scale.set(PLAYER_RENDER_SCALE * uniformScale * MOBILE_PLAYER_SCALE);

    const shadowScale = clamp(
      0.82 - Math.max(playerYRef.current, 0) / 220,
      0.34,
      0.82,
    );
    const shadowAlpha =
      runState === "gameover" ||
      runState === "completed" ||
      fallingHoleRef.current ||
      isPlayerOverHole(holesRef.current, PLAYER_COLLISION_HALF_WIDTH)
        ? 0
        : 0.22;

    shadow.clear();
    shadow
      .ellipse(
        playerXScaled,
        py(GROUND_Y - 10),
        ss(25 * shadowScale),
        ss(6.5 * shadowScale),
      )
      .fill({ color: 0x102542, alpha: shadowAlpha });
  }, [groundYScaled, playerXScaled, py, runState, ss, uniformScale]);

  // ── Scene reset ───────────────────────────────────────────────────────────────
  const resetScene = useCallback(() => {
    playerYRef.current = 0;
    velocityRef.current = 0;
    rotationRef.current = 0;
    jumpCountRef.current = 0;
    coyoteTimeRef.current = COYOTE_TIME_SECONDS;
    scoreRef.current = 0;
    scoreTickTimerRef.current = 0;
    gameOverSentRef.current = false;
    animationElapsedRef.current = 0;
    runElapsedRef.current = 0;
    fallingHoleRef.current = false;
    nextHoleIdRef.current = 1;
    holesRef.current = [];
    onScoreChange(0);
    drawBackdrop();
    drawTerrain();
    syncPlayerVisuals();
  }, [drawBackdrop, drawTerrain, onScoreChange, syncPlayerVisuals]);

  // ── Jump ──────────────────────────────────────────────────────────────────────
  const tryJump = useCallback(() => {
    const supported =
      hasGroundSupport(holesRef.current) && !fallingHoleRef.current;
    const grounded = playerYRef.current <= 0.01 && supported;
    const maxJumps = getMaxJumpsForTime(courseTimeRef.current);
    const canGroundJump = grounded;
    const canCoyoteJump =
      jumpCountRef.current === 0 && coyoteTimeRef.current > 0;
    const canAirJump =
      jumpCountRef.current > 0 && jumpCountRef.current < maxJumps;

    if (!canGroundJump && !canCoyoteJump && !canAirJump) return;

    const nextJumpCount = jumpCountRef.current + 1;
    jumpCountRef.current = nextJumpCount;
    coyoteTimeRef.current = 0;
    velocityRef.current = getJumpForce(nextJumpCount);
    rotationRef.current = nextJumpCount > 1 ? -0.34 : -0.18;
    syncPlayerVisuals();
  }, [syncPlayerVisuals]);

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (playerFrames.length === 0) return;
    resetScene();
  }, [playerFrames, restartNonce, resetScene]);

  useEffect(() => {
    if (playerFrames.length === 0) return;
    drawTerrain();
    syncPlayerVisuals();
  }, [currentCourseTime, drawTerrain, playerFrames, syncPlayerVisuals]);

  useEffect(() => {
    if (playerFrames.length === 0) return;
    drawBackdrop();
  }, [currentPhaseId, drawBackdrop, playerFrames]);

  useEffect(() => {
    if (playerFrames.length === 0 || runState !== "running") return;
    tryJump();
  }, [jumpNonce, playerFrames, runState, tryJump]);

  // ── Tick ──────────────────────────────────────────────────────────────────────
  useTick(
    useCallback(
      (ticker: Ticker) => {
        if (playerFrames.length === 0) return;

        const player = playerRef.current;
        if (player) {
          const speedMultiplier = getRunSpeedMultiplier(courseTimeRef.current);
          if (runState === "running") {
            animationElapsedRef.current +=
              (ticker.deltaMS / 1000) * Math.max(0.24, speedMultiplier);
          } else if (runState !== "paused") {
            animationElapsedRef.current = 0;
          }

          const frameIndex =
            runState === "running"
              ? Math.floor(animationElapsedRef.current * PLAYER_ANIMATION_FPS) %
                playerFrames.length
              : 0;
          const nextTexture = playerFrames[frameIndex];
          if (player.texture !== nextTexture) {
            player.texture = nextTexture;
          }
        }

        if (runState !== "running") {
          if (runState === "ready") {
            drawBackdrop();
            drawTerrain();
            syncPlayerVisuals();
          }
          return;
        }

        const deltaSeconds = Math.min(ticker.deltaMS / 1000, 1 / 20);
        const speedMultiplier = getRunSpeedMultiplier(courseTimeRef.current);
        const holeDeltaSeconds = deltaSeconds * speedMultiplier;
        runElapsedRef.current += deltaSeconds;
        const obstaclesEnabled = !isHazardLockedAtTime(courseTimeRef.current);

        let nextHoles: Hole[] = [];
        if (obstaclesEnabled) {
          nextHoles = holesRef.current
            .map((hole) => ({
              ...hole,
              x: hole.x - SCROLL_SPEED * holeDeltaSeconds,
            }))
            .filter((hole) => hole.x + hole.width > -80);

          const lastHole = nextHoles[nextHoles.length - 1];
          if (
            !lastHole ||
            lastHole.x + lastHole.width < WORLD_WIDTH - HOLE_SPAWN_DISTANCE
          ) {
            const spawnX = Math.max(
              WORLD_WIDTH + 120,
              lastHole
                ? lastHole.x + lastHole.width + lastHole.gapAfter
                : WORLD_WIDTH + 220,
            );
            nextHoles.push(
              createHole(nextHoleIdRef.current, spawnX, courseTimeRef.current),
            );
            nextHoleIdRef.current += 1;
          }
        } else {
          nextHoleIdRef.current = 1;
        }
        holesRef.current = nextHoles;

        let nextVelocity = velocityRef.current - GRAVITY * deltaSeconds;
        let nextY = playerYRef.current + nextVelocity * deltaSeconds;

        const rawOverHole = isPlayerOverHole(
          nextHoles,
          PLAYER_COLLISION_HALF_WIDTH,
        );
        const groundSupportAvailable = hasGroundSupport(nextHoles);

        if (fallingHoleRef.current && groundSupportAvailable && nextY > 0) {
          fallingHoleRef.current = false;
        }

        const supported = groundSupportAvailable && !fallingHoleRef.current;
        const grounded = playerYRef.current <= 0.01 && supported;

        if (grounded) {
          coyoteTimeRef.current = COYOTE_TIME_SECONDS;
        } else if (coyoteTimeRef.current > 0) {
          coyoteTimeRef.current = Math.max(
            0,
            coyoteTimeRef.current - deltaSeconds,
          );
        }

        const descendingTowardHole =
          velocityRef.current <= 0 && nextVelocity <= 0;
        const closeEnoughToFallLatch = playerYRef.current <= 6 && nextY <= 0;

        if (
          !fallingHoleRef.current &&
          rawOverHole &&
          !supported &&
          descendingTowardHole &&
          closeEnoughToFallLatch &&
          coyoteTimeRef.current <= 0
        ) {
          fallingHoleRef.current = true;
        }

        const overHole = fallingHoleRef.current || rawOverHole;
        const hasSupportNow = supported && !fallingHoleRef.current;

        if (hasSupportNow && nextY <= 0) {
          nextY = 0;
          nextVelocity = 0;
          jumpCountRef.current = 0;
          coyoteTimeRef.current = COYOTE_TIME_SECONDS;
          rotationRef.current *= 0.56;
        } else if ((overHole || fallingHoleRef.current) && nextY < -10) {
          rotationRef.current = clamp(
            rotationRef.current - 1.8 * deltaSeconds,
            -1.15,
            0.22,
          );
        } else {
          rotationRef.current *= 0.9;
        }

        playerYRef.current = nextY;
        velocityRef.current = nextVelocity;

        scoreTickTimerRef.current += deltaSeconds;
        if (scoreTickTimerRef.current >= SCORE_TICK_INTERVAL_SECONDS) {
          const scoreTicks = Math.floor(
            scoreTickTimerRef.current / SCORE_TICK_INTERVAL_SECONDS,
          );
          scoreTickTimerRef.current -= scoreTicks * SCORE_TICK_INTERVAL_SECONDS;
          scoreRef.current += scoreTicks * SCORE_STEP;
          onScoreChange(scoreRef.current);
        }

        drawTerrain();
        syncPlayerVisuals();

        if (nextY < -FALL_OUT_THRESHOLD && !gameOverSentRef.current) {
          gameOverSentRef.current = true;
          onGameOver(scoreRef.current);
        }

        if (
          courseTimeRef.current >= TOTAL_DURATION - 0.05 &&
          !gameOverSentRef.current
        ) {
          gameOverSentRef.current = true;
          onComplete(scoreRef.current);
        }
      },
      [
        drawBackdrop,
        drawTerrain,
        onComplete,
        onGameOver,
        onScoreChange,
        runState,
        syncPlayerVisuals,
        playerFrames,
      ],
    ),
  );

  return (
    <pixiContainer>
      <pixiGraphics ref={backgroundRef} draw={() => undefined} />
      <pixiGraphics ref={worldRef} draw={() => undefined} />
      <pixiGraphics ref={shadowRef} draw={() => undefined} />
      {playerFrames[0] ? (
        <pixiSprite
          ref={playerRef}
          texture={playerFrames[0]}
          x={playerXScaled}
          y={groundYScaled}
          anchor={{ x: 0.5, y: 1 }}
        />
      ) : null}
      {playerFrames.length === 0 ? (
        <pixiText
          text="Loading..."
          x={stageWidth / 2}
          y={stageHeight / 2}
          anchor={0.5}
          style={{
            fill: "#102542",
            fontFamily: "Arial",
            fontSize: ss(24),
            fontWeight: "800",
          }}
        />
      ) : null}
    </pixiContainer>
  );
}
