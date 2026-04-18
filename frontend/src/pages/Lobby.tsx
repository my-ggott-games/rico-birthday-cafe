import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useAnimationControls } from "framer-motion";
import { KCelebrateSlogan } from "k-celebrate-slogan";
import { AchievementModal } from "../components/common/AchievementModal";
import { AdminModal } from "../components/auth/AdminModal";
import { AuthModal } from "../components/auth/AuthModal";
import {
  NoteModal,
  type NoteModalContent,
} from "../components/common/NoteModal";
import { PushableButton } from "../components/common/PushableButton";
import { usePageBgm } from "../hooks/usePageBgm";
import {
  PUZZLE_MUSEUM_UNLOCK_EVENT,
  PUZZLE_MUSEUM_UNLOCK_KEY,
} from "../constants/puzzle";
import { EASTER_EGG_NOTE_ACCESS_STORAGE_KEY } from "../constants/noteAccess";
import { AppIcon } from "../components/common/AppIcon";
import type { AppIconName } from "../components/common/appIconRegistry";
import { LOBBY_BGM_SRC } from "../utils/bgm";
import { useAuthStore } from "../store/useAuthStore";
import { BASE_URL, fetchWithAuth } from "../utils/api";
import { useToastStore } from "../store/useToastStore";
import {
  addAchievementToast,
  parseAchievementAwardResponse,
} from "../utils/achievementAwards";

// ── Colour utilities ──────────────────────────────────────────────────────────

const hexToHsl = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return [hue, saturation * 100, lightness * 100];
};

const hslToHex = (h: number, s: number, l: number): string => {
  const sf = s / 100;
  const lf = l / 100;
  const c = (1 - Math.abs(2 * lf - 1)) * sf;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lf - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.round(Math.max(0, Math.min(255, (v + m) * 255)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
};

const darkenHex = (hex: string, lightnessDelta: number): string => {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - lightnessDelta));
};

const SLOGAN_COLLECTOR_CODE = "SLOGAN_COLLECTOR";
const SLOGAN_COLLECTOR_STORAGE_KEY = "lobby_slogan_collector_unlocked";
const CLICK_DROP_THRESHOLD = 100;
const CLICK_SHAKE_MILESTONES = new Set(
  Array.from({ length: 10 }, (_, index) => index * 10).concat(1),
);

type LobbyNoteKey = "cody" | "puzzle" | "asparagus" | "adventure";

