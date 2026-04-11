import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GameContainer } from "../components/common/GameContainer";
import { ScoreStatCard } from "../components/common/ScoreStatCard";
import { AdventureModal } from "../components/game/adventure/AdventureModal";
import { AdventureGamePanel } from "../components/game/adventure/AdventureGamePanel";
import { ADVENTURE_HELP_SLIDES } from "../constants/tutorialSlides";
import { ADVENTURE_PLAYER_FRAME_PATHS } from "../features/adventure/adventureAssets";
import { usePageBgm } from "../hooks/usePageBgm";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import { fetchWithAuth } from "../utils/api";
import { pickRandomActivityBgm } from "../utils/bgm";

type RunState = "ready" | "running" | "paused" | "gameover";

type Trap = {
  id: number;
  x: number;
  width: number;
  height: number;
  pulseOffset: number;
};

const ADVENTURE_BEST_SCORE_KEY = "birthday-cafe-adventure-best";
const R_GEND_HERO_CODE = "R-GEND-HERO";
const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 480;
const GROUND_HEIGHT = 100;
const PLAYER_X = 122;
const PLAYER_WIDTH = 200;
const PLAYER_HEIGHT = 200;
const PLAYER_HITBOX_WIDTH_RATIO = 0.5;
const PLAYER_HITBOX_HEIGHT_RATIO = 0.6;
const PLAYER_GROUND_OFFSET = -14;
const BASE_SCROLL_SPEED = 320;
const SCROLL_SPEED_STEP = 24;
const BASE_FRAME_DURATION_MS = 120;
const MIN_FRAME_DURATION_MS = 68;
const FRAME_DURATION_STEP_MS = 4;
const SCORE_PER_SECOND = 10;
const JUMP_VELOCITY = 500;
const GRAVITY = 2000;
const MAX_JUMPS = 2;

const clampDelta = (deltaSeconds: number) => Math.min(deltaSeconds, 0.035);

const randomTrapHeight = () => 58 + Math.random() * 28;
const randomTrapWidth = () => 42 + Math.random() * 16;

const createTrap = (id: number): Trap => ({
  id,
  x: WORLD_WIDTH + 40,
  width: randomTrapWidth(),
  height: randomTrapHeight(),
  pulseOffset: Math.random() * Math.PI * 2,
});

const getNextSpawnDelay = (speedTier: number) =>
  Math.max(0.72, 1.28 - speedTier * 0.03) + Math.random() * 0.36;

