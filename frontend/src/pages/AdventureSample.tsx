import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Application, extend, useTick } from "@pixi/react";
import {
  Assets,
  Container as PixiContainer,
  Graphics as PixiGraphics,
  Rectangle,
  Sprite as PixiSprite,
  Text as PixiText,
  Texture,
  Ticker,
} from "pixi.js";
import { GameContainer } from "../components/common/GameContainer";
import {
  AdventureModal,
  type AdventureModalAction,
} from "../components/game/AdventureModal";
import { AdventureSampleGamePanel } from "../components/game/adventureSample/AdventureSampleGamePanel";
import { AdventureSampleHudPanel } from "../components/game/adventureSample/AdventureSampleHudPanel";
import { AdventureSamplePhaseGuide } from "../components/game/adventureSample/AdventureSamplePhaseGuide";
import { ADVENTURE_SAMPLE_HELP_SLIDES } from "../constants/tutorialSlides";

type SamplePlayerInstance = {
  destroy: () => void;
  getCurrentTime: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  setVolume: (volume: number) => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
};

type SampleYouTubeNamespace = {
  Player: new (
    elementId: string,
    config: {
      height?: number | string;
      width?: number | string;
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (event: { target: SamplePlayerInstance }) => void;
      };
    },
  ) => SamplePlayerInstance;
};

type SampleYouTubeWindow = Window & {
  YT?: SampleYouTubeNamespace;
  onYouTubeIframeAPIReady?: () => void;
};

extend({
  Container: PixiContainer,
  Graphics: PixiGraphics,
  Sprite: PixiSprite,
  Text: PixiText,
});

const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 400;
const GROUND_Y = 318;
const PLAYER_X = 138;
const GRAVITY = 2150;
const JUMP_FORCES = [660, 540, 455];
const MAX_JUMPS = 2;
const PHASE_FIVE_MAX_JUMPS = 3;
const COYOTE_TIME_SECONDS = 0.12;
const PLAYER_SPRITE_SHEET_PATH = "/assets/adventuregame/1172-Sheet.png";
const PLAYER_FRAME_SIZE = 2000;
const PLAYER_FRAME_COUNT = 6;
const PLAYER_ANIMATION_FPS = 10;
const PLAYER_RENDER_SIZE = 156;
const PLAYER_RENDER_SCALE = PLAYER_RENDER_SIZE / PLAYER_FRAME_SIZE;
const SCROLL_SPEED = 330;
const HOLE_MIN_WIDTH = 144;
const HOLE_MAX_WIDTH = 220;
const HOLE_SPAWN_DISTANCE = 300;
const CLEAR_SLOWDOWN_START_SECONDS = 404;
const FALL_OUT_THRESHOLD = 252;
const SCORE_TICK_INTERVAL_SECONDS = 1;
const SCORE_STEP = 10;
const PHASE_ONE_HAZARD_DELAY_SECONDS = 20;
const PHASE_TRANSITION_SAFE_SECONDS = 3;
const BEST_SCORE_KEY = "birthday-cafe-adventure-sample-best";
const YOUTUBE_VIDEO_ID = "J3B0k47f0Fs";

const SAMPLE_PHASES = [
  {
    id: 1,
    title: "1장 - 용사 리코 이야기",
    start: 0,
    end: 39,
    theme: "서막",
    description: "옛날옛날 아주 먼 옛날에...",
  },
  {
    id: 2,
    title: "2장 - 모험의 시작",
    start: 39,
    end: 121,
    theme: "모험의 시작",
    description: "마왕을 잡으러 가자",
  },
  {
    id: 3,
    title: "3장 - 숲에서 만난 친구",
    start: 121,
    end: 224,
    theme: "숲",
    description: "치코등장",
  },
  {
    id: 4,
    title: "4장",
    start: 224,
    end: 282,
    theme: "던전",
    description: "치코뭔가하고죽음",
  },
  {
    id: 5,
    title: "5장",
    start: 282,
    end: 310,
    theme: "결투",
    description: "짧고 거대한 결전 구간입니다.",
  },
  {
    id: 6,
    title: "6장",
    start: 310,
    end: 388,
    theme: "승리",
    description: "치코뭔가함",
  },
  {
    id: 7,
    title: "7장",
    start: 388,
    end: 433,
    theme: "엔딩",
    description: "이야기 끝",
  },
] as const;
const TOTAL_SAMPLE_DURATION = SAMPLE_PHASES[SAMPLE_PHASES.length - 1].end;

type HoleKind = "pit" | "spike" | "lava";

type Hole = {
  id: number;
  x: number;
  width: number;
  gapAfter: number;
  kind: HoleKind;
};

type RunState = "ready" | "running" | "paused" | "gameover" | "completed";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remain = safeSeconds % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
};

const getPhaseAtTime = (time: number) =>
  SAMPLE_PHASES.find((phase) => time >= phase.start && time < phase.end) ??
  SAMPLE_PHASES[SAMPLE_PHASES.length - 1];

const getClearedPhaseId = (time: number) =>
  SAMPLE_PHASES.reduce(
    (highest, phase) => (time >= phase.end ? phase.id : highest),
    0,
  );

const getRetryPhase = (time: number) => {
  const clearedPhaseId = getClearedPhaseId(time);
  const retryPhaseId = Math.min(clearedPhaseId + 1, SAMPLE_PHASES.length);
  return (
    SAMPLE_PHASES.find((phase) => phase.id === retryPhaseId) ?? SAMPLE_PHASES[0]
  );
};

