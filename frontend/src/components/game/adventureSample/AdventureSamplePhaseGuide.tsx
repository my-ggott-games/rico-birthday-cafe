type AdventureSamplePhaseItem = {
  id: number;
  title: string;
  theme: string;
  start: number;
  end: number;
};

type AdventureSamplePhaseGuideProps = {
  phases: AdventureSamplePhaseItem[];
  activePhaseId: number;
  maxUnlockedPhaseId: number;
  onDebugUnlockAll: () => void;
  onPhaseStart: (startTime: number) => void;
  formatTime: (seconds: number) => string;
};

export function AdventureSamplePhaseGuide({
  phases,
  activePhaseId,
  maxUnlockedPhaseId,
  onDebugUnlockAll,
  onPhaseStart,
  formatTime,
}: AdventureSamplePhaseGuideProps) {
  return (
    <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-[#102542]">Phase Preview</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ui-control="true"
            onClick={onDebugUnlockAll}
            className="rounded-full border border-[#102542]/15 bg-[#fff7db] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#166D77] shadow-[0_6px_16px_rgba(16,37,66,0.08)]"
          >
            Debug Unlock
          </button>
          <span className="rounded-full bg-[#2a9d8f] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
            {activePhaseId} / {phases.length}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {phases.map((item) => {
          const active = item.id === activePhaseId;
          const unlocked = item.id <= maxUnlockedPhaseId;

          return (
            <button
              key={item.id}
              type="button"
              data-ui-control="true"
              disabled={!unlocked}
              onClick={() => onPhaseStart(item.start)}
              className={`w-full rounded-[1.2rem] border px-4 py-3 ${
                active
                  ? "border-[#102542] bg-[#102542] text-white"
                  : unlocked
                    ? "border-[#102542]/10 bg-[#fffaf2] text-[#102542] transition-transform hover:scale-[1.01]"
                    : "border-[#9ca3af]/40 bg-[#e5e7eb] text-[#6b7280]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
                    {item.title}
                  </p>
                  <p className="text-base font-black">{item.theme}</p>
                </div>
                <p className="text-sm font-bold">
                  {formatTime(item.start)} - {formatTime(item.end)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
