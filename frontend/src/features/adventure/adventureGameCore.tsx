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
  CLEAR_SLOWDOWN_START_SECONDS,
  COYOTE_TIME_SECONDS,
  FALL_OUT_THRESHOLD,
  GRAVITY,
  GROUND_Y,
  PLAYER_ANIMATION_FPS,
  PLAYER_COLLISION_HALF_WIDTH,
  PLAYER_COLLISION_HEIGHT,
  PLAYER_RENDER_SCALE,
  PLAYER_X,
  SCORE_STEP,
  SCORE_TICK_INTERVAL_SECONDS,
  SCROLL_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  createHole,
  drawCloud,
  drawTerrainScene,
  getGameOverReasonForHoleKind,
  getGapHazardUnderPlayer,
  getJumpForce,
  getMaxJumpsForTime,
  getPlayerBounds,
  getRunSpeedMultiplier,
  getSolidHazardTouchingPlayer,
  hasGroundSupport,
  isHazardLockedAtTime,
  isPlayerOverHole,
  type Hole,
  type HoleKind,
} from "./adventureGameDesktopConstants";
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
  type Phase5TrapEvent,
  type AdventurePlayerSpecialState,
} from "./adventureLaserShared";

extend({
  Container: PixiContainer,
  Graphics: PixiGraphics,
  Sprite: PixiSprite,
  Text: PixiText,
});

