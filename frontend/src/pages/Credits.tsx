import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import {
  addAchievementToast,
  parseAchievementAwardResponse,
} from "../utils/achievementAwards";
import { BASE_URL } from "../utils/api";
import { ReturnButton } from "../components/common/ReturnButton";
import { AppIcon } from "../components/common/AppIcon";
import { PushableButton } from "../components/common/PushableButton";
import { CommonModal } from "../components/common/CommonModal";
import { playDiriringSfx, preloadDiriringSfx } from "../utils/soundEffects";
import { pickRandomActivityBgm } from "../utils/bgm";
import { useAudioStore } from "../store/useAudioStore";

const THANK_YOU_ALL_CODE = "THANK_YOU_ALL";
type CreditEntry = {
  label?: string;
  credits: Array<{
    role: string;
    name: string;
  }>;
};

type CreditSection = {
  title: string;
  entries: CreditEntry[];
};

const CREDITS_SECTIONS: CreditSection[] = [
  {
    title: "생일카페 총대",
    entries: [
      {
        label: "전체 기획 및 컨셉",
        credits: [{ role: "CODE NAME: G", name: "" }],
      },
      {
        label: "Userflow 설계",
        credits: [{ role: "CODE NAME: G", name: "" }],
      },
    ],
  },
  {
    title: "아트 & 일러스트",
    entries: [
      {
        label: "리코의 외출 준비",
        credits: [
          { role: "코디 아이템", name: "Sie" },
          { role: "캐릭터 디자인", name: "Sie" },
          {
            role: "폴라로이드 배경 모델링\n(Animal Crossing: Pocket Camp Complete)",
            name: "CODE NAME: G",
          },
        ],
      },
      {
        label: "퍼즐 놀이",
        credits: [{ role: "퍼즐 일러스트", name: "상승새" }],
      },
      {
        label: "용사 리코 이야기",
        credits: [
          { role: "캐릭터 도트", name: "당근오이" },
          { role: "케이크 도트", name: "Pikurā" },
        ],
      },
      {
        label: "브랜딩 & 공간 연출",
        credits: [
          { role: "배너 & 포스터 디자인", name: "CODE NAME: G" },
          { role: "공간 섭외 & 촬영", name: "CODE NAME: G" },
        ],
      },
    ],
  },
  {
    title: "개발",
    entries: [
      {
        label: "프론트엔드 엔지니어링",
        credits: [{ role: "", name: "CODE NAME: G" }],
      },
      {
        label: "인터렉션 설계 & 애니메이션",
        credits: [{ role: "", name: "CODE NAME: G" }],
      },
      {
        label: "백엔드 & 데이터 아키텍처",
        credits: [
          { role: "", name: "CODE NAME: G" },
          { role: "", name: "송파 황제 Harlockius" },
        ],
      },
      {
        label: "인프라 운영 & 배포",
        credits: [{ role: "", name: "CODE NAME: G" }],
      },
      {
        label: "품질 검증 & 테스트",
        credits: [
          { role: "", name: "Sie" },
          { role: "", name: "미아라" },
          { role: "", name: "송파 황제 Harlockius" },
          { role: "", name: "금자C" },
          { role: "", name: "HE" },
          { role: "", name: "슈슉" },
          { role: "", name: "CODE NAME: G" },
        ],
      },
    ],
  },
  {
    title: "음악",
    entries: [
      {
        label: "「감자튀김 옴뇸뇸」",
        credits: [
          { role: "작사 & 작곡", name: "U+003AU+27B4" },
          { role: "편곡\n(iOS GarageBand)", name: "CODE NAME: G" },
        ],
      },
      {
        label: "「꽃 하나 aka.밤바밤바」",
        credits: [
          { role: "작사 & 작곡", name: "U+003AU+27B4" },
          { role: "편곡\n(iOS GarageBand)", name: "CODE NAME: G" },
        ],
      },
      {
        label: "「그 날, 감자튀김」",
        credits: [
          { role: "작사 & 작곡", name: "U+003AU+27B4" },
          { role: "편곡\n(iOS GarageBand)", name: "CODE NAME: G" },
        ],
      },
      {
        label: "효과음 「diriring」",
        credits: [{ role: "작곡", name: "U+003AU+27B4" }],
      },
    ],
  },
  {
    title: "Special Thanks",
    entries: [
      { credits: [{ role: "유즈하 리코", name: "" }] },
      { credits: [{ role: "스텔라이브", name: "" }] },
      { credits: [{ role: "파스텔", name: "" }] },
    ],
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
  const [highlightClaim, setHighlightClaim] = useState(false);
  const [manualScrollEnabled, setManualScrollEnabled] = useState(false);
  const [bgmSrc] = useState(() => pickRandomActivityBgm());
  const isMuted = useAudioStore((state) => state.isMuted);
  const [creditsMotion, setCreditsMotion] = useState({
    startY: window.innerHeight,
    endY: -window.innerHeight,
    duration: 120,
  });
  const setCurrentBgmSrc = useAudioStore((state) => state.setCurrentBgmSrc);
  const audioRef = useRef<HTMLAudioElement>(null);
  const claimButtonRef = useRef<HTMLDivElement>(null);
  const creditsViewportRef = useRef<HTMLDivElement>(null);
  const creditsScrollRef = useRef<HTMLDivElement>(null);
  const creditsTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentBgmSrc(bgmSrc);

    return () => {
      if (useAudioStore.getState().currentBgmSrc === bgmSrc) {
        setCurrentBgmSrc(null);
      }
    };
  }, [bgmSrc, setCurrentBgmSrc]);

  useEffect(() => {
    setNeedsManualStart(true);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const bootstrapClaimedState = async () => {
      try {
        const response = await fetch(`${BASE_URL}/achievements/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok || cancelled) {
          return;
        }

        const achievements = (await response.json()) as Array<{
          code?: string;
          earned?: boolean;
        }>;

        const alreadyClaimed = achievements.some(
          (achievement) =>
            achievement.code === THANK_YOU_ALL_CODE && achievement.earned,
        );

        if (!alreadyClaimed || cancelled) {
          return;
        }

        setClaimed(true);
        setManualScrollEnabled(true);
        setHasStarted(true);
        setNeedsManualStart(false);
        setHighlightClaim(false);
      } catch (error) {
        console.error("Failed to hydrate credits achievement state", error);
      }
    };

    void bootstrapClaimedState();

    return () => {
      cancelled = true;
    };
  }, [token]);

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
    const audio = audioRef.current;
    if (!audio || isMuted || !hasStarted) {
      return;
    }

    void audio.play().catch((error) => {
      console.error("Failed to resume credits BGM", error);
    });
  }, [hasStarted, isMuted]);

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
      audio.muted = isMuted;

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

  const handleDecline = () => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    navigate("/lobby");
  };

  const handleCreditsRollComplete = () => {
    if (!hasStarted || manualScrollEnabled) {
      return;
    }

    setManualScrollEnabled(true);
    setHighlightClaim(false);
  };

  const awardAchievement = async () => {
    if (!token || claimed || loading) {
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
        const awardResult = await parseAchievementAwardResponse(res);
        if (!awardResult) {
          console.error("Failed to parse achievement award response");
          return;
        }

        setClaimed(true);
        setManualScrollEnabled(true);
        setHighlightClaim(false);
        if (awardResult.awarded) {
          void playDiriringSfx();
          addAchievementToast(addToast, awardResult.achievement, "credits");
        }
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
          비공식 팬메이드 유즈하 리코 사이버 생일카페
        </p>
        <p className="mt-3 text-sm font-medium tracking-[0.28em] text-[#365486]/75 md:text-base">
          생일 카페를 빛낸 모두를 소개할게
        </p>
      </div>

      {CREDITS_SECTIONS.map((section, idx) => (
        <div key={idx} className="mb-24 w-full">
          <h2 className="mb-6 text-xl font-bold uppercase tracking-wider text-[#166D77] md:text-2xl">
            {section.title}
          </h2>
          <div className="flex flex-col items-center gap-4">
            {section.entries.map((entry, i) => (
              <div key={i} className="mx-auto max-w-full text-center">
                {entry.label ? (
                  <p className="text-lg font-semibold text-[#365486] md:text-xl">
                    {entry.label}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-col gap-1.5">
                  {entry.credits.map((credit, creditIndex) => (
                    <div
                      key={creditIndex}
                      className="flex flex-col items-center text-center"
                    >
                      <p className="whitespace-pre-line text-base font-black tracking-[0.08em] text-[#2a9d8f] md:text-lg">
                        {credit.role}
                      </p>
                      {credit.name ? (
                        <p className="text-sm font-semibold text-[#365486]/78 md:text-base">
                          {credit.name}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col items-center pt-32 pb-[50vh]">
        <h2 className="mb-10 text-3xl font-black text-[#166D77]">And You</h2>

        {token && showClaimButton ? (
          <motion.div
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
          >
            <PushableButton
              onClick={awardAchievement}
              disabled={loading}
              variant="mint"
              className="rounded-full px-8 py-4 text-lg shadow-[0_0_30px_rgba(94,199,165,0.4)]"
            >
              <span className="flex items-center gap-3">
                <AppIcon name="Clapperboard" size={24} />
                {loading ? "기록 중..." : "엔딩 크레딧 시청 완료 배지 받기"}
              </span>
            </PushableButton>
          </motion.div>
        ) : token ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <PushableButton
              variant="cream"
              disabled
              className="rounded-full px-8 py-4 text-lg"
            >
              <span className="flex items-center gap-2">
                <AppIcon name="BadgeCheck" size={20} /> 배지 획득 완료
              </span>
            </PushableButton>
          </motion.div>
        ) : null}
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
          gameName="엔딩 크레딧 재생"
          className="px-4 py-2 text-sm"
        />
      </div>

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
                {renderCreditsContent(!claimed)}
              </div>
            </div>
          ) : (
            <div
              key={`${hasStarted}-${creditsMotion.startY}-${creditsMotion.endY}-${creditsMotion.duration}`}
              className="absolute inset-x-0 top-0 z-10 flex justify-center px-3 sm:px-6"
              onAnimationEnd={handleCreditsRollComplete}
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

      {!claimed && (
        <CommonModal
          isOpen={needsManualStart && !hasStarted}
          onClose={handleDecline}
          title="다들 와줘서 고마워!"
          panelClassName="border-[#5EC7A5] px-8 py-10 shadow-[0_30px_80px_rgba(22,109,119,0.18)]"
          titleClassName="mb-4 text-2xl uppercase"
          bodyClassName="mb-6 text-xl text-[#365486]"
          footerClassName="flex flex-col gap-3 sm:flex-row sm:justify-center"
          footer={
            <>
              <PushableButton
                onClick={() => void handleStart()}
                variant="mint"
                className="w-1/2 self-center rounded-full px-8 py-3 text-lg shadow-[0_0_30px_rgba(94,199,165,0.3)] sm:w-auto"
              >
                좋아!
              </PushableButton>
              <PushableButton
                onClick={handleDecline}
                variant="cream"
                className="w-1/2 self-center rounded-full px-8 py-3 text-lg sm:w-auto"
              >
                됐어
              </PushableButton>
            </>
          }
        >
          생일 카페를 빛낸 모두를 소개할게
        </CommonModal>
      )}
    </div>
  );
}