const isHazardLockedAtTime = (time: number) =>
  time < PHASE_ONE_HAZARD_DELAY_SECONDS ||
  SAMPLE_PHASES.some(
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

const isPlayerOverHole = (holes: Hole[]) =>
  holes.some((hole) => hole.x < PLAYER_X && PLAYER_X < hole.x + hole.width);

const getRunSpeedMultiplier = (courseTime: number) => {
  if (courseTime <= CLEAR_SLOWDOWN_START_SECONDS) {
    return 1;
  }

  return clamp(
    (TOTAL_SAMPLE_DURATION - courseTime) /
      (TOTAL_SAMPLE_DURATION - CLEAR_SLOWDOWN_START_SECONDS),
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

const buildPlayerFrames = (sheetTexture: Texture): Texture[] =>
  Array.from({ length: PLAYER_FRAME_COUNT }, (_, index) => {
    const frame = new Rectangle(
      index * PLAYER_FRAME_SIZE,
      0,
      PLAYER_FRAME_SIZE,
      PLAYER_FRAME_SIZE,
    );

    return new Texture({
      source: sheetTexture.source,
      frame,
      orig: new Rectangle(0, 0, PLAYER_FRAME_SIZE, PLAYER_FRAME_SIZE),
    });
  });

type RunnerSceneProps = {
  runState: RunState;
  jumpNonce: number;
  restartNonce: number;
  currentCourseTime: number;
  onScoreChange: (score: number) => void;
  onGameOver: (score: number) => void;
  onComplete: (score: number) => void;
};

function RunnerScene({
  runState,
  jumpNonce,
  restartNonce,
  currentCourseTime,
  onScoreChange,
  onGameOver,
  onComplete,
}: RunnerSceneProps) {
  const [playerFrames, setPlayerFrames] = useState<Texture[]>([]);
  const worldRef = useRef<PixiGraphics | null>(null);
  const shadowRef = useRef<PixiGraphics | null>(null);
  const playerRef = useRef<PixiSprite | null>(null);
  const scoreTextRef = useRef<PixiText | null>(null);
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

  useEffect(() => {
    let mounted = true;

    void Assets.load<Texture>(PLAYER_SPRITE_SHEET_PATH).then((sheetTexture) => {
      if (mounted) {
        setPlayerFrames(buildPlayerFrames(sheetTexture));
      }
    });

    return () => {
      mounted = false;
    };
  }, [runState]);

  useEffect(() => {
    courseTimeRef.current = currentCourseTime;
  }, [currentCourseTime]);

  const updateHudText = useCallback((score: number) => {
    if (scoreTextRef.current) {
      scoreTextRef.current.text = `Score ${score}`;
    }
  }, [runState]);

  const drawWorld = useCallback(() => {
    const graphics = worldRef.current;
    if (!graphics) {
      return;
    }

    const courseTime = courseTimeRef.current;
    const phase = getPhaseAtTime(courseTime);
    const phaseDrift = (courseTime * 18) % (STAGE_WIDTH + 220);

    graphics.clear();
    switch (phase.id) {
      case 1:
        graphics.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill(0xf7f2e8);
        graphics.rect(0, 0, STAGE_WIDTH, 238).fill(0xd9eff3);
        graphics.circle(108, 82, 42).fill(0xffe08b);
        drawCloud(graphics, 28 - phaseDrift * 0.2, 48, 188, 42, 0.55);
        drawCloud(graphics, 512 - phaseDrift * 0.32, 70, 178, 38, 0.46);
        drawCloud(graphics, 684 - phaseDrift * 0.24, 34, 132, 28, 0.38);
        graphics.rect(0, 258, STAGE_WIDTH, 16).fill({
          color: 0xffffff,
          alpha: 0.18,
        });
        graphics.rect(0, 272, STAGE_WIDTH, 8).fill({
          color: 0x5ec7a5,
          alpha: 0.24,
        });
        break;
      case 2:
        graphics.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill(0xfff4dc);
        graphics.rect(0, 0, STAGE_WIDTH, 238).fill(0xf5c77e);
        graphics.circle(680, 86, 54).fill(0xfff0ad);
        graphics.roundRect(-50, 156, 440, 108, 54).fill(0xd9b572);
        graphics.roundRect(262, 172, 340, 96, 48).fill(0xc68b59);
        graphics.roundRect(548, 150, 320, 114, 56).fill(0xaa714f);
        for (let index = 0; index < 4; index += 1) {
          const baseX = ((index * 210 - phaseDrift * 0.55) % 980) - 100;
          graphics
            .rect(baseX, 132, 10, 120)
            .fill({ color: 0xfef3c7, alpha: 0.35 });
        }
        graphics.rect(0, 260, STAGE_WIDTH, 14).fill({
          color: 0xffffff,
          alpha: 0.12,
        });
        graphics.rect(0, 274, STAGE_WIDTH, 8).fill({
          color: 0xf7b267,
          alpha: 0.22,
        });
        break;
      case 3:
        graphics.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill(0xe8f2de);
        graphics.rect(0, 0, STAGE_WIDTH, 238).fill(0x9cc8a1);
        graphics.circle(120, 70, 32).fill({ color: 0xfef3c7, alpha: 0.72 });
        for (let index = 0; index < 6; index += 1) {
          const trunkX = ((index * 150 - phaseDrift * 0.8) % 980) - 80;
          graphics.rect(trunkX, 118, 18, 136).fill(0x5b4636);
          graphics.circle(trunkX + 8, 120, 52).fill(0x4c7c59);
          graphics.circle(trunkX - 12, 144, 42).fill(0x5f995f);
          graphics.circle(trunkX + 26, 146, 38).fill(0x6aa56a);
        }
        graphics.rect(0, 258, STAGE_WIDTH, 16).fill({
          color: 0xe9f7ef,
          alpha: 0.12,
        });
        graphics.rect(0, 272, STAGE_WIDTH, 8).fill({
          color: 0x7bb661,
          alpha: 0.24,
        });
        break;
      case 4:
        graphics.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill(0x2d3142);
        graphics.rect(0, 0, STAGE_WIDTH, 238).fill(0x4f5d75);
        graphics.roundRect(44, 74, 140, 118, 18).fill({
          color: 0x232936,
          alpha: 0.88,
        });
        graphics.roundRect(322, 58, 160, 128, 20).fill({
          color: 0x232936,
          alpha: 0.88,
        });
        graphics.roundRect(594, 82, 126, 112, 18).fill({
          color: 0x232936,
          alpha: 0.88,
        });
        graphics.circle(98, 140, 11).fill({ color: 0xffb703, alpha: 0.62 });
        graphics.circle(388, 122, 12).fill({ color: 0xffb703, alpha: 0.58 });
        graphics.circle(660, 146, 10).fill({ color: 0xffb703, alpha: 0.56 });
        for (let index = 0; index < 18; index += 1) {
          const brickX = (index % 6) * 132 - ((phaseDrift * 0.25) % 80);
          const brickY = 194 + Math.floor(index / 6) * 24;
          graphics
            .roundRect(brickX, brickY, 74, 16, 4)
            .fill({ color: 0x7d8597, alpha: 0.26 });
        }
        graphics.rect(0, 258, STAGE_WIDTH, 16).fill({
          color: 0xffffff,
          alpha: 0.08,
        });
        graphics.rect(0, 272, STAGE_WIDTH, 8).fill({
          color: 0x8d99ae,
          alpha: 0.22,
        });
        break;
      case 5:
        graphics.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill(0x28090f);
        graphics.rect(0, 0, STAGE_WIDTH, 238).fill(0x8d1c31);
        graphics.circle(630, 92, 58).fill({ color: 0xff8c42, alpha: 0.88 });
        graphics.circle(630, 92, 86).fill({ color: 0xff8c42, alpha: 0.16 });
        for (let index = 0; index < 7; index += 1) {
          const smokeX = ((index * 150 - phaseDrift * 0.6) % 980) - 100;
          graphics.circle(smokeX, 74 + (index % 3) * 26, 26).fill({
            color: 0x2b2d42,
            alpha: 0.26,
          });
        }
        for (let index = 0; index < 10; index += 1) {
          const spikeX = index * 84 - ((phaseDrift * 0.45) % 84);
          graphics
            .poly([spikeX, 252, spikeX + 18, 212, spikeX + 36, 252])
            .fill({ color: 0x5a0c20, alpha: 0.32 });
        }
        graphics.rect(0, 258, STAGE_WIDTH, 16).fill({
          color: 0xfef3c7,
          alpha: 0.08,
        });
        graphics.rect(0, 272, STAGE_WIDTH, 8).fill({
          color: 0xff8c42,
          alpha: 0.22,
        });
        break;
      case 6:
        graphics.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill(0xf1fbf8);
        graphics.rect(0, 0, STAGE_WIDTH, 238).fill(0xbde0fe);
        graphics.circle(118, 76, 34).fill({ color: 0xfff4b6, alpha: 0.82 });
        drawCloud(graphics, 58 - phaseDrift * 0.22, 42, 178, 40, 0.52);
        drawCloud(graphics, 454 - phaseDrift * 0.28, 72, 162, 34, 0.44);
        for (let index = 0; index < 12; index += 1) {
          const flowerX = index * 74 - ((phaseDrift * 0.7) % 74);
          graphics.rect(flowerX + 6, 236, 4, 34).fill(0x4d7c0f);
          graphics.circle(flowerX + 8, 234, 8).fill(0xf472b6);
          graphics.circle(flowerX + 2, 238, 6).fill(0xfef08a);
          graphics.circle(flowerX + 14, 238, 6).fill(0x86efac);
        }
        graphics.rect(0, 258, STAGE_WIDTH, 16).fill({
          color: 0xffffff,
          alpha: 0.16,
        });
        graphics.rect(0, 272, STAGE_WIDTH, 8).fill({
          color: 0x7dd3c7,
          alpha: 0.24,
        });
        break;
      default:
        graphics.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill(0x152238);
        graphics.rect(0, 0, STAGE_WIDTH, 238).fill(0x516b8b);
        graphics.circle(648, 72, 30).fill({ color: 0xf8fafc, alpha: 0.88 });
        for (let index = 0; index < 28; index += 1) {
          const starX =
            ((index * 63 + 18) % STAGE_WIDTH) + ((phaseDrift * 0.08) % 26);
          const starY = 26 + (index % 6) * 28;
          drawStar(
            graphics,
            starX % STAGE_WIDTH,
            starY,
            1.8 + (index % 3),
            0.6,
          );
        }
        graphics.roundRect(-40, 164, 360, 96, 48).fill(0x324a5f);
        graphics.roundRect(214, 148, 330, 112, 54).fill(0x243b53);
        graphics.roundRect(488, 170, 360, 102, 52).fill(0x1b2a41);
        graphics.rect(0, 258, STAGE_WIDTH, 16).fill({
          color: 0xffffff,
          alpha: 0.1,
        });
        graphics.rect(0, 272, STAGE_WIDTH, 8).fill({
          color: 0x90cdf4,
          alpha: 0.2,
        });
        break;
    }

    const sortedHoles = [...holesRef.current].sort((a, b) => a.x - b.x);
    let segmentStart = 0;

    for (const hole of sortedHoles) {
      const clampedLeft = clamp(hole.x, 0, STAGE_WIDTH);
      const clampedRight = clamp(hole.x + hole.width, 0, STAGE_WIDTH);

      if (clampedRight > clampedLeft) {
        graphics
          .rect(
            clampedLeft,
            GROUND_Y - 4,
            clampedRight - clampedLeft,
            STAGE_HEIGHT - GROUND_Y + 4,
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
                spikeX,
                GROUND_Y - 4,
                spikeX + 8,
                GROUND_Y - 24,
                spikeX + 16,
                GROUND_Y - 4,
              ])
              .fill({ color: 0xd9d9d9, alpha: 0.9 });
          }
        }
        if (hole.kind === "lava") {
          graphics
            .rect(
              clampedLeft + 8,
              GROUND_Y + 14,
              Math.max(clampedRight - clampedLeft - 16, 0),
              12,
            )
            .fill({ color: 0xff8c42, alpha: 0.72 });
          graphics
            .rect(
              clampedLeft + 18,
              GROUND_Y + 28,
              Math.max(clampedRight - clampedLeft - 36, 0),
              8,
            )
            .fill({ color: 0xffbe0b, alpha: 0.5 });
        }
        graphics
          .rect(
            clampedLeft + 12,
            GROUND_Y + 28,
            Math.max(clampedRight - clampedLeft - 24, 0),
            10,
          )
          .fill({
            color: 0x000000,
            alpha: 0.16,
          });
      }

      if (hole.x > segmentStart) {
        const segmentWidth = hole.x - segmentStart;
        graphics
          .roundRect(
            segmentStart,
            GROUND_Y - 16,
            segmentWidth,
            STAGE_HEIGHT - GROUND_Y + 24,
            18,
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
          .rect(segmentStart, GROUND_Y - 18, segmentWidth, 14)
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
        graphics.rect(segmentStart, GROUND_Y + 24, segmentWidth, 9).fill({
          color: 0xffffff,
          alpha: 0.18,
        });
      }

      segmentStart = Math.max(segmentStart, hole.x + hole.width);
    }

    if (segmentStart < STAGE_WIDTH) {
      const segmentWidth = STAGE_WIDTH - segmentStart;
      graphics
        .roundRect(
          segmentStart,
          GROUND_Y - 16,
          segmentWidth,
          STAGE_HEIGHT - GROUND_Y + 24,
          18,
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
        .rect(segmentStart, GROUND_Y - 18, segmentWidth, 14)
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
      graphics.rect(segmentStart, GROUND_Y + 24, segmentWidth, 9).fill({
        color: 0xffffff,
        alpha: 0.18,
      });
    }
  }, []);

  const syncPlayerVisuals = useCallback(() => {
    const player = playerRef.current;
    const shadow = shadowRef.current;
    if (!player || !shadow) {
      return;
    }

    player.x = PLAYER_X;
    player.y = GROUND_Y - playerYRef.current;
    player.rotation = rotationRef.current;
    player.scale.set(PLAYER_RENDER_SCALE, PLAYER_RENDER_SCALE);

    const shadowScale = clamp(
      0.82 - Math.max(playerYRef.current, 0) / 220,
      0.34,
      0.82,
    );
    const shadowAlpha =
      runState === "gameover" ||
      runState === "completed" ||
      fallingHoleRef.current ||
      isPlayerOverHole(holesRef.current)
        ? 0
        : 0.22;

    shadow.clear();
    shadow
      .ellipse(PLAYER_X, GROUND_Y - 10, 25 * shadowScale, 6.5 * shadowScale)
      .fill({
        color: 0x102542,
        alpha: shadowAlpha,
      });
  }, [runState]);

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
    updateHudText(0);
    onScoreChange(0);
    drawWorld();
    syncPlayerVisuals();
  }, [drawWorld, onScoreChange, syncPlayerVisuals, updateHudText]);

  const tryJump = useCallback(() => {
    const overHole =
      fallingHoleRef.current || isPlayerOverHole(holesRef.current);
    const grounded = playerYRef.current <= 0.01 && !overHole;
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
    rotationRef.current = nextJumpCount > 1 ? -0.34 : -0.18;
    syncPlayerVisuals();
  }, [syncPlayerVisuals]);

  useEffect(() => {
    if (playerFrames.length === 0) {
      return;
    }

    resetScene();
  }, [playerFrames, restartNonce, resetScene]);

  useEffect(() => {
    if (playerFrames.length === 0) {
      return;
    }

    drawWorld();
    syncPlayerVisuals();
  }, [currentCourseTime, drawWorld, playerFrames, syncPlayerVisuals]);

  useEffect(() => {
    if (playerFrames.length === 0 || runState !== "running") {
      return;
    }

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
            drawWorld();
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
            lastHole.x + lastHole.width < STAGE_WIDTH - HOLE_SPAWN_DISTANCE
          ) {
            const spawnX = Math.max(
              STAGE_WIDTH + 120,
              lastHole
                ? lastHole.x + lastHole.width + lastHole.gapAfter
                : STAGE_WIDTH + 220,
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

        const rawOverHole = isPlayerOverHole(nextHoles);
        const overHole = rawOverHole || fallingHoleRef.current;
        const grounded = playerYRef.current <= 0.01 && !overHole;

        if (grounded) {
          coyoteTimeRef.current = COYOTE_TIME_SECONDS;
        } else if (coyoteTimeRef.current > 0) {
          coyoteTimeRef.current = Math.max(
            0,
            coyoteTimeRef.current - deltaSeconds,
          );
        }

        let nextVelocity = velocityRef.current - GRAVITY * deltaSeconds;
        let nextY = playerYRef.current + nextVelocity * deltaSeconds;

        if (rawOverHole && nextY < -2) {
          fallingHoleRef.current = true;
        }

        if (!fallingHoleRef.current && !overHole && nextY <= 0) {
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
          updateHudText(scoreRef.current);
          onScoreChange(scoreRef.current);
        }

        drawWorld();
        syncPlayerVisuals();

        if (nextY < -FALL_OUT_THRESHOLD && !gameOverSentRef.current) {
          gameOverSentRef.current = true;
          onGameOver(scoreRef.current);
        }

        if (
          courseTimeRef.current >= TOTAL_SAMPLE_DURATION - 0.05 &&
          !gameOverSentRef.current
        ) {
          gameOverSentRef.current = true;
          onComplete(scoreRef.current);
        }
      },
      [
        drawWorld,
        onComplete,
        onGameOver,
        onScoreChange,
        runState,
        syncPlayerVisuals,
        playerFrames,
        updateHudText,
      ],
    ),
  );

  return (
    <pixiContainer>
      <pixiGraphics ref={worldRef} draw={() => undefined} />
      <pixiGraphics ref={shadowRef} draw={() => undefined} />

      {playerFrames[0] ? (
        <pixiSprite
          ref={playerRef}
          texture={playerFrames[0]}
          x={PLAYER_X}
          y={GROUND_Y}
          anchor={{ x: 0.5, y: 1 }}
          width={PLAYER_RENDER_SIZE}
          height={PLAYER_RENDER_SIZE}
        />
      ) : null}

      <pixiText
        ref={scoreTextRef}
        text="Score 0"
        x={28}
        y={0}
        style={{
          fill: "#102542",
          fontFamily: "OneStoreMobilePop",
          fontSize: 26,
          fontWeight: "800",
          stroke: {
            color: "#FFFFF8",
            width: 5,
            join: "round",
          },
        }}
      />
      {playerFrames.length === 0 ? (
        <pixiText
          text="Loading runner..."
          x={STAGE_WIDTH / 2}
          y={STAGE_HEIGHT / 2}
          anchor={0.5}
          style={{
            fill: "#102542",
            fontFamily: "Arial",
            fontSize: 24,
            fontWeight: "800",
          }}
        />
      ) : null}
    </pixiContainer>
  );
}

