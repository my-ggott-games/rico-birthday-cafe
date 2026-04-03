import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { KCelebrateSlogan } from "k-celebrate-slogan";
import { AchievementModal } from "../components/common/AchievementModal";
import { AdminModal } from "../components/auth/AdminModal";
import { usePageBgm } from "../hooks/usePageBgm";
import {
  PUZZLE_MUSEUM_UNLOCK_EVENT,
  PUZZLE_MUSEUM_UNLOCK_KEY,
} from "../constants/puzzle";
import { AppIcon, type AppIconName } from "../components/common/AppIcon";
import { LOBBY_BGM_SRC } from "../utils/bgm";

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

const Lobby: React.FC = () => {
  usePageBgm(LOBBY_BGM_SRC);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [backgroundSrc, setBackgroundSrc] = useState("/lobby-thumb.jpg");
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPuzzleMuseumUnlocked, setIsPuzzleMuseumUnlocked] = useState(
    window.localStorage.getItem(PUZZLE_MUSEUM_UNLOCK_KEY) === "true",
  );

  useEffect(() => {
    console.log("519_2024"); // Easter Egg
    let isCancelled = false;

    const handleResize = () => setWindowWidth(window.innerWidth);
    const handlePuzzleUnlock = () =>
      setIsPuzzleMuseumUnlocked(
        window.localStorage.getItem(PUZZLE_MUSEUM_UNLOCK_KEY) === "true",
      );
    const backgroundImage = new Image();
    backgroundImage.src = "/lobby.jpg";

    const revealBackground = () => {
      if (!isCancelled) {
        setBackgroundSrc("/lobby.jpg");
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

  const isMobile = windowWidth < 768;

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
          className={`flex ${isMobile ? "flex-col items-center gap-2" : "justify-between items-center"} ${isMobile ? "mb-3" : "mb-6"}`}
        >
          <div
            className={`flex ${isMobile ? "flex-wrap justify-center" : ""} gap-2`}
          >
            <Link
              to="/credits"
              className={`${isMobile ? "px-3 py-1 text-sm" : "px-6 py-2"} bg-black rounded-full border-2 border-gray-700 shadow-sm font-black text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-1.5`}
            >
              <AppIcon name="Clapperboard" size={16} /> Who Made This?!
            </Link>
            <button
              onClick={() => setIsAchievementOpen(true)}
              className={`${isMobile ? "px-3 py-1 text-sm" : "px-6 py-2"} bg-cream rounded-full border-2 border-[#5EC7A5] shadow-sm font-black text-[#5EC7A5] hover:bg-[#5EC7A5] hover:text-pale-custard transition-colors flex items-center gap-1.5`}
            >
              <AppIcon name="IdCardLanyard" size={16} /> 프로필
            </button>
            <button
              onClick={() => setIsAdminOpen(true)}
              className={`${isMobile ? "px-3 py-1 text-[10px]" : "px-5 py-2 text-xs"} bg-[#1a1a1a] text-pale-custard/40 rounded-full border border-pale-custard/10 shadow-lg font-mono tracking-tighter hover:text-pale-custard hover:border-[#5EC7A5]/50 transition-all group relative overflow-hidden`}
            >
              <span className="relative z-10 transition-transform group-hover:scale-110 inline-block">
                who am I?
              </span>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#5EC7A5]/0 via-[#5EC7A5]/5 to-[#5EC7A5]/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </header>

        {/* Slogan */}
        <div className="flex justify-center w-full shrink-0">
          <KCelebrateSlogan
            className="slogan-lobby"
            text1="축하합니다"
            text2="유즈하 리코"
            text3="아무 이유 없음"
            scale={isMobile ? 0.82 : 0.8}
            emblemScale={isMobile ? 0.72 : 0.7}
          />
        </div>

        <div
          className={`flex-1 relative ${isMobile ? "mt-2 grid grid-cols-2 gap-x-3 gap-y-4 place-items-center content-start pb-8" : "mt-4"}`}
        >
          {/* Hotspot: TPO Cody (Paper Doll Table) */}
          <Link
            to="/game/cody"
            className={
              isMobile
                ? "relative group w-full flex justify-center"
                : "absolute top-10 left-20 group"
            }
          >
            <motion.div whileHover={{ scale: 1.05 }} className="group">
              <LobbyIconTile
                name="리코의 외출준비"
                icon="Shirt"
                isMobile={isMobile}
                className="border-[#e7bcc2] bg-[#FFE4E6]/30 group-hover:bg-[#FFE4E6]/85"
                iconClassName="text-[#cf9aa3]"
              />
            </motion.div>
          </Link>

          {/* Hotspot: Itabag (Display Table) - Positioned differently for mobile */}
          <Link
            to="/game/itabag"
            className={
              isMobile
                ? "relative group w-full flex justify-center"
                : "absolute bottom-10 right-[20%] group"
            }
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

          {/* Hotspot: Mini Game (Puzzle) */}
          <Link
            to="/game/puzzle"
            className={
              isMobile
                ? "relative group w-full flex justify-center"
                : "absolute top-20 right-20 group"
            }
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
          </Link>

          {/* Hotspot: Asparagus Merge (2048 style) */}
          <Link
            to="/game/asparagus"
            className={
              isMobile
                ? "relative group w-full flex justify-center"
                : "absolute bottom-8 left-[24%] -translate-x-1/2 group"
            }
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
          </Link>

          {/* Hotspot: Rico's Fortune (Omikuji) */}
          <Link
            to="/game/fortune"
            className={
              isMobile
                ? "relative group w-full flex justify-center"
                : "absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 group"
            }
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
          </Link>

          <Link
            to="/game/adventure"
            className={
              isMobile
                ? "relative group w-full flex justify-center"
                : "absolute bottom-[18%] right-[42%] group"
            }
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
          </Link>
        </div>
      </div>

      <AchievementModal
        isOpen={isAchievementOpen}
        onClose={() => setIsAchievementOpen(false)}
      />

      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
};

export default Lobby;
