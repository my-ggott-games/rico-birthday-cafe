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
import type {
  AdventureGameOverReason,
  AdventureRunnerSnapshot,
  RunState,
} from "../../types/adventure";
import {
  ADVENTURE_PHASES,
  TOTAL_DURATION,
  clamp,
  getPhaseAtTime,
} from "./adventureGameShared";
import { ADVENTURE_PLAYER_TEXTURE_PATHS } from "./adventureAssets";
import {
  COYOTE_TIME_SECONDS,
  FALL_OUT_THRESHOLD,
  GRAVITY,
  GROUND_Y,
  GROUND_Y_RATIO,
  MOBILE_PLAYER_SCALE,
  PLAYER_ANIMATION_FPS,
  PLAYER_COLLISION_HALF_WIDTH,
  PLAYER_COLLISION_HEIGHT,
  PLAYER_RENDER_SCALE,
  PLAYER_X,
  SCORE_STEP,
  SCORE_TICK_INTERVAL_SECONDS,
  SCROLL_SPEED,
  WORLD_WIDTH,
  createHole,
  drawCloud,
  drawStar,
  getGameOverReasonForHoleKind,
  getGapHazardUnderPlayer,
  getJumpForce,
  getMaxJumpsForTime,
  getPlayerBounds,
  getRunSpeedMultiplier,
  getSolidHazardTouchingPlayer,
  hasGroundSupport,
  isGapHazard,
  isHazardLockedAtTime,
  isPlayerOverHole,
  type Hole,
  type HoleKind,
} from "./adventureGameMobileConstants";
import {
  ANGER_SPRITE_END_TIME,
  CHICO_SAVE_TIME,
  CHICO_SILHOUETTE_CENTER_X_RATIO,
  CHICO_SILHOUETTE_FADE_OUT_DURATION,
  drawLaserOverlay,
  getSwordAuraState,
  getActiveLaserEventAtTime,
  getLaserStateAtTime,
  getPlayerSpecialStateAtTime,
  isLaserTouchingPlayer,
  generatePhase5CombatSchedule,
  PHASE_FIVE_SCROLL_RESUME_TIME,
  type AdventureLaserEvent,
  type AdventureLaserHitBehavior,
  type AdventurePlayerSpecialState,
  type Phase5TrapEvent,
} from "./adventureLaserShared";

extend({
  Container: PixiContainer,
  Graphics: PixiGraphics,
  Sprite: PixiSprite,
  Text: PixiText,
});

// ─── Component ───────────────────────────────────────────────────────────────
type RunnerSceneMobileProps = {
  stageWidth: number;
  stageHeight: number;
  runState: RunState;
  jumpNonce: number;
  restartNonce: number;
  currentCourseTime: number;
  sceneSnapshot: AdventureRunnerSnapshot | null;
  onSceneSnapshotChange: (snapshot: AdventureRunnerSnapshot) => void;
  onScoreChange: (score: number) => void;
  onGameOver: (score: number, reason: AdventureGameOverReason) => void;
  onComplete: (score: number) => void;
};

type AdventurePlayerTextureSet = {
  default: Texture[];
  shock: Texture[];
  anger: Texture[];
  swordAura: Texture | null;
  chikoDefense: Texture | null;
  chikoHurt: Texture | null;
  chikoDefault: Texture | null;
};