const LOBBY_NOTE_CONTENT: Record<LobbyNoteKey, NoteModalContent> = {
  cody: {
    title: "비하인드 스토리",
    eyebrow: "리코의 외출 준비",
    icon: "StickyNote",
    accentColor: "#e7bcc2",
    backgroundColor: "#FFF1F3",
    bodyBackgroundColor: "rgba(255,255,255,0.82)",
    content: (
      <>
        <p>
          눈치 챘나요? 동물농장 미니게임 크라라의 외출을 모티브로 만들었어요.
        </p>
        <p>일러스트 작가님과 함께 작업하니 마마와 파파가 된 기분이네요!</p>
        <p>작가님... 한복 패턴 한땀한땀 작업하느라 힘드셨죠...</p>
        <p>제가 그림에 무지해서 복잡한 패턴을 생각 못 했어요...</p>
      </>
    ),
    signature: "CODE NAME: G",
  },
  puzzle: {
    title: "비하인드 스토리",
    eyebrow: "퍼즐 맞추기",
    icon: "StickyNote",
    accentColor: "#ddd1bf",
    backgroundColor: "#F7F0E6",
    bodyBackgroundColor: "rgba(255,255,255,0.82)",
    iconBackgroundColor: "rgba(221,209,191,0.25)",
    content: (
      <>
        <p>한국인은 밥심이죠. 한국에 있는 이세계인에게도 예외는 없어요.</p>
        <p>맛있는 음식 많이 먹고 행복한 하루 보냈으면 좋겠어요.</p>
        <p>
          뭘 좋아할지 몰라 다 차려봤어요. 제일 먼저 먹고싶은 음식은 무엇인가요?
        </p>
      </>
    ),
    signature: "CODE NAME: G",
  },
  asparagus: {
    title: "비하인드 스토리",
    eyebrow: "아스파라거스 키우기",
    icon: "StickyNote",
    accentColor: "#aad0b2",
    backgroundColor: "#EFF8F1",
    bodyBackgroundColor: "rgba(255,255,255,0.82)",
    content: (
      <>
        <p>아스파라거스의 실제 성장 과정을 참고해 단계를 구상했어요.</p>
        <p>사실 성검 아스파라거스... 저도 못 만들었어요... 너무 어렵네요.</p>
        <p>아이템 사용도 3번까지였는데 5번으로 늘렸어요.</p>
        <p>언젠가 어디선가 누군가 나타나서 어떻게든 깨주지 않으려나...</p>
      </>
    ),
    signature: "CODE NAME: G",
  },
  adventure: {
    title: "비하인드 스토리",
    eyebrow: "용사 리코 이야기 1",
    icon: "StickyNote",
    accentColor: "#aebed7",
    backgroundColor: "#EEF3FB",
    bodyBackgroundColor: "rgba(255,255,255,0.82)",
    content: (
      <>
        <p>치코는 오케스트라 소속 단원으로 활동하고 있어요.</p>
        <p>한 OST 악보를 받아 합주하던 그 순간,</p>
        <p>리코가 이세계에서 마왕을 잡는 이야기가 떠올랐어요.</p>
        <p>상상하던 이야기의 프롤로그입니다.</p>
      </>
    ),
    signature: "CODE NAME: G",
  },
};

const getLobbyNoteContent = (
  noteKey: LobbyNoteKey,
  isPuzzleMuseumUnlocked: boolean,
): NoteModalContent => {
  if (noteKey !== "puzzle") {
    return LOBBY_NOTE_CONTENT[noteKey];
  }

  if (isPuzzleMuseumUnlocked) {
    return LOBBY_NOTE_CONTENT.puzzle;
  }

  return {
    ...LOBBY_NOTE_CONTENT.puzzle,
    accentColor: "#84bf2e",
    backgroundColor: "#F2F9E5",
    iconBackgroundColor: "rgba(132,191,46,0.18)",
  };
};

const LobbyIconTile = ({
  name,
  icon,
  isMobile,
  bgColor,
  borderColor,
  iconColor,
}: {
  name: string;
  icon: AppIconName;
  isMobile: boolean;
  bgColor: string;
  borderColor?: string;
  iconColor?: string;
}) => {
  const resolvedBorder = borderColor ?? darkenHex(bgColor, 14);
  const resolvedIcon = iconColor ?? darkenHex(bgColor, 42);
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex items-center justify-center rounded-[1.35rem] border-4 opacity-100 shadow-xl transition-transform group-hover:-translate-y-0.5 ${isMobile ? "h-20 w-20" : "h-24 w-24"}`}
        style={{ backgroundColor: `${bgColor}d9`, borderColor: resolvedBorder }}
      >
        <AppIcon
          name={icon}
          size={isMobile ? 28 : 34}
          style={{ color: resolvedIcon }}
        />
      </div>
      <div
        className={`mt-2 rounded-xl border-2 border-[#D6C0B0] bg-pale-custard opacity-100 font-bold text-[#166D77] shadow-md transition-colors ${isMobile ? "px-3 py-1 text-xs" : "px-4 py-2"}`}
      >
        {name}
      </div>
    </div>
  );
};

