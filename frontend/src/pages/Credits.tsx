import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import { BASE_URL } from "../utils/api";
import { ReturnButton } from "../components/common/ReturnButton";
import { AppIcon } from "../components/common/AppIcon";
import { playDiriringSfx, preloadDiriringSfx } from "../utils/soundEffects";
import { pickRandomActivityBgm } from "../utils/bgm";

const CREDITS_SECTIONS = [
  {
    title: "프로젝트 총괄",
    names: ["전체 기획 및 컨셉: (이름 미정)", "경험 설계: (이름 미정)"],
  },
  {
    title: "개발",
    names: [
      "프론트엔드 개발: (이름 미정)",
      "백엔드 개발: (이름 미정)",
      "데이터베이스 설계: (이름 미정)",
      "배포 환경 구성: (이름 미정)",
      "인터랙션 및 애니메이션: (이름 미정)",
    ],
  },
  {
    title: "음악",
    names: [
      "「감자튀김 옴뇸뇸」: U+003AU+27B4\n편곡: (이름 미정)",
      "「밤바밤바」: U+003AU+27B4\n편곡: (이름 미정)",
      "「그 날, 감자튀김」: U+003AU+27B4\n편곡: (이름 미정)",
      "「diriring」 효과음: U+003AU+27B4",
      "",
      "용사 리코 이야기 BGM:",
      "Exodus (Arr. A. Reed)",
      "작곡: Ernest Gold",
      "편곡: Alfred Reed",
      "연주: Japan Air Self-Defense Force Western Air Band",
      "지휘: Hiroyuki Kayo",
      "℗ 2018 CAFUA",
    ],
  },
  {
    title: "리코의 외출",
    names: ["코디 아이템 및 캐릭터 디자인: Sie", "맵 모델링: (이름 미정)"],
  },
  {
    title: "퍼즐 놀이",
    names: ["일러스트: 상승새"],
  },
  {
    title: "용사 리코 이야기",
    names: [
      "도트 아트: 당근오이",
      "시나리오: (이름 미정)",
      "맵 디자인: (이름 미정)",
    ],
  },
  {
    title: "QA 및 피드백",
    names: ["플레이테스트 및 피드백: Sie, (이름 미정)"],
  },
  {
    title: "Special Thanks",
    names: ["유즈하 리코", "스텔라이브", "파스텔"],
  },
];

const CLAIM_ALERT_THRESHOLD = 0.33;
const CREDITS_BOTTOM_PADDING = 140;
const CREDITS_SCROLL_SPEED_PX = 24;