export default function AdventureGame() {
  const { isGuest } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [bgmSrc] = useState(() => pickRandomActivityBgm());
  const [runState, setRunState] = useState<RunState>("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [displaySpeedTier, setDisplaySpeedTier] = useState(0);
  const [playerY, setPlayerY] = useState(0);
  const [playerFrameIndex, setPlayerFrameIndex] = useState(0);
  const [traps, setTraps] = useState<Trap[]>([]);
  const [resultScore, setResultScore] = useState(0);
  const [stageScale, setStageScale] = useState(1);
  const [speedMessage, setSpeedMessage] = useState<string | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const speedMessageTimeoutRef = useRef<number | null>(null);
  const stageViewportRef = useRef<HTMLDivElement | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const runStateRef = useRef<RunState>("ready");
  const elapsedMsRef = useRef(0);
  const playerYRef = useRef(0);
  const velocityRef = useRef(0);
  const jumpsLeftRef = useRef(MAX_JUMPS);
  const trapsRef = useRef<Trap[]>([]);
  const spawnDelayRef = useRef(0.95);
  const trapIdRef = useRef(0);
  const playerFrameRef = useRef(0);
  const frameElapsedRef = useRef(0);
  const achievementAwardRequestedRef = useRef(false);
  const lastAnnouncedSpeedTierRef = useRef(0);

  usePageBgm(bgmSrc, { volume: 0.48 });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rawBestScore = window.localStorage.getItem(ADVENTURE_BEST_SCORE_KEY);
    const parsed = Number(rawBestScore);
    if (Number.isFinite(parsed) && parsed >= 0) {
      setBestScore(parsed);
    }
  }, []);

  useLayoutEffect(() => {
    const element = stageViewportRef.current;
    if (!element) {
      return;
    }

    const updateScale = () => {
      const rect = element.getBoundingClientRect();
      const nextScale = Math.max(rect.width / WORLD_WIDTH, 0.25);
      setStageScale((current) =>
        Math.abs(current - nextScale) < 0.001 ? current : nextScale,
      );
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    window.addEventListener("resize", updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(ADVENTURE_BEST_SCORE_KEY, String(bestScore));
  }, [bestScore]);

  const resetStage = useCallback(() => {
    elapsedMsRef.current = 0;
    playerYRef.current = 0;
    velocityRef.current = 0;
    jumpsLeftRef.current = MAX_JUMPS;
    trapsRef.current = [];
    spawnDelayRef.current = 0.95;
    playerFrameRef.current = 0;
    frameElapsedRef.current = 0;
    lastTimestampRef.current = null;
    achievementAwardRequestedRef.current = false;
    lastAnnouncedSpeedTierRef.current = 0;

    setScore(0);
    setDisplaySpeedTier(0);
    setPlayerY(0);
    setPlayerFrameIndex(0);
    setTraps([]);
    setSpeedMessage(null);
  }, []);

  useEffect(() => {
    return () => {
      if (speedMessageTimeoutRef.current != null) {
        window.clearTimeout(speedMessageTimeoutRef.current);
      }
    };
  }, []);

  const awardLegendAchievement = useCallback(async () => {
    if (achievementAwardRequestedRef.current || isGuest) {
      return;
    }

    achievementAwardRequestedRef.current = true;

    try {
      const response = await fetchWithAuth(
        `/achievements/award/${R_GEND_HERO_CODE}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        return;
      }

      const awarded = (await response.json()) === true;
      if (!awarded) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent("achievement-unlocked", {
          detail: { code: R_GEND_HERO_CODE },
        }),
      );
      addToast({
        title: "R전드 용사",
        description: "1000점을 넘긴 채 마법 함정까지 버텨냈다!",
        icon: "Crown",
      });
    } catch (error) {
      console.error("Failed to award adventure achievement", error);
    }
  }, [addToast, isGuest]);

  const finishRun = useCallback(
    (finalScore: number) => {
      runStateRef.current = "gameover";
      setRunState("gameover");
      setResultScore(finalScore);
      setBestScore((currentBest) =>
        finalScore > currentBest ? finalScore : currentBest,
      );

      if (finalScore >= 1000) {
        void awardLegendAchievement();
      }
    },
    [awardLegendAchievement],
  );

  const startGame = useCallback(() => {
    resetStage();
    runStateRef.current = "running";
    setRunState("running");
  }, [resetStage]);

  const goToReady = useCallback(() => {
    resetStage();
    runStateRef.current = "ready";
    setRunState("ready");
    setResultScore(0);
  }, [resetStage]);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  const pauseGame = useCallback(() => {
    if (runStateRef.current !== "running") {
      return;
    }

    runStateRef.current = "paused";
    setRunState("paused");
    lastTimestampRef.current = null;
  }, []);

  const resumeGame = useCallback(() => {
    if (runStateRef.current !== "paused") {
      return;
    }

    runStateRef.current = "running";
    setRunState("running");
    lastTimestampRef.current = null;
  }, []);

  const togglePause = useCallback(() => {
    if (runStateRef.current === "running") {
      pauseGame();
      return;
    }

    if (runStateRef.current === "paused") {
      resumeGame();
    }
  }, [pauseGame, resumeGame]);

  const jump = useCallback(() => {
    if (runStateRef.current !== "running" || jumpsLeftRef.current <= 0) {
      return;
    }

    velocityRef.current = JUMP_VELOCITY;
    jumpsLeftRef.current -= 1;
  }, []);

  const handleStagePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-ui-control='true']")) {
        return;
      }

      jump();
    },
    [jump],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        if (runStateRef.current === "ready") {
          startGame();
          return;
        }

        if (runStateRef.current === "gameover") {
          restartGame();
          return;
        }

        jump();
      }

      if (event.code === "KeyP") {
        event.preventDefault();
        togglePause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [jump, restartGame, startGame, togglePause]);

  useEffect(() => {
    const tick = (timestamp: number) => {
      animationFrameRef.current = window.requestAnimationFrame(tick);

      if (runStateRef.current !== "running") {
        lastTimestampRef.current = timestamp;
        return;
      }

      if (lastTimestampRef.current == null) {
        lastTimestampRef.current = timestamp;
        return;
      }

      const deltaSeconds = clampDelta(
        (timestamp - lastTimestampRef.current) / 1000,
      );
      lastTimestampRef.current = timestamp;

      elapsedMsRef.current += deltaSeconds * 1000;
      const nextScore =
        Math.floor(elapsedMsRef.current / 1000) * SCORE_PER_SECOND;
      const speedTier = Math.floor(nextScore / 100);
      const scrollSpeed = BASE_SCROLL_SPEED + speedTier * SCROLL_SPEED_STEP;

      frameElapsedRef.current += deltaSeconds * 1000;
      const frameDuration = Math.max(
        MIN_FRAME_DURATION_MS,
        BASE_FRAME_DURATION_MS - speedTier * FRAME_DURATION_STEP_MS,
      );
      while (frameElapsedRef.current >= frameDuration) {
        frameElapsedRef.current -= frameDuration;
        playerFrameRef.current =
          (playerFrameRef.current + 1) % ADVENTURE_PLAYER_FRAME_PATHS.length;
      }

      if (playerYRef.current > 0 || velocityRef.current > 0) {
        playerYRef.current += velocityRef.current * deltaSeconds;
        velocityRef.current -= GRAVITY * deltaSeconds;
        if (playerYRef.current <= 0) {
          playerYRef.current = 0;
          velocityRef.current = 0;
          jumpsLeftRef.current = MAX_JUMPS;
        }
      }

      spawnDelayRef.current -= deltaSeconds;
      if (spawnDelayRef.current <= 0) {
        trapsRef.current = [...trapsRef.current, createTrap(trapIdRef.current)];
        trapIdRef.current += 1;
        spawnDelayRef.current = getNextSpawnDelay(speedTier);
      }

      const movedTraps = trapsRef.current
        .map((trap) => ({
          ...trap,
          x: trap.x - scrollSpeed * deltaSeconds,
        }))
        .filter((trap) => trap.x + trap.width > -48);

      trapsRef.current = movedTraps;

      const playerHorizontalInset =
        (PLAYER_WIDTH * (1 - PLAYER_HITBOX_WIDTH_RATIO)) / 2;
      const playerLeft = PLAYER_X + playerHorizontalInset;
      const playerRight = PLAYER_X + PLAYER_WIDTH - playerHorizontalInset;
      const playerClearance =
        playerYRef.current + PLAYER_HEIGHT * (1 - PLAYER_HITBOX_HEIGHT_RATIO);
      const collided = movedTraps.some(
        (trap) =>
          trap.x < playerRight &&
          trap.x + trap.width > playerLeft &&
          playerClearance < trap.height,
      );

      if (speedTier > 0 && speedTier > lastAnnouncedSpeedTierRef.current) {
        lastAnnouncedSpeedTierRef.current = speedTier;
        setSpeedMessage("좀더 빠르게 달려볼까?");
        if (speedMessageTimeoutRef.current != null) {
          window.clearTimeout(speedMessageTimeoutRef.current);
        }
        speedMessageTimeoutRef.current = window.setTimeout(() => {
          setSpeedMessage(null);
        }, 1400);
      }

      setScore(nextScore);
      setDisplaySpeedTier(speedTier);
      setPlayerY(playerYRef.current);
      setPlayerFrameIndex(playerFrameRef.current);
      setTraps(movedTraps);

      if (collided) {
        finishRun(nextScore);
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current != null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [finishRun]);

  useEffect(() => {
    resetStage();
  }, [resetStage]);

  const targetProgress = Math.min(100, (score / 1000) * 100);
  const playerFrameSrc = ADVENTURE_PLAYER_FRAME_PATHS[playerFrameIndex];
  const introInstructionMessage =
    runState === "running"
      ? (speedMessage ?? "탭, 클릭, 스페이스바로 점프")
      : null;

  const stageScene = (
    <div
      ref={stageViewportRef}
      className="relative h-full w-full overflow-hidden bg-[#fff4d6]"
      onPointerDown={handleStagePointerDown}
      style={{
        background: "linear-gradient(180deg, #fffaf0 0%, #ffe8ba 100%)",
      }}
    >
      <div
        className="absolute left-1/2 top-0"
        style={{
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          transform: `translateX(-50%) scale(${stageScale})`,
          transformOrigin: "top center",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-[84px] bg-[#8b5a2b]" />
        <div
          className="absolute inset-x-0 bottom-0 border-t-[10px] border-[#59a94a]"
          style={{
            height: GROUND_HEIGHT,
            backgroundColor: "#8b5a2b",
          }}
        />
        <div
          className="absolute inset-x-0 bg-[#59a94a]"
          style={{ bottom: GROUND_HEIGHT, height: 4 }}
        />

        {traps.map((trap) => (
          <div
            key={trap.id}
            className="absolute border border-white/20 bg-[#111111]"
            style={{
              left: trap.x,
              bottom: GROUND_HEIGHT,
              width: trap.width,
              height: trap.height,
            }}
          />
        ))}

        <div
          className="absolute border border-[#14532d] bg-[#22c55e]/30"
          style={{
            left: PLAYER_X,
            bottom: GROUND_HEIGHT + playerY + PLAYER_GROUND_OFFSET,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
          }}
        >
          <div
            className="absolute border border-[#166534] bg-[#16a34a]/40"
            style={{
              left: `${((1 - PLAYER_HITBOX_WIDTH_RATIO) / 2) * 100}%`,
              bottom: 0,
              width: `${PLAYER_HITBOX_WIDTH_RATIO * 100}%`,
              height: `${PLAYER_HITBOX_HEIGHT_RATIO * 100}%`,
            }}
          />
          <img
            src={playerFrameSrc}
            alt="달리는 리코"
            draggable={false}
            className="relative z-[1] h-full w-full select-none object-contain"
            style={{
              imageRendering: "auto",
              filter:
                runState === "gameover"
                  ? "drop-shadow(0 6px 18px rgba(249,115,22,0.24)) saturate(0.84)"
                  : "drop-shadow(0 8px 18px rgba(15,118,110,0.26))",
              transform:
                runState === "running" && playerY === 0
                  ? "translateY(2px)"
                  : "translateY(0)",
            }}
          />
        </div>
      </div>
    </div>
  );

  const overlayModal =
    runState === "ready" ? (
      <AdventureModal
        embedded
        status="무한 달리기"
        title="준비됐어?"
        description="마법 함정을 뛰어넘고 1000점을 노려보자."
        actions={[{ label: "시작하기", onClick: startGame }]}
      />
    ) : runState === "paused" ? (
      <AdventureModal
        embedded
        status="일시정지"
        title="잠깐 쉬는 중"
        description="다시 달릴 준비가 되면 바로 이어갈 수 있어."
        actions={[
          { label: "이어서 달리기", onClick: resumeGame },
          { label: "처음부터", onClick: restartGame, tone: "secondary" },
        ]}
      />
    ) : runState === "gameover" ? (
      <AdventureModal
        embedded
        status={`${resultScore}점`}
        title={resultScore >= 1000 ? "R전드 페이스였어" : "마법 함정에 닿았어"}
        description={
          resultScore >= 1000
            ? "1000점을 넘긴 채 끝났어. 업적 조건을 만족했어!"
            : "속도를 다시 끌어올려서 1000점까지 달려보자."
        }
        actions={[
          { label: "다시 달리기", onClick: restartGame },
          { label: "준비 화면", onClick: goToReady, tone: "secondary" },
        ]}
      >
        <div className="grid grid-cols-2 gap-3">
          <ScoreStatCard
            label="Best"
            value={Math.max(bestScore, resultScore)}
            background="#102542"
            className="rounded-xl"
            valueClassName="text-lg"
          />
          <ScoreStatCard
            label="Speed"
            value={Math.floor(resultScore / 100)}
            background="#166D77"
            className="rounded-xl"
            valueClassName="text-lg"
          />
        </div>
      </AdventureModal>
    ) : null;

  const panel = (
    <AdventureGamePanel
      runState={runState}
      introInstructionMessage={introInstructionMessage}
      introOverlayOpacity={1}
      introMessageOpacity={1}
      showMapVolumeUi={false}
      onPauseToggle={togglePause}
      gameCanvas={stageScene}
      mapVolumeControls={null}
      overlayModal={overlayModal}
    />
  );

  const headerStats = useMemo(
    () => (
      <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
        <ScoreStatCard
          label="Score"
          value={score}
          background="#102542"
          className="min-w-[96px]"
        />
        <ScoreStatCard
          label="Best"
          value={bestScore}
          background="#166D77"
          className="min-w-[96px]"
        />
        <ScoreStatCard
          label="Speed"
          value={displaySpeedTier}
          background="#f97316"
          textColor="#fff7ef"
          borderColor="#fcd7b0"
          className="min-w-[96px]"
        />
      </div>
    ),
    [bestScore, displaySpeedTier, score],
  );

  return (
    <GameContainer
      title="리코의 위대한 여정"
      desc="스테이지 없이 계속 달린다. 마법 함정을 넘고 1000점을 노려보자."
      gameName="로비"
      helpSlides={ADVENTURE_HELP_SLIDES}
      className="bg-[linear-gradient(180deg,#fffdf7_0%,#fff6e2_100%)]"
      mainClassName="px-4 pb-10 sm:px-6"
      returnButtonVariant="cream"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border-2 border-[#102542]/10 bg-white/80 p-4 shadow-[0_18px_40px_rgba(17,24,39,0.08)] lg:flex-row">
          {headerStats}
          <div className="w-full max-w-[18rem]">
            <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-[#166D77]">
              <span>R-GEND Target</span>
              <span>{Math.min(score, 1000)} / 1000</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#d9efe8]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#5EC7A5_0%,#f59e0b_100%)] transition-[width] duration-200"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div>{panel}</div>
      </div>
    </GameContainer>
  );
}
