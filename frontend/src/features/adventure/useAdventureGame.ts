import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useToastStore } from "../../store/useToastStore";
import { fetchWithAuth } from "../../utils/api";
import {
  addAchievementToast,
  parseAchievementAwardResponse,
} from "../../utils/achievementAwards";
import {
  type RunState,
  ADVENTURE_BEST_SCORE_KEY,
  R_GEND_HERO_CODE,
  WORLD_WIDTH,
  PLAYER_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  MOBILE_WORLD_SCALE,
  PLAYER_MOBILE_SCALE,
  PLAYER_HITBOX_WIDTH_RATIO,
  PLAYER_HITBOX_HEIGHT_RATIO,
  PLAYER_HITBOX_BOTTOM_OFFSET_RATIO,
  PLAYER_GROUND_OFFSET,
  TRAP_HITBOX_BOTTOM_OFFSET_RATIO_MOBILE,
  TRAP_HITBOX_HEIGHT_RATIO_MOBILE,
  TRAP_HITBOX_HORIZONTAL_INSET_RATIO_MOBILE,
  BASE_SCROLL_SPEED,
  SCROLL_SPEED_STEP,
  BASE_FRAME_DURATION_MS,
  MIN_FRAME_DURATION_MS,
  FRAME_DURATION_STEP_MS,
  TRAP_MOBILE_SCALE,
  JUMP_VELOCITY,
  JUMP_HOLD_BOOST,
  JUMP_HOLD_MAX_MS,
  GRAVITY,
  MAX_JUMPS,
} from "./adventureConstants";
import {
  type Trap,
  createTrap,
  pickTrapKind,
  getNextSpawnDelay,
} from "./adventureTrap";
import {
  ADVENTURE_PLAYER_FRAME_PATHS,
  startAdventureAssetPreload,
} from "./adventureAssets";

