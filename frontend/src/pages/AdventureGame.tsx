import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameContainer } from "../components/common/GameContainer";
import type { TutorialSlide } from "../components/common/TutorialBanner";
import { BASE_URL } from "../utils/api";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type PlayerInstance = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
};

type PlayerStateValue = -1 | 0 | 1 | 2 | 3 | 5;

type YouTubeNamespace = {
  Player: new (
    elementId: string,
    config: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (event: { target: PlayerInstance }) => void;
        onStateChange?: (event: {
          data: PlayerStateValue;
          target: PlayerInstance;
        }) => void;
      };
    },
  ) => PlayerInstance;
};

type Phase = {
  id: number;
  title: string;
  start: number;
  end: number;
  theme: string;
  sky: string;
  accent: string;
  description: string;
};

type Obstacle = {
  key: string;
  emoji: string;
  time: number;
  type: "ground" | "flare";
  size: string;
};

type RunState = "ready" | "running" | "gameover" | "completed";

const BEST_SCORE_KEY = "rico-adventure-best-score";
const YOUTUBE_VIDEO_ID = "J3B0k47f0Fs";
const COURSE_LENGTH = 440;
const PLAYER_X = 72;
const PIXELS_PER_SECOND = 92;
const JUMP_VELOCITY = 1080;
const DOUBLE_JUMP_VELOCITY = 980;
const GRAVITY = 2800;
const GROUND_SAFE_HEIGHT = 82;
const FLARE_COLLISION_HEIGHT = 124;
const DOUBLE_TAP_WINDOW_MS = 260;

const ADVENTURE_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "🎼 스타트 규칙",
    lines: [
      "Play를 누르면 음악이 시작되고 재생 잠금이 켜집니다.",
      "도전 중에는 일시정지, 시크, 스테이지 스킵을 할 수 없어요.",
    ],
    showArrows: false,
  },
  {
    title: "🦘 점프 조작",
    lines: [
      "코스 화면을 클릭하거나 터치하면 점프합니다.",
      "공중에서 빠르게 한 번 더 누르면 더블 점프가 발동합니다.",
    ],
    showArrows: false,
  },
  {
    title: "💾 세이브 포인트",
    lines: [
      "각 Phase를 끝까지 살아남으면 다음 Phase 체크포인트가 열립니다.",
      "게임 오버 후 열린 체크포인트에서 재도전할 수 있습니다.",
    ],
    showArrows: false,
  },
];

const PHASES: Phase[] = [
  {
    id: 1,
    title: "Phase 1",
    start: 0,
    end: 39,
    theme: "오프닝",
    sky: "from-[#f9d8c2] via-[#f4f0d0] to-[#d4f0e2]",
    accent: "#9c6644",
    description: "용사 리코의 옛날이야기가 천천히 시작됩니다.",
  },
  {
    id: 2,
    title: "Phase 2",
    start: 39,
    end: 121,
    theme: "출정",
    sky: "from-[#f6c177] via-[#f9e2af] to-[#b8e0d2]",
    accent: "#b85c38",
    description: "긴 여정을 향해 첫 발을 내딛는 구간입니다.",
  },
  {
    id: 3,
    title: "Phase 3",
    start: 121,
    end: 214,
    theme: "숲",
    sky: "from-[#87b37a] via-[#d9ed92] to-[#f1f7d5]",
    accent: "#386641",
    description: "햇살이 스며드는 숲과 들판을 달립니다.",
  },
  {
    id: 4,
    title: "Phase 4",
    start: 214,
    end: 282,
    theme: "던전",
    sky: "from-[#283046] via-[#3d405b] to-[#111827]",
    accent: "#e07a5f",
    description: "마왕의 성 내부로 들어가며 분위기가 급격히 어두워집니다.",
  },
  {
    id: 5,
    title: "Phase 5",
    start: 282,
    end: 310,
    theme: "결투",
    sky: "from-[#4a1010] via-[#9d0208] to-[#ffba08]",
    accent: "#ffd166",
    description: "짧고 거대한 결전. 모든 에너지가 한곳에 몰립니다.",
  },
  {
    id: 6,
    title: "Phase 6",
    start: 310,
    end: 388,
    theme: "승리",
    sky: "from-[#6ec6ff] via-[#bde0fe] to-[#d8f3dc]",
    accent: "#2a9d8f",
    description: "전투가 끝나고 평화로운 풍경이 다시 펼쳐집니다.",
  },
  {
    id: 7,
    title: "Phase 7",
    start: 388,
    end: 433,
    theme: "엔딩",
    sky: "from-[#1d3557] via-[#457b9d] to-[#f1faee]",
    accent: "#f1fa8c",
    description: "옛날이야기의 마지막 페이지가 닫힙니다.",
  },
];

