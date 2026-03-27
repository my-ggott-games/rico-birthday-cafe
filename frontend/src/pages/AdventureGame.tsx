import { useEffect, useMemo, useRef, useState } from "react";
import type { TutorialSlide } from "../components/common/TutorialBanner";
import type { AppIconName } from "../components/common/AppIcon";
import { type AdventureModalAction } from "../components/game/AdventureModal";
import { BASE_URL } from "../utils/api";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import type { Phase, PositionedHole, RunState, Hole } from "../types/adventure";
import { AdventureGameView } from "../components/game/AdventureGameView";

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type PlayerInstance = {
  destroy: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
};

type PlayerStateValue = -1 | 0 | 1 | 2 | 3 | 5;

type YouTubeNamespace = {
  Player: new (
    elementId: string,
    config: {
      height?: number | string;
      width?: number | string;
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

const BEST_SCORE_KEY = "rico-adventure-best-score";
const YOUTUBE_VIDEO_ID = "J3B0k47f0Fs";
const COURSE_LENGTH = 440;
const PLAYER_X = 72;
const PIXELS_PER_SECOND = 160;
const PLAYER_UI_WIDTH = 64;
const JUMP_VELOCITY = 1080;
const DOUBLE_JUMP_VELOCITY = 980;
const GRAVITY = 2800;
const PLAYER_WIDTH = 28;
const FALL_OUT_THRESHOLD = 320;
const DEFAULT_DEATH_MESSAGE = "거기 누구 없어요? 도와주세요!!";
const HUD_UPDATE_INTERVAL_MS = 80;
const MIN_RANDOM_HOLE_INTERVAL = 0.85;
const HOLE_COLLISION_INSET = 6;

const HOLE_PRESETS: Record<
  number,
  Array<{ time: number; width?: number; lengthType?: "short" | "long" }>
> = {
  2: [
    { time: 52, width: 68 },
    { time: 88, lengthType: "long" },
  ],
  4: [
    { time: 228, width: 76 },
    { time: 252, width: 70 },
  ],
  6: [{ time: 332, width: 74 }],
};

const ADVENTURE_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "용사 리코 이야기",
    lines: [
      "이세계 용사 리코와 함께 모험을 떠나자!",
      "화면을 탭하면 점프 할 수 있어",
    ],
    showArrows: false,
  },
  {
    title: "함정에 빠지지 않게 조심해!",
    lines: [
      "함정에 빠지면 우리의 모험이 끝나버려...",
      "함정을 잘 피해서 달려보자!",
    ],
    showArrows: false,
  },
  {
    title: "점프는 2번까지 할 수 있어",
    lines: ["힘내서 마왕을 무찌르자!"],
    showArrows: false,
  },
];

const PHASES: Phase[] = [
  {
    id: 1,
    title: "1장 - 용사 리코 이야기",
    start: 0,
    end: 39,
    theme: "서막",
    skyColor: "#f0dfce",
    hazeColor: "#fff3de",
    groundColor: "#7f8f63",
    pathColor: "#7b5f41",
    detailColor: "#d0c5a3",
    accent: "#9c6644",
    description: "옛날옛날 아주 먼 옛날에...",
  },
  {
    id: 2,
    title: "2장 - 모험의 시작",
    start: 39,
    end: 121,
    theme: "모험의 시작",
    skyColor: "#efcf99",
    hazeColor: "#f9e5bc",
    groundColor: "#7e8d5f",
    pathColor: "#82583d",
    detailColor: "#d4cbac",
    accent: "#b85c38",
    description: "긴 여정을 향해 첫 발을 내딛는 구간입니다.",
  },
  {
    id: 3,
    title: "3장",
    start: 121,
    end: 224,
    theme: "숲",
    skyColor: "#bfd4ad",
    hazeColor: "#eaf2d0",
    groundColor: "#5f7d4a",
    pathColor: "#5d4731",
    detailColor: "#d7dbb8",
    accent: "#386641",
    description: "햇살이 스며드는 숲과 들판을 달립니다.",
  },
  {
    id: 4,
    title: "4장",
    start: 224,
    end: 282,
    theme: "던전",
    skyColor: "#434a5f",
    hazeColor: "#667085",
    groundColor: "#4d5b4a",
    pathColor: "#4a392b",
    detailColor: "#9aa0ab",
    accent: "#e07a5f",
    description: "마왕의 성 내부로 들어가며 분위기가 어두워집니다.",
  },
  {
    id: 5,
    title: "5장",
    start: 282,
    end: 310,
    theme: "결투",
    skyColor: "#8b2f2f",
    hazeColor: "#d57b58",
    groundColor: "#6a5b44",
    pathColor: "#55331f",
    detailColor: "#b6825d",
    accent: "#ffd166",
    description: "짧고 거대한 결전 구간입니다.",
  },
  {
    id: 6,
    title: "6장",
    start: 310,
    end: 388,
    theme: "승리",
    skyColor: "#b5dff0",
    hazeColor: "#edf7ef",
    groundColor: "#789768",
    pathColor: "#6e5238",
    detailColor: "#dcead4",
    accent: "#2a9d8f",
    description: "전투가 끝나고 평화로운 풍경이 펼쳐집니다.",
  },
  {
    id: 7,
    title: "7장",
    start: 388,
    end: 433,
    theme: "엔딩",
    skyColor: "#6f87a6",
    hazeColor: "#d7e3dc",
    groundColor: "#667b68",
    pathColor: "#5d4734",
    detailColor: "#c8d3d7",
    accent: "#f1fa8c",
    description: "옛날이야기의 마지막 페이지입니다.",
  },
];

const getCurrentPhase = (time: number): Phase =>
  PHASES.find((phase) => time >= phase.start && time < phase.end) ??
  PHASES[PHASES.length - 1];

const TOTAL_RUN_DURATION = PHASES[PHASES.length - 1].end;

const getRandomHoleWidth = (
  _phaseId: number,
  lengthType: "short" | "long" = "short",
): number => {
  const base = PLAYER_UI_WIDTH * 1.5;
  return lengthType === "long" ? base * 2 : base;
};

const getHoleVisualHeight = (width: number): number =>
  Math.max(180, Math.round(width * 1.65), Math.round(width + 56));

const getHoleBottomKoDepth = (hole: Hole): number =>
  getHoleVisualHeight(hole.width);

type HoleCollisionState = {
  wallHole: Hole | null;
  fallingHole: Hole | null;
  bottomHitHole: Hole | null;
  passedHoleKeys: string[];
};

const getHoleCollisionState = (
  holes: Hole[],
  currentCourseTime: number,
  nextCourseTime: number,
  playerY: number,
  ignoredHoleKeys: Set<string>,
): HoleCollisionState => {
  // 플레이어 좌우 끝 계산
  const playerLeft = PLAYER_X - PLAYER_WIDTH / 2;
  const playerRight = PLAYER_X + PLAYER_WIDTH / 2;
  const playerBottom = -playerY;

  let wallHole: Hole | null = null;
  let fallingHole: Hole | null = null;
  let bottomHitHole: Hole | null = null;
  const newlyPassedHoleKeys: string[] = [];

  for (const hole of holes) {
    if (ignoredHoleKeys.has(hole.key)) continue;

    // 현재/다음 프레임에서 홀 중심 X 위치
    const currentHoleCenterX =
      PLAYER_X + (hole.time - currentCourseTime) * PIXELS_PER_SECOND;
    const nextHoleCenterX =
      PLAYER_X + (hole.time - nextCourseTime) * PIXELS_PER_SECOND;

    // 홀의 좌우 경계 (collision inset 적용)
    // const currentHoleLeft =
    //   currentHoleCenterX - hole.width / 2 + HOLE_COLLISION_INSET;
    const currentHoleRight =
      currentHoleCenterX + hole.width / 2 - HOLE_COLLISION_INSET;
    const nextHoleLeft =
      nextHoleCenterX - hole.width / 2 + HOLE_COLLISION_INSET;
    const nextHoleRight =
      nextHoleCenterX + hole.width / 2 - HOLE_COLLISION_INSET;

    const holeTop = 0;
    const holeBottom = getHoleBottomKoDepth(hole);

    // ── 추락/바닥 판정 ───────────────────────────────────────────────────────
    // 플레이어가 홀 위에 있다고 판단하는 조건:
    //   플레이어 우측이 홀 우측을 완전히 넘어서지 않았고 (아직 탈출 못함)
    //   플레이어 좌측이 홀 우측보다 왼쪽에 있을 때 (홀과 수평 겹침 있음)
    const playerOverlapsHoleHorizontally =
      playerRight <= nextHoleRight && // 우측이 홀 우측을 완전히 못 넘었음
      playerLeft < nextHoleRight && // 좌측이 홀 안에 걸쳐 있음
      playerRight > nextHoleLeft; // 우측이 홀 좌측보다는 오른쪽

    if (playerOverlapsHoleHorizontally && playerBottom >= holeTop) {
      if (playerBottom >= holeBottom) {
        bottomHitHole = hole;
      } else {
        fallingHole = hole;
      }
    }

    // ── 벽 충돌 판정 ─────────────────────────────────────────────────────────
    // 플레이어 우측이 홀 우측 벽에 막히는 조건:
    //   수직 범위 안에 있고, 우측 경계를 이번 프레임에 통과하려는 경우
    const playerInsideHoleVertical =
      playerBottom > holeTop && playerBottom < holeBottom;

    const hitsWallThisFrame =
      nextHoleRight > playerLeft &&
      ((currentHoleRight > playerRight && nextHoleRight <= playerRight) ||
        (nextHoleRight <= playerRight && nextHoleLeft < playerRight));

    if (playerInsideHoleVertical && hitsWallThisFrame) {
      wallHole = hole;
    }

    // ── 통과 판정 ─────────────────────────────────────────────────────────────
    if (nextHoleRight < PLAYER_X - 22) {
      newlyPassedHoleKeys.push(hole.key);
    }
  }

  return {
    wallHole,
    fallingHole,
    bottomHitHole,
    passedHoleKeys: newlyPassedHoleKeys,
  };
};

const buildHoleCourse = (): Hole[] => {
  const holes: Hole[] = [];
  const safeStart = 4.8;

  PHASES.forEach((phase) => {
    const gapMin = phase.id >= 5 ? 1.1 : phase.id >= 3 ? 1.35 : 1.7;
    const gapMax = phase.id >= 5 ? 1.65 : phase.id >= 3 ? 2.1 : 2.7;
    const minCenter = Math.max(
      phase.start + 1.35,
      phase.id === 1 ? safeStart : phase.start + 1.35,
    );
    let lastHoleEnd = minCenter - MIN_RANDOM_HOLE_INTERVAL;

    const sortedPresets = [...(HOLE_PRESETS[phase.id] ?? [])].sort(
      (a, b) => a.time - b.time,
    );

    const pushHole = (
      time: number,
      width: number,
      lengthType?: "short" | "long",
    ) => {
      const key = `${phase.id}-${time.toFixed(3)}`;
      holes.push({ key, time, width, lengthType });
      lastHoleEnd = time + width / (2 * PIXELS_PER_SECOND);
    };

    for (const preset of sortedPresets) {
      if (preset.time <= phase.start || preset.time >= phase.end) {
        console.warn(
          `Preset hole at ${preset.time}s is outside phase ${phase.id} bounds`,
        );
        continue;
      }
      const width =
        preset.width ??
        getRandomHoleWidth(phase.id, preset.lengthType ?? "short");
      const halfDuration = width / (2 * PIXELS_PER_SECOND);
      let center = preset.time;
      if (center - halfDuration < lastHoleEnd + MIN_RANDOM_HOLE_INTERVAL) {
        center = lastHoleEnd + MIN_RANDOM_HOLE_INTERVAL + halfDuration;
      }
      if (center + halfDuration >= phase.end) {
        continue;
      }
      pushHole(center, width, preset.lengthType);
    }

    let marker = Math.max(minCenter, lastHoleEnd + MIN_RANDOM_HOLE_INTERVAL);
    while (marker < phase.end - 1.7) {
      const lengthType: "short" | "long" =
        Math.random() < 0.2 ? "long" : "short";
      const width = getRandomHoleWidth(phase.id, lengthType);
      const halfDuration = width / (2 * PIXELS_PER_SECOND);
      const earliestAllowed =
        lastHoleEnd + MIN_RANDOM_HOLE_INTERVAL + halfDuration;
      if (marker - halfDuration < lastHoleEnd + MIN_RANDOM_HOLE_INTERVAL) {
        marker = earliestAllowed;
      }
      if (marker + halfDuration >= phase.end) {
        break;
      }

      pushHole(marker, width, lengthType);
      marker += gapMin + Math.random() * (gapMax - gapMin);
    }
  });

  return holes;
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

const getPassedHoleKeys = (time: number, holes: Hole[]): Set<string> =>
  new Set(holes.filter((hole) => hole.time < time).map((hole) => hole.key));

const getDistanceAtTime = (time: number): number =>
  (Math.min(Math.max(time, 0), TOTAL_RUN_DURATION) / TOTAL_RUN_DURATION) *
  COURSE_LENGTH;

const getPhaseScoreRate = (phaseId: number): number => 10 + (phaseId - 1) * 5;

const getScoreAtTime = (time: number): number =>
  PHASES.reduce((totalScore, phase) => {
    const phaseDistance = Math.max(
      0,
      getDistanceAtTime(Math.min(time, phase.end)) -
        getDistanceAtTime(phase.start),
    );
    return totalScore + Math.floor(phaseDistance) * getPhaseScoreRate(phase.id);
  }, 0);

const getStageSpeedMultiplier = (phaseId: number): number =>
  1 + (phaseId - 1) * 0.06;

export default function AdventureGame() {
  const { token } = useAuthStore();
  const { addToast } = useToastStore();
  const musicPlayerRef = useRef<PlayerInstance | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTsRef = useRef<number | null>(null);
  const lastHudUpdateRef = useRef(0);
  const playerYRef = useRef(0);
  const jumpVelocityRef = useRef(0);
  const remainingAirJumpRef = useRef(1);
  const passedHoleKeysRef = useRef<Set<string>>(new Set());
  const awardedCodesRef = useRef<Set<string>>(new Set());
  const fallingHoleKeyRef = useRef<string | null>(null);
  const runStateRef = useRef<RunState>("ready");
  const courseTimeRef = useRef(0);
  const pendingMusicStartRef = useRef(false);
  const pendingMusicStartTimeRef = useRef(0);
  const intentionalMusicPauseRef = useRef(false);

  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [runState, setRunState] = useState<RunState>("ready");
  const [hudCourseTime, setHudCourseTime] = useState(0);
  const [bestScore, setBestScore] = useState(() => getSavedBestScore());
  const [holes, setHoles] = useState<Hole[]>(() => buildHoleCourse());
  const [deathMessage, setDeathMessage] = useState(DEFAULT_DEATH_MESSAGE);

  const phase = useMemo(() => getCurrentPhase(hudCourseTime), [hudCourseTime]);
  const holesWithPosition = useMemo<PositionedHole[]>(
    () =>
      holes.map((hole) => ({
        ...hole,
        baseLeft: PLAYER_X + hole.time * PIXELS_PER_SECOND - hole.width / 2,
        visualHeight: getHoleVisualHeight(hole.width),
      })),
    [holes],
  );
  const currentScore = useMemo(
    () => getScoreAtTime(hudCourseTime),
    [hudCourseTime],
  );
  const overallCourseProgress = Math.min(hudCourseTime / TOTAL_RUN_DURATION, 1);
  const phaseProgress = useMemo(() => {
    const phaseDuration = phase.end - phase.start;
    if (phaseDuration <= 0) {
      return 1;
    }

    return Math.min(
      Math.max((hudCourseTime - phase.start) / phaseDuration, 0),
      1,
    );
  }, [hudCourseTime, phase]);
  const unlockedPhaseId =
    runState === "completed"
      ? PHASES[PHASES.length - 1].id
      : PHASES.reduce((highest, item) => {
          if (hudCourseTime >= item.start) {
            return item.id;
          }

          return highest;
        }, 1);

  useEffect(() => {
    runStateRef.current = runState;
  }, [runState]);

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
    if (!apiReady || musicPlayerRef.current || !window.YT?.Player) {
      return;
    }

    musicPlayerRef.current = new window.YT.Player("rico-adventure-player", {
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
            event.target.seekTo(pendingMusicStartTimeRef.current, true);
            event.target.playVideo();
            pendingMusicStartRef.current = false;
          }
        },
        onStateChange: (event) => {
          if (
            event.data === 2 &&
            runStateRef.current === "running" &&
            !intentionalMusicPauseRef.current
          ) {
            event.target.playVideo();
          }
        },
      },
    });

    return () => {
      musicPlayerRef.current?.destroy();
      musicPlayerRef.current = null;
    };
  }, [apiReady]);

  const playMusicFromTime = (time: number) => {
    pendingMusicStartRef.current = true;
    pendingMusicStartTimeRef.current = Math.max(0, time);
    intentionalMusicPauseRef.current = false;

    if (!playerReady || !musicPlayerRef.current) {
      return;
    }

    musicPlayerRef.current.seekTo(pendingMusicStartTimeRef.current, true);
    musicPlayerRef.current.playVideo();
    pendingMusicStartRef.current = false;
  };

  const pauseMusic = () => {
    pendingMusicStartRef.current = false;
    intentionalMusicPauseRef.current = true;
    musicPlayerRef.current?.pauseVideo();
  };

  useEffect(() => {
    if (runState !== "running") {
      lastFrameTsRef.current = null;
      return;
    }

    const tick = (ts: number) => {
      const previousTs = lastFrameTsRef.current ?? ts;
      const delta = Math.min((ts - previousTs) / 1000, 0.04);
      lastFrameTsRef.current = ts;
      const currentCourseTime = courseTimeRef.current;
      const speedMultiplier = getStageSpeedMultiplier(
        getCurrentPhase(currentCourseTime).id,
      );

      let nextTime = Math.min(
        currentCourseTime + delta * speedMultiplier,
        PHASES[PHASES.length - 1].end,
      );
      const nextJumpVelocity = jumpVelocityRef.current - GRAVITY * delta;
      const nextPlayerY = playerYRef.current + nextJumpVelocity * delta;
      let collisionState = getHoleCollisionState(
        holes,
        currentCourseTime,
        nextTime,
        nextPlayerY,
        passedHoleKeysRef.current,
      );

      if (collisionState.wallHole) {
        // 플레이어 우측이 홀 우측 벽에 닿은 순간의 courseTime을 계산
        // hole.right(in time) = hole.time + (hole.width/2 - PLAYER_WIDTH/2) / PPS
        const wallContactTime =
          collisionState.wallHole.time +
          (collisionState.wallHole.width / 2 - PLAYER_WIDTH / 2) /
            PIXELS_PER_SECOND;

        // nextTime을 벽 접촉 시점으로 클램핑 → 맵이 더 이상 좌로 이동하지 않음
        nextTime = Math.max(
          currentCourseTime,
          Math.min(nextTime, wallContactTime),
        );

        // 클램핑 후 상태 재계산
        collisionState = getHoleCollisionState(
          holes,
          currentCourseTime,
          nextTime,
          nextPlayerY,
          passedHoleKeysRef.current,
        );

        // 플레이어가 홀 위로 올라갔으면(playerBottom <= holeTop = 0) 벽 차단 해제
        // → nextTime 클램핑을 취소하고 원래 nextTime 사용
        if (nextPlayerY > 0 && collisionState.wallHole === null) {
          // 위로 탈출 성공: 별도 처리 없이 이미 collisionState가 null이므로 자연스럽게 이동 재개
        }
      }

      jumpVelocityRef.current = nextJumpVelocity;
      playerYRef.current = nextPlayerY;

      collisionState.passedHoleKeys.forEach((holeKey) => {
        passedHoleKeysRef.current.add(holeKey);
      });

      if (collisionState.fallingHole) {
        if (
          playerYRef.current <= 0 &&
          fallingHoleKeyRef.current !== collisionState.fallingHole.key
        ) {
          remainingAirJumpRef.current = Math.max(
            remainingAirJumpRef.current,
            2,
          );
        }
        fallingHoleKeyRef.current = collisionState.fallingHole.key;
      } else {
        fallingHoleKeyRef.current = null;
      }

      if (collisionState.bottomHitHole) {
        jumpVelocityRef.current = 0;
        setDeathMessage(DEFAULT_DEATH_MESSAGE);
        setRunState("gameover");
        courseTimeRef.current = nextTime;
        setHudCourseTime(nextTime);
        return;
      }

      if (!collisionState.fallingHole && playerYRef.current <= 0) {
        playerYRef.current = 0;
        if (jumpVelocityRef.current < 0) {
          jumpVelocityRef.current = 0;
        }
        remainingAirJumpRef.current = 1;
      }

      if (playerYRef.current < -FALL_OUT_THRESHOLD) {
        jumpVelocityRef.current = 0;
        setDeathMessage(DEFAULT_DEATH_MESSAGE);
        setRunState("gameover");
        courseTimeRef.current = nextTime;
        setHudCourseTime(nextTime);
        return;
      }

      courseTimeRef.current = nextTime;

      const shouldUpdateHud =
        ts - lastHudUpdateRef.current >= HUD_UPDATE_INTERVAL_MS;
      if (shouldUpdateHud) {
        lastHudUpdateRef.current = ts;
        setHudCourseTime(nextTime);
      }

      if (nextTime >= PHASES[PHASES.length - 1].end) {
        setHudCourseTime(nextTime);
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
  }, [holes, runState]);

  useEffect(() => {
    if (currentScore <= bestScore) {
      return;
    }

    setBestScore(currentScore);
    window.localStorage.setItem(BEST_SCORE_KEY, String(currentScore));
  }, [bestScore, currentScore]);

  useEffect(() => {
    if (runState !== "completed" || !token) {
      return;
    }

    const award = async (
      code: string,
      title: string,
      description: string,
      icon: AppIconName,
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
      "Sword",
    );
    void award(
      "R-GEND-HERO",
      "R전드 용사",
      "단 한 번의 실패 없이 여정을 끝마쳤다.",
      "Crown",
    );
  }, [addToast, runState, token]);

  useEffect(() => {
    if (runState === "gameover" || runState === "completed") {
      pauseMusic();
    }
  }, [runState]);

  const resetRun = () => {
    const nextHoles = buildHoleCourse();

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    lastFrameTsRef.current = null;
    playerYRef.current = 0;
    jumpVelocityRef.current = 0;
    remainingAirJumpRef.current = 1;
    fallingHoleKeyRef.current = null;
    passedHoleKeysRef.current = new Set();
    setHoles(nextHoles);
    setHudCourseTime(0);
    setDeathMessage(DEFAULT_DEATH_MESSAGE);
    courseTimeRef.current = 0;
  };

  const restartFromTime = (
    time: number,
    options?: { rebuildCourse?: boolean },
  ) => {
    const rebuildCourse = options?.rebuildCourse ?? false;
    const nextHoles = rebuildCourse ? buildHoleCourse() : holes;
    const passedHoleKeys = getPassedHoleKeys(time, nextHoles);

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    lastFrameTsRef.current = null;
    playerYRef.current = 0;
    jumpVelocityRef.current = 0;
    remainingAirJumpRef.current = 1;
    fallingHoleKeyRef.current = null;
    passedHoleKeysRef.current = passedHoleKeys;

    if (rebuildCourse) {
      setHoles(nextHoles);
    }

    setHudCourseTime(time);
    setDeathMessage(DEFAULT_DEATH_MESSAGE);
    courseTimeRef.current = time;
    playMusicFromTime(time);
    setRunState("running");
  };

  const handleStart = () => {
    resetRun();
    playMusicFromTime(0);
    setRunState("running");
  };

  const handleRestartStageOne = () =>
    restartFromTime(0, { rebuildCourse: true });

  const handleRestartCurrentStage = () => restartFromTime(phase.start);

  const handlePauseToggle = () => {
    if (runState === "running") {
      pauseMusic();
      setRunState("paused");
      return;
    }

    if (runState === "paused") {
      lastFrameTsRef.current = null;
      playMusicFromTime(courseTimeRef.current);
      setRunState("running");
    }
  };

  const performJump = () => {
    if (runStateRef.current !== "running") {
      return;
    }

    const hasGroundSupport =
      playerYRef.current <= 4 && fallingHoleKeyRef.current === null;

    if (hasGroundSupport) {
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
    <>
      <AdventureGameView
        statusLabel={statusLabel}
        bestScore={bestScore}
        currentScore={currentScore}
        hudCourseTime={hudCourseTime}
        totalDuration={PHASES[PHASES.length - 1].end}
        courseLength={COURSE_LENGTH}
        phase={phase}
        overallCourseProgress={overallCourseProgress}
        runState={runState}
        pauseModalActions={pauseModalActions}
        gameOverModalActions={gameOverModalActions}
        onPauseToggle={handlePauseToggle}
        onJumpInput={handleJumpInput}
        onStart={handleStart}
        deathMessage={deathMessage}
        holes={holesWithPosition}
        courseTimeRef={courseTimeRef}
        playerYRef={playerYRef}
        phaseProgress={phaseProgress}
        helpSlides={ADVENTURE_TUTORIAL_SLIDES}
        formatTime={formatTime}
        playerX={PLAYER_X}
        pixelsPerSecond={PIXELS_PER_SECOND}
        phases={PHASES}
        unlockedPhaseId={unlockedPhaseId}
      />
      <div
        id="rico-adventure-player"
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
      />
    </>
  );
}
