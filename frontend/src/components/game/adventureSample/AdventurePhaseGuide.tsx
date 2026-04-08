import { PushableButton } from "../../common/PushableButton";

type AdventurePhaseItem = {
  id: number;
  start: number;
};

type AdventurePhaseGuideProps = {
  phases: AdventurePhaseItem[];
  activePhaseId: number;
  maxUnlockedPhaseId: number;
  onDebugUnlockAll: () => void;
  onPhaseStart: (startTime: number) => void;
};

export function AdventurePhaseGuide({
  phases,
  activePhaseId,
  maxUnlockedPhaseId,
  onDebugUnlockAll,
  onPhaseStart,
}: AdventurePhaseGuideProps) {
  return (
    <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-4 shadow-[0_18px_40px_rgba(17,24,39,0.08)] sm:p-5">
      <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {phases.map((item) => {
            const active = item.id === activePhaseId;
            const unlocked = item.id <= maxUnlockedPhaseId;

            return (
              <PushableButton
                key={item.id}
                type="button"
                data-ui-control="true"
                disabled={!unlocked}
                onClick={() => onPhaseStart(item.start)}
                variant={active ? "black" : "cream"}
                className={`h-12 w-12 rounded-[1rem] px-0 py-0 text-base ${
                  unlocked
                    ? ""
                    : "border-[#b9c0ca] bg-[#e5e7eb] text-[#8a94a5] shadow-[0_6px_0_#b9c0ca] hover:shadow-[0_6px_0_#b9c0ca]"
                }`}
                aria-label={`${item.id}번 세이브 포인트`}
              >
                {item.id}
              </PushableButton>
            );
          })}
        </div>
        <button
          type="button"
          data-ui-control="true"
          onClick={onDebugUnlockAll}
          className="rounded-full border border-[#102542]/15 bg-[#fff7db] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#166D77] shadow-[0_6px_16px_rgba(16,37,66,0.08)]"
        >
          Debug Unlock
        </button>
      </div>
    </section>
  );
}
