import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { KCelebrateSlogan } from "k-celebrate-slogan";
import { AchievementModal } from "../components/common/AchievementModal";
import { AdminModal } from "../components/auth/AdminModal";
import {
  PUZZLE_MUSEUM_UNLOCK_EVENT,
  PUZZLE_MUSEUM_UNLOCK_KEY,
} from "../constants/puzzle";
import { AppIcon } from "../components/common/AppIcon";

const CIRCLE_DOT_RED = "#ef4444";

const Lobby: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPuzzleMuseumUnlocked, setIsPuzzleMuseumUnlocked] = useState(
    window.localStorage.getItem(PUZZLE_MUSEUM_UNLOCK_KEY) === "true",
  );

  useEffect(() => {
    console.log("519_2024"); // Easter Egg

    const handleResize = () => setWindowWidth(window.innerWidth);
    const handlePuzzleUnlock = () =>
      setIsPuzzleMuseumUnlocked(
        window.localStorage.getItem(PUZZLE_MUSEUM_UNLOCK_KEY) === "true",
      );

    window.addEventListener("resize", handleResize);
    window.addEventListener("storage", handlePuzzleUnlock);
    window.addEventListener(PUZZLE_MUSEUM_UNLOCK_EVENT, handlePuzzleUnlock);

    return () => {
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
      {/* Background: Cafe Interior */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(#5EC7A5 2px, transparent 2px), radial-gradient(#5EC7A5 2px, transparent 2px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 20px 20px",
        }}
      />
      {/* Floor */}
      <div className="absolute bottom-0 w-full h-1/3 bg-[#f3e6d8] border-t-8 border-[#D6C0B0]" />

      <div
        className={`relative z-10 w-full min-h-screen ${isMobile ? "px-4 pt-4 pb-8" : "p-10"} flex flex-col`}
      >
        <header
          className={`flex ${isMobile ? "flex-col items-center gap-2" : "justify-between items-center"} ${isMobile ? "mb-3" : "mb-6"}`}
        >
          <h2
            className={`${isMobile ? "text-2xl" : "text-4xl"} flex items-center gap-2 font-black text-[#166D77] drop-shadow-sm rotate-[-1deg]`}
          >
            <AppIcon name="Coffee" size={isMobile ? 24 : 34} />
            Main Hall
          </h2>
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
            scale={isMobile ? 0.82 : 0.85}
            emblemScale={isMobile ? 0.72 : 0.75}
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
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center"
            >
              <div
                className={`relative ${isMobile ? "w-28 h-40" : "w-48 h-64"} bg-[#FFE4E6] rounded-[20px] border-4 border-[#166D77] shadow-xl overflow-hidden flex items-center justify-center rotate-[-2deg] hover:rotate-0 transition-transform`}
              >
                {/* Paper Texture bg */}
                <div
                  className="absolute inset-0 bg-pale-custard"
                  style={{
                    backgroundImage:
                      "radial-gradient(#eee 2px, transparent 2px)",
                    backgroundSize: "10px 10px",
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <AppIcon
                    name="Scissors"
                    size={isMobile ? 28 : 40}
                    className="text-[#166D77] drop-shadow-sm"
                  />
                  <span
                    className={`bg-[#5EC7A5] text-pale-custard ${isMobile ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"} font-black rotate-[-5deg] shadow-md border-2 border-pale-custard`}
                  >
                    PAPER
                    <br />
                    DOLL
                  </span>
                </div>
              </div>
              <div
                className={`mt-2 bg-pale-custard ${isMobile ? "px-3 py-1 text-xs" : "px-4 py-2"} rounded-xl font-bold text-[#166D77] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#5EC7A5] group-hover:text-pale-custard transition-colors`}
              >
                리코 옷입히기
              </div>
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
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center"
            >
              <div
                className={`relative ${isMobile ? "w-36 h-20" : "w-64 h-32"} bg-pale-custard rounded-xl border-4 border-[#166D77] shadow-xl flex items-center justify-center overflow-visible`}
              >
                {/* Tablecloth */}
                <div className="absolute top-0 w-full h-4 bg-[#fef2f2]" />
                <AppIcon
                  name="Handbag"
                  size={isMobile ? 38 : 54}
                  className="text-[#166D77] drop-shadow-md"
                />
              </div>
              <div
                className={`mt-2 bg-pale-custard ${isMobile ? "px-3 py-1 text-xs" : "px-4 py-2"} rounded-xl font-bold text-[#166D77] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#5EC7A5] group-hover:text-pale-custard transition-colors`}
              >
                이타백 꾸미기
              </div>
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
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center"
            >
              <div
                className={`relative overflow-hidden ${isMobile ? "w-24 h-24" : "w-40 h-40"} rounded-[1.75rem] border-4 border-[#166D77] shadow-xl flex items-center justify-center ${
                  isPuzzleMuseumUnlocked
                    ? "bg-[#f5ecdd] p-[0.34rem]"
                    : "bg-[#a3e635] p-4"
                }`}
              >
                <AppIcon
                  name="Puzzle"
                  size={isMobile ? 34 : 58}
                  className="text-[#166D77] drop-shadow-md"
                />
              </div>
              <div
                className={`mt-2 bg-pale-custard ${isMobile ? "px-3 py-1 text-xs" : "px-4 py-2"} rounded-xl font-bold text-[#166D77] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#5EC7A5] group-hover:text-pale-custard transition-colors`}
              >
                퍼즐 맞추기
              </div>
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
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center"
            >
              <div
                className={`relative ${isMobile ? "w-28 h-20" : "w-52 h-32"} bg-[#d4edda] rounded-2xl border-4 border-[#166D77] shadow-xl flex flex-col items-center justify-center gap-1`}
              >
                {/* Asparagus tile grid preview */}
                <div className="grid grid-cols-3 gap-1 p-2">
                  {[
                    "Sprout",
                    "TrendingUp",
                    "Leaf",
                    "Flower2",
                    "CircleDot",
                    "Sword",
                  ].map((iconName, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{
                        background: "#2d6a4f",
                      }}
                    >
                      <AppIcon
                        name={iconName as Parameters<typeof AppIcon>[0]["name"]}
                        size={isMobile ? 12 : 14}
                        className="text-[#f8fff0]"
                        style={
                          iconName === "CircleDot"
                            ? { color: CIRCLE_DOT_RED }
                            : undefined
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div
                className={`mt-2 bg-pale-custard ${isMobile ? "px-3 py-1 text-xs" : "px-4 py-2"} rounded-xl font-bold text-[#166D77] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#5EC7A5] group-hover:text-pale-custard transition-colors`}
              >
                아스파라거스 키우기
              </div>
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
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center"
            >
              <div
                className={`relative ${isMobile ? "w-[5.5rem] h-28" : "w-32 h-44"} bg-[#D6C0B0] rounded-b-[2rem] rounded-t-lg border-4 border-[#8B5A2B] shadow-xl flex flex-col items-center justify-center`}
              >
                <div className={`absolute top-0 w-3/4 h-2 bg-[#8B5A2B]`} />
                <AppIcon
                  name="ScrollText"
                  size={isMobile ? 36 : 48}
                  className="text-[#8B5A2B] drop-shadow-md"
                />
                <div className="absolute inset-x-0 bottom-4 flex justify-center">
                  <div className="w-4/5 h-1 bg-[#8B5A2B] opacity-30" />
                </div>
              </div>
              <div
                className={`mt-2 bg-pale-custard ${isMobile ? "px-3 py-1 text-xs" : "px-4 py-2"} rounded-xl font-bold text-[#166D77] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#5EC7A5] group-hover:text-pale-custard transition-colors`}
              >
                오늘의 운세
              </div>
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
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center"
            >
              <div
                className={`relative ${isMobile ? "w-36 h-20" : "w-56 h-28"} overflow-hidden rounded-[1.75rem] border-4 border-[#102542] bg-[linear-gradient(135deg,#102542_0%,#365486_55%,#f5e6ca_100%)] shadow-xl`}
              >
                <div className="absolute inset-x-0 bottom-0 h-10 bg-[#345b48]" />
                <div className="absolute left-5 bottom-6 text-2xl drop-shadow-md text-white">
                  <AppIcon name="Shield" size={isMobile ? 20 : 28} />
                </div>
                <div className="absolute right-5 top-4 text-3xl drop-shadow-md text-[#ffe08a]">
                  <AppIcon name="Crown" size={isMobile ? 24 : 30} />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.35),transparent_30%)]" />
              </div>
              <div
                className={`mt-2 bg-pale-custard ${isMobile ? "px-3 py-1 text-xs" : "px-4 py-2"} rounded-xl font-bold text-[#166D77] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#102542] group-hover:text-white transition-colors`}
              >
                용사 리코 이야기
              </div>
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
