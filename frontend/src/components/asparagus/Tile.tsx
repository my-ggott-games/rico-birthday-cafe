import React from "react";
import { motion } from "framer-motion";
import { STAGES, WIN_VALUE } from "./constants";

interface TileProps {
  value: number | null;
  isSelected?: boolean;
  onClick?: () => void;
}

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
    emoji: "🌿",
    bg: "#2d6a4f",
    text: "#FFFFF8",
  };
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
      <span style={{ fontSize: "clamp(20px, 5vw, 42px)", lineHeight: 1 }}>
        {stage.emoji}
      </span>
      <span
        className="font-black text-center leading-tight"
        style={{
          fontSize: "clamp(11px, 3.2vw, 15px)",
          marginTop: 4,
          opacity: 0.85,
          padding: "0 2px",
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
