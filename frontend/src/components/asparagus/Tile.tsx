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
    iconColor: "#FFFFF8",
  };
  const StageIcon = STAGE_ICONS[stage.icon] ?? Leaf;
  const isGradient = stage.bg.includes("gradient");
  const lines = value >= 128 ? stage.name.split(/\s+/) : [stage.name];
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
        position: "relative",
        boxShadow:
          value === WIN_VALUE
            ? "0 0 24px 6px rgba(255,200,0,0.4), inset 0 1px 0 rgba(255,255,255,0.65)"
            : "0 6px 14px rgba(10,75,82,0.08), inset 0 1px 0 rgba(255,255,255,0.2)",
        border:
          value === WIN_VALUE
            ? "3px solid #ffd700"
            : isSelected
              ? "3px solid #2da487"
              : "1px solid rgba(9,73,79,0.38)",
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
          border: "1px solid rgba(8,73,79,0.18)",
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[20%]"
        style={{
          width: "56%",
          height: "34%",
          transform: "translateX(-50%)",
          borderRadius: "9999px",
          background: "rgba(255,255,255,0.16)",
          filter: "blur(10px)",
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
              ? "drop-shadow(0 0 12px rgba(255,255,255,0.7))"
              : "drop-shadow(0 2px 8px rgba(0,0,0,0.14))",
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
