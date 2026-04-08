import type {
  PointerEventHandler,
  ReactNode,
} from "react";

type AdventureGamePanelProps = {
  isMobileViewport: boolean;
  runState: "ready" | "running" | "paused" | "gameover" | "completed";
  introInstructionMessage: string | null;
  introOverlayOpacity: number;
  showMapVolumeUi: boolean;
  onStagePointerDown: PointerEventHandler<HTMLDivElement>;
  onPauseToggle: () => void;
  gameCanvas: ReactNode;
  mapVolumeControls: ReactNode;
  overlayModal: ReactNode;
};

export function AdventureGamePanel({
  isMobileViewport,
  runState,
  introInstructionMessage,
  introOverlayOpacity,
  showMapVolumeUi,
  onStagePointerDown,
  onPauseToggle,
  gameCanvas,
  mapVolumeControls,
  overlayModal,
}: AdventureGamePanelProps) {
  const overlayStyle = {
    color: "var(--color-pale-custard)",
    borderColor: "var(--color-pale-custard)",
    backgroundColor: "rgba(16, 37, 66, 0.82)",
  } as const;

  return (
    <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-3.5 shadow-[0_24px_60px_rgba(17,24,39,0.12)] sm:p-5">
      <div
        className="relative overflow-hidden rounded-[1.75rem] border-4 border-white/80 bg-[#102542] shadow-[0_18px_50px_rgba(17,24,39,0.18)]"
        onPointerDown={onStagePointerDown}
        onContextMenu={(event) => event.preventDefault()}
        style={{
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        <div
          className={`relative mx-auto w-full max-w-[62rem] touch-none overscroll-none ${
            isMobileViewport ? "aspect-[4/3]" : "aspect-[2/1]"
          }`}
        >
          {gameCanvas}
        </div>

        {introInstructionMessage &&
        (runState === "running" || runState === "paused") ? (
          <div
            className="pointer-events-none absolute left-1/2 top-4 z-[11] -translate-x-1/2 transition-opacity duration-700"
            style={{ opacity: introOverlayOpacity }}
          >
            <div
              className="rounded-full border-[3px] px-5 py-2 text-center text-xs font-bold shadow-[0_10px_26px_rgba(16,37,66,0.25)] backdrop-blur-sm sm:text-sm"
              style={overlayStyle}
            >
              {introInstructionMessage}
            </div>
          </div>
        ) : null}

        {showMapVolumeUi && (runState === "running" || runState === "paused") ? (
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
            className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border-[3px] text-lg font-black shadow-[0_14px_28px_rgba(0,0,0,0.2)]"
            style={overlayStyle}
            aria-label={runState === "paused" ? "Resume" : "Pause"}
          >
            {runState === "paused" ? "▶" : "Ⅱ"}
          </button>
        )}

        {overlayModal}
      </div>
    </section>
  );
}