type RunnerSceneProps = {
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

export function RunnerScene({
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
}: RunnerSceneProps) {
  const [playerTextures, setPlayerTextures] =
    useState<AdventurePlayerTextureSet>({
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
  const scaleX = stageWidth / WORLD_WIDTH;
  const scaleY = stageHeight / WORLD_HEIGHT;
  const uniformScale = Math.min(scaleX, scaleY);
  const viewportOffsetX = (stageWidth - WORLD_WIDTH * uniformScale) / 2;
  const viewportOffsetY = (stageHeight - WORLD_HEIGHT * uniformScale) / 2;
  const sx = useCallback(
    (value: number) => value * uniformScale,
    [uniformScale],
  );
  const sy = useCallback(
    (value: number) => value * uniformScale,
    [uniformScale],
  );
  const px = useCallback(
    (value: number) => viewportOffsetX + value * uniformScale,
    [uniformScale, viewportOffsetX],
  );
  const py = useCallback(
    (value: number) => viewportOffsetY + value * uniformScale,
    [uniformScale, viewportOffsetY],
  );
  const ss = useCallback(
    (value: number) => value * uniformScale,
    [uniformScale],
  );
  const groundYScaled = py(GROUND_Y);
  const playerXScaled = px(PLAYER_X);
  const groundSegmentBodyHeight = Math.max(0, stageHeight - py(GROUND_Y + 24));
  const playerScaleMultiplier = 1;
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

  const drawLaserEffects = useCallback(() => {
    const graphics = effectsRef.current;
    if (!graphics) {
      return;
    }

    graphics.clear();
    const activeLaserEvent =
      getActiveLaserEventAtTime(courseTimeRef.current) ??
      phase5DynamicLasersRef.current.find(
        (e) => getLaserStateAtTime(e, courseTimeRef.current) !== null,
      );
    if (activeLaserEvent) {
      const laserState = getLaserStateAtTime(
        activeLaserEvent,
        courseTimeRef.current,
      );
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
          Assets.load<Texture>({
            src: path,
            data: { scaleMode: "nearest" },
          }),
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

  const drawBackdrop = useCallback(() => {
    const graphics = backgroundRef.current;
    if (!graphics) {
      return;
    }

    const phase = getPhaseAtTime(courseTimeRef.current);

    graphics.clear();
    switch (phase.id) {
      case 1:
      case 2:
        graphics.rect(0, 0, stageWidth, stageHeight).fill(0xf7f2e8);
        graphics
          .rect(0, 0, stageWidth, Math.min(stageHeight, py(238)))
          .fill(0xd9eff3);
        graphics.circle(px(108), py(82), ss(42)).fill(0xffe08b);
        drawCloud(graphics, px(28), py(48), sx(188), sy(42), 0.55);
        drawCloud(graphics, px(512), py(70), sx(178), sy(38), 0.46);
        drawCloud(graphics, px(684), py(34), sx(132), sy(28), 0.38);
        break;
      case 3:
        graphics.rect(0, 0, stageWidth, stageHeight).fill(0xe8f2de);
        graphics
          .rect(0, 0, stageWidth, Math.min(stageHeight, py(238)))
          .fill(0x9cc8a1);
        graphics
          .circle(px(120), py(70), ss(32))
          .fill({ color: 0xfef3c7, alpha: 0.72 });
        for (let index = 0; index < 6; index += 1) {
          const trunkX = index * 150 - 80;
          graphics.rect(px(trunkX), py(118), sx(18), sy(136)).fill(0x5b4636);
          graphics.circle(px(trunkX + 8), py(120), ss(52)).fill(0x4c7c59);
          graphics.circle(px(trunkX - 12), py(144), ss(42)).fill(0x5f995f);
          graphics.circle(px(trunkX + 26), py(146), ss(38)).fill(0x6aa56a);
        }
        break;
      case 4:
      case 5:
      case 6:
        graphics.rect(0, 0, stageWidth, stageHeight).fill(0x28090f);
        graphics
          .rect(0, 0, stageWidth, Math.min(stageHeight, sy(238)))
          .fill(0x8d1c31);
        graphics
          .circle(sx(630), sy(92), ss(58))
          .fill({ color: 0xff8c42, alpha: 0.88 });
        graphics
          .circle(sx(630), sy(92), ss(86))
          .fill({ color: 0xff8c42, alpha: 0.16 });
        for (let index = 0; index < 7; index += 1) {
          const smokeX = index * 150 - 100;
          graphics.circle(sx(smokeX), sy(74 + (index % 3) * 26), ss(26)).fill({
            color: 0x2b2d42,
            alpha: 0.26,
          });
        }
        for (let index = 0; index < 10; index += 1) {
          const spikeX = index * 84;
          graphics
            .poly([
              sx(spikeX),
              sy(252),
              sx(spikeX + 18),
              sy(212),
              sx(spikeX + 36),
              sy(252),
            ])
            .fill({ color: 0x5a0c20, alpha: 0.32 });
        }
        break;
      default:
        graphics.rect(0, 0, stageWidth, stageHeight).fill(0xf1fbf8);
        graphics
          .rect(0, 0, stageWidth, Math.min(stageHeight, sy(238)))
          .fill(0xbde0fe);
        graphics
          .circle(sx(118), sy(76), ss(34))
          .fill({ color: 0xfff4b6, alpha: 0.82 });
        drawCloud(graphics, sx(58), sy(42), sx(178), sy(40), 0.52);
        drawCloud(graphics, sx(454), sy(72), sx(162), sy(34), 0.44);
        for (let index = 0; index < 12; index += 1) {
          const flowerX = index * 74;
          graphics.rect(sx(flowerX + 6), sy(236), sx(4), sy(34)).fill(0x4d7c0f);
          graphics.circle(sx(flowerX + 8), sy(234), ss(8)).fill(0xf472b6);
          graphics.circle(sx(flowerX + 2), sy(238), ss(6)).fill(0xfef08a);
          graphics.circle(sx(flowerX + 14), sy(238), ss(6)).fill(0x86efac);
        }
    }
    graphics.x = cameraShakeXRef.current;
    graphics.y = cameraShakeYRef.current;
  }, [groundYScaled, stageHeight, stageWidth]);

  const drawTerrain = useCallback(() => {
    const graphics = worldRef.current;
    if (!graphics) {
      return;
    }
    drawTerrainScene({
      graphics,
      holes: holesRef.current,
      phaseId: getPhaseAtTime(courseTimeRef.current).id,
      stageHeight,
      groundSegmentBodyHeight,
      px,
      py,
      sx,
      sy,
      ss,
    });

    graphics.x = cameraShakeXRef.current;
    graphics.y = cameraShakeYRef.current;
  }, [groundSegmentBodyHeight, px, py, stageHeight, sx, sy, ss]);

  const syncPlayerVisuals = useCallback(() => {
    const player = playerRef.current;
    const swordAura = swordAuraRef.current;
    const shadow = shadowRef.current;
    if (!player || !shadow) {
      return;
    }

    player.x = playerXScaled + cameraShakeXRef.current;
    player.y = groundYScaled - ss(playerYRef.current) + cameraShakeYRef.current;
    player.rotation = rotationRef.current;
    player.scale.set(
      PLAYER_RENDER_SCALE * uniformScale * playerScaleMultiplier,
    );
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
      .fill({
        color: 0x102542,
        alpha: shadowAlpha,
      });

    const glow = glowRef.current;
    if (glow) {
      glow.clear();
      const t = courseTimeRef.current;
      const glowStart = CHICO_SAVE_TIME + 2;
      if (t >= glowStart && t < 310) {
        const a = Math.min((t - glowStart) / 1.5, 1);
        const tripleBoost = jumpCountRef.current >= 3 ? 2.2 : 1.0;
        const b = a * tripleBoost;
        const gx = player.x;
        const gy = player.y - ss(PLAYER_COLLISION_HEIGHT * 0.5);
        glow
          .circle(gx, gy, ss(65))
          .fill({ color: 0x7fff4f, alpha: Math.min(0.06 * b, 1) });
        glow
          .circle(gx, gy, ss(46))
          .fill({ color: 0x7fff4f, alpha: Math.min(0.13 * b, 1) });
        glow
          .circle(gx, gy, ss(30))
          .fill({ color: 0x9eff68, alpha: Math.min(0.22 * b, 1) });
        glow
          .circle(gx, gy, ss(18))
          .fill({ color: 0xc4ff8f, alpha: Math.min(0.38 * b, 1) });
        if (tripleBoost > 1) {
          glow
            .circle(gx, gy, ss(10))
            .fill({ color: 0xffffff, alpha: Math.min(0.55 * a, 1) });
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
        chico.texture = isHurt
          ? playerTextures.chikoHurt
          : playerTextures.chikoDefense;

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
  }, [
    groundYScaled,
    playerScaleMultiplier,
    playerXScaled,
    playerTextures.swordAura,
    px,
    py,
    runState,
    ss,
    sx,
    sy,
    uniformScale,
  ]);

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
    phase5TrapInjectedRef.current = [];
    const p5schedule = generatePhase5CombatSchedule();
    phase5TrapScheduleRef.current = p5schedule.traps;
    phase5DynamicLasersRef.current = p5schedule.lasers;
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
    onScoreChange(0);
    drawBackdrop();
    drawTerrain();
    drawLaserEffects();
    syncPlayerVisuals();
    emitSnapshot();
  }, [
    drawBackdrop,
    drawLaserEffects,
    drawTerrain,
    emitSnapshot,
    onScoreChange,
    syncPlayerVisuals,
  ]);

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
      phase5TrapInjectedRef.current = [...snapshot.phase5TrapInjectedIds];
      phase5TrapScheduleRef.current = [...snapshot.phase5TrapSchedule];
      phase5DynamicLasersRef.current = [...snapshot.phase5DynamicLasers];
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
      gameOverSentRef.current = false;
      onScoreChange(snapshot.score);
      drawBackdrop();
      drawTerrain();
      drawLaserEffects();
      syncPlayerVisuals();
      emitSnapshot();
    },
    [
      drawBackdrop,
      drawLaserEffects,
      drawTerrain,
      emitSnapshot,
      getCurrentCameraShake,
      onScoreChange,
      syncPlayerVisuals,
    ],
  );

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

    if (!canGroundJump && !canCoyoteJump && !canAirJump) {
      return;
    }

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
        velocityRef.current = getJumpForce(0.5);
        rotationRef.current = -0.3;
        jumpCountRef.current = 1;
        coyoteTimeRef.current = 0;
        reverseMotionUntilRef.current = event.fireTime + 0.32;
        stopMotionUntilRef.current = event.fireTime + 0.72;
        shakeUntilRef.current = event.fireTime + 1;
        shakeAmplitudeRef.current = 10;
        chicoUntilRef.current = CHICO_SAVE_TIME + 2;
      }
    },
    [],
  );

  useEffect(() => {
    if (!arePlayerTexturesReady) {
      return;
    }

    if (sceneSnapshot) {
      restoreScene(sceneSnapshot);
      return;
    }

    resetScene();
  }, [
    arePlayerTexturesReady,
    restartNonce,
    resetScene,
    restoreScene,
    sceneSnapshot,
  ]);

  useEffect(() => {
    if (!arePlayerTexturesReady) {
      return;
    }

    drawTerrain();
    drawLaserEffects();
    syncPlayerVisuals();
  }, [
    arePlayerTexturesReady,
    currentCourseTime,
    drawLaserEffects,
    drawTerrain,
    syncPlayerVisuals,
  ]);

  useEffect(() => {
    if (!arePlayerTexturesReady) {
      return;
    }

    drawBackdrop();
  }, [arePlayerTexturesReady, currentPhaseId, drawBackdrop]);

  useEffect(() => {
    if (!arePlayerTexturesReady || runState !== "running") {
      return;
    }

    if (jumpNonce === lastHandledJumpNonceRef.current) {
      return;
    }

    lastHandledJumpNonceRef.current = jumpNonce;
    tryJump();
  }, [arePlayerTexturesReady, jumpNonce, runState, tryJump]);

  useTick(
    useCallback(
      (ticker: Ticker) => {
        if (!arePlayerTexturesReady) {
          return;
        }

        const player = playerRef.current;
        if (player) {
          const baseRunSpeedMultiplier = getRunSpeedMultiplier(
            courseTimeRef.current,
          );
          const motionScale =
            courseTimeRef.current < reverseMotionUntilRef.current
              ? 0.22
              : courseTimeRef.current < stopMotionUntilRef.current
                ? 0.08
                : Math.max(damageSlowMultiplierRef.current, 0.08);
          const visualSpeedMultiplier = baseRunSpeedMultiplier * motionScale;
          const specialState = getPlayerSpecialStateAtTime(
            courseTimeRef.current,
          );
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

          if (
            runState === "running" &&
            specialState !== "shock" &&
            !angerFrozen
          ) {
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
          } else if (
            runState !== "paused" &&
            specialState !== "shock" &&
            !angerFrozen
          ) {
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
        const baseSpeedMultiplier = getRunSpeedMultiplier(
          courseTimeRef.current,
        );
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
        const isPhase7ClearSlowdown =
          currentPhaseId === 7 &&
          courseTimeRef.current >= CLEAR_SLOWDOWN_START_SECONDS;
        const obstaclesEnabled =
          currentPhaseId !== 5 &&
          !isHazardLockedAtTime(courseTimeRef.current) &&
          !isPhase7ClearSlowdown;

        const nextHoles: Hole[] =
          currentPhaseId === 5
            ? holesRef.current
                .map((hole) => ({
                  ...hole,
                  x: hole.x - SCROLL_SPEED * holeDeltaSeconds,
                }))
                .filter((hole) => hole.x + hole.width > -80 && hole.id < 0)
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

        // Inject scripted phase 5 magic traps
        if (currentPhaseId === 5) {
          for (const trap of phase5TrapScheduleRef.current) {
            if (
              courseTimeRef.current >= trap.injectTime &&
              !phase5TrapInjectedRef.current.includes(trap.id)
            ) {
              nextHoles.push({
                id: trap.holeId,
                x: WORLD_WIDTH + 120,
                width: trap.width,
                gapAfter: 9999,
                kind: "magic",
                height: trap.height,
                y: trap.laneTop,
              });
              phase5TrapInjectedRef.current = [
                ...phase5TrapInjectedRef.current,
                trap.id,
              ];
            }
          }
        }

        holesRef.current = nextHoles;

        const activeLaserEvent = getActiveLaserEventAtTime(
          courseTimeRef.current,
        );
        if (activeLaserEvent && !hasProcessedLaserEvent(activeLaserEvent.id)) {
          const laserState = getLaserStateAtTime(
            activeLaserEvent,
            courseTimeRef.current,
          );
          if (laserState === "firing") {
            if (activeLaserEvent.onHitBehavior === "chico-save") {
              applyLaserBehavior(
                activeLaserEvent,
                activeLaserEvent.onHitBehavior,
              );
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
              applyLaserBehavior(
                activeLaserEvent,
                activeLaserEvent.onHitBehavior,
              );
              markLaserEventProcessed(activeLaserEvent.id);
            }
          }
        }

        for (const dynLaser of phase5DynamicLasersRef.current) {
          if (hasProcessedLaserEvent(dynLaser.id)) continue;
          const laserState = getLaserStateAtTime(
            dynLaser,
            courseTimeRef.current,
          );
          if (laserState === "firing") {
            if (
              isLaserTouchingPlayer(
                dynLaser,
                getPlayerBounds(playerYRef.current),
                WORLD_WIDTH,
              )
            ) {
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
        const touchingSolidHazard = getSolidHazardTouchingPlayer(
          nextHoles,
          nextY,
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
    ),
  );

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
          text="Loading runner..."
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
