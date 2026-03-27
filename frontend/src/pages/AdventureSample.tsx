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
import { ADVENTURE_SAMPLE_HELP_SLIDES } from "../constants/tutorialSlides";

type SamplePlayerInstance = {
  destroy: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
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
const GRAVITY = 2200;
const JUMP_FORCES = [650, 530, 450];
const MAX_JUMPS = 2;
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
const FALL_OUT_THRESHOLD = 240;
const SCORE_TICK_INTERVAL_SECONDS = 1;
const SCORE_STEP = 10;
const BEST_SCORE_KEY = "birthday-cafe-adventure-sample-best";
const YOUTUBE_VIDEO_ID = "J3B0k47f0Fs";

const SAMPLE_PHASES = [
  { id: 1, title: "1장 - 용사 리코 이야기", start: 0, end: 39, theme: "서막" },
  { id: 2, title: "2장 - 모험의 시작", start: 39, end: 121, theme: "모험의 시작" },
  { id: 3, title: "3장", start: 121, end: 214, theme: "숲" },
  { id: 4, title: "4장", start: 214, end: 282, theme: "던전" },
  { id: 5, title: "5장", start: 282, end: 310, theme: "결투" },
  { id: 6, title: "6장", start: 310, end: 388, theme: "승리" },
  { id: 7, title: "7장", start: 388, end: 433, theme: "엔딩" },
];

type Hole = {
  id: number;
  x: number;
  width: number;
};

type RunState = "ready" | "running" | "paused" | "gameover";

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

const getJumpForce = (jumpCount: number) =>
  JUMP_FORCES[jumpCount - 1] ??
  Math.max(
    380,
    JUMP_FORCES[JUMP_FORCES.length - 1] -
      (jumpCount - JUMP_FORCES.length) * 55,
  );

const isPlayerOverHole = (holes: Hole[]) =>
  holes.some((hole) => hole.x < PLAYER_X && PLAYER_X < hole.x + hole.width);

const createHole = (id: number, startX: number): Hole => ({
  id,
  x: startX,
  width: Math.round(randomBetween(HOLE_MIN_WIDTH, HOLE_MAX_WIDTH)),
});

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
  const [playerFrames, setPlayerFrames] = useState<Texture[]>([]);
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
  const animationElapsedRef = useRef(0);

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
        graphics
          .rect(
            clampedLeft,
            GROUND_Y - 4,
            clampedRight - clampedLeft,
            STAGE_HEIGHT - GROUND_Y + 4,
          )
          .fill(0x3d2b2c);
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
          .fill(0xf0d3ae);
        graphics
          .rect(segmentStart, GROUND_Y - 18, segmentWidth, 14)
          .fill(0x5ec7a5);
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
        .fill(0xf0d3ae);
      graphics
        .rect(segmentStart, GROUND_Y - 18, segmentWidth, 14)
        .fill(0x5ec7a5);
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
      isPlayerOverHole(holesRef.current) && playerYRef.current < -12
        ? 0.12
        : 0.22;

    shadow.clear();
    shadow
      .ellipse(PLAYER_X, GROUND_Y + 9, 34 * shadowScale, 10 * shadowScale)
      .fill({
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
    animationElapsedRef.current = 0;
    nextHoleIdRef.current = 2;
    holesRef.current = [createHole(1, STAGE_WIDTH + 240)];
    updateHudText(0);
    updateHintText("Tap / Space to jump");
    onScoreChange(0);
    drawWorld();
    syncPlayerVisuals();
  }, [
    drawWorld,
    onScoreChange,
    syncPlayerVisuals,
    updateHintText,
    updateHudText,
  ]);

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

    const nextJumpCount = jumpCountRef.current + 1;
    jumpCountRef.current = nextJumpCount;
    coyoteTimeRef.current = 0;
    velocityRef.current = getJumpForce(nextJumpCount);
    rotationRef.current = nextJumpCount > 1 ? -0.34 : -0.18;
    updateHintText(nextJumpCount > 1 ? "Air jump!" : "Jump!");
    syncPlayerVisuals();
  }, [syncPlayerVisuals, updateHintText]);

  useEffect(() => {
    if (playerFrames.length === 0) {
      return;
    }

    resetScene();
  }, [playerFrames, restartNonce, resetScene]);

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
          if (runState === "running") {
            animationElapsedRef.current += ticker.deltaMS / 1000;
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
      },
      [
        drawWorld,
        onGameOver,
        onScoreChange,
        runState,
        syncPlayerVisuals,
        playerFrames,
        updateHintText,
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
            setPlayerReady(true);

            if (pendingMusicStartRef.current) {
              event.target.seekTo(0, true);
              event.target.playVideo();
              pendingMusicStartRef.current = false;
            }
          },
        },
      },
    );

    return () => {
      musicPlayerRef.current?.destroy();
      musicPlayerRef.current = null;
    };
  }, [apiReady, youtubeWindow]);

  const playMusicFromStart = useCallback(() => {
    pendingMusicStartRef.current = true;

    if (!playerReady || !musicPlayerRef.current) {
      return;
    }

    musicPlayerRef.current.seekTo(0, true);
    musicPlayerRef.current.playVideo();
    pendingMusicStartRef.current = false;
  }, [playerReady]);

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

  const startGame = useCallback(() => {
    setScore(0);
    setFinalScore(0);
    setRestartNonce((value) => value + 1);
    playMusicFromStart();
    setRunState("running");
  }, [playMusicFromStart]);

  const handlePauseToggle = useCallback(() => {
    setRunState((current) => {
      if (current === "running") {
        pauseMusic();
        return "paused";
      }
      if (current === "paused") {
        musicPlayerRef.current?.playVideo();
        return "running";
      }
      return current;
    });
  }, [pauseMusic]);

  const handleScoreChange = useCallback((nextScore: number) => {
    setScore((current) => (current === nextScore ? current : nextScore));
    setBestScore((current) => Math.max(current, nextScore));
  }, []);

  const handleGameOver = useCallback(
    (endedScore: number) => {
      pauseMusic();
      setFinalScore(endedScore);
      setScore(endedScore);
      setBestScore((current) => Math.max(current, endedScore));
      setRunState("gameover");
    },
    [pauseMusic],
  );

  useEffect(() => {
    if (runState === "ready") {
      pauseMusic();
    }
  }, [pauseMusic, runState]);

  const triggerJump = useCallback(() => {
    setJumpNonce((value) => value + 1);
  }, []);

  const readyModalActions: AdventureModalAction[] = [
    {
      label: "Start Game",
      onClick: startGame,
    },
  ];

  const pauseModalActions: AdventureModalAction[] = [
    {
      label: "Resume",
      onClick: handlePauseToggle,
    },
    {
      label: "Restart",
      onClick: startGame,
      tone: "secondary",
    },
  ];

  const gameOverModalActions: AdventureModalAction[] = [
    {
      label: "Retry",
      onClick: startGame,
    },
    {
      label: "Keep Browsing",
      onClick: () => setRunState("ready"),
      tone: "secondary",
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
        (runState === "ready" || runState === "gameover")
      ) {
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

  const statusLabel =
    runState === "running"
      ? "Running"
      : runState === "paused"
        ? "Paused"
        : runState === "gameover"
          ? "Game Over"
          : "Ready";
  const activePhaseId = 1;
  const unlockedPhaseId = 1;

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
          <>
            <div
              className={`flex flex-col items-center rounded-2xl px-4 py-2 ${
                isMobileViewport ? "min-w-[76px]" : "min-w-[88px]"
              }`}
              style={{ background: "#102542", color: "#FFFFF8" }}
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
              className={`flex flex-col items-center rounded-2xl px-4 py-2 ${
                isMobileViewport ? "min-w-[76px]" : "min-w-[88px]"
              }`}
              style={{ background: "#5EC7A5", color: "#FFFFF8" }}
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
          </>
        }
      >
        <div
          className={`mx-auto flex w-full flex-col ${
            isMobileViewport ? "max-w-[23rem] gap-4" : "max-w-6xl gap-6"
          }`}
        >
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
            <section
              className={`rounded-[2rem] border-4 border-white/70 bg-white/80 shadow-[0_24px_60px_rgba(17,24,39,0.12)] ${
                isMobileViewport ? "p-3.5" : "p-4 sm:p-5"
              }`}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-[#5EC7A5]">
                    1장 - 용사 리코 이야기
                  </p>
                  <h2 className="font-handwriting text-4xl leading-none text-[#166D77] sm:text-5xl">
                    옛날옛날 아주 먼 옛날에...
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
                <div
                  className={`w-full touch-none overscroll-none ${
                    isMobilePortrait ? "aspect-[9/10]" : "aspect-[2/1]"
                  }`}
                >
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
                  <AdventureModal
                    embedded
                    title="이야기 시작"
                    status="준비 됐어?"
                    description="모험을 떠나볼까?"
                    actions={readyModalActions}
                  />
                )}

                {runState === "paused" && (
                  <AdventureModal
                    embedded
                    title="1 - 용사 리코 이야기"
                    status="용사에게도 휴식이 필요해"
                    description="다시 마왕을 무찌르러 가볼까?"
                    actions={pauseModalActions}
                  />
                )}

                {runState === "gameover" && (
                  <AdventureModal
                    embedded
                    status="1장 - 용사 리코 이야기"
                    title="함정에 빠졌어..."
                    description="거기 누구 없어요? 도와주세요!!"
                    actions={gameOverModalActions}
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
                    Mobile is now tuned for portrait play. The stage and side
                    panels shrink into a narrower vertical layout instead of
                    asking for landscape.
                  </div>
                  <div className="rounded-[1.2rem] border border-[#102542]/10 bg-[#fffaf2] px-4 py-3">
                    The stage uses Pixi at a fixed 800x400 logical size and
                    scales into a portrait-friendly frame on phones while
                    keeping the same collision and jump timing.
                  </div>
                  <div className="rounded-[1.2rem] border border-[#102542]/10 bg-[#fffaf2] px-4 py-3">
                    Space, W, Up Arrow or tap to jump. Press P or use the pause
                    button to freeze the run.
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-black text-[#102542]">
                    Phase Preview
                  </h3>
                  <span className="rounded-full bg-[#2a9d8f] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
                    1 / {SAMPLE_PHASES.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {SAMPLE_PHASES.map((item) => {
                    const active = item.id === activePhaseId;
                    const unlocked = item.id <= unlockedPhaseId;

                    return (
                      <div
                        key={item.id}
                        className={`w-full rounded-[1.2rem] border px-4 py-3 ${
                          active
                            ? "border-[#102542] bg-[#102542] text-white"
                            : unlocked
                              ? "border-[#102542]/10 bg-[#fffaf2] text-[#102542]"
                              : "border-[#9ca3af]/40 bg-[#e5e7eb] text-[#6b7280]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
                              {item.title}
                            </p>
                            <p className="text-base font-black">{item.theme}</p>
                          </div>
                          <p className="text-sm font-bold">
                            {formatTime(item.start)} - {formatTime(item.end)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
                <h3 className="text-lg font-black text-[#102542]">Current HUD</h3>
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
      <div
        id="rico-adventure-sample-player"
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
      />
    </>
  );
}
