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
import { TOTAL_DURATION, clamp, getPhaseAtTime } from "./adventureGameShared";
import { ADVENTURE_PLAYER_FRAME_PATHS } from "./adventureAssets";
import {
  COYOTE_TIME_SECONDS,
  FALL_OUT_THRESHOLD,
  GRAVITY,
  GROUND_Y,
  PLAYER_ANIMATION_FPS,
  PLAYER_COLLISION_HALF_WIDTH,
  PLAYER_RENDER_SCALE,
  PLAYER_X,
  SCORE_STEP,
  SCORE_TICK_INTERVAL_SECONDS,
  SCROLL_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  createHole,
  drawCloud,
  drawStar,
  drawTerrainScene,
  getGameOverReasonForHoleKind,
  getGapHazardUnderPlayer,
  getJumpForce,
  getMaxJumpsForTime,
  getRunSpeedMultiplier,
  getSolidHazardTouchingPlayer,
  hasGroundSupport,
  isHazardLockedAtTime,
  isPlayerOverHole,
  type Hole,
  type HoleKind,
} from "./adventureGameDesktopConstants";

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
  const [playerFrames, setPlayerFrames] = useState<Texture[]>([]);
  const backgroundRef = useRef<PixiGraphics | null>(null);
  const worldRef = useRef<PixiGraphics | null>(null);
  const shadowRef = useRef<PixiGraphics | null>(null);
  const playerRef = useRef<PixiSprite | null>(null);
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
  const animationElapsedRef = useRef(0);
  const runElapsedRef = useRef(0);
  const fallingHoleRef = useRef(false);
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
    });
  }, [onSceneSnapshotChange]);

  useEffect(() => {
    let mounted = true;

    void Promise.all(
      ADVENTURE_PLAYER_FRAME_PATHS.map((path) =>
        Assets.load<Texture>({
          src: path,
          data: { scaleMode: "nearest" },
        }),
      ),
    ).then((frames) => {
      if (mounted) {
        setPlayerFrames(frames);
      }
    });

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
        graphics.rect(0, py(258), stageWidth, sy(16)).fill({
          color: 0xffffff,
          alpha: 0.18,
        });
        graphics.rect(0, py(272), stageWidth, sy(8)).fill({
          color: 0x5ec7a5,
          alpha: 0.24,
        });
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
        graphics.rect(0, py(258), stageWidth, sy(16)).fill({
          color: 0xe9f7ef,
          alpha: 0.12,
        });
        graphics.rect(0, py(272), stageWidth, sy(8)).fill({
          color: 0x7bb661,
          alpha: 0.24,
        });
        break;
      case 4:
        graphics.rect(0, 0, stageWidth, stageHeight).fill(0x2d3142);
        graphics
          .rect(0, 0, stageWidth, Math.min(stageHeight, sy(238)))
          .fill(0x4f5d75);
        graphics.roundRect(sx(44), sy(74), sx(140), sy(118), ss(18)).fill({
          color: 0x232936,
          alpha: 0.88,
        });
        graphics.roundRect(sx(322), sy(58), sx(160), sy(128), ss(20)).fill({
          color: 0x232936,
          alpha: 0.88,
        });
        graphics.roundRect(sx(594), sy(82), sx(126), sy(112), ss(18)).fill({
          color: 0x232936,
          alpha: 0.88,
        });
        graphics
          .circle(sx(98), sy(140), ss(11))
          .fill({ color: 0xffb703, alpha: 0.62 });
        graphics
          .circle(sx(388), sy(122), ss(12))
          .fill({ color: 0xffb703, alpha: 0.58 });
        graphics
          .circle(sx(660), sy(146), ss(10))
          .fill({ color: 0xffb703, alpha: 0.56 });
        for (let index = 0; index < 18; index += 1) {
          const brickX = (index % 6) * 132;
          const brickY = 194 + Math.floor(index / 6) * 24;
          graphics
            .roundRect(sx(brickX), sy(brickY), sx(74), sy(16), ss(4))
            .fill({ color: 0x7d8597, alpha: 0.26 });
        }
        graphics.rect(0, sy(258), stageWidth, sy(16)).fill({
          color: 0xffffff,
          alpha: 0.08,
        });
        graphics.rect(0, sy(272), stageWidth, sy(8)).fill({
          color: 0x8d99ae,
          alpha: 0.22,
        });
        break;
      case 5:
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
        graphics.rect(0, sy(258), stageWidth, sy(16)).fill({
          color: 0xfef3c7,
          alpha: 0.08,
        });
        graphics.rect(0, sy(272), stageWidth, sy(8)).fill({
          color: 0xff8c42,
          alpha: 0.22,
        });
        break;
      case 6:
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
        graphics.rect(0, sy(258), stageWidth, sy(16)).fill({
          color: 0xffffff,
          alpha: 0.16,
        });
        graphics.rect(0, sy(272), stageWidth, sy(8)).fill({
          color: 0x7dd3c7,
          alpha: 0.24,
        });
        break;
      default:
        graphics.rect(0, 0, stageWidth, stageHeight).fill(0x152238);
        graphics
          .rect(0, 0, stageWidth, Math.min(stageHeight, sy(238)))
          .fill(0x516b8b);
        graphics
          .circle(sx(648), sy(72), ss(30))
          .fill({ color: 0xf8fafc, alpha: 0.88 });
        for (let index = 0; index < 28; index += 1) {
          const starX = (index * 63 + 18) % WORLD_WIDTH;
          const starY = 26 + (index % 6) * 28;
          drawStar(graphics, sx(starX), sy(starY), ss(1.8 + (index % 3)), 0.6);
        }
        graphics
          .roundRect(sx(-40), sy(164), sx(360), sy(96), ss(48))
          .fill(0x324a5f);
        graphics
          .roundRect(sx(214), sy(148), sx(330), sy(112), ss(54))
          .fill(0x243b53);
        graphics
          .roundRect(sx(488), sy(170), sx(360), sy(102), ss(52))
          .fill(0x1b2a41);
        graphics.rect(0, sy(258), stageWidth, sy(16)).fill({
          color: 0xffffff,
          alpha: 0.1,
        });
        graphics.rect(0, sy(272), stageWidth, sy(8)).fill({
          color: 0x90cdf4,
          alpha: 0.2,
        });
        break;
    }
  }, [px, py, ss, stageHeight, stageWidth, sx, sy]);

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
  }, [groundSegmentBodyHeight, px, py, stageHeight, sx, sy, ss]);

  const syncPlayerVisuals = useCallback(() => {
    const player = playerRef.current;
    const shadow = shadowRef.current;
    if (!player || !shadow) {
      return;
    }

    player.x = playerXScaled;
    player.y = groundYScaled - ss(playerYRef.current);
    player.rotation = rotationRef.current;
    player.scale.set(
      PLAYER_RENDER_SCALE * uniformScale * playerScaleMultiplier,
    );

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
      .fill({
        color: 0x102542,
        alpha: shadowAlpha,
      });
  }, [
    groundYScaled,
    playerScaleMultiplier,
    playerXScaled,
    py,
    runState,
    ss,
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
    nextHoleIdRef.current = 1;
    holesRef.current = [];
    onScoreChange(0);
    drawBackdrop();
    drawTerrain();
    syncPlayerVisuals();
    emitSnapshot();
  }, [
    drawBackdrop,
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
      nextHoleIdRef.current = snapshot.nextHoleId;
      holesRef.current = snapshot.holes.map((hole) => ({ ...hole }));
      gameOverSentRef.current = false;
      onScoreChange(snapshot.score);
      drawBackdrop();
      drawTerrain();
      syncPlayerVisuals();
      emitSnapshot();
    },
    [drawBackdrop, drawTerrain, emitSnapshot, onScoreChange, syncPlayerVisuals],
  );

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

    if (!canGroundJump && !canCoyoteJump && !canAirJump) {
      return;
    }

    const nextJumpCount = jumpCountRef.current + 1;
    jumpCountRef.current = nextJumpCount;
    coyoteTimeRef.current = 0;
    velocityRef.current = getJumpForce(nextJumpCount);
    rotationRef.current = nextJumpCount > 1 ? 0.05 : -0.18;
    syncPlayerVisuals();
  }, [syncPlayerVisuals]);

  useEffect(() => {
    if (playerFrames.length === 0) {
      return;
    }

    if (sceneSnapshot) {
      restoreScene(sceneSnapshot);
      return;
    }

    resetScene();
  }, [playerFrames, restartNonce, resetScene, restoreScene, sceneSnapshot]);

  useEffect(() => {
    if (playerFrames.length === 0) {
      return;
    }

    drawTerrain();
    syncPlayerVisuals();
  }, [currentCourseTime, drawTerrain, playerFrames, syncPlayerVisuals]);

  useEffect(() => {
    if (playerFrames.length === 0) {
      return;
    }

    drawBackdrop();
  }, [currentPhaseId, drawBackdrop, playerFrames]);

  useEffect(() => {
    if (playerFrames.length === 0 || runState !== "running") {
      return;
    }

    if (jumpNonce === lastHandledJumpNonceRef.current) {
      return;
    }

    lastHandledJumpNonceRef.current = jumpNonce;
    tryJump();
  }, [jumpNonce, playerFrames, runState, tryJump]);

  useTick(
    useCallback(
      (ticker: Ticker) => {
        if (playerFrames.length === 0) {
          return;
        }

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
            emitSnapshot();
          }
          return;
        }

        const deltaSeconds = Math.min(ticker.deltaMS / 1000, 1 / 20);
        const speedMultiplier = getRunSpeedMultiplier(courseTimeRef.current);
        const holeDeltaSeconds = deltaSeconds * speedMultiplier;
        runElapsedRef.current += deltaSeconds;
        const obstaclesEnabled = !isHazardLockedAtTime(courseTimeRef.current);

        let nextHoles: Hole[] = holesRef.current
          .map((hole) => ({
            ...hole,
            x: hole.x - SCROLL_SPEED * holeDeltaSeconds,
          }))
          .filter((hole) => hole.x + hole.width > -80);

        if (obstaclesEnabled) {
          const currentPhaseId = getPhaseAtTime(courseTimeRef.current).id;
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
        drawTerrain,
        emitSnapshot,
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
