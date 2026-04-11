import { Play } from "lucide-react";
import type { ReactNode } from "react";

type AdventureGamePanelProps = {
  runState: "ready" | "running" | "paused" | "gameover" | "completed";
  introInstructionMessage: string | null;
  introOverlayOpacity: number;
  introMessageOpacity: number;
  showMapVolumeUi: boolean;
  onPauseToggle: () => void;
  gameCanvas: ReactNode;
  mapVolumeControls: ReactNode;
  overlayModal: ReactNode;
};

export function AdventureGamePanel({
  runState,
  introInstructionMessage,
  introOverlayOpacity,
  introMessageOpacity,
  showMapVolumeUi,
  onPauseToggle,
  gameCanvas,
  mapVolumeControls,
  overlayModal,
}: AdventureGamePanelProps) {
  const overlayStyle = {
    color: "var(--color-pale-custard)",
    borderColor: "var(--color-pale-custard)",
    backgroundColor: "#112543",
  } as const;

  return (
    <section
      data-adventure-layout="desktop"
      className="rounded-2xl border-4 border-[#102542]/10 bg-white/80 p-2 sm:rounded-[2rem] sm:p-5 sm:shadow-[0_24px_60px_rgba(17,24,39,0.12)]"
    >
      <div
        className="relative flex flex-col overflow-hidden rounded-xl border-4 border-white/80 bg-transparent sm:rounded-[1.75rem] sm:shadow-[0_18px_50px_rgba(17,24,39,0.18)]"
        onContextMenu={(event) => event.preventDefault()}
        style={{
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        <div className="relative aspect-square w-full flex-none touch-none overscroll-none sm:aspect-[2/1]">
          {gameCanvas}
        </div>

        {introInstructionMessage &&
        (runState === "running" || runState === "paused") ? (
          <div
            className="pointer-events-none absolute left-1/2 top-4 z-[11] -translate-x-1/2 transition-opacity duration-700"
            style={{ opacity: introMessageOpacity }}
          >
            <div
              className="rounded-full border-[3px] px-5 py-2 text-center text-xs font-bold shadow-[0_10px_26px_rgba(17,37,67,0.25)] backdrop-blur-sm sm:text-sm"
              style={overlayStyle}
            >
              {introInstructionMessage}
            </div>
          </div>
        ) : null}

        {showMapVolumeUi &&
        (runState === "running" || runState === "paused") ? (
          <div
            data-ui-control="true"
            className="absolute bottom-4 left-4 z-[12] w-[11.5rem] transition-opacity duration-700"
            style={{ opacity: introOverlayOpacity }}
          >
            {mapVolumeControls}
          </div>
        ) : null}

        {(runState === "running" || runState === "paused") && (
          <button
            type="button"
            data-ui-control="true"
            onClick={onPauseToggle}
            onPointerDown={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border-[3px] text-base font-black shadow-[0_14px_28px_rgba(0,0,0,0.2)] sm:right-4 sm:top-4 sm:h-12 sm:w-12 sm:text-lg"
            style={overlayStyle}
            aria-label={runState === "paused" ? "Resume" : "Pause"}
          >
            {runState === "paused" ? (
              <Play className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
            ) : (
              "Ⅱ"
            )}
          </button>
        )}

        {overlayModal}
      </div>
    </section>
  );
}
