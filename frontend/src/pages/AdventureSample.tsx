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
  Sprite as PixiSprite,
  Text as PixiText,
  Texture,
  Ticker,
} from "pixi.js";
import { GameContainer } from "../components/common/GameContainer";
import type { TutorialSlide } from "../components/common/TutorialBanner";

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
const PLAYER_SIZE = 64;
const GRAVITY = 2200;
const JUMP_FORCE = 860;
const MAX_JUMPS = 2;
const COYOTE_TIME_SECONDS = 0.12;
const PLAYER_IMAGE = "/assets/adventure_character_sample.png";
const SCROLL_SPEED = 330;
const HOLE_MIN_WIDTH = 144;
const HOLE_MAX_WIDTH = 220;
const HOLE_SPAWN_DISTANCE = 300;
const FALL_OUT_THRESHOLD = 240;
const SCORE_TICK_INTERVAL_SECONDS = 1;
const SCORE_STEP = 10;
const BEST_SCORE_KEY = "birthday-cafe-adventure-sample-best";

type Hole = {
  id: number;
  x: number;
  width: number;
};

type RunState = "ready" | "running" | "paused" | "gameover";

const HELP_SLIDES: TutorialSlide[] = [
  {
    title: "Tap, Jump, Recover",
    lines: [
      "Tap the stage or press Space to jump.",
      "A second jump is available in the air.",
    ],
  },
  {
    title: "Mind The Holes",
    lines: [
      "The ground has moving gaps instead of obstacles.",
      "If Rico falls too deep, the run is over.",
    ],
  },
  {
    title: "Mobile Ready",
    lines: [
      "Landscape mode gives the cleanest view.",
      "Press P or tap pause anytime.",
    ],
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const isPlayerOverHole = (holes: Hole[]) =>
  holes.some((hole) => hole.x < PLAYER_X && PLAYER_X < hole.x + hole.width);

const createHole = (id: number, startX: number): Hole => ({
  id,
  x: startX,
  width: Math.round(randomBetween(HOLE_MIN_WIDTH, HOLE_MAX_WIDTH)),
});

type RunnerSceneProps = {
  runState: RunState;
  jumpNonce: number;
  restartNonce: number;
  onScoreChange: (score: number) => void;
  onGameOver: (score: number) => void;
};

function RunnerScene({
  runState,
  jumpNonce,
  restartNonce,
  onScoreChange,
  onGameOver,
}: RunnerSceneProps) {
  const [texture, setTexture] = useState<Texture | null>(null);
  const worldRef = useRef<PixiGraphics | null>(null);
  const shadowRef = useRef<PixiGraphics | null>(null);
  const playerRef = useRef<PixiSprite | null>(null);
  const scoreTextRef = useRef<PixiText | null>(null);
  const hintTextRef = useRef<PixiText | null>(null);

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

  useEffect(() => {
    let mounted = true;

    void Assets.load<Texture>(PLAYER_IMAGE).then((loadedTexture) => {
      if (mounted) {
        setTexture(loadedTexture);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const updateHudText = useCallback((score: number) => {
    if (scoreTextRef.current) {
      scoreTextRef.current.text = `Score ${score}`;
    }
  }, []);

  const updateHintText = useCallback((label: string) => {
    if (hintTextRef.current) {
      hintTextRef.current.text = label;
    }
  }, []);

  const drawWorld = useCallback(() => {
    const graphics = worldRef.current;
    if (!graphics) {
      return;
    }

    graphics.clear();
    graphics.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill(0xf7f2e8);
    graphics.rect(0, 0, STAGE_WIDTH, 238).fill(0xd9eff3);
    graphics.circle(108, 84, 42).fill(0xffe08b);

    graphics.roundRect(34, 48, 182, 24, 12).fill({
      color: 0xffffff,
      alpha: 0.55,
    });
    graphics.roundRect(564, 72, 168, 22, 12).fill({
      color: 0xffffff,
      alpha: 0.48,
    });
    graphics.roundRect(474, 36, 118, 16, 10).fill({
      color: 0xffffff,
      alpha: 0.42,
    });

    graphics.rect(0, 258, STAGE_WIDTH, 16).fill({
      color: 0xffffff,
      alpha: 0.18,
    });
    graphics.rect(0, 272, STAGE_WIDTH, 8).fill({
      color: 0x5ec7a5,
      alpha: 0.24,
    });

    const sortedHoles = [...holesRef.current].sort((a, b) => a.x - b.x);
    let segmentStart = 0;

    for (const hole of sortedHoles) {
      const clampedLeft = clamp(hole.x, 0, STAGE_WIDTH);
      const clampedRight = clamp(hole.x + hole.width, 0, STAGE_WIDTH);

      if (clampedRight > clampedLeft) {
        graphics.rect(clampedLeft, GROUND_Y - 4, clampedRight - clampedLeft, STAGE_HEIGHT - GROUND_Y + 4).fill(
          0x3d2b2c,
        );
        graphics.rect(clampedLeft + 12, GROUND_Y + 28, Math.max(clampedRight - clampedLeft - 24, 0), 10).fill({
          color: 0x000000,
          alpha: 0.16,
        });
      }

      if (hole.x > segmentStart) {
        const segmentWidth = hole.x - segmentStart;
        graphics.roundRect(
          segmentStart,
          GROUND_Y - 16,
          segmentWidth,
          STAGE_HEIGHT - GROUND_Y + 24,
          18,
        ).fill(0xf0d3ae);
        graphics.rect(segmentStart, GROUND_Y - 18, segmentWidth, 14).fill(
          0x5ec7a5,
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
      graphics.roundRect(
        segmentStart,
        GROUND_Y - 16,
        segmentWidth,
        STAGE_HEIGHT - GROUND_Y + 24,
        18,
      ).fill(0xf0d3ae);
      graphics.rect(segmentStart, GROUND_Y - 18, segmentWidth, 14).fill(
        0x5ec7a5,
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

    const stretch = clamp(1 + velocityRef.current / 2400, 0.9, 1.06);
    player.scale.x = playerYRef.current <= 0.1 ? 1.02 : clamp(1 - rotationRef.current * 0.08, 0.92, 1.08);
    player.scale.y = stretch;

    const shadowScale = clamp(1 - Math.max(playerYRef.current, 0) / 190, 0.46, 1);
    const shadowAlpha =
      isPlayerOverHole(holesRef.current) && playerYRef.current < -12 ? 0.12 : 0.22;

    shadow.clear();
    shadow.ellipse(
      PLAYER_X,
      GROUND_Y + 9,
      36 * shadowScale,
      12 * shadowScale,
    ).fill({
      color: 0x102542,
      alpha: shadowAlpha,
    });
  }, []);

  const resetScene = useCallback(() => {
    playerYRef.current = 0;
    velocityRef.current = 0;
    rotationRef.current = 0;
    jumpCountRef.current = 0;
    coyoteTimeRef.current = COYOTE_TIME_SECONDS;
    scoreRef.current = 0;
    scoreTickTimerRef.current = 0;
    gameOverSentRef.current = false;
    nextHoleIdRef.current = 2;
    holesRef.current = [createHole(1, STAGE_WIDTH + 240)];
    updateHudText(0);
    updateHintText("Tap / Space to jump");
    onScoreChange(0);
    drawWorld();
    syncPlayerVisuals();
  }, [drawWorld, onScoreChange, syncPlayerVisuals, updateHintText, updateHudText]);

  const tryJump = useCallback(() => {
    const overHole = isPlayerOverHole(holesRef.current);
    const grounded = playerYRef.current <= 0.01 && !overHole;
    const canGroundJump = grounded;
    const canCoyoteJump =
      jumpCountRef.current === 0 && coyoteTimeRef.current > 0;
    const canAirJump =
      jumpCountRef.current > 0 && jumpCountRef.current < MAX_JUMPS;

    if (!canGroundJump && !canCoyoteJump && !canAirJump) {
      return;
    }

    jumpCountRef.current += 1;
    coyoteTimeRef.current = 0;
    velocityRef.current = JUMP_FORCE;
    rotationRef.current = jumpCountRef.current > 1 ? -0.34 : -0.18;
    updateHintText(jumpCountRef.current > 1 ? "Air jump!" : "Jump!");
    syncPlayerVisuals();
  }, [syncPlayerVisuals, updateHintText]);

  useEffect(() => {
    if (!texture) {
      return;
    }

    resetScene();
  }, [texture, restartNonce, resetScene]);

  useEffect(() => {
    if (!texture || runState !== "running") {
      return;
    }

    tryJump();
  }, [jumpNonce, runState, texture, tryJump]);

  useTick(
    useCallback(
      (ticker: Ticker) => {
        if (!texture) {
          return;
        }

        if (runState !== "running") {
          if (runState === "ready") {
            drawWorld();
            syncPlayerVisuals();
          }
          return;
        }

        const deltaSeconds = Math.min(ticker.deltaMS / 1000, 1 / 20);

        const nextHoles = holesRef.current
          .map((hole) => ({
            ...hole,
            x: hole.x - SCROLL_SPEED * deltaSeconds,
          }))
          .filter((hole) => hole.x + hole.width > -80);

        const lastHole = nextHoles[nextHoles.length - 1];
        if (
          !lastHole ||
          lastHole.x + lastHole.width < STAGE_WIDTH - HOLE_SPAWN_DISTANCE
        ) {
          const spawnX = lastHole
            ? lastHole.x +
              lastHole.width +
              randomBetween(HOLE_SPAWN_DISTANCE, HOLE_SPAWN_DISTANCE + 120)
            : STAGE_WIDTH + 220;
          nextHoles.push(createHole(nextHoleIdRef.current, spawnX));
          nextHoleIdRef.current += 1;
        }
        holesRef.current = nextHoles;

        const overHole = isPlayerOverHole(nextHoles);
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

        if (!overHole && nextY <= 0) {
          nextY = 0;
          nextVelocity = 0;
          jumpCountRef.current = 0;
          coyoteTimeRef.current = COYOTE_TIME_SECONDS;
          rotationRef.current *= 0.56;
          updateHintText("Tap / Space to jump");
        } else if (overHole && nextY < -10) {
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
          scoreTickTimerRef.current -=
            scoreTicks * SCORE_TICK_INTERVAL_SECONDS;
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
      },
      [
        drawWorld,
        onGameOver,
        onScoreChange,
        runState,
        syncPlayerVisuals,
        texture,
        updateHintText,
        updateHudText,
      ],
    ),
  );

  return (
    <pixiContainer>
      <pixiGraphics ref={worldRef} draw={() => undefined} />
      <pixiGraphics ref={shadowRef} draw={() => undefined} />

      {texture ? (
        <pixiSprite
          ref={playerRef}
          texture={texture}
          x={PLAYER_X}
          y={GROUND_Y}
          anchor={{ x: 0.5, y: 1 }}
          width={PLAYER_SIZE}
          height={PLAYER_SIZE}
        />
      ) : null}

      <pixiText
        ref={scoreTextRef}
        text="Score 0"
        x={28}
        y={24}
        style={{
          fill: "#102542",
          fontFamily: "Arial",
          fontSize: 24,
          fontWeight: "800",
        }}
      />

      <pixiText
        ref={hintTextRef}
        text="Loading..."
        x={28}
        y={58}
        style={{
          fill: "#365486",
          fontFamily: "Arial",
          fontSize: 14,
          fontWeight: "700",
        }}
      />

      {!texture ? (
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

type OverlayAction = {
  label: string;
  onClick: () => void;
  tone?: "primary" | "secondary";
};

type StageOverlayProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions: OverlayAction[];
};

function StageOverlay({
  eyebrow,
  title,
  description,
  actions,
}: StageOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#fffaf2]/70 p-4 backdrop-blur-[3px]">
      <div className="w-full max-w-sm rounded-[2rem] border-4 border-[#D6C0B0] bg-[#FFFFF8]/95 p-6 text-center shadow-[0_28px_60px_rgba(17,24,39,0.18)]">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#5EC7A5]">
          {eyebrow}
        </p>
        <h3 className="mt-2 font-handwriting text-4xl text-[#166D77]">
          {title}
        </h3>
        <p className="mt-3 text-sm font-bold leading-relaxed text-[#365486]">
          {description}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              data-ui-control="true"
              onClick={action.onClick}
              className={`rounded-2xl px-5 py-3 text-sm font-black transition-transform active:scale-95 ${
                action.tone === "secondary"
                  ? "border-2 border-[#166D77] bg-white text-[#166D77]"
                  : "border-2 border-[#166D77] bg-[#5EC7A5] text-[#FFFFF8] shadow-[0_6px_0_rgba(22,109,119,0.16)]"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdventureSample() {
  const [runState, setRunState] = useState<RunState>("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [jumpNonce, setJumpNonce] = useState(0);
  const [restartNonce, setRestartNonce] = useState(0);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);

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

  const attemptLandscapeLock = useCallback(() => {
    if (typeof window === "undefined" || typeof screen === "undefined") {
      return;
    }

    const orientation = screen.orientation as
      | (ScreenOrientation & {
          lock?: (orientation: "landscape") => Promise<void>;
        })
      | undefined;

    if (orientation?.lock) {
      void orientation.lock("landscape").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateOrientationState = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const isSmallViewport = window.innerWidth < 1024;
      const isMobile = coarsePointer || isSmallViewport;
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

  const startGame = useCallback(() => {
    attemptLandscapeLock();
    setScore(0);
    setFinalScore(0);
    setRestartNonce((value) => value + 1);
    setRunState("running");
  }, [attemptLandscapeLock]);

  const handlePauseToggle = useCallback(() => {
    setRunState((current) => {
      if (current === "running") {
        return "paused";
      }
      if (current === "paused") {
        attemptLandscapeLock();
        return "running";
      }
      return current;
    });
  }, [attemptLandscapeLock]);

  const handleScoreChange = useCallback((nextScore: number) => {
    setScore((current) => (current === nextScore ? current : nextScore));
    setBestScore((current) => Math.max(current, nextScore));
  }, []);

  const handleGameOver = useCallback((endedScore: number) => {
    setFinalScore(endedScore);
    setScore(endedScore);
    setBestScore((current) => Math.max(current, endedScore));
    setRunState("gameover");
  }, []);

  const triggerJump = useCallback(() => {
    setJumpNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyP") {
        event.preventDefault();
        if (runState === "running" || runState === "paused") {
          handlePauseToggle();
        }
        return;
      }

      if (event.code === "Enter" && (runState === "ready" || runState === "gameover")) {
        event.preventDefault();
        startGame();
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
  }, [handlePauseToggle, runState, startGame, triggerJump]);

  const handleStagePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (isMobilePortrait) {
        return;
      }

      const target = event.target;
      if (target instanceof HTMLElement && target.closest("[data-ui-control='true']")) {
        return;
      }

      event.preventDefault();
      attemptLandscapeLock();

      if (runState === "running") {
        triggerJump();
      }
    },
    [attemptLandscapeLock, isMobilePortrait, runState, triggerJump],
  );

  const statusLabel =
    runState === "running"
      ? "Running"
      : runState === "paused"
        ? "Paused"
        : runState === "gameover"
          ? "Game Over"
          : "Ready";

  return (
    <>
      <GameContainer
        title="리코의 생일 질주"
        desc="Birthday Cafe 톤으로 다시 꾸민 Pixi 러너 샘플"
        gameName="용사 리코 이야기"
        helpSlides={HELP_SLIDES}
        className="relative overflow-hidden bg-[#f7f2e8] text-[#1d3557] select-none"
        mainClassName="px-4 pb-8 sm:px-6 lg:px-8"
        headerRight={
          <>
            <div
              className="flex min-w-[88px] flex-col items-center rounded-2xl px-4 py-2"
              style={{ background: "#102542", color: "#FFFFF8" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">
                Score
              </span>
              <span className="text-xl font-black leading-tight">{score}</span>
            </div>
            <div
              className="flex min-w-[88px] flex-col items-center rounded-2xl px-4 py-2"
              style={{ background: "#5EC7A5", color: "#FFFFF8" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-80">
                Best
              </span>
              <span className="text-xl font-black leading-tight">
                {bestScore}
              </span>
            </div>
          </>
        }
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
            <section className="rounded-[2rem] border-4 border-white/70 bg-white/80 p-4 shadow-[0_24px_60px_rgba(17,24,39,0.12)] sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-[#5EC7A5]">
                    Birthday Cafe Runner
                  </p>
                  <h2 className="font-handwriting text-4xl leading-none text-[#166D77] sm:text-5xl">
                    Rico&apos;s Gap Dash
                  </h2>
                </div>
                <div className="rounded-full bg-[#102542] px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-white">
                  {statusLabel}
                </div>
              </div>

              <div
                className="relative overflow-hidden rounded-[1.75rem] border-4 border-white/80 bg-[#d9eff3] shadow-[0_18px_50px_rgba(17,24,39,0.18)]"
                onPointerDown={handleStagePointerDown}
                style={{ touchAction: "none" }}
              >
                <div className="aspect-[2/1] w-full touch-none overscroll-none">
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
                      onScoreChange={handleScoreChange}
                      onGameOver={handleGameOver}
                    />
                  </Application>
                </div>

                {(runState === "running" || runState === "paused") && (
                  <button
                    type="button"
                    data-ui-control="true"
                    onClick={handlePauseToggle}
                    className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/80 bg-[#102542] text-lg font-black text-white shadow-[0_14px_28px_rgba(0,0,0,0.2)]"
                    aria-label={runState === "paused" ? "Resume" : "Pause"}
                  >
                    {runState === "paused" ? "▶" : "Ⅱ"}
                  </button>
                )}

                {runState === "ready" && (
                  <StageOverlay
                    eyebrow="Ready"
                    title="Start Game"
                    description="Tap the button to begin. Score rises by exactly 10 points every second while you survive."
                    actions={[
                      {
                        label: "Start Game",
                        onClick: startGame,
                      },
                    ]}
                  />
                )}

                {runState === "paused" && (
                  <StageOverlay
                    eyebrow="Pause"
                    title="Take A Breath"
                    description="The run is paused. Press P or tap resume when you are ready to jump again."
                    actions={[
                      {
                        label: "Resume",
                        onClick: handlePauseToggle,
                      },
                      {
                        label: "Restart",
                        onClick: startGame,
                        tone: "secondary",
                      },
                    ]}
                  />
                )}

                {runState === "gameover" && (
                  <StageOverlay
                    eyebrow="Game Over"
                    title="Fell Into A Gap"
                    description={`Final score ${finalScore}. Try another run and beat your best cafe record.`}
                    actions={[
                      {
                        label: "Retry",
                        onClick: startGame,
                      },
                      {
                        label: "Keep Browsing",
                        onClick: () => setRunState("ready"),
                        tone: "secondary",
                      },
                    ]}
                  />
                )}
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-black text-[#102542]">
                    Run Notes
                  </h3>
                  <span className="rounded-full bg-[#bef264] px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-[#166D77]">
                    10 pts/s
                  </span>
                </div>
                <div className="space-y-3 text-sm font-bold leading-relaxed text-[#365486]">
                  <div className="rounded-[1.2rem] border border-[#102542]/10 bg-[#fffaf2] px-4 py-3">
                    Landscape mode is preferred on mobile. Portrait opens a
                    rotate-your-device overlay before play continues.
                  </div>
                  <div className="rounded-[1.2rem] border border-[#102542]/10 bg-[#fffaf2] px-4 py-3">
                    The stage uses Pixi at a fixed 800x400 logical size and
                    scales inside a responsive 2:1 frame without browser
                    gestures getting in the way.
                  </div>
                  <div className="rounded-[1.2rem] border border-[#102542]/10 bg-[#fffaf2] px-4 py-3">
                    Space, W, Up Arrow or tap to jump. Press P or use the pause
                    button to freeze the run.
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
                <h3 className="text-lg font-black text-[#102542]">
                  Current HUD
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[1.2rem] bg-[#102542] px-4 py-3 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">
                      Status
                    </p>
                    <p className="mt-1 text-lg font-black">{statusLabel}</p>
                  </div>
                  <div className="rounded-[1.2rem] bg-[#FFE4E6] px-4 py-3 text-[#166D77]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">
                      Final
                    </p>
                    <p className="mt-1 text-lg font-black">{finalScore}</p>
                  </div>
                </div>
              </section>
            </aside>
          </section>
        </div>
      </GameContainer>

      {isMobilePortrait && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#fffaf2]/95 px-6 backdrop-blur-md lg:hidden">
          <div className="w-full max-w-sm rounded-[2rem] border-4 border-[#D6C0B0] bg-[#FFFFF8] p-6 text-center shadow-[0_28px_60px_rgba(17,24,39,0.18)]">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5EC7A5]">
              Landscape Only
            </p>
            <div className="mt-3 text-5xl text-[#166D77]">⟲</div>
            <h3 className="mt-3 font-handwriting text-4xl text-[#166D77]">
              Please rotate your device
            </h3>
            <p className="mt-3 text-sm font-bold leading-relaxed text-[#365486]">
              The runner uses a wide 2:1 stage. Rotate to landscape so the
              Pixi canvas can fill the frame cleanly without being cut off.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
