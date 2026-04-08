import { Play } from "lucide-react";
import type { PointerEventHandler, ReactNode } from "react";

type AdventureGamePanelMobileProps = {
  runState: "ready" | "running" | "paused" | "gameover" | "completed";
  introInstructionMessage: string | null;
  introOverlayOpacity: number;
  onStagePointerDown: PointerEventHandler<HTMLDivElement>;
  onPauseToggle: () => void;
  gameCanvas: ReactNode;
  overlayModal: ReactNode;
};

export function AdventureGamePanelMobile({
  runState,
  introInstructionMessage,
  introOverlayOpacity,
  onStagePointerDown,
  onPauseToggle,
  gameCanvas,
  overlayModal,
}: AdventureGamePanelMobileProps) {
  const overlayStyle = {
    color: "var(--color-pale-custard)",
    borderColor: "var(--color-pale-custard)",
    backgroundColor: "#112543",
  } as const;

  return (
    <section
      data-adventure-layout="mobile"
      className="rounded-[1.7rem] border-4 border-[#102542]/10 bg-white/80 p-2.5 shadow-[0_20px_45px_rgba(17,24,39,0.12)]"
    >
      <div
        className="relative overflow-hidden rounded-[1.45rem] border-4 border-white/80 bg-[#112543] shadow-[0_18px_44px_rgba(17,24,39,0.18)]"
        onPointerDown={onStagePointerDown}
        onContextMenu={(event) => event.preventDefault()}
        style={{
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        <div className="relative h-[28rem] w-full touch-none overscroll-none">
          {gameCanvas}
        </div>

        {introInstructionMessage &&
        (runState === "running" || runState === "paused") ? (
          <div
            className="pointer-events-none absolute left-1/2 top-3 z-[11] w-[calc(100%-4rem)] -translate-x-1/2 transition-opacity duration-700"
            style={{ opacity: introOverlayOpacity }}
          >
            <div
              className="rounded-full border-[3px] px-4 py-2 text-center text-[11px] font-bold leading-tight shadow-[0_10px_24px_rgba(17,37,67,0.25)] backdrop-blur-sm"
              style={overlayStyle}
            >
              {introInstructionMessage}
            </div>
          </div>
        ) : null}

        {(runState === "running" || runState === "paused") && (
          <button
            type="button"
            data-ui-control="true"
            onClick={onPauseToggle}
            onPointerDown={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border-[3px] text-base font-black shadow-[0_12px_24px_rgba(0,0,0,0.2)]"
            style={overlayStyle}
            aria-label={runState === "paused" ? "Resume" : "Pause"}
          >
            {runState === "paused" ? <Play className="h-4 w-4" aria-hidden="true" /> : "Ⅱ"}
          </button>
        )}

        {overlayModal}
      </div>
    </section>
  );
}
