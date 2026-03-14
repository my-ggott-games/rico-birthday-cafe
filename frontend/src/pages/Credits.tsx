import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { BASE_URL } from "../utils/api";
import { ReturnButton } from "../components/common/ReturnButton";

const CREDITS_SECTIONS = [
  {
    title: "Project Overview",
    names: [
      "Planning: G. Minho",
      "Illustration: Sie, Rico Archive, Community Artists",
      "BGM: 꽃하나",
    ],
  },
  {
    title: "Resources & Tools",
    names: [
      "React, Vite, TypeScript, Tailwind CSS, Framer Motion",
      "dnd-kit, canvas-confetti, modern-screenshot, Zustand",
      "OpenAI Codex, GitHub, Figma references, community asset archives",
    ],
  },
  {
    title: "Cody Game",
    names: [
      "Planning: G. Minho",
      "Art Assets: Rico Archive",
      "Implementation: Codex + Frontend Codebase",
    ],
  },
  {
    title: "Puzzle Game",
    names: [
      "Planning: G. Minho",
      "Sample Illustration: Rico Archive",
      "Puzzle Logic & UI: Frontend Team",
    ],
  },
  {
    title: "Adventure / Fortune / Itabag / Asparagus",
    names: [
      "Design Direction: G. Minho",
      "Interactive Implementation: Frontend Team",
      "Testing & Feedback: Rico Birthday Cafe Attendees",
    ],
  },
  {
    title: "Special Thanks",
    names: ["Yuzuha Rico", "Rico Fans", "Everyone who participated"],
  },
];

// Placeholder illustrations to cycle on PC
const ILLUSTRATION_IMAGES = [
  "/assets/illustration1.png", // Replace with actual paths if available
  "/assets/illustration2.png",
];

const BGM_SRC = "/꽃하나.m4a";
const CLAIM_ALERT_THRESHOLD = 0.33;