export default function AdventureSample() {
  const musicPlayerRef = useRef<SamplePlayerInstance | null>(null);
  const pendingMusicStartRef = useRef(false);
  const pendingMusicStartTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const courseTimeRef = useRef(0);
  const [runState, setRunState] = useState<RunState>("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [jumpNonce, setJumpNonce] = useState(0);
  const [restartNonce, setRestartNonce] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [hudCourseTime, setHudCourseTime] = useState(0);
  const [retryStartTime, setRetryStartTime] = useState(0);
  const [volume, setVolume] = useState(55);
  const [debugUnlockAll, setDebugUnlockAll] = useState(false);
  const [phaseTransition, setPhaseTransition] = useState<{
    id: number;
    title: string;
    theme: string;
  } | null>(null);
  const volumeRef = useRef(55);
  const lastPhaseIdRef = useRef<number | null>(null);
  const liveScoreRef = useRef(0);
  const jumpLockUntilRef = useRef(0);
  const youtubeWindow =
    typeof window === "undefined" ? undefined : (window as SampleYouTubeWindow);

  const resolution = useMemo(
    () =>
      typeof window === "undefined"
        ? 1
        : Math.min(window.devicePixelRatio || 1, 2),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rawBestScore = window.localStorage.getItem(BEST_SCORE_KEY);
    const parsed = Number(rawBestScore);
    if (Number.isFinite(parsed) && parsed >= 0) {
      setBestScore(parsed);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  }, [bestScore]);

  useEffect(() => {
    courseTimeRef.current = hudCourseTime;
  }, [hudCourseTime]);

  useEffect(() => {
    volumeRef.current = volume;
    if (playerReady && musicPlayerRef.current) {
      musicPlayerRef.current.setVolume(volume);
    }
  }, [playerReady, volume]);

  useEffect(() => {
    if (youtubeWindow?.YT?.Player) {
      setApiReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;

    const previousHandler = youtubeWindow?.onYouTubeIframeAPIReady;
    if (!youtubeWindow) {
      return;
    }

    youtubeWindow.onYouTubeIframeAPIReady = () => {
      previousHandler?.();
      setApiReady(true);
    };

    document.body.appendChild(script);

    return () => {
      youtubeWindow.onYouTubeIframeAPIReady = previousHandler;
    };
  }, [youtubeWindow]);

  useEffect(() => {
    if (!apiReady || musicPlayerRef.current || !youtubeWindow?.YT?.Player) {
      return;
    }

    musicPlayerRef.current = new youtubeWindow.YT.Player(
      "rico-adventure-sample-player",
      {
        height: 1,
        width: 1,
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            const player = event.target as SamplePlayerInstance;
            setPlayerReady(true);
            player.setVolume(volumeRef.current);

            if (pendingMusicStartRef.current) {
              player.seekTo(pendingMusicStartTimeRef.current, true);
              player.playVideo();
              pendingMusicStartRef.current = false;
            }
          },
        },
      },
    ) as SamplePlayerInstance;

    return () => {
      musicPlayerRef.current?.destroy();
      musicPlayerRef.current = null;
    };
  }, [apiReady, youtubeWindow]);

  const playMusicFromTime = useCallback(
    (seconds: number) => {
      pendingMusicStartRef.current = true;
      pendingMusicStartTimeRef.current = clamp(
        seconds,
        0,
        TOTAL_SAMPLE_DURATION,
      );

      if (!playerReady || !musicPlayerRef.current) {
        return;
      }

      musicPlayerRef.current.seekTo(pendingMusicStartTimeRef.current, true);
      musicPlayerRef.current.playVideo();
      pendingMusicStartRef.current = false;
    },
    [playerReady],
  );

  const pauseMusic = useCallback(() => {
    pendingMusicStartRef.current = false;
    musicPlayerRef.current?.pauseVideo();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateOrientationState = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const isSmallViewport = window.innerWidth < 1024;
      const isMobile = coarsePointer || isSmallViewport;
      setIsMobileViewport(isMobile);
      setIsMobilePortrait(isMobile && window.innerHeight > window.innerWidth);
    };

    updateOrientationState();
    window.addEventListener("resize", updateOrientationState);
    window.addEventListener("orientationchange", updateOrientationState);

    return () => {
      window.removeEventListener("resize", updateOrientationState);
      window.removeEventListener("orientationchange", updateOrientationState);
    };
  }, []);

  const startGame = useCallback(
    (startTime = 0) => {
      jumpLockUntilRef.current = 0;
      setScore(0);
      setFinalScore(0);
      setHudCourseTime(startTime);
      setRetryStartTime(startTime);
      setRestartNonce((value) => value + 1);
      playMusicFromTime(startTime);
      setRunState("running");
    },
    [playMusicFromTime],
  );

  const handlePauseToggle = useCallback(() => {
    setRunState((current) => {
      if (current === "running") {
        pauseMusic();
        return "paused";
      }
      if (current === "paused") {
        jumpLockUntilRef.current = Date.now() + 240;
        musicPlayerRef.current?.playVideo();
        return "running";
      }
      return current;
    });
  }, [pauseMusic]);

  const handleScoreChange = useCallback((nextScore: number) => {
    liveScoreRef.current = nextScore;
    setScore((current) => (current === nextScore ? current : nextScore));
  }, []);

  const handleGameOver = useCallback(
    (endedScore: number) => {
      const currentMusicTime = musicPlayerRef.current?.getCurrentTime();
      const resolvedCourseTime = clamp(
        Number.isFinite(currentMusicTime ?? Number.NaN)
          ? (currentMusicTime as number)
          : courseTimeRef.current,
        0,
        TOTAL_SAMPLE_DURATION,
      );
      const nextRetryPhase = getRetryPhase(resolvedCourseTime);

      pauseMusic();
      setFinalScore(endedScore);
      setScore(endedScore);
      setBestScore((current) => Math.max(current, endedScore));
      setHudCourseTime(resolvedCourseTime);
      setRetryStartTime(nextRetryPhase.start);
      setRunState("gameover");
    },
    [pauseMusic],
  );

  const handleGameComplete = useCallback(
    (clearedScore: number) => {
      pauseMusic();
      setFinalScore(clearedScore);
      setScore(clearedScore);
      setBestScore((current) => Math.max(current, clearedScore));
      setHudCourseTime(TOTAL_SAMPLE_DURATION);
      setRetryStartTime(SAMPLE_PHASES[SAMPLE_PHASES.length - 1].start);
      setRunState("completed");
    },
    [pauseMusic],
  );

  useEffect(() => {
    if (runState === "ready") {
      pauseMusic();
    }
  }, [pauseMusic, runState]);

  useEffect(() => {
    if (runState !== "running") {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const syncCourseTime = () => {
      const playerTime = musicPlayerRef.current?.getCurrentTime();
      const nextTime = clamp(
        Number.isFinite(playerTime ?? Number.NaN)
          ? (playerTime as number)
          : courseTimeRef.current,
        0,
        TOTAL_SAMPLE_DURATION,
      );

      if (nextTime >= TOTAL_SAMPLE_DURATION - 0.05) {
        handleGameComplete(liveScoreRef.current);
        return;
      }

      setHudCourseTime((current) =>
        Math.abs(current - nextTime) < 0.05 ? current : nextTime,
      );
      rafRef.current = window.requestAnimationFrame(syncCourseTime);
    };

    rafRef.current = window.requestAnimationFrame(syncCourseTime);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [handleGameComplete, runState]);

  const triggerJump = useCallback(() => {
    if (Date.now() < jumpLockUntilRef.current) {
      return;
    }
    setJumpNonce((value) => value + 1);
  }, []);

  const readyModalActions: AdventureModalAction[] = [
    {
      label: "게임 시작하기",
      onClick: () => startGame(0),
    },
  ];

  const handleRestartStageOne = useCallback(() => {
    startGame(0);
  }, [startGame]);

  const handleRestartCurrentStage = useCallback(() => {
    startGame(getPhaseAtTime(hudCourseTime).start);
  }, [hudCourseTime, startGame]);

  const handleDebugUnlockAll = useCallback(() => {
    setDebugUnlockAll(true);
  }, []);

  const handlePhaseStart = useCallback(
    (startTime: number) => {
      startGame(startTime);
    },
    [startGame],
  );

  const pauseModalActions: AdventureModalAction[] = [
    {
      label: "다시하기",
      onClick: handleRestartCurrentStage,
      tone: "secondary",
    },
    {
      label: "계속 가볼까?",
      onClick: handlePauseToggle,
    },
  ];

  const gameOverModalActions: AdventureModalAction[] = [
    {
      label: "처음부터 시작하기",
      onClick: handleRestartStageOne,
      tone: "secondary",
    },
    {
      label: "다시하기",
      onClick: handleRestartCurrentStage,
    },
  ];

  const completedModalActions: AdventureModalAction[] = [
    {
      label: "처음부터 다시 보기",
      onClick: handleRestartStageOne,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyP") {
        event.preventDefault();
        if (runState === "running" || runState === "paused") {
          handlePauseToggle();
        }
        return;
      }

      if (
        event.code === "Enter" &&
        (runState === "ready" ||
          runState === "gameover" ||
          runState === "completed")
      ) {
        event.preventDefault();
        if (runState === "gameover") {
          handleRestartCurrentStage();
          return;
        }
        if (runState === "completed") {
          handleRestartStageOne();
          return;
        }
        startGame(0);
        return;
      }

      if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "KeyW"
      ) {
        event.preventDefault();
        if (runState === "running") {
          triggerJump();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handlePauseToggle,
    handleRestartCurrentStage,
    handleRestartStageOne,
    runState,
    startGame,
    triggerJump,
  ]);

  const handleStagePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("[data-ui-control='true']")
      ) {
        return;
      }

      event.preventDefault();

      if (runState === "running") {
        triggerJump();
      }
    },
    [runState, triggerJump],
  );

  const displayTime =
    runState === "gameover" || runState === "completed"
      ? hudCourseTime
      : runState === "ready"
        ? retryStartTime
        : hudCourseTime;
  const displayTimeLabel = formatTime(displayTime);
  const activePhase = getPhaseAtTime(displayTime);
  const activePhaseId = activePhase.id;
  const unlockedPhaseId = Math.min(
    getClearedPhaseId(hudCourseTime) + 1,
    SAMPLE_PHASES.length,
  );
  const maxUnlockedPhaseId = debugUnlockAll
    ? SAMPLE_PHASES.length
    : unlockedPhaseId;
  const statusLabel =
    runState === "running"
      ? "Running"
      : runState === "paused"
        ? "Paused"
        : runState === "completed"
          ? "Clear"
          : runState === "gameover"
            ? "Game Over"
            : "Ready";
  const introOverlayFadeProgress = clamp((displayTime - 20) / 1.4, 0, 1);
  const introOverlayOpacity =
    activePhaseId === 1 ? 1 - introOverlayFadeProgress : 0;
  const showMapVolumeUi = activePhaseId === 1 && introOverlayOpacity > 0;
  const introInstructionMessage =
    activePhaseId === 1 && displayTime < 10
      ? "배경음이 작거나 크면 볼륨을 조절해줘"
      : activePhaseId === 1 && displayTime < 15
        ? "화면을 탭하거나 스페이스바로 점프할 수 있어"
        : activePhaseId === 1 && displayTime < 20
          ? "P 키를 누르면 잠시 쉴 수 있어"
          : null;

  const renderVolumeControls = (compact = false) => (
    <div
      data-ui-control="true"
      className={`rounded-[1.1rem] bg-white/84 ${
        compact
          ? "border border-[#fff7db]/85 px-2.5 py-2 shadow-[0_6px_14px_rgba(16,37,66,0.08)]"
          : "border-2 border-[#fff7db] px-3 py-2 shadow-[0_12px_28px_rgba(16,37,66,0.14)]"
      }`}
    >
      <div
        className={`flex items-center justify-between ${
          compact ? "mb-1 gap-2" : "mb-2 gap-3"
        }`}
      >
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#166D77]">
          Volume
        </span>
        <span className="text-sm font-black text-[#102542]">{volume}</span>
      </div>
      <input
        data-ui-control="true"
        type="range"
        min={0}
        max={100}
        step={1}
        value={volume}
        onChange={(event) => setVolume(Number(event.target.value))}
        className={`w-full cursor-pointer accent-[#166D77] ${
          compact ? "h-1.5" : "h-2"
        }`}
        aria-label="게임 볼륨"
      />
    </div>
  );

  const overlayModal =
    runState === "ready" ? (
      <AdventureModal
        embedded
        title="이야기 시작"
        status="준비 됐어?"
        description="모험을 떠나볼까?"
        actions={readyModalActions}
      >
        {renderVolumeControls(true)}
      </AdventureModal>
    ) : runState === "paused" ? (
      <AdventureModal
        embedded
        title={activePhase.title}
        status="용사에게도 휴식이 필요해"
        description="다시 마왕을 무찌르러 가볼까?"
        actions={pauseModalActions}
      >
        {renderVolumeControls(true)}
      </AdventureModal>
    ) : runState === "gameover" ? (
      <AdventureModal
        embedded
        status="함정에 빠졌어..."
        title={activePhase.title}
        description="거기 누구 없어요? 도와주세요!!"
        actions={gameOverModalActions}
      >
        {renderVolumeControls(true)}
      </AdventureModal>
    ) : runState === "completed" ? (
      <AdventureModal
        embedded
        status="배경음악이 끝났어"
        title="모험 성공!"
        description="용사 리코의 이야기가 해피엔딩으로 마무리됐어."
        actions={completedModalActions}
      >
        {renderVolumeControls(true)}
      </AdventureModal>
    ) : null;

  useEffect(() => {
    if (runState !== "running") {
      lastPhaseIdRef.current = activePhaseId;
      return;
    }

    if (lastPhaseIdRef.current === null) {
      lastPhaseIdRef.current = activePhaseId;
      return;
    }

    if (lastPhaseIdRef.current !== activePhaseId) {
      setPhaseTransition({
        id: activePhaseId,
        title: activePhase.title,
        theme: activePhase.theme,
      });
      const timeoutId = window.setTimeout(() => {
        setPhaseTransition((current) =>
          current?.id === activePhaseId ? null : current,
        );
      }, 3400);
      lastPhaseIdRef.current = activePhaseId;
      return () => window.clearTimeout(timeoutId);
    }
  }, [activePhase, activePhaseId, runState]);

  return (
    <>
      <GameContainer
        title="용사 리코 이야기"
        desc="라떼는 말이야 검 하나로 마왕을 잡았다고"
        gameName="용사 리코 이야기"
        helpSlides={ADVENTURE_SAMPLE_HELP_SLIDES}
        className="relative overflow-hidden bg-[#f7f2e8] text-[#1d3557] select-none"
        mainClassName={
          isMobileViewport ? "px-3 pb-6 sm:px-4" : "px-4 pb-8 sm:px-6 lg:px-8"
        }
        headerRight={
          <div className="flex -translate-y-1 items-center gap-3">
            <div
              className={`flex flex-col items-center rounded-2xl border-2 px-4 py-2 shadow-[0_10px_24px_rgba(16,37,66,0.16)] ${
                isMobileViewport ? "min-w-[76px]" : "min-w-[88px]"
              }`}
              style={{
                background: "#102542",
                color: "#FFFFF8",
                borderColor: "var(--color-pale-custard)",
                fontFamily: "OneStoreMobilePop",
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">
                Score
              </span>
              <span
                className={`font-black leading-tight ${
                  isMobileViewport ? "text-lg" : "text-xl"
                }`}
              >
                {score}
              </span>
            </div>
            <div
              className={`flex flex-col items-center rounded-2xl border-2 px-4 py-2 shadow-[0_10px_24px_rgba(16,37,66,0.16)] ${
                isMobileViewport ? "min-w-[76px]" : "min-w-[88px]"
              }`}
              style={{
                background: "#5EC7A5",
                color: "#FFFFF8",
                borderColor: "var(--color-pale-custard)",
                fontFamily: "OneStoreMobilePop",
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-80">
                Best
              </span>
              <span
                className={`font-black leading-tight ${
                  isMobileViewport ? "text-lg" : "text-xl"
                }`}
              >
                {bestScore}
              </span>
            </div>
          </div>
        }
      >
        <div
          className={`mx-auto flex w-full flex-col ${
            isMobileViewport ? "max-w-[23rem] gap-4" : "max-w-6xl gap-6"
          }`}
        >
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
            <AdventureSampleGamePanel
              activePhaseTitle={activePhase.title}
              activePhaseDescription={activePhase.description}
              statusLabel={statusLabel}
              displayTimeLabel={displayTimeLabel}
              isMobileViewport={isMobileViewport}
              isMobilePortrait={isMobilePortrait}
              runState={runState}
              introInstructionMessage={introInstructionMessage}
              introOverlayOpacity={introOverlayOpacity}
              showMapVolumeUi={showMapVolumeUi}
              phaseTransition={phaseTransition}
              onStagePointerDown={handleStagePointerDown}
              onPauseToggle={handlePauseToggle}
              mapVolumeControls={renderVolumeControls()}
              overlayModal={overlayModal}
              gameCanvas={
                <>
                  <Application
                    width={STAGE_WIDTH}
                    height={STAGE_HEIGHT}
                    autoDensity
                    resolution={resolution}
                    antialias
                    backgroundAlpha={0}
                    className="block h-full w-full max-w-full object-contain pointer-events-none"
                  >
                    <RunnerScene
                      runState={runState}
                      jumpNonce={jumpNonce}
                      restartNonce={restartNonce}
                      currentCourseTime={displayTime}
                      onScoreChange={handleScoreChange}
                      onGameOver={handleGameOver}
                      onComplete={handleGameComplete}
                    />
                  </Application>
                </>
              }
            />

            <aside className="space-y-5">
              <AdventureSamplePhaseGuide
                phases={SAMPLE_PHASES.map((phase) => ({
                  id: phase.id,
                  title: phase.title,
                  theme: phase.theme,
                  start: phase.start,
                  end: phase.end,
                }))}
                activePhaseId={activePhaseId}
                maxUnlockedPhaseId={maxUnlockedPhaseId}
                onDebugUnlockAll={handleDebugUnlockAll}
                onPhaseStart={handlePhaseStart}
                formatTime={formatTime}
              />

              <AdventureSampleHudPanel
                statusLabel={statusLabel}
                displayTimeLabel={displayTimeLabel}
                finalScore={finalScore}
              />
            </aside>
          </section>
        </div>
      </GameContainer>
      <div
        id="rico-adventure-sample-player"
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
      />
    </>
  );
}
