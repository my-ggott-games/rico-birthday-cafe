import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useAnimationControls } from "framer-motion";
import { KCelebrateSlogan } from "k-celebrate-slogan";
import { AchievementModal } from "../components/common/AchievementModal";
import { AdminModal } from "../components/auth/AdminModal";
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
import { AppIcon, type AppIconName } from "../components/common/AppIcon";
import { LOBBY_BGM_SRC } from "../utils/bgm";
import { useAuthStore } from "../store/useAuthStore";
import { BASE_URL, fetchWithAuth } from "../utils/api";
import { useToastStore } from "../store/useToastStore";

const SLOGAN_COLLECTOR_CODE = "SLOGAN_COLLECTOR";
const SLOGAN_COLLECTOR_STORAGE_KEY = "lobby_slogan_collector_unlocked";
const CLICK_DROP_THRESHOLD = 100;
const CLICK_SHAKE_MILESTONES = new Set(
  Array.from({ length: 10 }, (_, index) => index * 10).concat(1),
);

type LobbyNoteKey =
  | "cody"
  | "puzzle"
  | "asparagus"
  | "fortune"
  | "adventure";

const LOBBY_NOTE_CONTENT: Record<LobbyNoteKey, NoteModalContent> = {
  cody: {
    title: "외출 준비대 메모",
    eyebrow: "Dress Room",
    icon: "StickyNote",
    content: (
      <>
        <p>리코는 작은 리본 하나만 달라도 하루 기분이 달라진대.</p>
        <p>오늘은 어떤 조합이 가장 리코답게 보일까?</p>
      </>
    ),
    signature: "stylist memo",
  },
  puzzle: {
    title: "복원 기록",
    eyebrow: "Museum Draft",
    icon: "StickyNote",
    content: (
      <>
        <p>조각은 흩어져도 그림이 기억하는 중심은 사라지지 않아.</p>
        <p>끝까지 맞추면 로비에 남아 있던 분위기도 조금 달라질 거야.</p>
      </>
    ),
    signature: "curation team",
  },
  asparagus: {
    title: "재배 안내",
    eyebrow: "Greenhouse",
    icon: "StickyNote",
    content: (
      <>
        <p>욕심내서 너무 빨리 키우면 모양은 커져도 귀여움이 줄어든다.</p>
        <p>조금 느려 보여도 끝까지 합치면 의외로 대단한 게 나온다.</p>
      </>
    ),
    signature: "garden log",
  },
  fortune: {
    title: "오늘의 참고사항",
    eyebrow: "Fortune Slip",
    icon: "StickyNote",
    content: (
      <>
        <p>좋은 운세는 믿고, 애매한 운세는 재해석하고, 나쁜 운세는 웃어넘길 것.</p>
        <p>결국 오늘을 만드는 건 뽑은 종이보다 지금 기분에 더 가깝다.</p>
      </>
    ),
    signature: "counter note",
  },
  adventure: {
    title: "용사 관찰일지",
    eyebrow: "Field Note",
    icon: "StickyNote",
    content: (
      <>
        <p>검을 들고 있어도 리코의 본질은 귀여움 쪽에 더 가깝다.</p>
        <p>하지만 방심하면 누구보다 빠르게 세계관을 장악할 수 있음.</p>
      </>
    ),
    signature: "anonymous witness",
  },
};

const LobbyIconTile = ({
  name,
  icon,
  isMobile,
  className,
  iconClassName,
}: {
  name: string;
  icon: AppIconName;
  isMobile: boolean;
  className: string;
  iconClassName?: string;
}) => (
  <div className="flex flex-col items-center">
    <div
      className={`flex items-center justify-center rounded-[1.35rem] border-4 shadow-xl transition-transform transition-colors group-hover:-translate-y-0.5 ${isMobile ? "h-20 w-20" : "h-24 w-24"} ${className}`}
    >
      <AppIcon
        name={icon}
        size={isMobile ? 28 : 34}
        className={iconClassName}
      />
    </div>
    <div
      className={`mt-2 bg-pale-custard ${isMobile ? "px-3 py-1 text-xs" : "px-4 py-2"} rounded-xl font-bold text-[#166D77] shadow-md border-2 border-[#D6C0B0] transition-colors`}
    >
      {name}
    </div>
  </div>
);

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
}) => (
  <div
    className="relative flex w-full justify-center"
    style={{ width: isMobile ? undefined : "auto" }}
  >
    <Link to={to} className="relative group flex w-full justify-center">
      {children}
    </Link>
    <button
      type="button"
      aria-label={`${LOBBY_NOTE_CONTENT[noteKey].title} 열기`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpenNote(noteKey);
      }}
      className={`absolute right-[calc(50%-3.6rem)] top-[-0.7rem] z-10 rounded-2xl border-2 border-[#D6B089] bg-[#FFF4D8] p-2 text-[#9B6A3D] shadow-[0_8px_18px_rgba(128,87,40,0.2)] transition-transform duration-150 hover:-translate-y-0.5 ${noteVisible ? "block" : "hidden"}`}
    >
      <AppIcon name="StickyNote" size={isMobile ? 16 : 18} />
    </button>
  </div>
);

