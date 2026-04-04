import React from "react";

type PushableButtonVariant = "mint" | "cream";

interface PushableButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  variant?: PushableButtonVariant;
}

const PUSHABLE_BUTTON_VARIANTS: Record<PushableButtonVariant, string> = {
  mint: "border-[#3f9e80] bg-[#5EC7A5] text-pale-custard shadow-[0_6px_0_#3f9e80] hover:shadow-[0_2px_0_#3f9e80]",
  cream:
    "border-[#D8B98C] bg-[#FFF8EA] text-[#166D77] shadow-[0_6px_0_#D8B98C] hover:shadow-[0_2px_0_#D8B98C]",
};

export const PushableButton = React.forwardRef<
  HTMLButtonElement,
  PushableButtonProps
>(
  (
    {
      className = "",
      fullWidth = false,
      type = "button",
      variant = "mint",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`inline-flex items-center justify-center rounded-2xl border-2 px-6 py-3 text-sm font-black transition-all hover:translate-y-1 active:translate-y-1.5 active:shadow-none disabled:opacity-50 ${PUSHABLE_BUTTON_VARIANTS[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
        draggable={false}
        {...props}
      >
        {children}
      </button>
    );
  },
);

PushableButton.displayName = "PushableButton";
