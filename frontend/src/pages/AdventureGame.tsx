import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameContainer } from "../components/common/GameContainer";
import type { TutorialSlide } from "../components/common/TutorialBanner";
import { BASE_URL } from "../utils/api";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";

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

type RunState = "ready" | "running" | "paused" | "gameover" | "completed";

const BEST_SCORE_KEY = "rico-adventure-best-score";
const COURSE_LENGTH = 440;
const PLAYER_X = 72;
const PIXELS_PER_SECOND = 160;
const JUMP_VELOCITY = 1080;
const DOUBLE_JUMP_VELOCITY = 980;
const GRAVITY = 2800;
const GROUND_SAFE_HEIGHT = 82;
const FLARE_COLLISION_HEIGHT = 124;

const ADVENTURE_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "🏃 테스트 빌드",
    lines: [
      "영상 연동은 잠시 빼고 러너 코어만 남겼어요.",
      "캐릭터는 고정, 배경과 장애물이 왼쪽으로 움직입니다.",
    ],
    showArrows: false,
  },
  {
    title: "🦘 점프 조작",
    lines: [
      "코스를 터치하거나 버튼을 누르면 점프합니다.",
      "첫 점프 뒤에는 착지 전까지 언제든 한 번 더 점프할 수 있습니다.",
    ],
    showArrows: false,
  },
  {
    title: "⚔️ 목표",
    lines: [
      "Chrome Dino처럼 최소 루프만 확인하는 버전입니다.",
      "움직임과 충돌이 안정화되면 세부 연출을 다시 얹으면 됩니다.",
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
    description: "마왕의 성 내부로 들어가며 분위기가 어두워집니다.",
  },
  {
    id: 5,
    title: "Phase 5",
    start: 282,
    end: 310,
    theme: "결투",
    sky: "from-[#4a1010] via-[#9d0208] to-[#ffba08]",
    accent: "#ffd166",
    description: "짧고 거대한 결전 구간입니다.",
  },
  {
    id: 6,
    title: "Phase 6",
    start: 310,
    end: 388,
    theme: "승리",
    sky: "from-[#6ec6ff] via-[#bde0fe] to-[#d8f3dc]",
    accent: "#2a9d8f",
    description: "전투가 끝나고 평화로운 풍경이 펼쳐집니다.",
  },
  {
    id: 7,
    title: "Phase 7",
    start: 388,
    end: 433,
    theme: "엔딩",
    sky: "from-[#1d3557] via-[#457b9d] to-[#f1faee]",
    accent: "#f1fa8c",
    description: "옛날이야기의 마지막 페이지입니다.",
  },
];

const getCurrentPhase = (time: number): Phase =>
  PHASES.find((phase) => time >= phase.start && time < phase.end) ??
  PHASES[PHASES.length - 1];

const getObstacleEmoji = (
  phaseId: number,
  type: Obstacle["type"],
  variant: number,
) => {
  if (phaseId <= 2) {
    return type === "flare" ? "✨" : ["📜", "🪵", "🥁"][variant % 3];
  }

  if (phaseId === 3) {
    return type === "flare" ? "🦋" : ["🌲", "🍃", "🌿"][variant % 3];
  }

  if (phaseId === 4) {
    return type === "flare" ? "🔥" : ["🪨", "🕸️", "🦴"][variant % 3];
  }

  if (phaseId === 5) {
    return type === "flare" ? "💥" : ["⚔️", "👑", "🛡️"][variant % 3];
  }

  return type === "flare" ? "⭐" : ["🌼", "🎖️", "🕊️"][variant % 3];
};