const getCurrentPhase = (time: number): Phase =>
  PHASES.find((phase) => time >= phase.start && time < phase.end) ??
  PHASES[PHASES.length - 1];

const getVisibleObstacles = (time: number): Obstacle[] => {
  const visible: Obstacle[] = [];
  const aheadWindow = 6;
  const behindWindow = 1.2;

  PHASES.forEach((phase) => {
    const begin = Math.max(phase.start, time - behindWindow);
    const finish = Math.min(phase.end, time + aheadWindow);
    const step = phase.id >= 4 ? 1.35 : 2.05;
    const offset = phase.id * 0.41;

    for (
      let marker = phase.start + offset;
      marker < phase.end;
      marker += step
    ) {
      if (marker < begin || marker > finish) {
        continue;
      }

      const variant = Math.round(marker * 10) % 4;
      const type = variant === 3 ? "flare" : "ground";
      const emoji =
        phase.id <= 2
          ? type === "flare"
            ? "✨"
            : ["📜", "🪵", "🥁"][variant % 3]
          : phase.id === 3
            ? type === "flare"
              ? "🦋"
              : ["🌲", "🍃", "🌿"][variant % 3]
            : phase.id === 4
              ? type === "flare"
                ? "🔥"
                : ["🪨", "🕸️", "🦴"][variant % 3]
              : phase.id === 5
                ? type === "flare"
                  ? "💥"
                  : ["⚔️", "👑", "🛡️"][variant % 3]
                : type === "flare"
                  ? "⭐"
                  : ["🌼", "🎖️", "🕊️"][variant % 3];

      visible.push({
        key: `${phase.id}-${marker.toFixed(2)}`,
        emoji,
        time: marker,
        type,
        size: phase.id >= 5 ? "text-4xl" : "text-3xl",
      });
    }
  });

  return visible;
};

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remain = safeSeconds % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
};

const getSavedBestScore = (): number => {
  if (typeof window === "undefined") {
    return 0;
  }

  const saved = Number(window.localStorage.getItem(BEST_SCORE_KEY) ?? "0");
  return Number.isFinite(saved) ? saved : 0;
};