export default function Credits() {
  const { token } = useAuthStore();
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [needsManualStart, setNeedsManualStart] = useState(false);
  const [highlightClaim, setHighlightClaim] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const claimButtonRef = useRef<HTMLButtonElement>(null);

  // Swap illustration every 8 seconds (slowed down for gentler pacing)
  useEffect(() => {
    if (!hasStarted) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % ILLUSTRATION_IMAGES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [hasStarted]);

  useEffect(() => {
    setNeedsManualStart(true);
  }, []);

  useEffect(() => {
    const button = claimButtonRef.current;
    if (!button || !hasStarted || claimed) {
      setHighlightClaim(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const triggerLine = window.innerHeight * CLAIM_ALERT_THRESHOLD;
        const { top, bottom } = entry.boundingClientRect;
        setHighlightClaim(top <= triggerLine && bottom >= 0);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    observer.observe(button);
    return () => observer.disconnect();
  }, [claimed, hasStarted]);

  const handleStart = async () => {
    const audio = audioRef.current;
    setHasStarted(true);
    setNeedsManualStart(false);

    if (!audio) return;

    try {
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.error("Failed to start credits BGM", error);
    }
  };

  const awardAchievement = async () => {
    if (!token) {
      alert("로그인이 필요합니다!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/achievements/award/THANK_YOU_ALL`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setClaimed(true);
      } else {
        console.error("Failed to claim achievement");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden bg-[linear-gradient(180deg,#fffdf4_0%,#f4fff6_52%,#eefafc_100%)] text-[#102542] select-none"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <audio ref={audioRef} src={BGM_SRC} loop preload="auto" />

      {/* Fixed header buttons */}
      <div className="absolute left-4 top-4 z-50">
        <ReturnButton
          gameName="엔딩 크레딧"
          className="rounded-xl border-2 border-[#5EC7A5] bg-white/90 px-4 py-2 text-sm font-bold text-[#166D77] shadow-[0_10px_30px_rgba(22,109,119,0.14)]"
        />
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-screen">
        {/* Visual Pane (PC only) */}
        <div className="relative hidden h-full w-1/2 items-center justify-center border-r border-[#166D77]/10 bg-[linear-gradient(180deg,#fff7db_0%,#e5fff5_100%)] p-10 md:flex">
          {/* Placeholder image cycling */}
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="w-full h-full bg-contain bg-center bg-no-repeat"
            style={{
              // Just a visual placeholder until actual assets are provided
              backgroundImage: `linear-gradient(to bottom right, #fef3c7, #cffafe)`,
            }}
          >
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-[#166D77]/30">
              Illustration {currentImageIndex + 1}
            </div>
          </motion.div>
        </div>

        {/* Credits Scroll Pane */}
        {/* Container masks the scroll. */}
        <div className="relative flex h-full w-full justify-center overflow-hidden md:w-1/2">
          {/* Mobile background (dimmed) */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#fef3c7]/60 via-[#f0fdf4] to-[#e0f2fe] md:hidden" />

          <motion.div
            className="w-full max-w-lg px-8 relative z-10 flex flex-col items-center text-center pb-32"
            initial={false}
            animate={hasStarted ? { y: ["72vh", "-260%"] } : { y: "100vh" }}
            transition={{
              duration: 155,
              ease: "linear",
              repeat: 0,
            }}
          >
            {/* Title Space */}
            <div className="pt-32 pb-40">
              <h1 className="mb-4 text-4xl font-black text-[#166D77] md:text-5xl">
                THANK YOU
              </h1>
              <p className="font-bold tracking-widest text-[#2a9d8f]">
                FOR COMING TO RICO'S BIRTHDAY CAFE
              </p>
            </div>

            {/* Sections */}
            {CREDITS_SECTIONS.map((section, idx) => (
              <div key={idx} className="mb-24 w-full">
                <h2 className="mb-6 text-xl font-bold uppercase tracking-wider text-[#2a9d8f] md:text-2xl">
                  {section.title}
                </h2>
                <div className="flex flex-col gap-4">
                  {section.names.map((name, i) => (
                    <p
                      key={i}
                      className="text-lg font-medium text-[#365486] md:text-xl"
                    >
                      {name}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {/* Final message & Achievement Button */}
            <div className="pt-32 pb-[50vh] flex flex-col items-center">
              <h2 className="mb-10 text-3xl font-black text-[#102542]">And You</h2>

              {!claimed ? (
                <motion.button
                  ref={claimButtonRef}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={
                    highlightClaim
                      ? { x: [0, -6, 6, -5, 5, -3, 3, 0] }
                      : { x: 0 }
                  }
                  transition={
                    highlightClaim
                      ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.2 }
                  }
                  onClick={awardAchievement}
                  disabled={loading}
                  className="flex items-center gap-3 px-8 py-4 rounded-full font-black text-lg shadow-[0_0_30px_rgba(94,199,165,0.4)] border-2 transition-all hover:bg-[#5EC7A5] hover:text-[#166D77]"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    color: "#166D77",
                    borderColor: "#5EC7A5",
                  }}
                >
                  <span className="text-2xl">🎬</span>
                  {loading ? "기록 중..." : "엔딩 크레딧 시청 완료 배지 받기"}
                </motion.button>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-8 py-4 rounded-full font-black text-lg bg-[#5EC7A5] text-[#166D77] flex items-center gap-2"
                >
                  <span className="text-xl">✨</span> 감사합니다! 배지가
                  지급되었습니다.
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {needsManualStart && !hasStarted && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#fffdf4]/85 px-6 backdrop-blur-sm">
          <div className="rounded-[2rem] border border-[#5EC7A5]/30 bg-white/90 px-8 py-10 text-center shadow-[0_30px_80px_rgba(22,109,119,0.18)]">
            <p className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-[#166D77] md:text-base">
              Start Credits
            </p>
            <p className="mb-6 text-sm text-[#365486]">
              iOS 포함 모든 환경에서 시작 버튼을 눌러야 음악과 스크롤이 함께
              재생됩니다.
            </p>
            <button
              type="button"
              onClick={() => void handleStart()}
              className="px-8 py-3 rounded-full border-2 border-[#bef264] bg-[#166D77] text-[#FFFFF8] font-black text-lg shadow-[0_0_30px_rgba(94,199,165,0.3)]"
            >
              Start
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
