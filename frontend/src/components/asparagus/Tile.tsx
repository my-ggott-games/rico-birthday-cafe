import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpToLine,
  CalendarCheck,
  CalendarDays,
  CircleDot,
  Crown,
  Flower2,
  Leaf,
  Sprout,
  Sword,
  Trees,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { STAGES, WIN_VALUE } from "./constants";

interface TileProps {
  value: number | null;
  isSelected?: boolean;
  onClick?: () => void;
}

const STAGE_ICONS: Record<string, LucideIcon> = {
  Sprout,
  ArrowUpToLine,
  TrendingUp,
  Leaf,
  Trees,
  Flower2,
  CircleDot,
  CalendarDays,
  CalendarCheck,
  Utensils,
  Crown,
  Sword,
};

export const Tile: React.FC<TileProps> = ({ value, isSelected, onClick }) => {
  if (!value) {
    return (
      <div
        className={`transition-all ${onClick ? "cursor-pointer hover:bg-white/20" : ""}`}
        style={{
          background: isSelected
            ? "rgba(94, 199, 165, 0.4)"
            : "rgba(74,59,50,0.08)",
          width: "100%",
          height: "100%",
          border: isSelected ? "3px solid #5EC7A5" : "none",
          borderRadius: "var(--cell-radius, 16px)",
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
  };
  const StageIcon = STAGE_ICONS[stage.icon] ?? Leaf;
  const isGradient = stage.bg.includes("gradient");
  const words = stage.name.split(/\s+/);
  const lines =
    words.length <= 2
      ? words
      : [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
  return (
    <motion.div
      key={value}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
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
        overflow: "hidden",
        borderRadius: "var(--cell-radius, 16px)",
        boxShadow:
          value === WIN_VALUE
            ? "0 0 24px 6px rgba(255,200,0,0.4)"
            : "0 2px 8px rgba(0,0,0,0.10)",
        border:
          value === WIN_VALUE
            ? "3px solid #ffd700"
            : isSelected
              ? "3px solid #5EC7A5"
              : "none",
        filter: isSelected ? "brightness(1.1) saturate(1.2)" : "none",
      }}
    >
      <StageIcon
        aria-hidden
        strokeWidth={2.2}
        style={{
          width: "clamp(18px, 4.2vw, 36px)",
          height: "clamp(18px, 4.2vw, 36px)",
          flexShrink: 0,
        }}
      />
      <span
        className="font-black text-center leading-tight"
        style={{
          fontSize: "clamp(9px, 2.1vw, 13px)",
          marginTop: 3,
          opacity: 0.85,
          padding: "0 2px",
          maxWidth: "100%",
          wordBreak: "keep-all",
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
