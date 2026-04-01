import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpToLine,
  CalendarCheck,
  CalendarDays,
  CircleDot,
  Crown,
  Feather,
  Flower,
  Leaf,
  Sprout,
  Sword,
  TreeDeciduous,
  TreePine,
  Trees,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { STAGES, WIN_VALUE } from "./constants";

interface TileProps {
  value: number | null;
  isSelected?: boolean;
  isSwapMode?: boolean;
  onClick?: () => void;
}

const STAGE_ICONS: Record<string, LucideIcon> = {
  Sprout,
  ArrowUpToLine,
  TrendingUp,
  Leaf,
  Trees,
  Flower: Flower,
  CircleDot,
  CalendarDays,
  CalendarCheck,
  Feather,
  TreeDeciduous,
  TreePine,
  Utensils,
  Crown,
  Sword,
};

export const Tile: React.FC<TileProps> = ({
  value,
  isSelected,
  isSwapMode = false,
  onClick,
}) => {
  const tileRadius = "var(--cell-radius, 16px)";
  const swapAccentColor = "#3C9E96";
  const swapRing = `inset 0 0 0 3px ${swapAccentColor}`;
  const selectedGlow = "0 0 14px rgba(60, 158, 150, 0.18)";

  if (!value) {
    return (
      <div
        className={`transition-all ${onClick ? "cursor-pointer hover:bg-white/20" : ""}`}
        style={{
          background: isSelected
            ? "rgba(60, 158, 150, 0.24)"
            : isSwapMode
              ? "rgba(255,255,255,0.18)"
              : "rgba(255,255,255,0.12)",
          width: "100%",
          height: "100%",
          border: "2px solid rgba(245,255,251,0.72)",
          borderRadius: tileRadius,
          boxShadow: isSelected
            ? `${swapRing}, ${selectedGlow}`
            : isSwapMode
              ? swapRing
              : "none",
        }}
        onClick={onClick}
      />
    );
  }
  const stage = STAGES[value] ?? {
    name: String(value),
    icon: "Leaf",
    bg: "#2d6a4f",
    text: "#FFFFF8",
    iconColor: "#FFFFF8",
  };
  const StageIcon = STAGE_ICONS[stage.icon] ?? Leaf;
  const isGradient = stage.bg.includes("gradient");
  const lines = value >= 128 ? stage.name.split(/\s+/) : [stage.name];
  const baseBorderColor =
    value === WIN_VALUE ? "#ffd700" : "rgba(9,73,79,0.38)";

  return (
    <motion.div
      key={value}
      initial={{ scale: 0.6, opacity: 0, borderColor: "rgba(255,255,255,0)" }}
      animate={{ scale: 1, opacity: 1, borderColor: baseBorderColor }}
      transition={{
        scale: { type: "spring", stiffness: 320, damping: 20 },
        opacity: { duration: 0.12 },
        borderColor: { delay: 0.16, duration: 0.16, ease: "easeOut" },
      }}
      className={`flex flex-col items-center justify-center select-none ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      style={{
        background: isGradient ? stage.bg : stage.bg,
        color: stage.text,
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        padding: "clamp(4px, 1.2vw, 10px)",
        boxSizing: "border-box",
        overflow: value === WIN_VALUE ? "visible" : "hidden",
        borderRadius: tileRadius,
        position: "relative",
        zIndex: value === WIN_VALUE ? 2 : 1,
        boxShadow:
          value === WIN_VALUE
            ? "0 0 16px rgba(255,215,0,0.34), 0 0 34px 8px rgba(255,215,0,0.24), inset 0 1px 0 rgba(255,255,255,0.65)"
            : isSelected
              ? `${selectedGlow}, ${swapRing}, inset 0 1px 0 rgba(255,255,255,0.2)`
              : isSwapMode
                ? `${swapRing}, inset 0 1px 0 rgba(255,255,255,0.2)`
                : "inset 0 1px 0 rgba(255,255,255,0.2)",
        borderWidth: value === WIN_VALUE ? 3 : 1,
        borderStyle: "solid",
        filter: isSelected ? "brightness(1.08) saturate(1.16)" : "none",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: "var(--cell-radius, 16px)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.06) 38%, rgba(255,255,255,0) 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-[2px]"
        style={{
          borderRadius: "calc(var(--cell-radius, 16px) - 3px)",
          border: "1px solid rgba(255,255,255,0.14)",
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[20%]"
        style={{
          width: "56%",
          height: "34%",
          transform: "translateX(-50%)",
          borderRadius: "9999px",
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.09) 48%, rgba(255,255,255,0) 100%)",
          opacity: value >= 512 ? 0.32 : 0.2,
        }}
      />
      <StageIcon
        aria-hidden
        strokeWidth={2.2}
        style={{
          width: "clamp(18px, 4.2vw, 36px)",
          height: "clamp(18px, 4.2vw, 36px)",
          flexShrink: 0,
          color: stage.iconColor,
          filter:
            value === WIN_VALUE
              ? "drop-shadow(0 0 3px rgba(255, 247, 214, 0.5)) drop-shadow(0 0 7px rgba(255, 238, 182, 0.22))"
              : "none",
        }}
      />
      <span
        className="font-black text-center leading-tight"
        style={{
          fontSize: "clamp(10px, 2.5vw, 14px)",
          marginTop: 4,
          opacity: 0.92,
          padding: "0 2px",
          maxWidth: "100%",
          wordBreak: "keep-all",
          textShadow: "0 1px 2px rgba(0,0,0,0.12)",
        }}
      >
        {lines.map((line, index) => (
          <React.Fragment key={`${stage.name}-${index}`}>
            {index > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </span>
    </motion.div>
  );
};
