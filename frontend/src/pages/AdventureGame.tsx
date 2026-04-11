import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Application } from "@pixi/react";
import { GameContainer } from "../components/common/GameContainer";
import { ScoreStatCard } from "../components/common/ScoreStatCard";
import {
  AdventureModal,
  type AdventureModalAction,
} from "../components/game/adventure/AdventureModal";
import { AdventureGamePanel } from "../components/game/adventure/AdventureGamePanel";
import { AdventureGamePanelMobile } from "../components/game/adventure/AdventureGamePanelMobile";
import { AdventurePhaseGuide } from "../components/game/adventure/AdventurePhaseGuide";
import { ADVENTURE_HELP_SLIDES } from "../constants/tutorialSlides";
import {
  type AdventureGameOverReason,
  type AdventureRunnerSnapshot,
  type RunState,
} from "../types/adventure";
import { RunnerScene } from "../features/adventure/adventureGameCore";
import { RunnerSceneMobile } from "../features/adventure/adventureGameCoreMobile";
import {
  ADVENTURE_BEST_SCORE_KEY,
  ADVENTURE_SERVER_STAGE_KEY,
  ADVENTURE_PHASES,
  TOTAL_DURATION,
  YOUTUBE_VIDEO_ID,
  clamp,
  getClearedPhaseId,
  getPhaseAtTime,
  getRetryPhase,
} from "../features/adventure/adventureGameShared";
import { useAuthStore } from "../store/useAuthStore";
import { fetchWithAuth } from "../utils/api";

type AdventurePlayerInstance = {
  destroy: () => void;
  getCurrentTime: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  setVolume: (volume: number) => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
};

type AdventureYouTubeNamespace = {
  Player: new (
    elementId: string | HTMLElement,
    config: {
      height?: number | string;
      width?: number | string;
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (event: { target: AdventurePlayerInstance }) => void;
      };
    },
  ) => AdventurePlayerInstance;
};

type AdventureYouTubeWindow = Window & {
  YT?: AdventureYouTubeNamespace;
  onYouTubeIframeAPIReady?: () => void;
};