const buildObstacleCourse = (): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  const safeStart = 3;

  PHASES.forEach((phase) => {
    let marker = Math.max(
      phase.start + 0.8,
      phase.id === 1 ? safeStart + 0.35 : phase.start + 0.8,
    );

    while (marker < phase.end - 1.1) {
      const gapMin = phase.id >= 5 ? 1.05 : phase.id >= 3 ? 1.3 : 1.6;
      const gapMax = phase.id >= 5 ? 1.85 : phase.id >= 3 ? 2.3 : 2.9;
      const type: Obstacle["type"] = Math.random() < 0.26 ? "flare" : "ground";
      const variant = Math.floor(Math.random() * 6);

      obstacles.push({
        key: `${phase.id}-${marker.toFixed(3)}`,
        emoji: getObstacleEmoji(phase.id, type, variant),
        time: marker,
        type,
        size: phase.id >= 5 ? "text-4xl" : "text-3xl",
      });

      marker += gapMin + Math.random() * (gapMax - gapMin);
    }
  });

  return obstacles;
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
  const rafRef = useRef<number | null>(null);
  const lastFrameTsRef = useRef<number | null>(null);
  const jumpYRef = useRef(0);
  const jumpVelocityRef = useRef(0);
  const remainingAirJumpRef = useRef(1);
  const passedObstacleKeysRef = useRef<Set<string>>(new Set());
  const awardedCodesRef = useRef<Set<string>>(new Set());
  const runStateRef = useRef<RunState>("ready");
  const courseTimeRef = useRef(0);

  const [runState, setRunState] = useState<RunState>("ready");
  const [courseTime, setCourseTime] = useState(0);
  const [jumpHeight, setJumpHeight] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => getSavedBestScore());
  const [obstacles, setObstacles] = useState<Obstacle[]>(() =>
    buildObstacleCourse(),
  );
  const [deathMessage, setDeathMessage] = useState(
    "장애물에 부딪혀 여정이 중단되었습니다.",
  );

  const phase = useMemo(() => getCurrentPhase(courseTime), [courseTime]);
  const visibleObstacles = useMemo(
    () =>
      obstacles.filter(
        (obstacle) =>
          obstacle.time >= courseTime - 1.2 && obstacle.time <= courseTime + 6,
      ),
    [courseTime, obstacles],
  );
  const progress = Math.min(courseTime / PHASES[PHASES.length - 1].end, 1);
  const isRunning = runState === "running";

  useEffect(() => {
    runStateRef.current = runState;
  }, [runState]);

  useEffect(() => {
    courseTimeRef.current = courseTime;
  }, [courseTime]);

  useEffect(() => {
    if (runState !== "running") {
      lastFrameTsRef.current = null;
      return;
    }

    const tick = (ts: number) => {
      const previousTs = lastFrameTsRef.current ?? ts;
      const delta = Math.min((ts - previousTs) / 1000, 0.04);
      lastFrameTsRef.current = ts;

      jumpVelocityRef.current -= GRAVITY * delta;
      jumpYRef.current = Math.max(
        0,
        jumpYRef.current + jumpVelocityRef.current * delta,
      );

      if (jumpYRef.current === 0 && jumpVelocityRef.current < 0) {
        jumpVelocityRef.current = 0;
        remainingAirJumpRef.current = 1;
      }

      const nextTime = Math.min(
        courseTimeRef.current + delta,
        PHASES[PHASES.length - 1].end,
      );

      for (const obstacle of obstacles) {
        if (passedObstacleKeysRef.current.has(obstacle.key)) {
          continue;
        }

        const x = PLAYER_X + (obstacle.time - nextTime) * PIXELS_PER_SECOND;
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
            setRunState("gameover");
            setJumpHeight(jumpYRef.current);
            setCourseTime(nextTime);
            courseTimeRef.current = nextTime;
            return;
          }
        }

        if (x < PLAYER_X - 22) {
          passedObstacleKeysRef.current.add(obstacle.key);
        }
      }

      const nextScore =
        Math.floor(nextTime * 100) + passedObstacleKeysRef.current.size * 20;

      if (nextScore > bestScore) {
        setBestScore(nextScore);
        window.localStorage.setItem(BEST_SCORE_KEY, String(nextScore));
      }

      setJumpHeight(jumpYRef.current);
      setCourseTime(nextTime);
      setCurrentScore(nextScore);
      courseTimeRef.current = nextTime;

      if (nextTime >= PHASES[PHASES.length - 1].end) {
        setRunState("completed");
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [bestScore, obstacles, runState]);

  useEffect(() => {
    if (runState !== "completed" || !token) {
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

        const newlyAwarded = (await response.json()) === true;
        if (newlyAwarded) {
          addToast({ title, description, icon });
        }
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
    void award(
      "R-GEND-HERO",
      "R전드 용사",
      "첫 구간부터 끝까지 한 번에 여정을 완주했다.",
      "👑",
    );
  }, [addToast, runState, token]);

  const resetRun = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    lastFrameTsRef.current = null;
    jumpYRef.current = 0;
    jumpVelocityRef.current = 0;
    remainingAirJumpRef.current = 1;
    passedObstacleKeysRef.current = new Set();
    setObstacles(buildObstacleCourse());
    setJumpHeight(0);
    setCourseTime(0);
    setCurrentScore(0);
    setDeathMessage("장애물에 부딪혀 여정이 중단되었습니다.");
    courseTimeRef.current = 0;
  };

  const handleStart = () => {
    resetRun();
    setRunState("running");
  };

  const handleRetry = () => {
    resetRun();
    setRunState("running");
  };

  const handlePauseToggle = () => {
    if (runState === "running") {
      setRunState("paused");
      return;
    }

    if (runState === "paused") {
      lastFrameTsRef.current = null;
      setRunState("running");
    }
  };

  const performJump = () => {
    if (runStateRef.current !== "running") {
      return;
    }

    if (jumpYRef.current <= 4) {
      jumpVelocityRef.current = JUMP_VELOCITY;
      remainingAirJumpRef.current = 1;
      return;
    }

    if (remainingAirJumpRef.current > 0) {
      jumpVelocityRef.current = DOUBLE_JUMP_VELOCITY;
      remainingAirJumpRef.current -= 1;
    }
  };

  const handleJumpInput = () => {
    performJump();
  };

  const statusLabel =
    runState === "running"
      ? "Live Run"
      : runState === "paused"
        ? "Paused"
        : runState === "gameover"
          ? "Game Over"
          : runState === "completed"
            ? "Completed"
            : "Ready";

  return (
    <GameContainer
      title="위대한 모험"
      desc="러너 코어만 남긴 디버그 버전"
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
        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.5fr_0.7fr]">
          <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
            <div className="space-y-3">
              <h3 className="text-lg font-black text-[#102542]">Runner Status</h3>
              <div className="rounded-[1.2rem] bg-[#102542] px-4 py-3 text-sm font-black text-white">
                {statusLabel}
              </div>
              <div className="rounded-[1.2rem] border border-[#102542]/10 bg-[#fffaf2] px-4 py-3 text-sm font-bold text-[#365486]">
                비디오/싱크 관련 코드는 잠시 제거했고, 배경 이동과 장애물 이동만
                남긴 최소 러너 루프입니다.
              </div>
              <div className="rounded-[1.2rem] border border-[#102542]/10 bg-[#fffaf2] px-4 py-3 text-sm font-bold text-[#365486]">
                코스가 오른쪽에서 왼쪽으로 흐르고, 캐릭터는 항상 같은 위치를
                지킵니다.
              </div>
              <div className="rounded-[1.2rem] border border-[#102542]/10 bg-[#fffaf2] px-4 py-3 text-sm font-bold text-[#365486]">
                {formatTime(courseTime)} / {formatTime(PHASES[PHASES.length - 1].end)}
              </div>
            </div>
          </section>

          <div
            className={`relative overflow-hidden rounded-[2rem] border-4 border-white/70 bg-gradient-to-br ${phase.sky} p-4 shadow-[0_25px_80px_rgba(17,24,39,0.16)]`}
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
              <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-transparent" />

              <div
                className="absolute inset-y-[18%] left-[-140%] w-[280%] opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.9) 0 16%, transparent 17%)",
                  backgroundSize: "160px 44px",
                  transform: `translateX(-${(courseTime * 18) % 160}px)`,
                }}
              />

              <div
                className="absolute bottom-[30%] left-[-120%] h-16 w-[260%] opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, transparent 0, rgba(255,255,255,0.55) 10%, transparent 20%)",
                  backgroundSize: "220px 100%",
                  transform: `translateX(-${(courseTime * 80) % 220}px)`,
                }}
              />

              <div className="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(180deg,rgba(98,122,80,0.12),rgba(71,93,64,0.95))]" />

              <div
                className="absolute inset-x-[-20%] bottom-[21%] h-7 opacity-70"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(66,99,63,0.25) 0 14%, transparent 14% 22%, rgba(66,99,63,0.2) 22% 34%, transparent 34% 44%)",
                  backgroundSize: "180px 100%",
                  transform: `translateX(-${(courseTime * 140) % 180}px)`,
                }}
              />

              <div
                className="absolute inset-x-[-25%] bottom-[17%] h-10"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #7c5c3b 0 18%, transparent 18% 24%, #6b4f34 24% 42%, transparent 42% 48%)",
                  backgroundSize: "210px 100%",
                  transform: `translateX(-${(courseTime * 210) % 210}px)`,
                }}
              />

              <div className="absolute left-0 right-0 top-4 flex justify-center">
                <div className="rounded-full bg-[#102542]/70 px-4 py-2 text-sm font-bold text-white">
                  Course {Math.round(progress * COURSE_LENGTH)}m /{" "}
                  {COURSE_LENGTH}m
                </div>
              </div>

              <div className="absolute bottom-6 right-6 rounded-full bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#102542] shadow-lg">
                Tap to Jump · One Extra Air Jump
              </div>

              {visibleObstacles.map((obstacle) => {
                const x =
                  PLAYER_X + (obstacle.time - courseTime) * PIXELS_PER_SECOND;
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
                  {jumpHeight > 4 ? "🤸‍♀️" : "🦸‍♀️"}
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
              {(runState === "ready" ||
                runState === "gameover" ||
                runState === "completed") && (
                <button
                  type="button"
                  onClick={runState === "ready" ? handleStart : handleRetry}
                  className="rounded-[1.2rem] bg-[#102542] px-5 py-4 text-base font-black text-white transition-transform hover:scale-[1.01]"
                >
                  {runState === "ready" ? "Run Start" : "다시 도전"}
                </button>
              )}

              <button
                type="button"
                onClick={handleJumpInput}
                disabled={!isRunning}
                className="rounded-[1.2rem] border-2 border-[#102542] bg-[#fffaf2] px-5 py-3 text-sm font-black text-[#102542] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Jump
              </button>
              {(runState === "running" || runState === "paused") && (
                <button
                  type="button"
                  onClick={handlePauseToggle}
                  className="rounded-[1.2rem] bg-[#102542] px-5 py-3 text-sm font-black text-white transition-transform hover:scale-[1.01]"
                >
                  {runState === "paused" ? "Resume" : "Pause"}
                </button>
              )}
            </div>
          </div>

          <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-[#102542]">Phase Preview</h3>
              <span className="rounded-full bg-[#2a9d8f] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div className="space-y-2">
              {PHASES.map((item) => {
                const active = item.id === phase.id;

                return (
                  <div
                    key={item.id}
                    className={`w-full rounded-[1.2rem] border px-4 py-3 ${active ? "border-[#102542] bg-[#102542] text-white" : "border-[#102542]/10 bg-[#fffaf2] text-[#102542]"}`}
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
            <h3 className="mt-3 text-2xl font-black text-[#102542]">
              Game Over
            </h3>
            <p className="mt-3 text-base font-bold text-[#365486]">
              {deathMessage}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-6 rounded-[1.2rem] bg-[#102542] px-6 py-4 text-base font-black text-white transition-transform hover:scale-[1.01]"
            >
              다시 도전
            </button>
          </motion.div>
        </div>
      )}
    </GameContainer>
  );
}