export default function AdventureGame() {
  const { token } = useAuthStore();
  const { addToast } = useToastStore();
  const playerRef = useRef<PlayerInstance | null>(null);
  const timelineRafRef = useRef<number | null>(null);
  const physicsRafRef = useRef<number | null>(null);
  const jumpYRef = useRef(0);
  const jumpVelocityRef = useRef(0);
  const lastPhysicsTsRef = useRef<number | null>(null);
  const passedObstacleKeysRef = useRef<Set<string>>(new Set());
  const phaseUnlocksRef = useRef<Set<number>>(new Set([1]));
  const intentionalPauseRef = useRef(false);
  const awardedCodesRef = useRef<Set<string>>(new Set());
  const attemptStartPhaseIdRef = useRef(1);
  const runStateRef = useRef<RunState>("ready");
  const timelineTimeRef = useRef(0);
  const timelineTickPrevTsRef = useRef<number | null>(null);
  const remainingAirJumpRef = useRef(1);
  const lastJumpInputTsRef = useRef(0);

  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerStateValue>(-1);
  const [runState, setRunState] = useState<RunState>("ready");
  const [timelineTime, setTimelineTime] = useState(0);
  const [duration, setDuration] = useState(433);
  const [jumpHeight, setJumpHeight] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => getSavedBestScore());
  const [successfulJumps, setSuccessfulJumps] = useState(0);
  const [unlockedPhaseIds, setUnlockedPhaseIds] = useState<number[]>([1]);
  const [selectedRetryPhaseId, setSelectedRetryPhaseId] = useState(1);
  const [attemptStartTime, setAttemptStartTime] = useState(0);
  const [deathMessage, setDeathMessage] = useState(
    "장애물에 부딪혀 여정이 중단되었습니다.",
  );

  const phase = useMemo(() => getCurrentPhase(timelineTime), [timelineTime]);
  const visibleObstacles = useMemo(
    () => getVisibleObstacles(timelineTime),
    [timelineTime],
  );
  const progress = Math.min(timelineTime / duration, 1);
  const isRunning = runState === "running";

  useEffect(() => {
    runStateRef.current = runState;
  }, [runState]);

  useEffect(() => {
    timelineTimeRef.current = timelineTime;
  }, [timelineTime]);

  useEffect(() => {
    if (window.YT?.Player) {
      setApiReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;

    const previousHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousHandler?.();
      setApiReady(true);
    };

    document.body.appendChild(script);

    return () => {
      window.onYouTubeIframeAPIReady = previousHandler;
    };
  }, []);

  useEffect(() => {
    if (!apiReady || playerRef.current || !window.YT?.Player) {
      return;
    }

    playerRef.current = new window.YT.Player("rico-adventure-player", {
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
          setDuration(Math.max(event.target.getDuration() || 0, 433));
        },
        onStateChange: (event) => {
          setPlayerState(event.data);

          if (
            event.data === 2 &&
            runStateRef.current === "running" &&
            !intentionalPauseRef.current
          ) {
            event.target.playVideo();
            return;
          }

          if (event.data === 0 && runStateRef.current === "running") {
            intentionalPauseRef.current = true;
            setRunState("completed");
          }
        },
      },
    });

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [apiReady]);

  useEffect(() => {
    const tick = (ts: number) => {
      const previousTs = timelineTickPrevTsRef.current ?? ts;
      const delta = Math.min((ts - previousTs) / 1000, 0.05);
      timelineTickPrevTsRef.current = ts;
      const player = playerRef.current;
      let nextTime = timelineTimeRef.current;

      if (player) {
        const playerTime = player.getCurrentTime() || 0;
        const playerAdvanced = playerTime > timelineTimeRef.current + 0.03;
        const trustPlayerClock =
          runStateRef.current !== "running" || playerAdvanced;
        nextTime = trustPlayerClock
          ? playerTime
          : timelineTimeRef.current + delta;
        setDuration(Math.max(player.getDuration() || 0, 433));
      } else if (runStateRef.current === "running") {
        nextTime = timelineTimeRef.current + delta;
      }

      if (runStateRef.current === "running") {
        nextTime = Math.min(nextTime, PHASES[PHASES.length - 1].end);
      }

      if (Math.abs(nextTime - timelineTimeRef.current) > 0.0001) {
        timelineTimeRef.current = nextTime;
        setTimelineTime(nextTime);
      }

      if (
        runStateRef.current === "running" &&
        nextTime >= PHASES[PHASES.length - 1].end
      ) {
        intentionalPauseRef.current = true;
        playerRef.current?.pauseVideo();
        setRunState("completed");
      }

      timelineRafRef.current = requestAnimationFrame(tick);
    };

    timelineRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (timelineRafRef.current !== null) {
        cancelAnimationFrame(timelineRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const tick = (ts: number) => {
      const previousTs = lastPhysicsTsRef.current ?? ts;
      const delta = Math.min((ts - previousTs) / 1000, 0.04);
      lastPhysicsTsRef.current = ts;

      if (runState === "running") {
        jumpVelocityRef.current -= GRAVITY * delta;
        jumpYRef.current = Math.max(
          0,
          jumpYRef.current + jumpVelocityRef.current * delta,
        );

        if (jumpYRef.current === 0 && jumpVelocityRef.current < 0) {
          jumpVelocityRef.current = 0;
          remainingAirJumpRef.current = 1;
        }

        setJumpHeight(jumpYRef.current);
      } else if (jumpYRef.current !== 0 || jumpVelocityRef.current !== 0) {
        jumpYRef.current = 0;
        jumpVelocityRef.current = 0;
        remainingAirJumpRef.current = 1;
        setJumpHeight(0);
      }

      physicsRafRef.current = requestAnimationFrame(tick);
    };

    physicsRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (physicsRafRef.current !== null) {
        cancelAnimationFrame(physicsRafRef.current);
      }
    };
  }, [runState]);

  useEffect(() => {
    if (runState !== "running") {
      return;
    }

    PHASES.forEach((item) => {
      if (timelineTime >= item.end) {
        const nextPhase = PHASES.find(
          (candidate) => candidate.id === item.id + 1,
        );
        if (nextPhase && !phaseUnlocksRef.current.has(nextPhase.id)) {
          const nextUnlocks = new Set(phaseUnlocksRef.current);
          nextUnlocks.add(nextPhase.id);
          phaseUnlocksRef.current = nextUnlocks;
          setUnlockedPhaseIds(Array.from(nextUnlocks).sort((a, b) => a - b));
          addToast({
            title: `${nextPhase.title} Open`,
            description: `${nextPhase.theme} 체크포인트가 열렸습니다.`,
            icon: "💾",
          });
        }
      }
    });
  }, [addToast, runState, timelineTime]);

  useEffect(() => {
    if (runState !== "running") {
      return;
    }

    const elapsed = Math.max(0, timelineTime - attemptStartTime);
    const score = Math.floor(elapsed * 10) + successfulJumps * 50;
    setCurrentScore(score);

    if (score > bestScore) {
      setBestScore(score);
      window.localStorage.setItem(BEST_SCORE_KEY, String(score));
    }
  }, [attemptStartTime, bestScore, runState, successfulJumps, timelineTime]);

  useEffect(() => {
    if (runState !== "running") {
      return;
    }

    for (const obstacle of visibleObstacles) {
      if (passedObstacleKeysRef.current.has(obstacle.key)) {
        continue;
      }

      const x = PLAYER_X + (obstacle.time - timelineTime) * PIXELS_PER_SECOND;
      const overlapsPlayer = Math.abs(x - PLAYER_X) < 18;

      if (overlapsPlayer) {
        const hitGroundObstacle =
          obstacle.type === "ground" && jumpYRef.current < GROUND_SAFE_HEIGHT;
        const hitFlareObstacle =
          obstacle.type === "flare" &&
          jumpYRef.current > FLARE_COLLISION_HEIGHT;

        if (hitGroundObstacle || hitFlareObstacle) {
          setDeathMessage(
            obstacle.type === "ground"
              ? "타이밍을 놓쳐 장애물을 뛰어넘지 못했습니다."
              : "점프가 너무 높아 불꽃 이펙트에 닿았습니다.",
          );
          intentionalPauseRef.current = true;
          playerRef.current?.pauseVideo();
          playerRef.current?.seekTo(attemptStartTime, true);
          timelineTimeRef.current = attemptStartTime;
          setTimelineTime(attemptStartTime);
          setRunState("gameover");
          return;
        }
      }

      if (x < PLAYER_X - 22) {
        passedObstacleKeysRef.current.add(obstacle.key);
        if (
          obstacle.type === "ground" &&
          jumpYRef.current >= GROUND_SAFE_HEIGHT
        ) {
          setSuccessfulJumps((prev) => prev + 1);
        }
      }
    }
  }, [attemptStartTime, runState, timelineTime, visibleObstacles]);

  useEffect(() => {
    if (runState !== "completed") {
      return;
    }

    const crossedEnding = timelineTime >= PHASES[PHASES.length - 1].end - 1;
    if (!crossedEnding || !token) {
      return;
    }

    const award = async (
      code: string,
      title: string,
      description: string,
      icon: string,
    ) => {
      if (awardedCodesRef.current.has(code)) {
        return;
      }

      awardedCodesRef.current.add(code);

      try {
        const response = await fetch(`${BASE_URL}/achievements/award/${code}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        addToast({ title, description, icon });
      } catch (error) {
        console.error(`Failed to award ${code}`, error);
      }
    };

    void award(
      "LEGEND-HERO",
      "레전드 용사",
      "마왕을 물리치고 긴 여정을 끝마쳤다.",
      "⚔️",
    );

    if (attemptStartPhaseIdRef.current === 1) {
      void award(
        "R-GEND-HERO",
        "R전드 용사",
        "1단계부터 끝까지 한 번에 여정을 완주했다.",
        "👑",
      );
    }
  }, [addToast, runState, timelineTime, token]);

  const startAttempt = (phaseId: number) => {
    const targetPhase = PHASES.find((item) => item.id === phaseId);
    const player = playerRef.current;

    if (!targetPhase || !player) {
      return;
    }

    intentionalPauseRef.current = false;
    attemptStartPhaseIdRef.current = phaseId;
    passedObstacleKeysRef.current = new Set();
    jumpYRef.current = 0;
    jumpVelocityRef.current = 0;
    remainingAirJumpRef.current = 1;
    lastJumpInputTsRef.current = 0;
    lastPhysicsTsRef.current = null;
    timelineTickPrevTsRef.current = null;

    setSelectedRetryPhaseId(phaseId);
    setAttemptStartTime(targetPhase.start);
    timelineTimeRef.current = targetPhase.start;
    setTimelineTime(targetPhase.start);
    setJumpHeight(0);
    setCurrentScore(0);
    setSuccessfulJumps(0);
    setDeathMessage("장애물에 부딪혀 여정이 중단되었습니다.");
    setRunState("running");

    player.seekTo(targetPhase.start, true);
    player.playVideo();
  };

  const handleStart = () => {
    startAttempt(selectedRetryPhaseId);
  };

  const performJump = (isDoubleJump: boolean) => {
    if (runState !== "running") {
      return;
    }

    if (jumpYRef.current <= 4) {
      jumpVelocityRef.current = JUMP_VELOCITY;
      remainingAirJumpRef.current = 1;
      return;
    }

    if (isDoubleJump && remainingAirJumpRef.current > 0) {
      jumpVelocityRef.current = DOUBLE_JUMP_VELOCITY;
      remainingAirJumpRef.current -= 1;
    }
  };

  const handleJumpInput = () => {
    const now = performance.now();
    const isDoubleJump =
      now - lastJumpInputTsRef.current <= DOUBLE_TAP_WINDOW_MS;
    lastJumpInputTsRef.current = now;
    performJump(isDoubleJump);
  };

  const handleRetry = () => {
    startAttempt(selectedRetryPhaseId);
  };

  const statusLabel =
    runState === "running"
      ? playerState === 3
        ? "Buffering"
        : "Live Run"
      : runState === "gameover"
        ? "Game Over"
        : runState === "completed"
          ? "Completed"
          : "Ready";

  return (
    <GameContainer
      title="위대한 모험"
      desc="라떼는 말이야 마왕을 검 하나로 때려잡았다고"
      gameName="위대한 모험"
      helpSlides={ADVENTURE_TUTORIAL_SLIDES}
      className="relative overflow-hidden bg-[#f7f2e8] text-[#1d3557] select-none"
      mainClassName="px-4 pb-10 sm:px-8"
      showDesktopHelp
      headerRight={
        <>
          <div
            className="flex min-w-[92px] flex-col items-center rounded-2xl px-4 py-2"
            style={{ background: "#102542", color: "#FFFFF8" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
              Score
            </span>
            <span className="text-xl font-black leading-tight">
              {currentScore}
            </span>
          </div>
          <div
            className="flex min-w-[92px] flex-col items-center rounded-2xl px-4 py-2"
            style={{ background: "#2a9d8f", color: "#fefae0" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-80">
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
        <section className="grid gap-5 lg:grid-cols-[0.72fr_1.45fr_0.83fr]">
          <section className="order-3 rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)] lg:order-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#102542]">Music Sync</h3>
              <span className="rounded-full bg-[#102542] px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-white">
                {formatTime(timelineTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="overflow-hidden rounded-[1.4rem] border border-[#102542]/10 bg-[#102542]">
              <div
                id="rico-adventure-player"
                className="aspect-video w-full pointer-events-none"
              />
            </div>

            <div className="mt-4 grid gap-3">
              {runState === "running" && (
                <div className="rounded-[1.2rem] bg-[#102542] px-5 py-4 text-center text-sm font-black text-white">
                  Playback Locked
                </div>
              )}

              {runState === "completed" && (
                <button
                  type="button"
                  onClick={() => startAttempt(1)}
                  className="w-full rounded-[1.2rem] bg-[#102542] px-5 py-4 text-base font-black text-white transition-transform hover:scale-[1.01]"
                >
                  처음부터 다시 도전
                </button>
              )}

              <button
                type="button"
                onClick={handleJumpInput}
                disabled={!isRunning}
                className="w-full rounded-[1.2rem] border-2 border-[#102542] bg-[#fffaf2] px-5 py-3 text-sm font-black text-[#102542] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Jump / Double Jump
              </button>
            </div>
          </section>

          <div
            className={`order-1 relative overflow-hidden rounded-[2rem] border-4 border-white/70 bg-gradient-to-br ${phase.sky} p-4 shadow-[0_25px_80px_rgba(17,24,39,0.16)] lg:order-2`}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.55), transparent 28%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.35), transparent 22%), linear-gradient(180deg, rgba(255,255,255,0.08), transparent 35%)",
              }}
            />

            <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p
                  className="text-sm font-black uppercase tracking-[0.28em]"
                  style={{ color: phase.accent }}
                >
                  {phase.title} · {phase.theme}
                </p>
                <h2 className="text-2xl font-black text-[#102542] sm:text-3xl">
                  {phase.description}
                </h2>
              </div>
              <div className="rounded-full bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#102542]">
                {statusLabel}
              </div>
            </div>

            <button
              type="button"
              onPointerDown={handleJumpInput}
              className="relative h-[360px] w-full overflow-hidden rounded-[1.6rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))] text-left sm:h-[420px]"
            >
              <div className="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(180deg,rgba(98,122,80,0.15),rgba(71,93,64,0.9))]" />
              <div className="absolute inset-x-0 bottom-[28%] h-3 bg-white/30" />
              <div
                className="absolute inset-y-[55%] w-[140%] opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 30%, transparent 60%)",
                  transform: `translateX(${((timelineTime * 28) % 120) - 60}%)`,
                }}
              />

              <div className="absolute left-0 right-0 top-4 flex justify-center">
                <div className="rounded-full bg-[#102542]/70 px-4 py-2 text-sm font-bold text-white">
                  Course {Math.round(progress * COURSE_LENGTH)}m /{" "}
                  {COURSE_LENGTH}m
                </div>
              </div>

              <div className="absolute bottom-6 right-6 rounded-full bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#102542] shadow-lg">
                Tap to Jump · Double Tap to Double Jump
              </div>

              {visibleObstacles.map((obstacle) => {
                const x =
                  PLAYER_X + (obstacle.time - timelineTime) * PIXELS_PER_SECOND;
                const isPast = x < PLAYER_X - 18;
                const isFlare = obstacle.type === "flare";

                return (
                  <motion.div
                    key={obstacle.key}
                    className={`absolute ${obstacle.size} ${isFlare ? "bottom-[40%]" : "bottom-[18%]"} select-none`}
                    style={{
                      left: `${x}px`,
                      opacity: isPast ? 0.28 : 1,
                      filter: isPast
                        ? "grayscale(0.25)"
                        : "drop-shadow(0 8px 16px rgba(0,0,0,0.18))",
                    }}
                  >
                    {obstacle.emoji}
                  </motion.div>
                );
              })}

              <motion.div
                className="absolute left-[72px] bottom-[16%] flex h-20 w-20 items-end justify-center"
                animate={{ y: -jumpHeight }}
                transition={{ duration: 0 }}
              >
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/80 bg-[#fff7db] text-4xl shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                  🦸‍♀️
                  <div className="absolute -bottom-4 h-3 w-14 rounded-full bg-black/15 blur-md" />
                </div>
              </motion.div>

              <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/10">
                <div
                  className="h-full rounded-full bg-[#102542]"
                  style={{ width: `${Math.max(progress * 100, 2)}%` }}
                />
              </div>
            </button>

            <div className="relative z-10 mt-4 flex flex-wrap gap-3">
              {runState === "ready" && (
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!playerReady}
                  className="rounded-[1.2rem] bg-[#102542] px-5 py-4 text-base font-black text-white transition-transform hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60"
                >
                  {playerReady ? "Play Stage" : "플레이어 준비 중..."}
                </button>
              )}

              <div className="rounded-[1.2rem] bg-white/70 px-4 py-3 text-sm font-black text-[#102542]">
                Live Run
              </div>
            </div>
          </div>

          <div className="order-2 flex flex-col gap-5 lg:order-3">
            <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-black text-[#102542]">
                  Phase Save Points
                </h3>
                <span className="rounded-full bg-[#2a9d8f] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
                  {successfulJumps} Jumps
                </span>
              </div>
              <div className="space-y-2">
                {PHASES.map((item) => {
                  const active = item.id === phase.id;
                  const unlocked = unlockedPhaseIds.includes(item.id);
                  const selected = selectedRetryPhaseId === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!unlocked || isRunning}
                      onClick={() => setSelectedRetryPhaseId(item.id)}
                      className={`w-full rounded-[1.2rem] border px-4 py-3 text-left transition-colors ${active ? "border-[#102542] bg-[#102542] text-white" : selected ? "border-[#2a9d8f] bg-[#dff6f3] text-[#102542]" : "border-[#102542]/10 bg-[#fffaf2] text-[#102542]"} ${!unlocked || isRunning ? "cursor-not-allowed opacity-45" : ""}`}
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
                    </button>
                  );
                })}
              </div>
              {(runState === "gameover" || runState === "completed") && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-4 w-full rounded-[1.2rem] bg-[#2a9d8f] px-5 py-4 text-base font-black text-white transition-transform hover:scale-[1.01]"
                >
                  선택한 체크포인트에서 재시작
                </button>
              )}
            </section>
          </div>
        </section>
      </div>

      {runState === "gameover" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.78, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-[2rem] border-4 border-[#102542]/10 bg-[#fffaf2] p-6 text-center shadow-[0_30px_60px_rgba(0,0,0,0.22)]"
          >
            <div className="text-5xl">💥</div>
            <h2 className="mt-3 text-2xl font-black text-[#102542]">
              Game Over
            </h2>
            <p className="mt-2 text-sm font-bold text-[#5c677d]">
              {deathMessage}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-black">
              <div className="rounded-2xl bg-[#102542] px-4 py-3 text-white">
                <div className="text-[10px] uppercase tracking-[0.22em] opacity-70">
                  Score
                </div>
                <div className="text-xl">{currentScore}</div>
              </div>
              <div className="rounded-2xl bg-[#2a9d8f] px-4 py-3 text-white">
                <div className="text-[10px] uppercase tracking-[0.22em] opacity-80">
                  Best
                </div>
                <div className="text-xl">{bestScore}</div>
              </div>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-[#102542]">
              Retry from{" "}
              {PHASES.find((item) => item.id === selectedRetryPhaseId)?.title}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 w-full rounded-[1.2rem] bg-[#102542] px-5 py-4 text-base font-black text-white transition-transform hover:scale-[1.01]"
            >
              다시 도전
            </button>
          </motion.div>
        </div>
      )}
    </GameContainer>
  );
}