export default function Credits() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { addToast } = useToastStore();
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [needsManualStart, setNeedsManualStart] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [highlightClaim, setHighlightClaim] = useState(false);
  const [manualScrollEnabled, setManualScrollEnabled] = useState(false);
  const [bgmSrc] = useState(() => pickRandomActivityBgm());
  const [creditsMotion, setCreditsMotion] = useState({
    startY: window.innerHeight,
    endY: -window.innerHeight,
    duration: 120,
  });
  const audioRef = useRef<HTMLAudioElement>(null);
  const claimButtonRef = useRef<HTMLButtonElement>(null);
  const creditsViewportRef = useRef<HTMLDivElement>(null);
  const creditsScrollRef = useRef<HTMLDivElement>(null);
  const creditsTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNeedsManualStart(true);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.preload = "auto";
    audio.load();
    preloadDiriringSfx();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const updateCreditsMotion = () => {
      const viewportHeight =
        creditsViewportRef.current?.clientHeight ?? window.innerHeight;
      const trackHeight =
        creditsTrackRef.current?.scrollHeight ?? viewportHeight;
      const startOffset = Math.min(viewportHeight * 0.38, 280);
      const travelDistance = startOffset + trackHeight + CREDITS_BOTTOM_PADDING;

      setCreditsMotion({
        startY: startOffset,
        endY: -trackHeight - CREDITS_BOTTOM_PADDING,
        duration: Math.max(travelDistance / CREDITS_SCROLL_SPEED_PX, 45),
      });
    };

    updateCreditsMotion();
    window.addEventListener("resize", updateCreditsMotion);
    return () => window.removeEventListener("resize", updateCreditsMotion);
  }, [claimed, hasStarted]);

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

  useEffect(() => {
    if (!manualScrollEnabled) {
      return;
    }

    creditsScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [manualScrollEnabled]);

  const handleStart = async () => {
    const audio = audioRef.current;
    setHasStarted(true);
    setNeedsManualStart(false);

    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
      audio.muted = false;
      setIsMuted(false);

      if (audio.readyState < 2) {
        await new Promise<void>((resolve) => {
          const onReady = () => resolve();
          audio.addEventListener("loadeddata", onReady, { once: true });
          audio.addEventListener("canplaythrough", onReady, { once: true });
          window.setTimeout(resolve, 1200);
          audio.load();
        });
      }

      await audio.play();
    } catch (error) {
      console.error("Failed to start credits BGM", error);
    }
  };

  const handleMuteToggle = async () => {
    const audio = audioRef.current;
    const nextMuted = !isMuted;

    if (!audio) {
      setIsMuted(nextMuted);
      return;
    }

    audio.muted = nextMuted;
    setIsMuted(nextMuted);

    if (!nextMuted && hasStarted) {
      try {
        await audio.play();
      } catch (error) {
        console.error("Failed to resume credits BGM", error);
      }
    }
  };

  const handleDecline = () => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    navigate("/lobby");
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
        setManualScrollEnabled(true);
        setHighlightClaim(false);
        void playDiriringSfx();
        addToast({
          title: "엔딩 크레딧 시청 완료",
          description: "THANK_YOU_ALL 업적이 추가되었어요.",
          icon: "BadgeCheck",
        });
      } else {
        console.error("Failed to claim achievement");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderCreditsContent = (showClaimButton: boolean) => (
    <div
      ref={creditsTrackRef}
      className="flex w-full max-w-4xl flex-col items-center text-center"
    >
      <div className="pb-40 pt-32">
        <h1 className="mb-4 text-4xl font-black text-[#166D77] md:text-5xl">
          THANK YOU
        </h1>
        <p className="font-bold tracking-widest text-[#2a9d8f]">
          생일 카페를 빛낸 모두를 소개할게
        </p>
      </div>

      {CREDITS_SECTIONS.map((section, idx) => (
        <div key={idx} className="mb-24 w-full">
          <h2 className="mb-6 text-xl font-bold uppercase tracking-wider text-[#2a9d8f] md:text-2xl">
            {section.title}
          </h2>
          <div className="flex flex-col items-center gap-4">
            {section.names.map((name, i) =>
              (() => {
                const separatorIndex = name.indexOf(": ");

                if (separatorIndex === -1) {
                  return (
                    <p
                      key={i}
                      className="mx-auto max-w-full text-lg font-medium text-[#365486] md:text-xl"
                    >
                      {name}
                    </p>
                  );
                }

                const label = name.slice(0, separatorIndex);
                const value = name.slice(separatorIndex + 2);

                return (
                  <div key={i} className="mx-auto max-w-full text-center">
                    <p className="text-lg font-semibold text-[#365486] md:text-xl">
                      {label}
                    </p>
                    <p className="whitespace-pre-line text-base font-normal text-[#365486]/78 md:text-lg">
                      {value}
                    </p>
                  </div>
                );
              })(),
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-col items-center pt-32 pb-[50vh]">
        <h2 className="mb-10 text-3xl font-black text-[#102542]">And You</h2>

        {showClaimButton ? (
          <motion.button
            ref={claimButtonRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={
              highlightClaim ? { x: [0, -6, 6, -5, 5, -3, 3, 0] } : { x: 0 }
            }
            transition={
              highlightClaim
                ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
            }
            onClick={awardAchievement}
            disabled={loading}
            className="flex items-center gap-3 rounded-full border-2 px-8 py-4 text-lg font-black shadow-[0_0_30px_rgba(94,199,165,0.4)] transition-all hover:bg-[#5EC7A5] hover:text-[#166D77]"
            style={{
              background: "rgba(255,255,255,0.9)",
              color: "#166D77",
              borderColor: "#5EC7A5",
            }}
          >
            <AppIcon name="Clapperboard" size={24} />
            {loading ? "기록 중..." : "엔딩 크레딧 시청 완료 배지 받기"}
          </motion.button>
        ) : (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 rounded-full bg-[#5EC7A5] px-8 py-4 text-lg font-black text-[#166D77]"
          >
            <AppIcon name="BadgeCheck" size={20} /> 배지 획득 완료
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="relative flex h-dvh min-h-screen flex-col overflow-hidden bg-[linear-gradient(180deg,#fffdf4_0%,#f4fff6_52%,#eefafc_100%)] text-[#102542] select-none"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes credits-roll {
          from {
            transform: translate3d(0, var(--credits-start-y), 0);
          }
          to {
            transform: translate3d(0, var(--credits-end-y), 0);
          }
        }
      `}</style>
      <audio ref={audioRef} src={bgmSrc} loop preload="auto" playsInline />

      {/* Fixed header buttons */}
      <div className="absolute left-4 top-4 z-50">
        <ReturnButton
          gameName="엔딩 크레딧"
          className="rounded-xl border-2 border-[#5EC7A5] bg-white/90 px-4 py-2 text-sm font-bold text-[#166D77] shadow-[0_10px_30px_rgba(22,109,119,0.14)]"
        />
      </div>
      {hasStarted && (
        <button
          type="button"
          onClick={() => void handleMuteToggle()}
          className="absolute right-4 top-4 z-50 flex items-center gap-2 rounded-xl border-2 border-[#5EC7A5] bg-white/90 px-4 py-2 text-sm font-bold text-[#166D77] shadow-[0_10px_30px_rgba(22,109,119,0.14)]"
          aria-label={isMuted ? "Unmute credits music" : "Mute credits music"}
        >
          <AppIcon
            name={isMuted ? "VolumeX" : "Volume2"}
            size={18}
            strokeWidth={2.2}
          />
          <span>{isMuted ? "Unmute" : "Mute"}</span>
        </button>
      )}

      <div className="flex h-screen flex-1">
        <div
          ref={creditsViewportRef}
          className="relative flex h-full w-full justify-center overflow-hidden"
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#fef3c7]/45 via-[#f0fdf4] to-[#e0f2fe]" />

          {manualScrollEnabled ? (
            <div
              ref={creditsScrollRef}
              className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden"
            >
              <div className="flex min-h-full justify-center px-3 py-12 sm:px-6">
                {renderCreditsContent(false)}
              </div>
            </div>
          ) : (
            <div
              key={`${hasStarted}-${creditsMotion.startY}-${creditsMotion.endY}-${creditsMotion.duration}`}
              className="absolute inset-x-0 top-0 z-10 flex justify-center px-3 sm:px-6"
              style={
                {
                  "--credits-start-y": `${creditsMotion.startY}px`,
                  "--credits-end-y": `${creditsMotion.endY}px`,
                  transform: `translate3d(0, ${creditsMotion.startY}px, 0)`,
                  animation: hasStarted
                    ? `credits-roll ${creditsMotion.duration}s linear forwards`
                    : "none",
                  willChange: "transform",
                } as CSSProperties
              }
            >
              {renderCreditsContent(true)}
            </div>
          )}
        </div>
      </div>

      {needsManualStart && !hasStarted && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#fffdf4]/85 px-6 backdrop-blur-sm">
          <div className="rounded-[2rem] border border-[#5EC7A5]/30 bg-white/90 px-8 py-10 text-center shadow-[0_30px_80px_rgba(22,109,119,0.18)]">
            <p className="mb-6 text-2xl font-bold uppercase tracking-[0.2em] text-[#166D77]">
              다들 와줘서 고마워!
            </p>
            <p className="mb-6 text-xl text-[#365486]">
              생일 카페를 빛낸 모두를 소개할게
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => void handleStart()}
                className="rounded-full border-2 border-[#bef264] bg-[#166D77] px-8 py-3 text-lg font-black text-[#FFFFF8] shadow-[0_0_30px_rgba(94,199,165,0.3)]"
              >
                좋아!
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="rounded-full border-2 border-[#166D77]/15 bg-white px-8 py-3 text-lg font-black text-[#166D77]"
              >
                됐어
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