export default function AdventureGame() {
  const musicPlayerRef = useRef<AdventurePlayerInstance | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingMusicStartRef = useRef(false);
  const pendingMusicStartTimeRef = useRef(0);
  const seekTimestampRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const courseTimeSyncActiveRef = useRef(false);
  const stageViewportRef = useRef<HTMLDivElement | null>(null);
  const courseTimeRef = useRef(0);
  const [runState, setRunState] = useState<RunState>("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [pausedScore, setPausedScore] = useState(0);
  const [resultScore, setResultScore] = useState(0);
  const [jumpNonce, setJumpNonce] = useState(0);
  const [restartNonce, setRestartNonce] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [hudCourseTime, setHudCourseTime] = useState(0);
  const [retryStartTime, setRetryStartTime] = useState(0);
  const [volume, setVolume] = useState(55);
  const [debugUnlockAll, setDebugUnlockAll] = useState(false);
  const [maxClearedPhaseId, setMaxClearedPhaseId] = useState(0);
  const serverStageRef = useRef(0);
  const { isGuest } = useAuthStore();
  const [gameOverReason, setGameOverReason] =
    useState<AdventureGameOverReason>("pit");
  const [stageViewportSize, setStageViewportSize] = useState({
    width: 0,
    height: 0,
  });
  const volumeRef = useRef(55);
  const liveScoreRef = useRef(0);
  const desktopSceneSnapshotRef = useRef<AdventureRunnerSnapshot | null>(null);
  const mobileSceneSnapshotRef = useRef<AdventureRunnerSnapshot | null>(null);
  const youtubeWindow =
    typeof window === "undefined"
      ? undefined
      : (window as AdventureYouTubeWindow);

  const resolution = useMemo(
    () =>
      typeof window === "undefined"
        ? 1
        : Math.min(window.devicePixelRatio || 1, 2),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined" || isGuest) {
      return;
    }

    const cached = window.localStorage.getItem(ADVENTURE_SERVER_STAGE_KEY);
    const cachedStage = Number(cached);
    if (Number.isFinite(cachedStage) && cachedStage > 0) {
      serverStageRef.current = cachedStage;
      setMaxClearedPhaseId((prev) => Math.max(prev, cachedStage));
      return;
    }

    fetchWithAuth("/adventure/stage")
      .then((res) => (res.ok ? res.json() : 0))
      .then((stage: unknown) => {
        const resolved = typeof stage === "number" && stage > 0 ? stage : 0;
        serverStageRef.current = resolved;
        window.localStorage.setItem(
          ADVENTURE_SERVER_STAGE_KEY,
          String(resolved),
        );
        setMaxClearedPhaseId((prev) => Math.max(prev, resolved));
      })
      .catch(() => {});
  }, [isGuest]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rawBestScore = window.localStorage.getItem(ADVENTURE_BEST_SCORE_KEY);
    const parsed = Number(rawBestScore);
    if (Number.isFinite(parsed) && parsed >= 0) {
      setBestScore(parsed);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(ADVENTURE_BEST_SCORE_KEY, String(bestScore));
  }, [bestScore]);

  useLayoutEffect(() => {
    const element = stageViewportRef.current;
    if (!element) {
      return;
    }

    const updateStageViewportSize = () => {
      // Use the larger of layout and rendered box sizes so aspect-ratio layouts
      // do not round canvas dimensions down and leave a 1px gap on one edge.
      const rect = element.getBoundingClientRect();
      const nextWidth = Math.max(
        1,
        Math.ceil(Math.max(element.offsetWidth, rect.width)),
      );
      const nextHeight = Math.max(
        1,
        Math.ceil(Math.max(element.offsetHeight, rect.height)),
      );
      setStageViewportSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      );
    };

    updateStageViewportSize();
    // Double RAF: iOS Safari can report 0 on the first animation frame after mount.
    let cancelled = false;
    const rafId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      updateStageViewportSize();
      window.requestAnimationFrame(() => {
        if (!cancelled) updateStageViewportSize();
      });
    });

    const observer = new ResizeObserver(updateStageViewportSize);
    observer.observe(element);
    window.addEventListener("resize", updateStageViewportSize);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateStageViewportSize);
      observer.disconnect();
    };
  }, [isMobileViewport]);

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
    const div = document.createElement("div");
    div.setAttribute("aria-hidden", "true");
    div.style.cssText =
      "position:fixed;left:-9999px;top:0;height:1px;width:1px;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(div);
    ytContainerRef.current = div;

    return () => {
      ytContainerRef.current = null;
      if (div.parentNode) {
        div.parentNode.removeChild(div);
      }
    };
  }, []);

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

    if (!ytContainerRef.current) {
      return;
    }

    musicPlayerRef.current = new youtubeWindow.YT.Player(
      ytContainerRef.current,
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
            const player = event.target as AdventurePlayerInstance;
            setPlayerReady(true);
            player.setVolume(volumeRef.current);

            if (pendingMusicStartRef.current) {
              player.seekTo(pendingMusicStartTimeRef.current, true);
              player.playVideo();
              seekTimestampRef.current = performance.now();
              pendingMusicStartRef.current = false;
            }
          },
        },
      },
    ) as AdventurePlayerInstance;

    return () => {
      musicPlayerRef.current?.destroy();
      musicPlayerRef.current = null;
    };
  }, [apiReady, youtubeWindow]);

  const playMusicFromTime = useCallback(
    (seconds: number) => {
      pendingMusicStartRef.current = true;
      pendingMusicStartTimeRef.current = clamp(seconds, 0, TOTAL_DURATION);

      if (!playerReady || !musicPlayerRef.current) {
        return;
      }

      musicPlayerRef.current.seekTo(pendingMusicStartTimeRef.current, true);
      musicPlayerRef.current.playVideo();
      seekTimestampRef.current = performance.now();
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
      // Layout should follow viewport width, not input hardware.
      // Touch-enabled laptops/desktops can report a coarse pointer and
      // accidentally get the mobile-only game canvas.
      setIsMobileViewport(window.innerWidth < 1024);
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
      desktopSceneSnapshotRef.current = null;
      mobileSceneSnapshotRef.current = null;
      liveScoreRef.current = 0;
      setGameOverReason("pit");
      setScore(0);
      setPausedScore(0);
      setResultScore(0);
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
        const resolvedScore = Math.max(liveScoreRef.current, score);
        courseTimeSyncActiveRef.current = false;
        const currentMusicTime = musicPlayerRef.current?.getCurrentTime();
        const resolvedCourseTime = clamp(
          Number.isFinite(currentMusicTime ?? Number.NaN)
            ? (currentMusicTime as number)
            : courseTimeRef.current,
          0,
          TOTAL_DURATION,
        );
        liveScoreRef.current = resolvedScore;
        setScore(resolvedScore);
        setPausedScore(resolvedScore);
        setHudCourseTime(resolvedCourseTime);
        pauseMusic();
        return "paused";
      }
      if (current === "paused") {
        musicPlayerRef.current?.playVideo();
        return "running";
      }
      return current;
    });
  }, [pauseMusic, score]);

  const handleScoreChange = useCallback((nextScore: number) => {
    liveScoreRef.current = nextScore;
    setScore((current) => (current === nextScore ? current : nextScore));
  }, []);

  const handleDesktopSceneSnapshotChange = useCallback(
    (snapshot: AdventureRunnerSnapshot) => {
      desktopSceneSnapshotRef.current = snapshot;
    },
    [],
  );

  const handleMobileSceneSnapshotChange = useCallback(
    (snapshot: AdventureRunnerSnapshot) => {
      mobileSceneSnapshotRef.current = snapshot;
    },
    [],
  );

  const postAdventureStage = useCallback(
    (clearedPhaseId: number) => {
      if (isGuest || clearedPhaseId <= serverStageRef.current) {
        return;
      }
      serverStageRef.current = clearedPhaseId;
      window.localStorage.setItem(
        ADVENTURE_SERVER_STAGE_KEY,
        String(clearedPhaseId),
      );
      fetchWithAuth("/adventure/stage", {
        method: "POST",
        body: JSON.stringify({ stage: clearedPhaseId }),
      }).catch(() => {});
    },
    [isGuest],
  );

  const handleGameOver = useCallback(
    (endedScore: number, reason: AdventureGameOverReason) => {
      const resolvedScore = Math.max(endedScore, liveScoreRef.current, score);
      const currentMusicTime = musicPlayerRef.current?.getCurrentTime();
      const resolvedCourseTime = clamp(
        Number.isFinite(currentMusicTime ?? Number.NaN)
          ? (currentMusicTime as number)
          : courseTimeRef.current,
        0,
        TOTAL_DURATION,
      );
      const nextRetryPhase = getRetryPhase(resolvedCourseTime);
      const clearedPhaseId = getClearedPhaseId(resolvedCourseTime);

      pauseMusic();
      liveScoreRef.current = resolvedScore;
      setGameOverReason(reason);
      setScore(resolvedScore);
      setResultScore(resolvedScore);
      setBestScore((current) => Math.max(current, resolvedScore));
      setHudCourseTime(resolvedCourseTime);
      setRetryStartTime(nextRetryPhase.start);
      setMaxClearedPhaseId((prev) => {
        const next = Math.max(prev, clearedPhaseId);
        postAdventureStage(next);
        return next;
      });
      setRunState("gameover");
    },
    [pauseMusic, postAdventureStage, score],
  );

  const handleGameComplete = useCallback(
    (clearedScore: number) => {
      const resolvedScore = Math.max(clearedScore, liveScoreRef.current, score);
      const finalPhaseId = ADVENTURE_PHASES[ADVENTURE_PHASES.length - 1].id;
      pauseMusic();
      desktopSceneSnapshotRef.current = null;
      mobileSceneSnapshotRef.current = null;
      liveScoreRef.current = resolvedScore;
      setScore(resolvedScore);
      setResultScore(resolvedScore);
      setBestScore((current) => Math.max(current, resolvedScore));
      setHudCourseTime(TOTAL_DURATION);
      setRetryStartTime(ADVENTURE_PHASES[ADVENTURE_PHASES.length - 1].start);
      setMaxClearedPhaseId((prev) => {
        const next = Math.max(prev, finalPhaseId);
        postAdventureStage(next);
        return next;
      });
      setRunState("completed");
    },
    [pauseMusic, postAdventureStage, score],
  );

  useEffect(() => {
    if (runState === "ready") {
      pauseMusic();
    }
  }, [pauseMusic, runState]);

  useEffect(() => {
    if (runState !== "running") {
      courseTimeSyncActiveRef.current = false;
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    courseTimeSyncActiveRef.current = true;
    const syncCourseTime = () => {
      if (!courseTimeSyncActiveRef.current) {
        return;
      }

      const seekCooldownActive =
        performance.now() - seekTimestampRef.current < 300;
      const playerTime = seekCooldownActive
        ? undefined
        : musicPlayerRef.current?.getCurrentTime();
      const nextTime = clamp(
        Number.isFinite(playerTime ?? Number.NaN)
          ? (playerTime as number)
          : courseTimeRef.current,
        0,
        TOTAL_DURATION,
      );

      if (nextTime >= TOTAL_DURATION - 0.05) {
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
      courseTimeSyncActiveRef.current = false;
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [handleGameComplete, runState]);

  const triggerJump = useCallback(() => {
    setJumpNonce((value) => value + 1);
  }, []);

  const readyModalActions: AdventureModalAction[] = [
    {
      label: "게임 시작하기",
      onClick: () => startGame(retryStartTime),
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

  const handlePhaseStart = useCallback((startTime: number) => {
    setRetryStartTime(startTime);
    setHudCourseTime(startTime);
  }, []);

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

  useEffect(() => {
    const stageElement = stageViewportRef.current;
    if (!stageElement) {
      return;
    }

    const handleNativePointerDown = (event: PointerEvent) => {
      event.preventDefault();

      if (runState === "running") {
        triggerJump();
      }
    };

    stageElement.addEventListener("pointerdown", handleNativePointerDown, {
      passive: false,
    });

    return () => {
      stageElement.removeEventListener("pointerdown", handleNativePointerDown);
    };
  }, [runState, triggerJump]);

  const displayTime =
    runState === "gameover" || runState === "completed"
      ? hudCourseTime
      : runState === "ready"
        ? retryStartTime
        : hudCourseTime;
  const activePhase = getPhaseAtTime(displayTime);
  const activePhaseId = activePhase.id;
  const unlockedPhaseId = Math.min(
    maxClearedPhaseId + 1,
    ADVENTURE_PHASES.length,
  );
  const maxUnlockedPhaseId = debugUnlockAll
    ? ADVENTURE_PHASES.length
    : unlockedPhaseId;
  const canSelectPhase = runState === "ready" || runState === "gameover";
  const introOverlayFadeProgress = clamp((displayTime - 20) / 1.4, 0, 1);
  const introOverlayOpacity =
    activePhaseId === 1 ? 1 - introOverlayFadeProgress : 0;
  const showMapVolumeUi =
    !isMobileViewport && activePhaseId === 1 && introOverlayOpacity > 0;
  const introInstructionMessage =
    activePhaseId === 1 && displayTime < 10
      ? "볼륨을 알맞게 조절해줘"
      : activePhaseId === 1 && displayTime < 15
        ? isMobileViewport
          ? "화면을 탭해서 점프!"
          : "화면을 탭하거나 스페이스바를 눌러 점프할 수 있어"
        : activePhaseId === 1 && displayTime < 20
          ? isMobileViewport
            ? "일시정지 버튼을 누르면 쉴 수 있어"
            : "P 키/일시정지 버튼을 누르면 쉴 수 있어"
          : displayTime >= 277 && displayTime < 282
            ? "치코의 의지가 깃듭니다... 3단 점프 봉인 해제"
            : null;
  const introMessageOpacity =
    activePhaseId === 1 ? introOverlayOpacity : introInstructionMessage ? 1 : 0;

  const renderVolumeControls = (compact = false) =>
    isMobileViewport ? null : (
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
            {isMobileViewport ? "" : "Volume"}
          </span>
          <span className="text-sm font-black text-[#102542]">{volume}</span>
        </div>
        {isMobileViewport ? null : (
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
        )}
      </div>
    );

  const overlayModal =
    runState === "ready" ? (
      <AdventureModal
        embedded
        title="용사 리코 이야기"
        status="준비 됐어?"
        description="모험을 떠나볼까?"
        actions={readyModalActions}
      >
        {renderVolumeControls(true)}
      </AdventureModal>
    ) : runState === "paused" ? (
      <AdventureModal
        embedded
        title={`Score ${pausedScore}`}
        status="용사에게도 휴식이 필요해"
        description="다시 마왕을 무찌르러 가볼까?"
        actions={pauseModalActions}
      >
        {isMobileViewport ? null : renderVolumeControls(true)}
      </AdventureModal>
    ) : runState === "gameover" ? (
      <AdventureModal
        embedded
        status={
          gameOverReason === "slime"
            ? "리코는 슬라임 싫어해"
            : gameOverReason === "magic"
              ? "함정이라니 비겁하다!"
              : gameOverReason === "lava"
                ? "용암에 빠졌어"
                : gameOverReason === "laser"
                  ? "마왕의 공격에 당했어"
                  : "함정에 빠졌어..."
        }
        title={`Score ${resultScore}`}
        description={
          gameOverReason === "slime"
            ? "웩... 끈적끈적해..."
            : gameOverReason === "magic"
              ? "마왕녀석, 정정당당하게 싸워라!!"
              : gameOverReason === "lava"
                ? "꺄아악!! 뜨거워!!!"
                : gameOverReason === "laser"
                  ? "용사는 포기하지 않아!"
                  : "거기 누구 없어요? 도와주세요!!"
        }
        actions={gameOverModalActions}
      >
        {renderVolumeControls(true)}
      </AdventureModal>
    ) : runState === "completed" ? (
      <AdventureModal
        embedded
        status="배경음악이 끝났어"
        title="THE END"
        description="용사 리코의 이야기가 해피엔딩으로 마무리됐어."
        actions={completedModalActions}
      >
        {renderVolumeControls(true)}
      </AdventureModal>
    ) : null;

  const scoreCards = (
    <div className="flex items-center gap-3">
      <ScoreStatCard
        label="Score"
        value={score}
        background="#102542"
        className={isMobileViewport ? "min-w-[76px]" : "min-w-[88px]"}
        valueClassName={isMobileViewport ? "text-lg" : "text-xl"}
      />
      <ScoreStatCard
        label="Best"
        value={bestScore}
        background="#5EC7A5"
        className={isMobileViewport ? "min-w-[76px]" : "min-w-[88px]"}
        labelClassName="opacity-80"
        valueClassName={isMobileViewport ? "text-lg" : "text-xl"}
      />
    </div>
  );

  return (
    <>
      <GameContainer
        title="용사 리코 이야기"
        desc="라떼는 말이야 검 하나로 마왕을 잡았다고"
        gameName="용사 리코 이야기"
        helpSlides={ADVENTURE_HELP_SLIDES}
        className="relative overflow-hidden bg-[#f7f2e8] text-[#1d3557] select-none"
        mainClassName={
          isMobileViewport
            ? "px-3 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] sm:px-4"
            : "px-4 pb-8 sm:px-6 lg:px-8"
        }
        headerRight={isMobileViewport ? null : scoreCards}
      >
        <div
          className={`mx-auto flex w-full flex-col ${
            isMobileViewport ? "max-w-[23rem] gap-4" : "max-w-[62rem] gap-6"
          }`}
        >
          {isMobileViewport ? (
            <div className="flex justify-center">{scoreCards}</div>
          ) : null}
          <section className="flex flex-col gap-5">
            {isMobileViewport ? (
              <AdventureGamePanelMobile
                runState={runState}
                introInstructionMessage={introInstructionMessage}
                introMessageOpacity={introMessageOpacity}
                onPauseToggle={handlePauseToggle}
                overlayModal={overlayModal}
                gameCanvas={
                  <div
                    ref={stageViewportRef}
                    className="absolute inset-0 overflow-hidden [&_canvas]:!h-full [&_canvas]:!w-full"
                  >
                    {stageViewportSize.width > 0 &&
                    stageViewportSize.height > 0 ? (
                      <Application
                        width={stageViewportSize.width}
                        height={stageViewportSize.height}
                        autoDensity
                        resolution={resolution}
                        antialias
                        backgroundAlpha={0}
                        className="block h-full w-full pointer-events-none"
                      >
                        <RunnerSceneMobile
                          stageWidth={stageViewportSize.width}
                          stageHeight={stageViewportSize.height}
                          runState={runState}
                          jumpNonce={jumpNonce}
                          restartNonce={restartNonce}
                          currentCourseTime={displayTime}
                          sceneSnapshot={mobileSceneSnapshotRef.current}
                          onSceneSnapshotChange={
                            handleMobileSceneSnapshotChange
                          }
                          onScoreChange={handleScoreChange}
                          onGameOver={handleGameOver}
                          onComplete={handleGameComplete}
                        />
                      </Application>
                    ) : null}
                  </div>
                }
              />
            ) : (
              <AdventureGamePanel
                runState={runState}
                introInstructionMessage={introInstructionMessage}
                introOverlayOpacity={introOverlayOpacity}
                introMessageOpacity={introMessageOpacity}
                showMapVolumeUi={showMapVolumeUi}
                onPauseToggle={handlePauseToggle}
                mapVolumeControls={renderVolumeControls()}
                overlayModal={overlayModal}
                gameCanvas={
                  <div
                    ref={stageViewportRef}
                    className="absolute inset-0 overflow-hidden [&_canvas]:!h-full [&_canvas]:!w-full"
                  >
                    {stageViewportSize.width > 0 &&
                    stageViewportSize.height > 0 ? (
                      <Application
                        width={stageViewportSize.width}
                        height={stageViewportSize.height}
                        autoDensity
                        resolution={resolution}
                        antialias
                        backgroundAlpha={0}
                        className="block h-full w-full pointer-events-none"
                      >
                        <RunnerScene
                          stageWidth={stageViewportSize.width}
                          stageHeight={stageViewportSize.height}
                          runState={runState}
                          jumpNonce={jumpNonce}
                          restartNonce={restartNonce}
                          currentCourseTime={displayTime}
                          sceneSnapshot={desktopSceneSnapshotRef.current}
                          onSceneSnapshotChange={
                            handleDesktopSceneSnapshotChange
                          }
                          onScoreChange={handleScoreChange}
                          onGameOver={handleGameOver}
                          onComplete={handleGameComplete}
                        />
                      </Application>
                    ) : null}
                  </div>
                }
              />
            )}

            <AdventurePhaseGuide
              phases={ADVENTURE_PHASES.map((phase) => ({
                id: phase.id,
                start: phase.start,
              }))}
              activePhaseId={activePhaseId}
              maxUnlockedPhaseId={maxUnlockedPhaseId}
              canSelectPhase={canSelectPhase}
              onDebugUnlockAll={handleDebugUnlockAll}
              onPhaseStart={handlePhaseStart}
            />
          </section>
        </div>
      </GameContainer>
    </>
  );
}
