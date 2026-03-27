import type {
  PointerEventHandler,
  ReactNode,
} from "react";

type AdventureSampleGamePanelProps = {
  activePhaseTitle: string;
  activePhaseDescription: string;
  statusLabel: string;
  displayTimeLabel: string;
  isMobileViewport: boolean;
  isMobilePortrait: boolean;
  runState: "ready" | "running" | "paused" | "gameover" | "completed";
  introInstructionMessage: string | null;
  introOverlayOpacity: number;
  showMapVolumeUi: boolean;
  phaseTransition: {
    title: string;
    theme: string;
  } | null;
  onStagePointerDown: PointerEventHandler<HTMLDivElement>;
  onPauseToggle: () => void;
  gameCanvas: ReactNode;
  mapVolumeControls: ReactNode;
  overlayModal: ReactNode;
};

export function AdventureSampleGamePanel({
  activePhaseTitle,
  activePhaseDescription,
  statusLabel,
  displayTimeLabel,
  isMobileViewport,
  isMobilePortrait,
  runState,
  introInstructionMessage,
  introOverlayOpacity,
  showMapVolumeUi,
  phaseTransition,
  onStagePointerDown,
  onPauseToggle,
  gameCanvas,
  mapVolumeControls,
  overlayModal,
}: AdventureSampleGamePanelProps) {
  return (
    <section
      className={`rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 shadow-[0_24px_60px_rgba(17,24,39,0.12)] ${
        isMobileViewport ? "p-3.5" : "p-4 sm:p-5"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#5EC7A5]">
            {activePhaseTitle}
          </p>
          <h2 className="font-handwriting text-4xl leading-none text-[#166D77] sm:text-5xl">
            {activePhaseDescription}
          </h2>
        </div>
        <div className="rounded-full bg-[#102542] px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-white">
          {statusLabel} · {displayTimeLabel}
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-[1.75rem] border-4 border-white/80 bg-[#102542] shadow-[0_18px_50px_rgba(17,24,39,0.18)]"
        onPointerDown={onStagePointerDown}
        style={{ touchAction: "none" }}
      >
        <div
          className={`w-full touch-none overscroll-none ${
            isMobilePortrait ? "aspect-[9/10]" : "aspect-[2/1]"
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
              className="rounded-full border-2 bg-[#102542]/82 px-5 py-2 text-center text-xs font-bold shadow-[0_10px_26px_rgba(16,37,66,0.25)] backdrop-blur-sm sm:text-sm"
              style={{
                color: "var(--color-pale-custard)",
                borderColor: "var(--color-pale-custard)",
              }}
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
            className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/80 bg-[#102542] text-lg font-black text-white shadow-[0_14px_28px_rgba(0,0,0,0.2)]"
            aria-label={runState === "paused" ? "Resume" : "Pause"}
          >
            {runState === "paused" ? "▶" : "Ⅱ"}
          </button>
        )}

        {phaseTransition ? (
          <div className="pointer-events-none absolute inset-0 z-[14] flex items-center justify-center phase-transition-blackout">
            <div className="phase-transition-card rounded-[1.8rem] border-2 border-[#fff7db] bg-[#102542]/88 px-8 py-5 text-center text-[#fff7db] shadow-[0_22px_56px_rgba(0,0,0,0.32)]">
              <p className="text-xs font-black uppercase tracking-[0.28em] opacity-75">
                New Phase
              </p>
              <p className="mt-2 text-2xl font-black">{phaseTransition.title}</p>
              <p className="mt-1 text-sm font-bold opacity-85">
                {phaseTransition.theme}
              </p>
            </div>
          </div>
        ) : null}

        {overlayModal}
      </div>
    </section>
  );
}
