import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useAnimationControls } from "framer-motion";
import { KCelebrateSlogan } from "k-celebrate-slogan";
import { AchievementModal } from "../components/common/AchievementModal";
import { AdminModal } from "../components/auth/AdminModal";
import { AuthModal } from "../components/auth/AuthModal";
import { NoteModal } from "../components/common/NoteModal";
import { PushableButton } from "../components/common/PushableButton";
import { usePageBgm } from "../hooks/usePageBgm";
import {
  PUZZLE_MUSEUM_UNLOCK_EVENT,
  PUZZLE_MUSEUM_UNLOCK_KEY,
} from "../constants/puzzle";
import { EASTER_EGG_NOTE_ACCESS_STORAGE_KEY } from "../constants/noteAccess";
import { AppIcon } from "../components/common/AppIcon";
import { LOBBY_BGM_SRC } from "../utils/bgm";
import { useAuthStore } from "../store/useAuthStore";
import { BASE_URL, fetchWithAuth } from "../utils/api";
import { useToastStore } from "../store/useToastStore";
import {
  addAchievementToast,
  parseAchievementAwardResponse,
} from "../utils/achievementAwards";
import {
  LobbyHotspot,
  LobbyIconTile,
} from "../features/lobby/LobbyHotspot";
import {
  getLobbyNoteContent,
  type LobbyNoteKey,
} from "../features/lobby/lobbyNotes";

const SLOGAN_COLLECTOR_CODE = "SLOGAN_COLLECTOR";
const SLOGAN_COLLECTOR_STORAGE_KEY = "lobby_slogan_collector_unlocked";
const CLICK_DROP_THRESHOLD = 100;
const CLICK_SHAKE_MILESTONES = new Set(
  Array.from({ length: 10 }, (_, index) => index * 10).concat(1),
);

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
    backgroundImage.src = "/pages/lobby/background.webp";

    const revealBackground = () => {
      if (!isCancelled) {
        setBackgroundSrc("/pages/lobby/background.webp");
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
