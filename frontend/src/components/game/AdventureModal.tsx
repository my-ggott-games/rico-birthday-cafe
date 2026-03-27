import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type AdventureModalAction = {
  label: string;
  onClick: () => void;
  tone?: "primary" | "secondary";
};

type AdventureModalProps = {
  status: string;
  title: string;
  description?: string;
  actions: AdventureModalAction[];
  embedded?: boolean;
  children?: ReactNode;
};

export function AdventureModal({
  status,
  title,
  description,
  actions,
  embedded = false,
  children,
}: AdventureModalProps) {
  const singleAction = actions.length === 1;

  return (
    <div
      className={
        embedded
          ? "absolute inset-0 z-30 flex items-center justify-center p-4"
          : "fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      }
    >
      <motion.div
        initial={{ scale: 0.78, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        data-ui-control="true"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-[2rem] border-4 border-[#102542]/10 bg-[#fffaf2] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.22)]"
      >
        <div className="text-center">
          <h3 className="text-2xl font-black text-[#102542]">{title}</h3>
          <div className="mt-3 text-xl">{status}</div>
          {description ? (
            <p className="text-base font-bold text-[#365486]">{description}</p>
          ) : null}
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        <div
          className={`mt-6 ${
            singleAction
              ? "flex justify-center"
              : "grid gap-3 sm:grid-cols-2"
          }`}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              data-ui-control="true"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={action.onClick}
              className={`rounded-[1.2rem] px-5 py-4 text-sm font-black transition-transform hover:scale-[1.01] ${
                singleAction ? "w-full max-w-[15rem]" : ""
              } ${
                action.tone === "secondary"
                  ? "border-2 border-[#102542] bg-white text-[#102542]"
                  : "bg-[#102542] text-white"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
