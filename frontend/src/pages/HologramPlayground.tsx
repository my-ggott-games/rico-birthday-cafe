import React, { useMemo, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { GameContainer } from "../components/common/GameContainer";
import type { TutorialSlide } from "../components/common/TutorialBanner";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const HOLOGRAPHIC_SPRING = { stiffness: 120, damping: 20 };
const BASE_IMAGE_URL = "/assets/rico_puzzle_birthday_banquet.png";

const Toggle: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition ${
      active
        ? "border-[#166D77] bg-[#E6FFFB] text-[#166D77]"
        : "border-[#d6e3e8] bg-white text-[#5B6B73] hover:border-[#aac5d1]"
    }`}
  >
    {label}
  </button>
);

const HologramPlayground: React.FC = () => {
  const helpSlides: TutorialSlide[] = [
    {
      title: "토글 가이드",
      lines: [
        "Radial / Spectral / Diagonal 레이어를 각각 켜고 끌 수 있어.",
        "Rainbow Sweep로 자동 이동 효과를 확인해.",
      ],
      showArrows: false,
    },
    {
      title: "모션 테스트",
      lines: [
        "Follow Pointer를 켜면 마우스/터치 위치에 따라 광원이 이동해.",
        "Sweep Animate를 꺼서 정지한 스윕 상태도 비교해.",
      ],
      showArrows: false,
    },
  ];

  const [showRadial, setShowRadial] = useState(true);
  const [showSpectral, setShowSpectral] = useState(true);
  const [showDiagonal, setShowDiagonal] = useState(true);
  const [showSweep, setShowSweep] = useState(true);
  const [animateSweep, setAnimateSweep] = useState(true);
  const [showProbe, setShowProbe] = useState(true);
  const [followPointer, setFollowPointer] = useState(true);

  const targetX = useMotionValue(50);
  const targetY = useMotionValue(50);
  const springX = useSpring(targetX, HOLOGRAPHIC_SPRING);
  const springY = useSpring(targetY, HOLOGRAPHIC_SPRING);

  const glintX = useTransform(springX, (v) => `${v}%`);
  const glintY = useTransform(springY, (v) => `${v}%`);
  const probeX = useTransform(springX, (v) => `${clamp(v, 0, 100)}%`);
  const probeY = useTransform(springY, (v) => `${clamp(v, 0, 100)}%`);
  const fieldX = useTransform(
    springX,
    (v) => `${clamp(50 + (v - 50) * 0.72, 0, 100)}%`,
  );
  const fieldY = useTransform(
    springY,
    (v) => `${clamp(50 + (v - 50) * 0.68, 0, 100)}%`,
  );

  const palette = useMemo(
    () => ({
      cyan: "hsla(192, 100%, 54%, 1)",
      pink: "hsla(324, 100%, 62%, 0.96)",
      violet: "hsla(272, 100%, 62%, 0.92)",
      gold: "hsla(52, 100%, 56%, 0.88)",
    }),
    [],
  );

  const overlayVars = useMemo(
    () =>
      ({
        "--glint-x": glintX,
        "--glint-y": glintY,
        "--field-x": fieldX,
        "--field-y": fieldY,
      }) as React.CSSProperties,
    [fieldX, fieldY, glintX, glintY],
  );

  const radialBurst = useMemo(
    () =>
      `radial-gradient(circle at var(--glint-x) var(--glint-y),
        ${palette.cyan} 0%,
        ${palette.pink} 28%,
        ${palette.gold} 52%,
        transparent 76%)`,
    [palette],
  );

  const spectralField = useMemo(
    () =>
      `conic-gradient(from 210deg at var(--field-x) var(--field-y),
        ${palette.cyan},
        ${palette.violet},
        ${palette.pink},
        ${palette.gold},
        ${palette.cyan})`,
    [palette],
  );

  const diagonalField = useMemo(
    () =>
      `linear-gradient(125deg,
        transparent 0%,
        ${palette.cyan} 18%,
        transparent 36%,
        ${palette.violet} 54%,
        transparent 70%,
        ${palette.gold} 92%)`,
    [palette],
  );

  const autoSweepGradient = useMemo(
    () =>
      `linear-gradient(118deg,
        transparent 0%,
        transparent 20%,
        ${palette.cyan} 38%,
        ${palette.pink} 52%,
        ${palette.violet} 66%,
        ${palette.gold} 80%,
        transparent 100%)`,
    [palette],
  );

  const handleMove = (clientX: number, clientY: number, rect: DOMRect) => {
    if (!followPointer) return;
    const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
    targetX.set(x);
    targetY.set(y);
  };

  const resetCenter = () => {
    targetX.set(50);
    targetY.set(50);
  };

  return (
    <GameContainer
      title="Hologram Playground"
      desc="Toggle hologram layers and motion to test visuals"
      gameName="Hologram Playground"
      helpSlides={helpSlides}
      className="bg-[#F8FFFE]"
    >
      <div className="flex flex-col gap-6 px-4 pb-6">
        <div className="flex flex-wrap gap-2">
          <Toggle
            label="라디얼"
            active={showRadial}
            onClick={() => setShowRadial((v) => !v)}
          />
          <Toggle
            label="스펙트럴 필드"
            active={showSpectral}
            onClick={() => setShowSpectral((v) => !v)}
          />
          <Toggle
            label="대각선 그레인"
            active={showDiagonal}
            onClick={() => setShowDiagonal((v) => !v)}
          />
          <Toggle
            label="레인보우 스윕"
            active={showSweep}
            onClick={() => setShowSweep((v) => !v)}
          />
          <Toggle
            label="스윕 애니메이션"
            active={animateSweep}
            onClick={() => setAnimateSweep((v) => !v)}
          />
          <Toggle
            label="프로브 표시"
            active={showProbe}
            onClick={() => setShowProbe((v) => !v)}
          />
          <Toggle
            label="포인터 따라가기"
            active={followPointer}
            onClick={() => {
              setFollowPointer((v) => !v);
              resetCenter();
            }}
          />
          <button
            type="button"
            onClick={resetCenter}
            className="rounded-full border border-[#d6e3e8] bg-white px-3 py-1 text-xs font-semibold text-[#2d3a40] hover:border-[#aac5d1]"
          >
            중앙으로
          </button>
        </div>

        <div className="relative aspect-square w-full max-w-3xl overflow-hidden rounded-2xl border border-[#ddecf0] bg-white shadow-[0_18px_50px_rgba(19,94,104,0.12)]">
          <div
            className="absolute inset-0"
            onMouseMove={(e) =>
              handleMove(
                e.clientX,
                e.clientY,
                e.currentTarget.getBoundingClientRect(),
              )
            }
            onMouseLeave={resetCenter}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              if (!touch) return;
              handleMove(
                touch.clientX,
                touch.clientY,
                e.currentTarget.getBoundingClientRect(),
              );
            }}
            onTouchEnd={resetCenter}
            onTouchCancel={resetCenter}
            aria-label="hologram preview"
          >
            <img
              src={BASE_IMAGE_URL}
              alt="리코 생일 퍼즐 일러스트"
              className="absolute inset-0 h-full w-full select-none object-cover"
              draggable={false}
            />

            {showRadial && (
              <div
                className="absolute inset-0"
                style={{
                  ...overlayVars,
                  background: "rgba(0, 255, 255, 0.35)",
                  mixBlendMode: "normal",
                  opacity: 1,
                  filter: "none",
                }}
              />
            )}

            {showSpectral && (
              <div
                className="absolute inset-0"
                style={{
                  ...overlayVars,
                  background: "rgba(255, 0, 255, 0.28)",
                  mixBlendMode: "normal",
                  opacity: 1,
                  filter: "none",
                }}
              />
            )}

            {showDiagonal && (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(
  125deg,
  transparent 0%,
  transparent 35%,
  rgba(255,255,0,0.9) 35%,
  rgba(255,255,0,0.9) 55%,
  transparent 55%,
  transparent 100%
)`,
                  mixBlendMode: "normal",
                  opacity: 1,
                  filter: "none",
                }}
              />
            )}

            {showSweep && (
              <motion.div
                className="absolute inset-[-45%]"
                style={{
                  background: autoSweepGradient,
                  mixBlendMode: "color-dodge",
                  transform: "rotate(-18deg)",
                  filter: "blur(16px) saturate(1.3)",
                }}
                animate={
                  animateSweep
                    ? { x: ["-140%", "138%"], opacity: [0, 0.84, 0] }
                    : { x: "-10%", opacity: 0.7 }
                }
                transition={
                  animateSweep
                    ? {
                        duration: 10,
                        repeat: Infinity,
                        repeatDelay: 4.2,
                        ease: "easeInOut",
                      }
                    : { duration: 0.25 }
                }
              />
            )}

            <svg
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              aria-hidden
            >
              <rect
                width="100%"
                height="100%"
                fill="rgba(22,109,119,0.82)"
                opacity="0.12"
                style={{ mixBlendMode: "soft-light" }}
              />
            </svg>

            {showProbe && (
              <motion.div
                aria-hidden
                className="absolute z-[6] h-8 w-8 rounded-full"
                style={{
                  left: probeX,
                  top: probeY,
                  transform: "translate(-50%, -50%)",
                  background: `conic-gradient(from 0deg,
                      hsla(192,100%,54%,0.95),
                      hsla(272,100%,62%,0.95),
                      hsla(324,100%,62%,0.95),
                      hsla(52,100%,56%,0.95),
                      hsla(192,100%,54%,0.95))`,
                  boxShadow:
                    "0 0 0 2px rgba(255,255,255,0.72), 0 0 14px 6px rgba(100,220,255,0.55), 0 0 28px 10px rgba(200,100,255,0.35)",
                  filter: "blur(0.5px) saturate(1.4)",
                }}
              >
                <div
                  className="absolute inset-[5px] rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.4)",
                    backdropFilter: "blur(2px)",
                  }}
                />
              </motion.div>
            )}

            <div className="absolute left-3 top-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#1f2d38]">
              {[
                showRadial && "라디얼",
                showSpectral && "스펙트럴",
                showDiagonal && "대각선",
                showSweep && `스윕${animateSweep ? "" : " (정지)"}`,
                showProbe && "프로브",
                followPointer ? "포인터" : "중앙",
              ]
                .filter(Boolean)
                .map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-white/86 px-2 py-1 shadow-sm ring-1 ring-[#c8d8de]"
                  >
                    {label}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </GameContainer>
  );
};

export default HologramPlayground;
