type AdventureHudPanelProps = {
  statusLabel: string;
  displayTimeLabel: string;
  finalScore: number;
};

export function AdventureHudPanel({
  statusLabel,
  displayTimeLabel,
  finalScore,
}: AdventureHudPanelProps) {
  return (
    <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
      <h3 className="text-lg font-black text-[#102542]">Current HUD</h3>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-[1.2rem] bg-[#102542] px-4 py-3 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">
            Status
          </p>
          <p className="mt-1 text-lg font-black">{statusLabel}</p>
        </div>
        <div className="rounded-[1.2rem] bg-[#E0F2FE] px-4 py-3 text-[#166D77]">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">
            Time
          </p>
          <p className="mt-1 text-lg font-black">{displayTimeLabel}</p>
        </div>
        <div className="rounded-[1.2rem] bg-[#FFE4E6] px-4 py-3 text-[#166D77]">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">
            Final
          </p>
          <p className="mt-1 text-lg font-black">{finalScore}</p>
        </div>
      </div>
    </section>
  );
}
