import React from "react";

interface PushableButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export const PushableButton = React.forwardRef<
  HTMLButtonElement,
  PushableButtonProps
>(({ className = "", fullWidth = false, type = "button", children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center rounded-2xl border-2 border-[#3f9e80] bg-[#5EC7A5] px-6 py-3 text-sm font-black text-pale-custard shadow-[0_6px_0_#3f9e80] transition-all hover:translate-y-1 hover:shadow-[0_2px_0_#3f9e80] active:translate-y-1.5 active:shadow-none disabled:opacity-50 ${fullWidth ? "w-full" : ""} ${className}`}
      draggable={false}
      {...props}
    >
      {children}
    </button>
  );
});

PushableButton.displayName = "PushableButton";