const Lobby: React.FC = () => {
  usePageBgm(LOBBY_BGM_SRC);
  const isGuest = useAuthStore((state) => state.isGuest);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [backgroundSrc, setBackgroundSrc] = useState(
    "/pages/lobby/background-thumb.jpg",
  );
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isEasterEggNoteAccess, setIsEasterEggNoteAccess] = useState(
    window.localStorage.getItem(EASTER_EGG_NOTE_ACCESS_STORAGE_KEY) === "true",
  );
  const [activeNoteKey, setActiveNoteKey] = useState<LobbyNoteKey | null>(null);
  const [isPuzzleMuseumUnlocked, setIsPuzzleMuseumUnlocked] = useState(
    window.localStorage.getItem(PUZZLE_MUSEUM_UNLOCK_KEY) === "true",
  );
  const [concertClickCount, setConcertClickCount] = useState(0);
  const [sloganClickCount, setSloganClickCount] = useState(0);
  const [, setIsSloganCollectorUnlocked] = useState(
    window.localStorage.getItem(SLOGAN_COLLECTOR_STORAGE_KEY) === "true",
  );
  const [isConcertDropping, setIsConcertDropping] = useState(false);
  const [isConcertHidden, setIsConcertHidden] = useState(false);
  const [isSloganDropping, setIsSloganDropping] = useState(false);
  const [isSloganHidden, setIsSloganHidden] = useState(false);
  const concertControls = useAnimationControls();
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

  const triggerConcertShake = useCallback(() => {
    void concertControls.start({
      y: [0, -4, 3, -3, 2, 0],
      transition: { duration: 0.34, ease: "easeInOut" },
    });
  }, [concertControls]);

  const triggerSloganShake = useCallback(() => {
    void sloganControls.start({
      y: [0, -4, 3, -3, 2, 0],
      transition: { duration: 0.34, ease: "easeInOut" },
    });
  }, [sloganControls]);

  const unlockSloganCollectorAchievement = useCallback(async () => {
    if (isGuest || !token) {
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

      const newlyAwarded = (await response.json()) === true;
      window.localStorage.setItem(SLOGAN_COLLECTOR_STORAGE_KEY, "true");
      setIsSloganCollectorUnlocked(true);

      if (newlyAwarded) {
        addToast({
          title: "슬로건을 탐낸 자",
          description: "카페 소품을 소중히 다뤄주세요!",
          icon: "Hand",
        });
      }
    } catch (error) {
      console.error("Failed to award slogan collector achievement", error);
    }
  }, [addToast, isGuest, token]);

  const triggerConcertDrop = useCallback(() => {
    if (isConcertDropping || isConcertHidden) {
      return;
    }

    const viewportHeight = window.innerHeight;
    const bounceFloor = viewportHeight * 0.5;
    const bounceUp = Math.max(bounceFloor - 32, 0);

    setIsConcertDropping(true);

    void concertControls.start({
      y: [0, bounceFloor, bounceUp],
      rotate: [0, 1.6, -1.1],
      transition: {
        duration: 1.05,
        ease: ["easeIn", "easeOut", "easeOut"],
        times: [0, 0.86, 1],
      },
    });
  }, [concertControls, isConcertDropping, isConcertHidden]);

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

  const handleConcertClick = useCallback(() => {
    if (isConcertDropping || isConcertHidden) {
      return;
    }

    const nextClickCount = concertClickCount + 1;
    setConcertClickCount(nextClickCount);

    if (nextClickCount >= CLICK_DROP_THRESHOLD) {
      triggerConcertDrop();
      return;
    }

    if (CLICK_SHAKE_MILESTONES.has(nextClickCount)) {
      triggerConcertShake();
    }
  }, [
    concertClickCount,
    isConcertDropping,
    isConcertHidden,
    triggerConcertDrop,
    triggerConcertShake,
  ]);

  const handleSloganClick = useCallback(() => {
    if (isConcertHidden === false || isSloganDropping || isSloganHidden) {
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
    isConcertHidden,
    isSloganDropping,
    isSloganHidden,
    sloganClickCount,
    triggerSloganShake,
    unlockSloganCollectorAchievement,
    triggerSloganDrop,
  ]);

  const isMobile = windowWidth < 768;
  const canViewSecretNotes = isAdmin || isEasterEggNoteAccess;
  const profileButton = (
    <PushableButton
      onClick={() => setIsAchievementOpen(true)}
      disabled={isGuest}
      variant="mint"
      className={`${isMobile ? "min-h-9 px-3 py-1 text-sm" : "px-6 py-2"} rounded-full disabled:cursor-not-allowed`}
    >
      <span className="flex items-center gap-1.5">
        <AppIcon name="IdCardLanyard" size={16} /> 프로필
      </span>
    </PushableButton>
  );
  const creditsButton = (
    <PushableButton
      onClick={() => navigate("/credits")}
      variant="cream"
      className={`${isMobile ? "min-h-9 px-3 py-1 text-sm" : "px-6 py-2"} rounded-full`}
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
      className={`${isMobile ? "fixed bottom-4 left-4 z-20 px-3 py-1 text-sm" : "px-5 py-2"} rounded-full font-mono tracking-tighter`}
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
        className={`relative z-10 w-full min-h-screen ${isMobile ? "px-4 pt-4 pb-8" : "p-10"} flex flex-col`}
      >
        <header
          className={`flex ${isMobile ? "justify-between items-start" : "justify-between items-center"} ${isMobile ? "mb-2" : ""}`}
        >
          <div />
          <div
            className={`${isMobile ? "flex gap-2" : "flex flex-col items-end gap-3"}`}
          >
            {isMobile ? (
              <div className="flex w-full  gap-2">
                {creditsButton}
                {profileButton}
              </div>
            ) : (
              <div className="flex gap-2">
                {creditsButton}
                {profileButton}
                {adminButton}
              </div>
            )}
            {isGuest && !isMobile && (
              <p className="rounded-full border border-[#166D77]/20 bg-[#166D77]/10 px-3 py-1 text-xs font-bold text-[#166D77]">
                게스트 모드: 프로필/업적/기록 저장 사용 불가
              </p>
            )}
          </div>
        </header>
        {isGuest && isMobile && (
          <p className="mb-3 self-center rounded-full border border-[#166D77]/20 bg-[#166D77]/10 px-3 py-1 text-xs font-bold text-[#166D77]">
            게스트 모드: 프로필/업적/기록 저장 사용 불가
          </p>
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
          {!isConcertHidden && (
            <motion.button
              type="button"
              initial={false}
              animate={concertControls}
              onAnimationComplete={() => {
                if (isConcertDropping) {
                  setIsConcertHidden(true);
                }
              }}
              onClick={handleConcertClick}
              className="lobby-slogan-stage__concert absolute left-1/2 top-1/2 w-[min(86vw,30rem)] -translate-x-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0"
            >
              <div
                className={`relative overflow-hidden rounded-[1.1rem] ${isMobile ? "h-[6.4rem]" : "h-[10rem]"}`}
              >
                <img
                  src="/slogan/concert.jpg"
                  alt="리코 콘서트 슬로건"
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
              className={`lobby-slogan-stage__banner absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent p-0 border-0 ${isConcertHidden ? "cursor-pointer" : ""}`}
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
          className={`flex-1 relative ${isMobile ? "mt-2 grid grid-cols-2 gap-x-3 gap-y-4 place-items-center content-start pb-8" : "mt-6 flex flex-wrap justify-center items-center gap-6 pb-8"}`}
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
                className="border-[#e7bcc2] bg-[#FFE4E6]/30 group-hover:bg-[#FFE4E6]/85"
                iconClassName="text-[#cf9aa3]"
              />
            </motion.div>
          </LobbyHotspot>

          {/* Hotspot: Itabag (Display Table)
          <Link
            to="/game/itabag"
            className="relative group w-full flex justify-center"
            style={{ width: isMobile ? undefined : "auto" }}
          >
            <motion.div whileHover={{ scale: 1.05 }} className="group">
              <LobbyIconTile
                name="이타백 꾸미기"
                icon="Handbag"
                isMobile={isMobile}
                className="border-[#e5dcc7] bg-[#fff8e8]/30 group-hover:bg-[#fff8e8]/85"
                iconClassName="text-[#166D77]"
              />
            </motion.div>
          </Link>
          */}

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
                className={
                  isPuzzleMuseumUnlocked
                    ? "border-[#ddd1bf] bg-[#f5ecdd]/30 group-hover:bg-[#f5ecdd]/85"
                    : "border-[#84bf2e] bg-[#a3e635]/30 group-hover:bg-[#a3e635]/85"
                }
                iconClassName={
                  isPuzzleMuseumUnlocked ? "text-[#b9ab97]" : "text-[#6e9f23]"
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
                className="border-[#aad0b2] bg-[#d4edda]/30 group-hover:bg-[#d4edda]/85"
                iconClassName="text-[#2d6a4f]"
              />
            </motion.div>
          </LobbyHotspot>

          {/* Hotspot: Rico's Fortune (Omikuji) */}
          <LobbyHotspot
            to="/game/fortune"
            noteKey="fortune"
            noteVisible={canViewSecretNotes}
            onOpenNote={setActiveNoteKey}
            isMobile={isMobile}
          >
            <motion.div whileHover={{ scale: 1.05 }} className="group">
              <LobbyIconTile
                name="오늘의 운세"
                icon="ScrollText"
                isMobile={isMobile}
                className="border-[#b79880] bg-[#D6C0B0]/30 group-hover:bg-[#D6C0B0]/85"
                iconClassName="text-[#8B5A2B]"
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
                className="border-[#aebed7] bg-[#d8e4f7]/30 group-hover:bg-[#d8e4f7]/85"
                iconClassName="text-[#102542]"
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
        note={activeNoteKey ? LOBBY_NOTE_CONTENT[activeNoteKey] : null}
      />
    </div>
  );
};

export default Lobby;