export function RunnerSceneMobile({
  stageWidth,
  stageHeight,
  runState,
  jumpNonce,
  restartNonce,
  currentCourseTime,
  sceneSnapshot,
  onSceneSnapshotChange,
  onScoreChange,
  onGameOver,
  onComplete,
}: RunnerSceneMobileProps) {
  const [playerTextures, setPlayerTextures] = useState<AdventurePlayerTextureSet>({
    default: [],
    shock: [],
    anger: [],
    swordAura: null,
    chikoDefense: null,
    chikoHurt: null,
    chikoDefault: null,
  });
  const backgroundRef = useRef<PixiGraphics | null>(null);
  const worldRef = useRef<PixiGraphics | null>(null);
  const effectsRef = useRef<PixiGraphics | null>(null);
  const shadowRef = useRef<PixiGraphics | null>(null);
  const glowRef = useRef<PixiGraphics | null>(null);
  const playerRef = useRef<PixiSprite | null>(null);
  const swordAuraRef = useRef<PixiSprite | null>(null);
  const chicoRef = useRef<PixiSprite | null>(null);
  const chikoFollowerRef = useRef<PixiSprite | null>(null);
  const courseTimeRef = useRef(currentCourseTime);
  const lastHandledJumpNonceRef = useRef(jumpNonce);
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
  const fallHazardKindRef = useRef<HoleKind>("pit");
  const phase5TrapInjectedRef = useRef<string[]>([]);
  const phase5TrapScheduleRef = useRef<Phase5TrapEvent[]>([]);
  const phase5DynamicLasersRef = useRef<AdventureLaserEvent[]>([]);
  const animationElapsedRef = useRef(0);
  const angerStartCourseTimeRef = useRef(-1);
  const runElapsedRef = useRef(0);
  const fallingHoleRef = useRef(false);
  const processedLaserEventIdsRef = useRef<string[]>([]);
  const damageSlowMultiplierRef = useRef(1);
  const reverseMotionUntilRef = useRef(0);
  const stopMotionUntilRef = useRef(0);
  const shakeUntilRef = useRef(0);
  const shakeAmplitudeRef = useRef(0);
  const blinkUntilRef = useRef(0);
  const blinkIntervalRef = useRef(0.12);
  const chicoUntilRef = useRef(0);
  const chikoFollowerYRef = useRef(0);
  const chikoFollowerVelocityRef = useRef(0);
  const chikoFollowerJumpQueueRef = useRef<number[]>([]);
  const chikoFollowerDefenseUntilRef = useRef(0);
  const cameraShakeXRef = useRef(0);
  const cameraShakeYRef = useRef(0);

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
  const arePlayerTexturesReady =
    playerTextures.default.length > 0 &&
    playerTextures.shock.length > 0 &&
    playerTextures.anger.length > 0 &&
    !!playerTextures.swordAura;

  const getPlayerFramesForState = useCallback(
    (state: AdventurePlayerSpecialState) =>
      state === "shock"
        ? playerTextures.shock
        : state === "anger"
          ? playerTextures.anger
          : playerTextures.default,
    [playerTextures],
  );

  const getCurrentCameraShake = useCallback((time: number) => {
    if (time >= shakeUntilRef.current || shakeAmplitudeRef.current <= 0) {
      return { x: 0, y: 0 };
    }

    const progress = 1 - (shakeUntilRef.current - time) / 0.45;
    const amplitude = shakeAmplitudeRef.current * Math.max(0.18, 1 - progress);
    return {
      x: Math.sin(time * 78) * amplitude,
      y: Math.cos(time * 62) * amplitude * 0.7,
    };
  }, []);

  const emitSnapshot = useCallback(() => {
    onSceneSnapshotChange({
      playerY: playerYRef.current,
      velocity: velocityRef.current,
      rotation: rotationRef.current,
      jumpCount: jumpCountRef.current,
      coyoteTime: coyoteTimeRef.current,
      score: scoreRef.current,
      scoreTickTimer: scoreTickTimerRef.current,
      animationElapsed: animationElapsedRef.current,
      runElapsed: runElapsedRef.current,
      fallingHole: fallingHoleRef.current,
      nextHoleId: nextHoleIdRef.current,
      holes: holesRef.current.map((hole) => ({ ...hole })),
      processedLaserEventIds: [...processedLaserEventIdsRef.current],
      phase5TrapInjectedIds: [...phase5TrapInjectedRef.current],
      phase5TrapSchedule: [...phase5TrapScheduleRef.current],
      phase5DynamicLasers: [...phase5DynamicLasersRef.current],
      damageSlowMultiplier: damageSlowMultiplierRef.current,
      reverseMotionUntil: reverseMotionUntilRef.current,
      stopMotionUntil: stopMotionUntilRef.current,
      shakeUntil: shakeUntilRef.current,
      shakeAmplitude: shakeAmplitudeRef.current,
      blinkUntil: blinkUntilRef.current,
      blinkInterval: blinkIntervalRef.current,
      chicoUntil: chicoUntilRef.current,
    });
  }, [onSceneSnapshotChange]);

  useEffect(() => {
    let mounted = true;

    const loadFrames = (paths: readonly string[]) =>
      Promise.all(
        paths.map((path) =>
          Assets.load<Texture>({ src: path, data: { scaleMode: "nearest" } }),
        ),
      );

    void Promise.all([
      loadFrames(ADVENTURE_PLAYER_TEXTURE_PATHS.default),
      loadFrames(ADVENTURE_PLAYER_TEXTURE_PATHS.shock),
      loadFrames(ADVENTURE_PLAYER_TEXTURE_PATHS.anger),
      Assets.load<Texture>({
        src: "/assets/adventuregame/sword-aura.png",
        data: { scaleMode: "linear" },
      }),
      Assets.load<Texture>({
        src: "/assets/adventuregame/chiko-defense.png",
        data: { scaleMode: "linear" },
      }),
      Assets.load<Texture>({
        src: "/assets/adventuregame/chiko-hurt.png",
        data: { scaleMode: "linear" },
      }),
      Assets.load<Texture>({
        src: "/assets/adventuregame/chiko-default.png",
        data: { scaleMode: "linear" },
      }),
    ]).then(
      ([
        defaultFrames,
        shockFrames,
        angerFrames,
        swordAuraTexture,
        chikoDefenseTexture,
        chikoHurtTexture,
        chikoDefaultTexture,
      ]) => {
        if (mounted) {
          setPlayerTextures({
            default: defaultFrames,
            shock: shockFrames,
            anger: angerFrames,
            swordAura: swordAuraTexture,
            chikoDefense: chikoDefenseTexture,
            chikoHurt: chikoHurtTexture,
            chikoDefault: chikoDefaultTexture,
          });
        }
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    courseTimeRef.current = currentCourseTime;
  }, [currentCourseTime]);

  useEffect(() => {
    if (runState !== "running") {
      lastHandledJumpNonceRef.current = jumpNonce;
    }
  }, [jumpNonce, runState]);

  // ── Background – portrait-native design ─────────────────────────────────────
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
      case 1:
      case 2: {
        graphics.rect(0, 0, W, H).fill(0xf7f2e8);
        graphics.rect(0, 0, W, gy * 0.9).fill(0xd9eff3);
        graphics.circle(W * 0.78, gy * 0.18, sceneUnit * 0.11).fill(0xffe08b);
        drawCloud(graphics, W * 0.04, gy * 0.09, sceneUnit * 0.4, sceneUnit * 0.09, 0.6);
        drawCloud(graphics, W * 0.46, gy * 0.28, sceneUnit * 0.32, sceneUnit * 0.07, 0.5);
        drawCloud(graphics, W * 0.68, gy * 0.06, sceneUnit * 0.28, sceneUnit * 0.06, 0.4);
        graphics.rect(0, gy * 0.82, W, gy * 0.08).fill({ color: 0xffffff, alpha: 0.18 });
        graphics.rect(0, gy * 0.88, W, gy * 0.04).fill({ color: 0x5ec7a5, alpha: 0.24 });
        break;
      }
      case 3: {
        graphics.rect(0, 0, W, H).fill(0xe8f2de);
        graphics.rect(0, 0, W, gy * 0.72).fill(0x9cc8a1);
        graphics.circle(W * 0.18, gy * 0.17, sceneUnit * 0.08).fill({ color: 0xfef3c7, alpha: 0.72 });
        const treeXs = [W * 0.02, W * 0.26, W * 0.52, W * 0.76];
        for (const tx of treeXs) {
          const tw = sceneUnit * 0.048;
          graphics.rect(tx, gy * 0.56, tw, sceneUnit * 0.36).fill(0x5b4636);
          graphics.circle(tx + tw / 2, gy * 0.54, sceneUnit * 0.13).fill(0x4c7c59);
          graphics.circle(tx + tw / 2 - sceneUnit * 0.03, gy * 0.62, sceneUnit * 0.1).fill(0x5f995f);
          graphics.circle(tx + tw / 2 + sceneUnit * 0.03, gy * 0.63, sceneUnit * 0.09).fill(0x6aa56a);
        }
        graphics.rect(0, gy * 0.84, W, gy * 0.06).fill({ color: 0xe9f7ef, alpha: 0.12 });
        graphics.rect(0, gy * 0.88, W, gy * 0.04).fill({ color: 0x7bb661, alpha: 0.24 });
        break;
      }
      case 4:
      case 5:
      case 6: {
        graphics.rect(0, 0, W, H).fill(0x28090f);
        graphics.rect(0, 0, W, gy * 0.74).fill(0x8d1c31);
        graphics.circle(W * 0.72, gy * 0.17, sceneUnit * 0.22).fill({ color: 0xff8c42, alpha: 0.14 });
        graphics.circle(W * 0.72, gy * 0.17, sceneUnit * 0.14).fill({ color: 0xff8c42, alpha: 0.88 });
        const smokeXs = [0.06, 0.22, 0.44, 0.64, 0.86];
        for (let i = 0; i < smokeXs.length; i++) {
          graphics.circle(W * smokeXs[i], gy * (0.28 + (i % 3) * 0.08), sceneUnit * 0.062).fill({ color: 0x2b2d42, alpha: 0.24 });
        }
        for (let i = 0; i < 7; i++) {
          const spX = W * (i / 7);
          graphics.poly([spX, gy * 0.8, spX + sceneUnit * 0.036, gy * 0.62, spX + sceneUnit * 0.072, gy * 0.8]).fill({ color: 0x5a0c20, alpha: 0.3 });
        }
        graphics.rect(0, gy * 0.86, W, gy * 0.06).fill({ color: 0xfef3c7, alpha: 0.08 });
        graphics.rect(0, gy * 0.9, W, gy * 0.04).fill({ color: 0xff8c42, alpha: 0.22 });
        break;
      }
      default: {
        graphics.rect(0, 0, W, H).fill(0xf1fbf8);
        graphics.rect(0, 0, W, gy * 0.82).fill(0xbde0fe);
        graphics.circle(W * 0.18, gy * 0.18, sceneUnit * 0.09).fill({ color: 0xfff4b6, alpha: 0.82 });
        drawCloud(graphics, W * 0.08, gy * 0.1, sceneUnit * 0.36, sceneUnit * 0.08, 0.52);
        drawCloud(graphics, W * 0.52, gy * 0.24, sceneUnit * 0.32, sceneUnit * 0.07, 0.44);
        const flowerXs = [0.04, 0.15, 0.27, 0.39, 0.51, 0.63, 0.75, 0.87, 0.96];
        for (const fx of flowerXs) {
          graphics.rect(W * fx, gy * 0.8, sceneUnit * 0.01, sceneUnit * 0.1).fill(0x4d7c0f);
          graphics.circle(W * fx, gy * 0.78, sceneUnit * 0.024).fill(0xf472b6);
          graphics.circle(W * fx - sceneUnit * 0.014, gy * 0.8, sceneUnit * 0.018).fill(0xfef08a);
          graphics.circle(W * fx + sceneUnit * 0.014, gy * 0.8, sceneUnit * 0.018).fill(0x86efac);
        }
        graphics.rect(0, gy * 0.84, W, gy * 0.06).fill({ color: 0xffffff, alpha: 0.16 });
        graphics.rect(0, gy * 0.88, W, gy * 0.04).fill({ color: 0x7dd3c7, alpha: 0.24 });
        break;
      }
    }
    graphics.x = cameraShakeXRef.current;
    graphics.y = cameraShakeYRef.current;
  }, [groundYScaled, stageHeight, stageWidth]);

  const drawLaserEffects = useCallback(() => {
    const graphics = effectsRef.current;
    if (!graphics) return;

    graphics.clear();
    const activeLaserEvent =
      getActiveLaserEventAtTime(courseTimeRef.current) ??
      phase5DynamicLasersRef.current.find(
        (e) => getLaserStateAtTime(e, courseTimeRef.current) !== null,
      );
    if (activeLaserEvent) {
      const laserState = getLaserStateAtTime(activeLaserEvent, courseTimeRef.current);
      if (laserState) {
        drawLaserOverlay({
          graphics,
          event: activeLaserEvent,
          state: laserState,
          worldWidth: WORLD_WIDTH,
          px,
          py,
          sx,
          sy,
          ss,
        });
      }
    }

    if (courseTimeRef.current < chicoUntilRef.current) {
      // Chico sprite handles its own rendering and animation in syncPlayerVisuals
    }

    const swordAuraState = getSwordAuraState(
      courseTimeRef.current,
      PLAYER_X,
      WORLD_WIDTH,
    );
    if (swordAuraState?.whiteFade) {
      graphics.rect(0, 0, stageWidth, stageHeight).fill({
        color: 0xffffff,
        alpha: swordAuraState.whiteFade,
      });
    }

    graphics.x = cameraShakeXRef.current;
    graphics.y = cameraShakeYRef.current;
  }, [px, py, ss, stageHeight, stageWidth, sx, sy]);

  // ── Terrain ───────────────────────────────────────────────────────────────────
  const drawTerrain = useCallback(() => {
    const graphics = worldRef.current;
    if (!graphics) return;

    const phase = getPhaseAtTime(courseTimeRef.current);
    graphics.clear();

    const sortedHoles = [...holesRef.current].sort((a, b) => a.x - b.x);
    const gapHoles = sortedHoles.filter(isGapHazard);
    let segmentStart = 0;

    for (const hole of gapHoles) {
      const clampedLeft = clamp(hole.x, 0, WORLD_WIDTH);
      const clampedRight = clamp(hole.x + hole.width, 0, WORLD_WIDTH);
      const holeLeft = px(clampedLeft);
      const holeRight = px(clampedRight);

      if (clampedRight > clampedLeft) {
        graphics
          .rect(holeLeft, py(GROUND_Y - 4), holeRight - holeLeft, stageHeight - py(GROUND_Y - 4))
          .fill(hole.kind === "lava" ? 0x5a0c20 : 0x3d2b2c);

        if (hole.kind === "spike") {
          for (let spikeX = clampedLeft; spikeX <= clampedRight - 16; spikeX += 18) {
            graphics
              .poly([px(spikeX), py(GROUND_Y - 4), px(spikeX + 8), py(GROUND_Y - 24), px(spikeX + 16), py(GROUND_Y - 4)])
              .fill({ color: 0xd9d9d9, alpha: 0.9 });
          }
        }

        if (hole.kind === "lava") {
          graphics
            .rect(px(clampedLeft + 8), py(GROUND_Y + 14), sx(Math.max(clampedRight - clampedLeft - 16, 0)), sy(12))
            .fill({ color: 0xff8c42, alpha: 0.72 });
          graphics
            .rect(px(clampedLeft + 18), py(GROUND_Y + 28), sx(Math.max(clampedRight - clampedLeft - 36, 0)), sy(8))
            .fill({ color: 0xffbe0b, alpha: 0.5 });
        }

        graphics
          .rect(px(clampedLeft + 12), py(GROUND_Y + 28), sx(Math.max(clampedRight - clampedLeft - 24, 0)), sy(10))
          .fill({ color: 0x000000, alpha: 0.16 });
      }

      if (hole.x > segmentStart) {
        const segmentWidth = hole.x - segmentStart;
        graphics
          .rect(px(segmentStart), py(GROUND_Y - 16), sx(segmentWidth), sy(40))
          .fill(
            phase.id === 4 ? 0x7d8597 : phase.id === 5 ? 0x9c6644 : phase.id === 7 ? 0x8892b0 : 0xf0d3ae,
          );
        graphics
          .rect(px(segmentStart), py(GROUND_Y - 18), sx(segmentWidth), sy(14))
          .fill(
            phase.id === 3 ? 0x7bb661 : phase.id === 4 ? 0xa9b4c2 : phase.id === 5 ? 0xff8c42 : phase.id === 6 ? 0x7dd3c7 : phase.id === 7 ? 0x90cdf4 : 0x5ec7a5,
          );
        graphics
          .rect(px(segmentStart), py(GROUND_Y + 24), sx(segmentWidth), groundSegmentBodyHeight)
          .fill(
            phase.id === 4 ? 0x7d8597 : phase.id === 5 ? 0x9c6644 : phase.id === 7 ? 0x8892b0 : 0xf0d3ae,
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
          phase.id === 4 ? 0x7d8597 : phase.id === 5 ? 0x9c6644 : phase.id === 7 ? 0x8892b0 : 0xf0d3ae,
        );
      graphics
        .rect(px(segmentStart), py(GROUND_Y - 18), sx(segmentWidth), sy(14))
        .fill(
          phase.id === 3 ? 0x7bb661 : phase.id === 4 ? 0xa9b4c2 : phase.id === 5 ? 0xff8c42 : phase.id === 6 ? 0x7dd3c7 : phase.id === 7 ? 0x90cdf4 : 0x5ec7a5,
        );
      graphics
        .rect(px(segmentStart), py(GROUND_Y + 24), sx(segmentWidth), groundSegmentBodyHeight)
        .fill(
          phase.id === 4 ? 0x7d8597 : phase.id === 5 ? 0x9c6644 : phase.id === 7 ? 0x8892b0 : 0xf0d3ae,
        );
      graphics
        .rect(px(segmentStart), py(GROUND_Y + 24), sx(segmentWidth), sy(9))
        .fill({ color: 0xffffff, alpha: 0.18 });
    }

    for (const hole of sortedHoles) {
      if (hole.kind === "slime") {
        const height = hole.height ?? 30;
        const top = hole.y ?? GROUND_Y - height;
        graphics.roundRect(px(hole.x), py(top), sx(hole.width), sy(height), ss(16)).fill(0x4caf50);
        graphics.ellipse(px(hole.x + hole.width * 0.28), py(top + height * 0.42), sx(6), sy(8)).fill(0xdbffcc);
        graphics.ellipse(px(hole.x + hole.width * 0.72), py(top + height * 0.42), sx(6), sy(8)).fill(0xdbffcc);
        graphics.rect(px(hole.x + 10), py(top + height - 8), sx(hole.width - 20), sy(6)).fill({ color: 0x1b5e20, alpha: 0.18 });
      }

      if (hole.kind === "magic") {
        const height = hole.height ?? 48;
        const top = hole.y ?? GROUND_Y - 150;
        const centerX = hole.x + hole.width / 2;
        const centerY = top + height / 2;
        const outerRadius = Math.max(hole.width, height) * 0.42;
        const coreRadius = Math.max(hole.width, height) * 0.24;
        graphics.circle(px(centerX), py(centerY), ss(outerRadius)).fill({ color: 0x11040b, alpha: 0.2 });
        graphics.circle(px(centerX), py(centerY), ss(outerRadius)).stroke({ color: 0x3b0a14, alpha: 0.95, width: ss(4.5) });
        graphics.circle(px(centerX), py(centerY), ss(coreRadius)).fill({ color: 0x23060d, alpha: 0.94 });
        graphics.circle(px(centerX), py(centerY), ss(coreRadius * 0.56)).fill({ color: 0x7a0f1f, alpha: 0.82 });
        graphics.circle(px(centerX), py(centerY), ss(coreRadius * 0.24)).fill({ color: 0xff7a5c, alpha: 0.92 });
        graphics
          .poly([
            px(centerX),
            py(top - 6),
            px(hole.x + hole.width * 0.72),
            py(centerY - height * 0.18),
            px(hole.x + hole.width + 6),
            py(centerY),
            px(hole.x + hole.width * 0.72),
            py(centerY + height * 0.18),
            px(centerX),
            py(top + height + 6),
            px(hole.x + hole.width * 0.28),
            py(centerY + height * 0.18),
            px(hole.x - 6),
            py(centerY),
            px(hole.x + hole.width * 0.28),
            py(centerY - height * 0.18),
          ])
          .fill({ color: 0x1a060b, alpha: 0.9 });
        graphics
          .poly([
            px(centerX),
            py(top + height * 0.08),
            px(hole.x + hole.width * 0.84),
            py(centerY),
            px(centerX),
            py(top + height * 0.92),
            px(hole.x + hole.width * 0.16),
            py(centerY),
          ])
          .fill({ color: 0x711225, alpha: 0.76 });
        graphics
          .circle(px(centerX), py(centerY), ss(outerRadius * 0.7))
          .stroke({ color: 0xd64545, alpha: 0.42, width: ss(2.2) });
      }
    }
    graphics.x = cameraShakeXRef.current;
    graphics.y = cameraShakeYRef.current;
  }, [groundSegmentBodyHeight, px, py, ss, stageHeight, sx, sy]);

  // ── Player visuals ────────────────────────────────────────────────────────────
  const syncPlayerVisuals = useCallback(() => {
    const player = playerRef.current;
    const swordAura = swordAuraRef.current;
    const shadow = shadowRef.current;
    if (!player || !shadow) return;

    player.x = playerXScaled + cameraShakeXRef.current;
    player.y = groundYScaled - ss(playerYRef.current) + cameraShakeYRef.current;
    player.rotation = rotationRef.current;
    player.scale.set(PLAYER_RENDER_SCALE * uniformScale * MOBILE_PLAYER_SCALE);
    const isBlinking = courseTimeRef.current < blinkUntilRef.current;
    player.alpha = isBlinking
      ? Math.sin(courseTimeRef.current / blinkIntervalRef.current) > 0
        ? 0.34
        : 0.96
      : 1;

    if (swordAura && playerTextures.swordAura) {
      const swordAuraState = getSwordAuraState(
        courseTimeRef.current,
        PLAYER_X,
        WORLD_WIDTH,
      );
      if (swordAuraState) {
        swordAura.visible = true;
        swordAura.x = px(swordAuraState.auraWorldX) + cameraShakeXRef.current;
        swordAura.y =
          player.y - ss(PLAYER_COLLISION_HEIGHT * 0.52) + cameraShakeYRef.current;
        swordAura.width = sx(132 * swordAuraState.scale);
        swordAura.height = sy(180 * swordAuraState.scale);
        swordAura.alpha = swordAuraState.alpha;
      } else {
        swordAura.visible = false;
        swordAura.alpha = 0;
      }
    }

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
        playerXScaled + cameraShakeXRef.current,
        py(GROUND_Y - 10) + cameraShakeYRef.current,
        ss(25 * shadowScale),
        ss(6.5 * shadowScale),
      )
      .fill({ color: 0x102542, alpha: shadowAlpha });

    const glow = glowRef.current;
    if (glow) {
      glow.clear();
      const t = courseTimeRef.current;
      const glowStart = CHICO_SAVE_TIME + 2;
      if (t >= glowStart && t < 310) {
        const a = Math.min((t - glowStart) / 1.5, 1);
        const isTripleJump = jumpCountRef.current >= 3;
        const boost = isTripleJump ? 2.2 : 1;
        const gx = player.x;
        const gy = player.y - ss(PLAYER_COLLISION_HEIGHT * 0.5);
        glow
          .circle(gx, gy, ss(65))
          .fill({ color: 0x7fff4f, alpha: 0.06 * a * boost });
        glow
          .circle(gx, gy, ss(46))
          .fill({ color: 0x7fff4f, alpha: 0.13 * a * boost });
        glow
          .circle(gx, gy, ss(30))
          .fill({ color: 0x9eff68, alpha: 0.22 * a * boost });
        glow
          .circle(gx, gy, ss(18))
          .fill({ color: 0xc4ff8f, alpha: 0.3 * a * boost });
        if (isTripleJump) {
          glow.circle(gx, gy, ss(10)).fill({ color: 0xffffff, alpha: 0.55 * a });
        }
      }
    }

    const chico = chicoRef.current;
    if (chico && playerTextures.chikoDefense && playerTextures.chikoHurt) {
      const t = courseTimeRef.current;
      if (t < chicoUntilRef.current) {
        const chicoAlpha = Math.min(
          1,
          Math.max(
            0,
            (chicoUntilRef.current - t) / CHICO_SILHOUETTE_FADE_OUT_DURATION,
          ),
        );
        const centerX = WORLD_WIDTH * CHICO_SILHOUETTE_CENTER_X_RATIO;

        // Switch texture after 1 second (CHICO_SAVE_TIME + 1.0)
        const isHurt = t >= CHICO_SAVE_TIME + 1.0;
        chico.texture = isHurt ? playerTextures.chikoHurt : playerTextures.chikoDefense;

        // Shake animation
        const shakeX = Math.sin(t * 85) * 2.5;
        const shakeY = Math.cos(t * 72) * 1.8;

        chico.visible = true;
        chico.alpha = chicoAlpha;
        chico.x = px(centerX) + cameraShakeXRef.current + sx(shakeX);
        chico.y = groundYScaled + cameraShakeYRef.current + sy(shakeY);
        chico.scale.set(uniformScale * 0.32);
        chico.anchor.set(0.5, 1);
      } else {
        chico.visible = false;
      }
    }
  }, [groundYScaled, playerTextures.swordAura, playerXScaled, px, py, runState, ss, sx, sy, uniformScale]);

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
    fallHazardKindRef.current = "pit";
    animationElapsedRef.current = 0;
    runElapsedRef.current = 0;
    fallingHoleRef.current = false;
    processedLaserEventIdsRef.current = [];
    damageSlowMultiplierRef.current = 1;
    reverseMotionUntilRef.current = 0;
    stopMotionUntilRef.current = 0;
    shakeUntilRef.current = 0;
    shakeAmplitudeRef.current = 0;
    blinkUntilRef.current = 0;
    blinkIntervalRef.current = 0.12;
    chicoUntilRef.current = 0;
    chikoFollowerYRef.current = 0;
    chikoFollowerVelocityRef.current = 0;
    chikoFollowerJumpQueueRef.current = [];
    chikoFollowerDefenseUntilRef.current = 0;
    cameraShakeXRef.current = 0;
    cameraShakeYRef.current = 0;
    nextHoleIdRef.current = 1;
    holesRef.current = [];
    phase5TrapInjectedRef.current = [];
    const p5schedule = generatePhase5CombatSchedule();
    phase5TrapScheduleRef.current = p5schedule.traps;
    phase5DynamicLasersRef.current = p5schedule.lasers;
    onScoreChange(0);
    drawBackdrop();
    drawTerrain();
    drawLaserEffects();
    syncPlayerVisuals();
    emitSnapshot();
  }, [drawBackdrop, drawLaserEffects, drawTerrain, emitSnapshot, onScoreChange, syncPlayerVisuals]);

  const restoreScene = useCallback(
    (snapshot: AdventureRunnerSnapshot) => {
      playerYRef.current = snapshot.playerY;
      velocityRef.current = snapshot.velocity;
      rotationRef.current = snapshot.rotation;
      jumpCountRef.current = snapshot.jumpCount;
      coyoteTimeRef.current = snapshot.coyoteTime;
      scoreRef.current = snapshot.score;
      scoreTickTimerRef.current = snapshot.scoreTickTimer;
      animationElapsedRef.current = snapshot.animationElapsed;
      runElapsedRef.current = snapshot.runElapsed;
      fallingHoleRef.current = snapshot.fallingHole;
      processedLaserEventIdsRef.current = [...snapshot.processedLaserEventIds];
      damageSlowMultiplierRef.current = snapshot.damageSlowMultiplier;
      reverseMotionUntilRef.current = snapshot.reverseMotionUntil;
      stopMotionUntilRef.current = snapshot.stopMotionUntil;
      shakeUntilRef.current = snapshot.shakeUntil;
      shakeAmplitudeRef.current = snapshot.shakeAmplitude;
      blinkUntilRef.current = snapshot.blinkUntil;
      blinkIntervalRef.current = snapshot.blinkInterval;
      chicoUntilRef.current = snapshot.chicoUntil;
      const shake = getCurrentCameraShake(courseTimeRef.current);
      const swordAuraState = getSwordAuraState(
        courseTimeRef.current,
        PLAYER_X,
        WORLD_WIDTH,
      );
      const swordAuraShake = swordAuraState?.shakeIntensity ?? 0;
      cameraShakeXRef.current =
        shake.x + Math.sin(courseTimeRef.current * 52) * 7 * swordAuraShake;
      cameraShakeYRef.current =
        shake.y + Math.cos(courseTimeRef.current * 44) * 4 * swordAuraShake;
      nextHoleIdRef.current = snapshot.nextHoleId;
      holesRef.current = snapshot.holes.map((hole) => ({ ...hole }));
      phase5TrapInjectedRef.current = [...snapshot.phase5TrapInjectedIds];
      phase5TrapScheduleRef.current = [...snapshot.phase5TrapSchedule];
      phase5DynamicLasersRef.current = [...snapshot.phase5DynamicLasers];
      gameOverSentRef.current = false;
      onScoreChange(snapshot.score);
      drawBackdrop();
      drawTerrain();
      drawLaserEffects();
      syncPlayerVisuals();
      emitSnapshot();
    },
    [drawBackdrop, drawLaserEffects, drawTerrain, emitSnapshot, getCurrentCameraShake, onScoreChange, syncPlayerVisuals],
  );

  // ── Jump ──────────────────────────────────────────────────────────────────────
  const tryJump = useCallback(() => {
    const t = courseTimeRef.current;
    if (getPhaseAtTime(t).id === 5 && t < PHASE_FIVE_SCROLL_RESUME_TIME) {
      return;
    }

    if (t >= CHICO_SAVE_TIME && t < ANGER_SPRITE_END_TIME) {
      return;
    }

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
    rotationRef.current = nextJumpCount > 1 ? 0.05 : -0.18;
    chikoFollowerJumpQueueRef.current.push(t + 0.3);
    syncPlayerVisuals();
  }, [syncPlayerVisuals]);

  const hasProcessedLaserEvent = useCallback(
    (eventId: string) => processedLaserEventIdsRef.current.includes(eventId),
    [],
  );

  const markLaserEventProcessed = useCallback((eventId: string) => {
    if (!processedLaserEventIdsRef.current.includes(eventId)) {
      processedLaserEventIdsRef.current = [
        ...processedLaserEventIdsRef.current,
        eventId,
      ];
    }
  }, []);

  const applyLaserBehavior = useCallback(
    (event: AdventureLaserEvent, behavior: AdventureLaserHitBehavior) => {
      if (behavior === "damage-step-1") {
        rotationRef.current = -0.1;
        shakeUntilRef.current = event.fireTime + 0.45;
        shakeAmplitudeRef.current = 8;
        blinkUntilRef.current = event.fireTime + 0.9;
        blinkIntervalRef.current = 0.12;
        return;
      }

      if (behavior === "damage-step-2") {
        rotationRef.current = -0.17;
        shakeUntilRef.current = event.fireTime + 0.65;
        shakeAmplitudeRef.current = 12;
        blinkUntilRef.current = event.fireTime + 1.2;
        blinkIntervalRef.current = 0.22;
        chikoFollowerDefenseUntilRef.current = event.fireTime + 0.6;
        return;
      }

      if (behavior === "chico-save") {
        velocityRef.current = getJumpForce(1);
        rotationRef.current = -0.3;
        jumpCountRef.current = 1;
        coyoteTimeRef.current = 0;
        reverseMotionUntilRef.current = event.fireTime + 0.32;
        stopMotionUntilRef.current = event.fireTime + 0.72;
        shakeUntilRef.current = event.fireTime + 1.5;
        shakeAmplitudeRef.current = 10;
        chicoUntilRef.current = CHICO_SAVE_TIME + 3;
      }
    },
    [],
  );

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!arePlayerTexturesReady) return;
    if (sceneSnapshot) {
      restoreScene(sceneSnapshot);
      return;
    }
    resetScene();
  }, [arePlayerTexturesReady, restartNonce, resetScene, restoreScene, sceneSnapshot]);

  useEffect(() => {
    if (!arePlayerTexturesReady) return;
    drawTerrain();
    drawLaserEffects();
    syncPlayerVisuals();
  }, [arePlayerTexturesReady, currentCourseTime, drawLaserEffects, drawTerrain, syncPlayerVisuals]);

  useEffect(() => {
    if (!arePlayerTexturesReady) return;
    drawBackdrop();
  }, [arePlayerTexturesReady, currentPhaseId, drawBackdrop]);

  useEffect(() => {
    if (!arePlayerTexturesReady || runState !== "running") return;
    if (jumpNonce === lastHandledJumpNonceRef.current) return;
    lastHandledJumpNonceRef.current = jumpNonce;
    tryJump();
  }, [arePlayerTexturesReady, jumpNonce, runState, tryJump]);

  // ── Tick ──────────────────────────────────────────────────────────────────────
  const onTick = useCallback(
    (ticker: Ticker) => {
      if (!arePlayerTexturesReady) return;

      const player = playerRef.current;
      if (player) {
        const baseRunSpeedMultiplier = getRunSpeedMultiplier(courseTimeRef.current);
        const motionScale =
          courseTimeRef.current < reverseMotionUntilRef.current
            ? 0.22
            : courseTimeRef.current < stopMotionUntilRef.current
              ? 0.08
              : Math.max(damageSlowMultiplierRef.current, 0.08);
        const visualSpeedMultiplier = baseRunSpeedMultiplier * motionScale;
        const specialState = getPlayerSpecialStateAtTime(courseTimeRef.current);
        const activeFrames = getPlayerFramesForState(specialState);
        if (specialState !== "anger") {
          angerStartCourseTimeRef.current = -1;
        } else if (angerStartCourseTimeRef.current < 0) {
          angerStartCourseTimeRef.current = courseTimeRef.current;
        }
        const angerElapsed =
          specialState === "anger" && angerStartCourseTimeRef.current >= 0
            ? courseTimeRef.current - angerStartCourseTimeRef.current
            : 0;
        const angerFrozen = specialState === "anger" && angerElapsed < 1;
        const angerBoost =
          specialState === "anger" && !angerFrozen
            ? Math.min((angerElapsed - 1) / 1, 1) * 2.0
            : specialState === "anger"
              ? 0
              : 1;

        if (runState === "running" && specialState !== "shock" && !angerFrozen) {
          const swordAuraState = getSwordAuraState(
            courseTimeRef.current,
            PLAYER_X,
            WORLD_WIDTH,
          );
          const phase5SpeedBoost =
            courseTimeRef.current >= PHASE_FIVE_SCROLL_RESUME_TIME ? 1.5 : 1;
          const phase6Slowdown = getPhaseAtTime(courseTimeRef.current).id === 6 ? 0.5 : 1;
          animationElapsedRef.current +=
            (ticker.deltaMS / 1000) *
            Math.max(0.24, Math.abs(visualSpeedMultiplier)) *
            phase5SpeedBoost *
            angerBoost *
            phase6Slowdown *
            (swordAuraState?.animationRate ?? 1);
        } else if (runState !== "paused" && specialState !== "shock" && !angerFrozen) {
          animationElapsedRef.current = 0;
        }

        const frameIndex =
          runState === "running" && specialState !== "shock" && !angerFrozen
            ? Math.floor(animationElapsedRef.current * PLAYER_ANIMATION_FPS) %
              activeFrames.length
            : 0;
        const nextTexture = activeFrames[frameIndex] ?? activeFrames[0];
        if (player.texture !== nextTexture) {
          player.texture = nextTexture;
        }
      }

      if (runState !== "running") {
        if (runState === "ready") {
          drawBackdrop();
          drawTerrain();
          drawLaserEffects();
          syncPlayerVisuals();
          emitSnapshot();
        }
        return;
      }

      const deltaSeconds = Math.min(ticker.deltaMS / 1000, 1 / 20);
      const currentPhaseId = getPhaseAtTime(courseTimeRef.current).id;
      if (currentPhaseId >= 5) {
        damageSlowMultiplierRef.current = 1;
      }
      const shake = getCurrentCameraShake(courseTimeRef.current);
      const swordAuraState = getSwordAuraState(
        courseTimeRef.current,
        PLAYER_X,
        WORLD_WIDTH,
      );
      const swordAuraShake = swordAuraState?.shakeIntensity ?? 0;
      cameraShakeXRef.current =
        shake.x + Math.sin(courseTimeRef.current * 52) * 7 * swordAuraShake;
      cameraShakeYRef.current =
        shake.y + Math.cos(courseTimeRef.current * 44) * 4 * swordAuraShake;
      const baseSpeedMultiplier = getRunSpeedMultiplier(courseTimeRef.current);
      const motionDirectionScale =
        currentPhaseId === 5 &&
        courseTimeRef.current < PHASE_FIVE_SCROLL_RESUME_TIME
          ? 0
          : courseTimeRef.current < reverseMotionUntilRef.current
          ? -0.28
          : courseTimeRef.current < stopMotionUntilRef.current
            ? 0
            : damageSlowMultiplierRef.current;
      const speedMultiplier = baseSpeedMultiplier * motionDirectionScale;
      const holeDeltaSeconds = deltaSeconds * speedMultiplier;
      runElapsedRef.current += deltaSeconds;
      const obstaclesEnabled =
        currentPhaseId !== 5 && !isHazardLockedAtTime(courseTimeRef.current);

      const nextHoles: Hole[] =
        currentPhaseId === 5
          ? holesRef.current
              .filter((hole) => hole.id < 0)
              .map((hole) => ({
                ...hole,
                x: hole.x - SCROLL_SPEED * holeDeltaSeconds,
              }))
              .filter((hole) => hole.x + hole.width > -80)
          : holesRef.current
              .map((hole) => ({
                ...hole,
                x: hole.x - SCROLL_SPEED * holeDeltaSeconds,
              }))
              .filter((hole) => hole.x + hole.width > -80);

      if (obstaclesEnabled) {
        const lastHole = nextHoles[nextHoles.length - 1];
        const canSpawnNextHole =
          currentPhaseId === 1
            ? nextHoles.length === 0
            : !lastHole ||
              lastHole.x + lastHole.width < WORLD_WIDTH - lastHole.gapAfter;

        if (canSpawnNextHole) {
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
      }
      holesRef.current = nextHoles;

      if (currentPhaseId === 5) {
        for (const trap of phase5TrapScheduleRef.current) {
          if (
            courseTimeRef.current >= trap.injectTime &&
            !phase5TrapInjectedRef.current.includes(trap.id)
          ) {
            phase5TrapInjectedRef.current = [...phase5TrapInjectedRef.current, trap.id];
            holesRef.current = [
              ...holesRef.current,
              {
                id: trap.holeId,
                x: WORLD_WIDTH + 120,
                width: trap.width,
                gapAfter: 0,
                kind: "magic" as HoleKind,
                height: trap.height,
                y: trap.laneTop,
              },
            ];
          }
        }
      }

      const activeLaserEvent = getActiveLaserEventAtTime(courseTimeRef.current);
      if (activeLaserEvent && !hasProcessedLaserEvent(activeLaserEvent.id)) {
        const laserState = getLaserStateAtTime(activeLaserEvent, courseTimeRef.current);
        if (laserState === "firing") {
          if (activeLaserEvent.onHitBehavior === "chico-save") {
            applyLaserBehavior(activeLaserEvent, activeLaserEvent.onHitBehavior);
            markLaserEventProcessed(activeLaserEvent.id);
          } else if (
            isLaserTouchingPlayer(
              activeLaserEvent,
              getPlayerBounds(playerYRef.current),
              WORLD_WIDTH,
            )
          ) {
            if (activeLaserEvent.onHitBehavior === "instant-gameover") {
              markLaserEventProcessed(activeLaserEvent.id);
              gameOverSentRef.current = true;
              onGameOver(scoreRef.current, "laser");
              return;
            }
            applyLaserBehavior(activeLaserEvent, activeLaserEvent.onHitBehavior);
            markLaserEventProcessed(activeLaserEvent.id);
          }
        }
      }

      for (const dynLaser of phase5DynamicLasersRef.current) {
        if (hasProcessedLaserEvent(dynLaser.id)) continue;
        const laserState = getLaserStateAtTime(dynLaser, courseTimeRef.current);
        if (laserState === "firing") {
          if (isLaserTouchingPlayer(dynLaser, getPlayerBounds(playerYRef.current), WORLD_WIDTH)) {
            markLaserEventProcessed(dynLaser.id);
            gameOverSentRef.current = true;
            onGameOver(scoreRef.current, "laser");
            return;
          }
        }
      }

      let nextVelocity = velocityRef.current - GRAVITY * deltaSeconds;
      let nextY = playerYRef.current + nextVelocity * deltaSeconds;

      const overlappingGapHazard = getGapHazardUnderPlayer(
        nextHoles,
        PLAYER_COLLISION_HALF_WIDTH,
      );
      const rawOverHole = Boolean(overlappingGapHazard);
      const touchingSolidHazard = getSolidHazardTouchingPlayer(nextHoles, nextY);
      const groundSupportAvailable = hasGroundSupport(nextHoles);

      if (fallingHoleRef.current && groundSupportAvailable && nextY > 0) {
        fallingHoleRef.current = false;
      }

      const supported = groundSupportAvailable && !fallingHoleRef.current;
      const grounded = playerYRef.current <= 0.01 && supported;

      if (grounded) {
        coyoteTimeRef.current = COYOTE_TIME_SECONDS;
      } else if (coyoteTimeRef.current > 0) {
        coyoteTimeRef.current = Math.max(0, coyoteTimeRef.current - deltaSeconds);
      }

      const descendingTowardHole =
        velocityRef.current <= 0 && nextVelocity <= 0;
      const closeEnoughToFallLatch = playerYRef.current <= 6 && nextY <= 0;

      if (
        !fallingHoleRef.current &&
        overlappingGapHazard &&
        !supported &&
        descendingTowardHole &&
        closeEnoughToFallLatch &&
        coyoteTimeRef.current <= 0
      ) {
        fallingHoleRef.current = true;
        fallHazardKindRef.current = overlappingGapHazard.kind;
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
      drawLaserEffects();

      // ─── CHIKO FOLLOWER LOGIC ───
      const chikoFollower = chikoFollowerRef.current;
      if (chikoFollower && playerTextures.chikoDefault) {
        const t = courseTimeRef.current;
        const phase3StartTime = ADVENTURE_PHASES[2].start;
        const p5StartTime = ADVENTURE_PHASES[4].start;
        const chikoAppearTime = phase3StartTime + 10;

        if (t >= chikoAppearTime && t < p5StartTime) {
          chikoFollower.visible = true;
          chikoFollower.alpha = 1;

          // X-position entrance and following
          const targetX = PLAYER_X - 80;
          const entranceProgress = Math.min((t - chikoAppearTime) / 1.5, 1);
          const startX = -60;
          const currentX = startX + (targetX - startX) * entranceProgress;

          // Delayed Jumping
          while (
            chikoFollowerJumpQueueRef.current.length > 0 &&
            t >= chikoFollowerJumpQueueRef.current[0]
          ) {
            chikoFollowerJumpQueueRef.current.shift();
            chikoFollowerVelocityRef.current = getJumpForce(1) * 0.92;
          }

          // Gravity and Vertical Motion
          const dt = ticker.deltaTime / 60;
          chikoFollowerVelocityRef.current -= GRAVITY * dt;
          chikoFollowerYRef.current = Math.max(
            0,
            chikoFollowerYRef.current + chikoFollowerVelocityRef.current * dt,
          );

          // Tick-like Bobbing (alternates every 0.5s)
          const bobOffset = (Math.floor(t * 2) % 2) * 6;
          const baseFloat = 12;

          // Orientation and Visuals
          const isDefense = t < chikoFollowerDefenseUntilRef.current;
          chikoFollower.texture = isDefense
            ? playerTextures.chikoDefense!
            : playerTextures.chikoDefault;
          chikoFollower.x = px(currentX) + cameraShakeXRef.current;
          chikoFollower.y =
            groundYScaled -
            ss(chikoFollowerYRef.current + baseFloat) +
            sy(bobOffset) +
            cameraShakeYRef.current;
          chikoFollower.height = ss(PLAYER_COLLISION_HEIGHT * 0.5);
          chikoFollower.scale.x = chikoFollower.scale.y;
          chikoFollower.anchor.set(0.5, 1);
        } else {
          chikoFollower.visible = false;
        }
      }

      syncPlayerVisuals();
      emitSnapshot();

      if (touchingSolidHazard && !gameOverSentRef.current) {
        gameOverSentRef.current = true;
        onGameOver(
          scoreRef.current,
          getGameOverReasonForHoleKind(touchingSolidHazard.kind),
        );
        return;
      }

      if (nextY < -FALL_OUT_THRESHOLD && !gameOverSentRef.current) {
        gameOverSentRef.current = true;
        onGameOver(
          scoreRef.current,
          getGameOverReasonForHoleKind(fallHazardKindRef.current),
        );
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
      drawLaserEffects,
      drawTerrain,
      emitSnapshot,
      getCurrentCameraShake,
      getPlayerFramesForState,
      hasProcessedLaserEvent,
      applyLaserBehavior,
      markLaserEventProcessed,
      onComplete,
      onGameOver,
      onScoreChange,
      runState,
      syncPlayerVisuals,
      arePlayerTexturesReady,
    ],
  );
  useTick(onTick);

  return (
    <pixiContainer>
      <pixiGraphics ref={backgroundRef} draw={() => undefined} />
      <pixiGraphics ref={worldRef} draw={() => undefined} />
      {playerTextures.swordAura ? (
        <pixiSprite
          ref={swordAuraRef}
          texture={playerTextures.swordAura}
          x={px(PLAYER_X + 120)}
          y={groundYScaled - ss(PLAYER_COLLISION_HEIGHT * 0.52)}
          width={sx(132)}
          height={sy(180)}
          alpha={0}
          visible={false}
          anchor={{ x: 0.5, y: 0.5 }}
        />
      ) : null}
      <pixiGraphics ref={shadowRef} draw={() => undefined} />
      <pixiGraphics ref={glowRef} draw={() => undefined} />

      <pixiGraphics ref={effectsRef} draw={() => undefined} />

      {playerTextures.chikoDefault ? (
        <pixiSprite
          ref={chikoFollowerRef}
          texture={playerTextures.chikoDefault}
          visible={false}
          alpha={0}
        />
      ) : null}

      {playerTextures.chikoDefense ? (
        <pixiSprite
          ref={chicoRef}
          texture={playerTextures.chikoDefense}
          visible={false}
          alpha={0}
        />
      ) : null}

      {playerTextures.default[0] ? (
        <pixiSprite
          ref={playerRef}
          texture={playerTextures.default[0]}
          x={playerXScaled}
          y={groundYScaled}
          anchor={{ x: 0.5, y: 1 }}
        />
      ) : null}
      {!arePlayerTexturesReady ? (
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
