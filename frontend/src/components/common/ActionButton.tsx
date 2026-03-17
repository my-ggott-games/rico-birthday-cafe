import React from "react";

export type ActionButtonVariant = "frame" | "sage" | "teal" | "neutral";
export type ActionButtonSize = "sm" | "md" | "lg";

interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ActionButtonVariant, string> = {
  frame:
    "border-2 border-[#d8c39f] bg-[#fffaf0] text-[#166D77] shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-[#fff6e7]",
  sage:
    "border-b-4 border-black/10 bg-[#d7e2ad] text-[#385953] shadow-lg hover:bg-[#cad79b]",
  teal:
    "border-b-4 border-black/10 bg-[#166D77] text-[#FFFFF8] shadow-lg hover:bg-[#11535b]",
  neutral:
    "border-b-4 border-black/5 bg-[#ebe7df] text-[#6d685f] shadow-lg hover:bg-[#dfd9cf]",
};

const SIZE_CLASSES: Record<ActionButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-2xl gap-1.5",
  md: "px-6 py-3 text-base rounded-2xl gap-2",
  lg: "px-8 py-4 text-xl rounded-[1.6rem] gap-2.5",
};

export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  ActionButtonProps
>(
  (
    {
      className = "",
      variant = "frame",
      size = "md",
      fullWidth = false,
      type = "button",
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center whitespace-nowrap font-black transition-all active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 select-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      draggable={false}
      {...props}
    >
      {children}
    </button>
  ),
);

ActionButton.displayName = "ActionButton";