const submitAdventureBestScore = (bestScore: number) => {
  fetchWithAuth(`/adventure/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bestScore }),
  }).catch((error) =>
    console.warn("Failed to save adventure best score", error),
  );
};

export function useAdventureGame() {
  const { token, isGuest } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [runState, setRunState] = useState<RunState>("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [displaySpeedTier, setDisplaySpeedTier] = useState(0);
  const [resultScore, setResultScore] = useState(0);
  const [stageScale, setStageScale] = useState(1);
  const [speedMessage, setSpeedMessage] = useState<string | null>(null);
  const [showIntroMessage, setShowIntroMessage] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Refs for per-frame state — bypasses React re-renders
  const scoreRef = useRef(0);
  const renderCallbackRef = useRef<(() => void) | null>(null);
  const prevScoreRef = useRef(-1);
  const prevDisplaySpeedTierRef = useRef(-1);

  const isMobileRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const speedMessageTimeoutRef = useRef<number | null>(null);
  const introMessageTimeoutRef = useRef<number | null>(null);
  const currentScoreRef = useRef(0);
  const jumpHeldRef = useRef(false);
  const jumpHeldStartRef = useRef(0);
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
  const preciseScoreRef = useRef(0);
  const achievementAwardRequestedRef = useRef(false);
  const lastAnnouncedSpeedTierRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawBestScore = window.localStorage.getItem(ADVENTURE_BEST_SCORE_KEY);
    const parsed = Number(rawBestScore);
    if (Number.isFinite(parsed) && parsed >= 0) {
      setBestScore(parsed);
    }
  }, []);

  useEffect(() => {
    if (isGuest || !token) return;

    const fetchBestScore = async () => {
      try {
        const response = await fetchWithAuth(`/adventure/score`);
        if (!response.ok) return;

        const serverBestScore = await response.json();
        if (
          typeof serverBestScore !== "number" ||
          !Number.isFinite(serverBestScore)
        ) {
          return;
        }

        setBestScore((currentBestScore) =>
          Math.max(currentBestScore, serverBestScore),
        );
      } catch (error) {
        console.warn("Failed to fetch adventure best score", error);
      }
    };

    void fetchBestScore();
  }, [isGuest, token]);

  useEffect(() => {
    startAdventureAssetPreload();
  }, []);

  useLayoutEffect(() => {
    const element = stageViewportRef.current;
    if (!element) return;

    const updateScale = () => {
      const rect = element.getBoundingClientRect();
      const nextScale = Math.max(rect.width / WORLD_WIDTH, 0.25);
      setStageScale((current) =>
        Math.abs(current - nextScale) < 0.001 ? current : nextScale,
      );
      const nextIsMobile = window.innerWidth < 640;
      isMobileRef.current = nextIsMobile;
      setIsMobile(nextIsMobile);
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
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ADVENTURE_BEST_SCORE_KEY, String(bestScore));
  }, [bestScore]);

  const resetStage = useCallback(() => {
    elapsedMsRef.current = 0;
    currentScoreRef.current = 0;
    playerYRef.current = 0;
    velocityRef.current = 0;
    jumpsLeftRef.current = MAX_JUMPS;
    trapsRef.current = [];
    spawnDelayRef.current = 0.95;
    playerFrameRef.current = 0;
    frameElapsedRef.current = 0;
    preciseScoreRef.current = 0;
    lastTimestampRef.current = null;
    achievementAwardRequestedRef.current = false;
    lastAnnouncedSpeedTierRef.current = 0;
    jumpHeldRef.current = false;
    scoreRef.current = 0;
    prevScoreRef.current = -1;
    prevDisplaySpeedTierRef.current = -1;

    if (introMessageTimeoutRef.current != null) {
      window.clearTimeout(introMessageTimeoutRef.current);
    }

    setScore(0);
    setDisplaySpeedTier(0);
    setSpeedMessage(null);
    setShowIntroMessage(true);
  }, []);

  useEffect(() => {
    return () => {
      if (speedMessageTimeoutRef.current != null) {
        window.clearTimeout(speedMessageTimeoutRef.current);
      }
      if (introMessageTimeoutRef.current != null) {
        window.clearTimeout(introMessageTimeoutRef.current);
      }
    };
  }, []);

  const awardLegendAchievement = useCallback(async () => {
    if (achievementAwardRequestedRef.current || isGuest || !token) return;
    achievementAwardRequestedRef.current = true;

    try {
      const response = await fetchWithAuth(
        `/achievements/award/${R_GEND_HERO_CODE}`,
        { method: "POST" },
      );
      if (!response.ok) return;

      const awardResult = await parseAchievementAwardResponse(response);
      if (!awardResult?.awarded) return;

      window.dispatchEvent(
        new CustomEvent("achievement-unlocked", {
          detail: { code: R_GEND_HERO_CODE },
        }),
      );
      addAchievementToast(addToast, awardResult.achievement);
    } catch (error) {
      console.error("Failed to award adventure achievement", error);
    }
  }, [addToast, isGuest, token]);

  const finishRun = useCallback(
    (finalScore: number) => {
      runStateRef.current = "gameover";
      setRunState("gameover");
      setResultScore(finalScore);
      setBestScore((currentBest) =>
        finalScore > currentBest ? finalScore : currentBest,
      );

      if (token && !isGuest) {
        submitAdventureBestScore(finalScore);
      }

      if (finalScore >= 1000 && token && !isGuest) {
        void awardLegendAchievement();
      }
    },
    [awardLegendAchievement, isGuest, token],
  );

  const startGame = useCallback(() => {
    resetStage();
    runStateRef.current = "running";
    setRunState("running");
    introMessageTimeoutRef.current = window.setTimeout(() => {
      setShowIntroMessage(false);
    }, 5000);
  }, [resetStage]);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  const pauseGame = useCallback(() => {
    if (runStateRef.current !== "running") return;
    runStateRef.current = "paused";
    setRunState("paused");
    lastTimestampRef.current = null;
  }, []);

  const resumeGame = useCallback(() => {
    if (runStateRef.current !== "paused") return;
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
    if (runStateRef.current !== "running" || jumpsLeftRef.current <= 0) return;
    const effectiveMaxJumps = currentScoreRef.current < 1000 ? 1 : MAX_JUMPS;
    if (MAX_JUMPS - jumpsLeftRef.current >= effectiveMaxJumps) return;

    const verticalScale = isMobileRef.current ? MOBILE_WORLD_SCALE : 1;
    velocityRef.current = JUMP_VELOCITY * verticalScale;
    jumpsLeftRef.current -= 1;
    jumpHeldRef.current = true;
    jumpHeldStartRef.current = performance.now();
  }, []);

  const releaseJump = useCallback(() => {
    jumpHeldRef.current = false;
  }, []);

  const handleStagePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-ui-control='true']")) return;
      jump();
    },
    [jump],
  );

  const handleStagePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-ui-control='true']")) return;
      releaseJump();
    },
    [releaseJump],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      if (event.code === "Space" || event.code === "ArrowUp") {
        if (runStateRef.current !== "running") return;
        event.preventDefault();
        jump();
      }

      if (event.code === "KeyP") {
        event.preventDefault();
        togglePause();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        releaseJump();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [jump, releaseJump, togglePause]);

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

      const frameDeltaSeconds = Math.min(
        (timestamp - lastTimestampRef.current) / 1000,
        0.12,
      );
      lastTimestampRef.current = timestamp;
      let collided = false;
      let remainingDeltaSeconds = frameDeltaSeconds;

      // Per-frame constants — invariant across sub-steps
      const isMobile = isMobileRef.current;
      const verticalScale = isMobile ? MOBILE_WORLD_SCALE : 1;
      const trapScale = isMobile ? TRAP_MOBILE_SCALE : 1;
      const playerScale = isMobile ? PLAYER_MOBILE_SCALE : 1;
      const scaledPlayerWidth = PLAYER_WIDTH * playerScale;
      const scaledPlayerHeight = PLAYER_HEIGHT * playerScale;
      const playerVisualLeft =
        PLAYER_X + (PLAYER_WIDTH - scaledPlayerWidth) / 2;
      const playerHInset =
        (scaledPlayerWidth * (1 - PLAYER_HITBOX_WIDTH_RATIO)) / 2;
      const playerHitboxWidth = scaledPlayerWidth * PLAYER_HITBOX_WIDTH_RATIO;
      const playerLeftTrim = isMobile ? playerHitboxWidth * 0.5 : 0;
      const playerLeft = playerVisualLeft + playerHInset + playerLeftTrim;
      const playerRight = playerVisualLeft + scaledPlayerWidth - playerHInset;

      while (remainingDeltaSeconds > 0 && !collided) {
        const deltaSeconds = Math.min(remainingDeltaSeconds, 1 / 60);
        remainingDeltaSeconds -= deltaSeconds;

        elapsedMsRef.current += deltaSeconds * 1000;

        const speedTier = Math.floor(currentScoreRef.current / 100);
        const scrollSpeed = BASE_SCROLL_SPEED + speedTier * SCROLL_SPEED_STEP;

        preciseScoreRef.current += (scrollSpeed * deltaSeconds) / 32;
        currentScoreRef.current = Math.floor(preciseScoreRef.current / 10) * 10;

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

        if (jumpHeldRef.current && velocityRef.current > 0) {
          const holdMs = timestamp - jumpHeldStartRef.current;
          if (holdMs < JUMP_HOLD_MAX_MS) {
            velocityRef.current +=
              JUMP_HOLD_BOOST * verticalScale * deltaSeconds;
          }
        }

        if (playerYRef.current > 0 || velocityRef.current > 0) {
          playerYRef.current += velocityRef.current * deltaSeconds;
          velocityRef.current -= GRAVITY * verticalScale * deltaSeconds;
          if (playerYRef.current <= 0) {
            playerYRef.current = 0;
            velocityRef.current = 0;
            jumpsLeftRef.current = MAX_JUMPS;
            jumpHeldRef.current = false;
          }
        }

        spawnDelayRef.current -= deltaSeconds;
        if (spawnDelayRef.current <= 0) {
          const kind = pickTrapKind(speedTier);
          trapsRef.current.push(
            createTrap(trapIdRef.current, kind, speedTier, isMobile),
          );
          trapIdRef.current += 1;
          spawnDelayRef.current = getNextSpawnDelay(speedTier);
        }

        // Mutate trap x in place — avoids per-frame object/array allocation
        const traps = trapsRef.current;
        let wi = 0;
        for (let i = 0; i < traps.length; i++) {
          traps[i].x -= scrollSpeed * deltaSeconds;
          if (traps[i].x + traps[i].width > -48) {
            traps[wi++] = traps[i];
          }
        }
        traps.length = wi;

        const playerHitboxBottom =
          playerYRef.current +
          PLAYER_GROUND_OFFSET +
          scaledPlayerHeight * PLAYER_HITBOX_BOTTOM_OFFSET_RATIO;
        const playerHitboxTop =
          playerHitboxBottom + scaledPlayerHeight * PLAYER_HITBOX_HEIGHT_RATIO;

        collided = traps.some((trap) => {
          const scaledWidth = trap.width * trapScale;
          const scaledHeight = trap.height * trapScale;
          const trapVisualLeft = trap.x + (trap.width - scaledWidth) / 2;
          const trapHitboxLeft =
            trapVisualLeft +
            scaledWidth * TRAP_HITBOX_HORIZONTAL_INSET_RATIO_MOBILE;
          const trapHitboxRight =
            trapVisualLeft +
            scaledWidth * (1 - TRAP_HITBOX_HORIZONTAL_INSET_RATIO_MOBILE);
          const trapHitboxBottom =
            trap.bottomFromGround +
            scaledHeight * TRAP_HITBOX_BOTTOM_OFFSET_RATIO_MOBILE;
          const trapHitboxTop =
            trapHitboxBottom + scaledHeight * TRAP_HITBOX_HEIGHT_RATIO_MOBILE;

          if (trapHitboxLeft >= playerRight || trapHitboxRight <= playerLeft)
            return false;
          return (
            playerHitboxBottom < trapHitboxTop &&
            playerHitboxTop > trapHitboxBottom
          );
        });
      }

      const nextScore = currentScoreRef.current;
      const speedTier = Math.floor(nextScore / 100);

      // Update scoreRef for direct DOM use in scene
      scoreRef.current = nextScore;

      // Sync score/speedTier to React state only when value changes
      if (nextScore !== prevScoreRef.current) {
        prevScoreRef.current = nextScore;
        setScore(nextScore);
      }
      if (speedTier !== prevDisplaySpeedTierRef.current) {
        prevDisplaySpeedTierRef.current = speedTier;
        setDisplaySpeedTier(speedTier);
      }

      if (speedTier > 0 && speedTier > lastAnnouncedSpeedTierRef.current) {
        lastAnnouncedSpeedTierRef.current = speedTier;
        playerFrameRef.current = 0;
        frameElapsedRef.current = 0;
        setSpeedMessage(
          speedTier === 10 ? "2단 점프 봉인 해제!" : "좀 더 빠르게 달려볼까?",
        );
        if (speedMessageTimeoutRef.current != null) {
          window.clearTimeout(speedMessageTimeoutRef.current);
        }
        speedMessageTimeoutRef.current = window.setTimeout(() => {
          setSpeedMessage(null);
        }, 3000);
      }

      // Drive scene DOM updates directly — no React re-render
      renderCallbackRef.current?.();

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

  const introInstructionMessage =
    runState === "running"
      ? (speedMessage ??
        (showIntroMessage ? "탭, 클릭, 스페이스바로 점프" : null))
      : null;

  return {
    runState,
    score,
    bestScore,
    displaySpeedTier,
    resultScore,
    stageScale,
    introInstructionMessage,
    stageViewportRef,
    isMobile,
    // Refs for direct DOM scene updates
    playerYRef,
    playerFrameRef,
    trapsRef,
    scoreRef,
    renderCallbackRef,
    isMobileRef,
    runStateRef,
    startGame,
    restartGame,
    resumeGame,
    togglePause,
    handleStagePointerDown,
    handleStagePointerUp,
  };
}
