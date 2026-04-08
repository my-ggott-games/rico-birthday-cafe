import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { PushableButton } from "../common/PushableButton";

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
        className="w-full max-w-[18rem] rounded-[1.6rem] border-4 border-[#102542]/10 bg-[#fffaf2] p-4 shadow-[0_24px_48px_rgba(0,0,0,0.22)] sm:max-w-sm sm:rounded-[2rem] sm:p-6 sm:shadow-[0_30px_60px_rgba(0,0,0,0.22)]"
      >
        <div className="text-center">
          <h3 className="text-xl font-black text-[#102542] sm:text-2xl">{title}</h3>
          <div className="mt-2 text-lg sm:mt-3 sm:text-xl">{status}</div>
          {description ? (
            <p className="text-sm font-bold text-[#365486] sm:text-base">{description}</p>
          ) : null}
        </div>

        {children ? <div className="mt-3 sm:mt-4">{children}</div> : null}

        <div
          className={`mt-4 sm:mt-6 ${
            singleAction
              ? "flex justify-center"
              : "grid gap-3 sm:grid-cols-2"
          }`}
        >
          {actions.map((action) => (
            <PushableButton
              key={action.label}
              type="button"
              data-ui-control="true"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={action.onClick}
              variant={action.tone === "secondary" ? "modalLight" : "modalDark"}
              className={`rounded-[1rem] px-4 py-3 text-sm font-black transition-transform hover:scale-[1.01] sm:rounded-[1.2rem] sm:px-5 sm:py-4 ${
                singleAction ? "w-full max-w-[15rem]" : ""
              }`}
            >
              {action.label}
            </PushableButton>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