const LobbyHotspot = ({
  to,
  noteKey,
  noteVisible,
  onOpenNote,
  children,
  isMobile,
}: {
  to: string;
  noteKey: LobbyNoteKey;
  noteVisible: boolean;
  onOpenNote: (key: LobbyNoteKey) => void;
  children: React.ReactNode;
  isMobile: boolean;
}) => {
  return (
    <div
      className="relative flex w-full justify-center"
      style={{ width: isMobile ? undefined : "auto" }}
    >
      <Link to={to} className="relative group flex w-full justify-center">
        {children}
      </Link>
      {noteVisible && (
        <button
          type="button"
          aria-label={`${LOBBY_NOTE_CONTENT[noteKey].title} 열기`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpenNote(noteKey);
          }}
          className="absolute right-[calc(50%-3.6rem)] top-[-0.7rem] z-10 rounded-2xl border-2 border-[#D6B089] bg-[#FFF4D8] p-2 text-[#9B6A3D] shadow-[0_8px_18px_rgba(128,87,40,0.2)] transition-transform duration-150 hover:-translate-y-0.5"
        >
          <AppIcon name="StickyNote" size={isMobile ? 16 : 18} />
        </button>
      )}
    </div>
  );
};

const Lobby: React.FC = () => {
  usePageBgm(LOBBY_BGM_SRC);
  const isGuest = useAuthStore((state) => state.isGuest);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [backgroundSrc, setBackgroundSrc] = useState(
    "/pages/lobby/background-thumb.jpg",
  );
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEasterEggNoteAccess, setIsEasterEggNoteAccess] = useState(
    window.localStorage.getItem(EASTER_EGG_NOTE_ACCESS_STORAGE_KEY) === "true",
  );
  const [isNoteToggleOn, setIsNoteToggleOn] = useState(true);
  const [activeNoteKey, setActiveNoteKey] = useState<LobbyNoteKey | null>(null);
  const [isPuzzleMuseumUnlocked, setIsPuzzleMuseumUnlocked] = useState(
    window.localStorage.getItem(PUZZLE_MUSEUM_UNLOCK_KEY) === "true",
  );
  const [happyBirthdayClickCount, setHappyBirthdayClickCount] = useState(0);
  const [sloganClickCount, setSloganClickCount] = useState(0);
  const [isSloganCollectorUnlocked, setIsSloganCollectorUnlocked] = useState(
    window.localStorage.getItem(SLOGAN_COLLECTOR_STORAGE_KEY) === "true",
  );
  const [isHappyBirthdayDropping, setIsHappyBirthdayDropping] = useState(false);
  const [isHappyBirthdayHidden, setIsHappyBirthdayHidden] = useState(false);
  const [isSloganDropping, setIsSloganDropping] = useState(false);
  const [isSloganHidden, setIsSloganHidden] = useState(false);
  const happyBirthdayControls = useAnimationControls();
  const sloganControls = useAnimationControls();

  useEffect(() => {
    console.log("519_2024"); // Easter Egg
    let isCancelled = false;

    const handleResize = () => setWindowWidth(window.innerWidth);
    const handlePuzzleUnlock = () =>
      setIsPuzzleMuseumUnlocked(
        window.localStorage.getItem(PUZZLE_MUSEUM_UNLOCK_KEY) === "true",
      );
    const backgroundImage = new Image();
    backgroundImage.src = "/pages/lobby/background.jpg";

    const revealBackground = () => {
      if (!isCancelled) {
        setBackgroundSrc("/pages/lobby/background.jpg");
      }
    };

    if (backgroundImage.complete) {
      revealBackground();
    } else {
      backgroundImage.onload = revealBackground;
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("storage", handlePuzzleUnlock);
    window.addEventListener(PUZZLE_MUSEUM_UNLOCK_EVENT, handlePuzzleUnlock);

    return () => {
      isCancelled = true;
      backgroundImage.onload = null;
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("storage", handlePuzzleUnlock);
      window.removeEventListener(
        PUZZLE_MUSEUM_UNLOCK_EVENT,
        handlePuzzleUnlock,
      );
    };
  }, []);

  useEffect(() => {
    if (isGuest || !token) {
      return;
    }

    let isCancelled = false;

    const hydrateSloganAchievement = async () => {
      try {
        const response = await fetchWithAuth("/achievements/all");
        if (!response.ok) {
          return;
        }

        const achievements = (await response.json()) as Array<{
          code: string;
          earned: boolean;
        }>;

        const hasUnlocked = achievements.some(
          (achievement) =>
            achievement.code === SLOGAN_COLLECTOR_CODE && achievement.earned,
        );

        if (isCancelled || !hasUnlocked) {
          return;
        }

        window.localStorage.setItem(SLOGAN_COLLECTOR_STORAGE_KEY, "true");
        setIsSloganCollectorUnlocked(true);
      } catch (error) {
        console.error("Failed to hydrate slogan collector achievement", error);
      }
    };

    void hydrateSloganAchievement();

    return () => {
      isCancelled = true;
    };
  }, [isGuest, token]);

  const triggerHappyBirthdayShake = useCallback(() => {
    void happyBirthdayControls.start({
      y: [0, -4, 3, -3, 2, 0],
      transition: { duration: 0.34, ease: "easeInOut" },
    });
  }, [happyBirthdayControls]);

  const triggerSloganShake = useCallback(() => {
    void sloganControls.start({
      y: [0, -4, 3, -3, 2, 0],
      transition: { duration: 0.34, ease: "easeInOut" },
    });
  }, [sloganControls]);

  const unlockSloganCollectorAchievement = useCallback(async () => {
    if (
      isGuest ||
      !token ||
      isSloganCollectorUnlocked ||
      window.localStorage.getItem(SLOGAN_COLLECTOR_STORAGE_KEY) === "true"
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/achievements/award/${SLOGAN_COLLECTOR_CODE}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        return;
      }

      const awardResult = await parseAchievementAwardResponse(response);
      if (!awardResult) {
        return;
      }

      window.localStorage.setItem(SLOGAN_COLLECTOR_STORAGE_KEY, "true");
      setIsSloganCollectorUnlocked(true);

      if (awardResult.awarded) {
        addAchievementToast(addToast, awardResult.achievement, "lobby");
      }
    } catch (error) {
      console.error("Failed to award slogan collector achievement", error);
    }
  }, [addToast, isGuest, isSloganCollectorUnlocked, token]);

  const triggerHappyBirthdayDrop = useCallback(() => {
    if (isHappyBirthdayDropping || isHappyBirthdayHidden) {
      return;
    }

    const viewportHeight = window.innerHeight;
    const bounceFloor = viewportHeight * 0.5;
    const bounceUp = Math.max(bounceFloor - 32, 0);

    setIsHappyBirthdayDropping(true);

    void happyBirthdayControls.start({
      y: [0, bounceFloor, bounceUp],
      rotate: [0, 1.6, -1.1],
      transition: {
        duration: 1.05,
        ease: ["easeIn", "easeOut", "easeOut"],
        times: [0, 0.86, 1],
      },
    });
  }, [happyBirthdayControls, isHappyBirthdayDropping, isHappyBirthdayHidden]);

  const triggerSloganDrop = useCallback(() => {
    if (isSloganDropping || isSloganHidden) {
      return;
    }

    const viewportHeight = window.innerHeight;
    const bounceFloor = viewportHeight * 0.5;
    const bounceUp = Math.max(bounceFloor - 32, 0);

    setIsSloganDropping(true);

    void sloganControls.start({
      y: [0, bounceFloor, bounceUp],
      rotate: [0, 1.6, -1.1],
      transition: {
        duration: 1.05,
        ease: ["easeIn", "easeOut", "easeOut"],
        times: [0, 0.86, 1],
      },
    });
  }, [sloganControls, isSloganHidden, isSloganDropping]);

  const handleHappyBirthdayClick = useCallback(() => {
    if (isHappyBirthdayDropping || isHappyBirthdayHidden) {
      return;
    }

    const nextClickCount = happyBirthdayClickCount + 1;
    setHappyBirthdayClickCount(nextClickCount);

    if (nextClickCount >= CLICK_DROP_THRESHOLD) {
      triggerHappyBirthdayDrop();
      return;
    }

    if (CLICK_SHAKE_MILESTONES.has(nextClickCount)) {
      triggerHappyBirthdayShake();
    }
  }, [
    happyBirthdayClickCount,
    isHappyBirthdayDropping,
    isHappyBirthdayHidden,
    triggerHappyBirthdayDrop,
    triggerHappyBirthdayShake,
  ]);

  const handleSloganClick = useCallback(() => {
    if (isHappyBirthdayHidden === false || isSloganDropping || isSloganHidden) {
      return;
    }

    const nextClickCount = sloganClickCount + 1;
    setSloganClickCount(nextClickCount);

    if (nextClickCount >= CLICK_DROP_THRESHOLD) {
      void unlockSloganCollectorAchievement();
      triggerSloganDrop();
      return;
    }

    if (CLICK_SHAKE_MILESTONES.has(nextClickCount)) {
      triggerSloganShake();
    }
  }, [
    isHappyBirthdayHidden,
    isSloganDropping,
    isSloganHidden,
    sloganClickCount,
    triggerSloganShake,
    unlockSloganCollectorAchievement,
    triggerSloganDrop,
  ]);

  const isMobile = windowWidth < 768;
  const hasSecretNoteAccess = isAdmin || isEasterEggNoteAccess;
  const canViewSecretNotes = hasSecretNoteAccess && isNoteToggleOn;
  const noteToggleButton = hasSecretNoteAccess ? (
    <button
      type="button"
      aria-label={isNoteToggleOn ? "쪽지 숨기기" : "쪽지 보이기"}
      aria-pressed={isNoteToggleOn}
      onClick={() => setIsNoteToggleOn((current) => !current)}
      className={`inline-flex items-center justify-center self-center rounded-full border-2 shadow-[0_8px_18px_rgba(128,87,40,0.2)] ${
        isNoteToggleOn
          ? "border-[#D6B089] bg-[#FFF4D8] text-[#9B6A3D]"
          : "border-[#D6C0B0] bg-[#FFF8EA] text-[#B7A28D] opacity-80"
      } ${isMobile ? "h-9 w-9 shrink-0" : "h-[42px] w-[42px] shrink-0"}`}
    >
      <AppIcon name="StickyNote" size={isMobile ? 16 : 18} />
    </button>
  ) : null;
  const profileButton = (
    <PushableButton
      onClick={() => {
        if (token) {
          setIsAchievementOpen(true);
        } else {
          setIsAuthOpen(true);
        }
      }}
      variant="mint"
      className={`${isMobile ? "min-h-9 px-3 py-1 text-sm" : "min-h-[2.75rem] px-7 py-2 text-base"} rounded-full`}
    >
      <span className="flex items-center gap-1.5">
        <AppIcon name="IdCardLanyard" size={16} />
        {token ? "프로필" : "로그인"}
      </span>
    </PushableButton>
  );
  const creditsButton = (
    <PushableButton
      onClick={() => navigate("/credits")}
      variant="cream"
      className={`${isMobile ? "min-h-9 px-3 py-1 text-sm" : "min-h-[2.75rem] px-7 py-2 text-base"} rounded-full`}
    >
      <span className="flex items-center gap-1.5">
        <AppIcon name="Clapperboard" size={16} /> Who Made This?!
      </span>
    </PushableButton>
  );
  const adminButton = (
    <PushableButton
      onClick={() => setIsAdminOpen(true)}
      variant="black"
      className={`${isMobile ? "fixed bottom-4 left-4 z-20 px-3 py-1 text-sm" : "min-h-[2.75rem] px-5 py-2 text-base"} rounded-full font-mono tracking-tighter`}
    >
      <span className="inline-block">who am I?</span>
    </PushableButton>
  );

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-[#FFFFF8]">
      <div
        className="absolute inset-0 pointer-events-none bg-center bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url('${backgroundSrc}')`,
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-white/30" />

      <div
        className={`relative z-10 w-full min-h-screen select-none ${isMobile ? "px-4 pt-4 pb-8" : "p-10"} flex flex-col`}
      >
        <header
          className={`flex ${isMobile ? "justify-between items-start" : "justify-between items-center"} ${isMobile ? "mb-2" : ""}`}
        >
          <div />
          <div
            className={`${isMobile ? "flex gap-2" : "flex flex-col items-end gap-3"}`}
          >
            {isMobile ? (
              <div className="flex w-full gap-2">
                {noteToggleButton}
                {creditsButton}
                {profileButton}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/50 px-4 py-2.5 shadow-[0_4px_24px_rgba(22,109,119,0.10)] backdrop-blur-sm">
                {noteToggleButton}
                {creditsButton}
                {profileButton}
                {adminButton}
              </div>
            )}
            {!token && !isMobile && (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="rounded-full border border-[#166D77]/20 bg-[#166D77]/8 px-3 py-1 text-xs font-bold text-[#166D77]/70 transition-colors hover:bg-[#166D77]/14 hover:text-[#166D77]"
              >
                로그인하면 업적과 점수를 저장할 수 있어요
              </button>
            )}
          </div>
        </header>
        {!token && isMobile && (
          <button
            type="button"
            onClick={() => setIsAuthOpen(true)}
            className="mb-3 self-center rounded-full border border-[#166D77]/20 bg-[#166D77]/8 px-3 py-1 text-xs font-bold text-[#166D77]/70"
          >
            로그인하면 업적과 점수를 저장할 수 있어요
          </button>
        )}

        {/* Slogan */}
        <div
          className={`lobby-slogan-stage relative flex w-full shrink-0 justify-center overflow-visible`}
          style={{ minHeight: isMobile ? "8rem" : "11rem" }}
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-[25%] w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden">
            <img
              src="/pages/lobby/decor/ezipia.png"
              alt=""
              className="w-[33rem] select-none rotate-90 object-contain"
              draggable={false}
            />
          </div>
          {!isHappyBirthdayHidden && (
            <motion.button
              type="button"
              initial={false}
              animate={happyBirthdayControls}
              onAnimationComplete={() => {
                if (isHappyBirthdayDropping) {
                  setIsHappyBirthdayHidden(true);
                }
              }}
              onClick={handleHappyBirthdayClick}
              className="lobby-slogan-stage__happy-birthday absolute left-1/2 top-1/2 w-[min(86vw,30rem)] -translate-x-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0"
            >
              <div
                className={`relative overflow-hidden rounded-[1.1rem] ${isMobile ? "h-[6.4rem]" : "h-[10rem]"}`}
              >
                <img
                  src="/slogan/happybirthday.jpg"
                  alt="리코 해피버스데이 슬로건"
                  className="h-full w-full select-none object-cover object-center"
                  draggable={false}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[1.1rem]"
                  style={{
                    boxShadow:
                      "-18px 18px 28px rgba(255,255,255,0.18), 14px -14px 24px rgba(26,78,53,0.14), 0 18px 30px rgba(0,0,0,0.16), inset 16px -16px 24px rgba(255,255,255,0.22), inset -18px 18px 30px rgba(30,73,46,0.18)",
                  }}
                />
              </div>
            </motion.button>
          )}
          {!isSloganHidden && (
            <motion.button
              type="button"
              initial={false}
              animate={sloganControls}
              onAnimationComplete={() => {
                if (isSloganDropping) {
                  setIsSloganHidden(true);
                }
              }}
              onClick={handleSloganClick}
              className={`lobby-slogan-stage__banner absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent p-0 border-0 ${isHappyBirthdayHidden ? "cursor-pointer" : ""}`}
            >
              <KCelebrateSlogan
                className="slogan-lobby"
                text1="축하합니다"
                text2="유즈하 리코"
                text3="아무 이유 없음"
                scale={isMobile ? 0.9 : 0.6}
                emblemScale={isMobile ? 0.8 : 0.7}
              />
            </motion.button>
          )}
        </div>
        <div
          className={`flex-1 relative ${isMobile ? "mt-2 grid grid-cols-2 gap-x-3 gap-y-4 place-items-center content-center pb-8" : "mt-6 flex flex-wrap justify-center items-center gap-6 pb-8"}`}
        >
          {/* Hotspot: TPO Cody (Paper Doll Table) */}
          <LobbyHotspot
            to="/game/cody"
            noteKey="cody"
            noteVisible={canViewSecretNotes}
            onOpenNote={setActiveNoteKey}
            isMobile={isMobile}
          >
            <motion.div whileHover={{ scale: 1.05 }} className="group">
              <LobbyIconTile
                name="리코의 외출 준비"
                icon="Shirt"
                isMobile={isMobile}
                bgColor="#FFE4E6"
                borderColor="#e7bcc2"
                iconColor="#cf9aa3"
              />
            </motion.div>
          </LobbyHotspot>

          {/* Hotspot: Mini Game (Puzzle) */}
          <LobbyHotspot
            to="/game/puzzle"
            noteKey="puzzle"
            noteVisible={canViewSecretNotes}
            onOpenNote={setActiveNoteKey}
            isMobile={isMobile}
          >
            <motion.div whileHover={{ scale: 1.05 }} className="group">
              <LobbyIconTile
                name="퍼즐 맞추기"
                icon="Puzzle"
                isMobile={isMobile}
                bgColor={
                  isMobile || isPuzzleMuseumUnlocked ? "#f5ecdd" : "#a3e635"
                }
                borderColor={
                  isMobile || isPuzzleMuseumUnlocked ? "#ddd1bf" : "#84bf2e"
                }
                iconColor={
                  isMobile || isPuzzleMuseumUnlocked ? "#b9ab97" : "#6e9f23"
                }
              />
            </motion.div>
          </LobbyHotspot>

          {/* Hotspot: Asparagus Merge (2048 style) */}
          <LobbyHotspot
            to="/game/asparagus"
            noteKey="asparagus"
            noteVisible={canViewSecretNotes}
            onOpenNote={setActiveNoteKey}
            isMobile={isMobile}
          >
            <motion.div whileHover={{ scale: 1.05 }} className="group">
              <LobbyIconTile
                name="아스파라거스 키우기"
                icon="Sprout"
                isMobile={isMobile}
                bgColor="#d4edda"
                borderColor="#aad0b2"
                iconColor="#2d6a4f"
              />
            </motion.div>
          </LobbyHotspot>

          <LobbyHotspot
            to="/game/adventure"
            noteKey="adventure"
            noteVisible={canViewSecretNotes}
            onOpenNote={setActiveNoteKey}
            isMobile={isMobile}
          >
            <motion.div whileHover={{ scale: 1.05 }} className="group">
              <LobbyIconTile
                name="용사 리코 이야기"
                icon="Swords"
                isMobile={isMobile}
                bgColor="#d8e4f7"
                borderColor="#aebed7"
                iconColor="#102542"
              />
            </motion.div>
          </LobbyHotspot>
        </div>
      </div>
      {isMobile && adminButton}

      <AchievementModal
        isOpen={isAchievementOpen}
        onClose={() => setIsAchievementOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onAccessGranted={(access) => {
          if (access === "easter_egg") {
            setIsEasterEggNoteAccess(true);
          }
        }}
      />
      <NoteModal
        isOpen={activeNoteKey !== null}
        onClose={() => setActiveNoteKey(null)}
        note={
          activeNoteKey
            ? getLobbyNoteContent(activeNoteKey, isPuzzleMuseumUnlocked)
            : null
        }
      />
    </div>
  );
};

export default Lobby;
