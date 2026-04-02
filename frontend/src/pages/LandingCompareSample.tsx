import { useState } from "react";

type CompareMode = "compare" | "landing" | "landing1";

const IMAGE_SOURCES = {
  landing: "/landing.jpg",
  landing1: "/landing1.jpg",
} as const;

const labels: Record<CompareMode, string> = {
  compare: "Compare",
  landing: "landing.jpg",
  landing1: "landing1.jpg",
};

function CoverImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`absolute inset-0 h-full w-full select-none object-cover object-top ${className}`}
    />
  );
}

export default function LandingCompareSample() {
  const [mode, setMode] = useState<CompareMode>("compare");
  const [split, setSplit] = useState(50);

  return (
    <main className="relative h-screen h-dvh w-full overflow-hidden bg-[#0b1115] text-white">
      <div className="absolute inset-0">
        <CoverImage
          src={IMAGE_SOURCES.landing}
          alt="landing.jpg full screen preview"
        />

        {mode === "compare" && (
          <>
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${split}%` }}
            >
              <CoverImage
                src={IMAGE_SOURCES.landing1}
                alt="landing1.jpg full screen preview"
              />
            </div>

            <div
              className="absolute inset-y-0 z-20 w-px bg-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
              style={{ left: `calc(${split}% - 0.5px)` }}
            >
              <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/35 text-xs font-black tracking-[0.24em] backdrop-blur-md">
                DRAG
              </div>
            </div>
          </>
        )}

        {mode === "landing1" && (
          <CoverImage
            src={IMAGE_SOURCES.landing1}
            alt="landing1.jpg full screen preview"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/45" />
      </div>

      <section className="pointer-events-none relative z-30 flex h-full flex-col justify-between p-4 md:p-6">
        <div className="pointer-events-auto flex w-fit max-w-full flex-col gap-3 rounded-[1.5rem] border border-white/18 bg-black/30 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.32em] text-white/64">
              Landing Sample
            </p>
            <h1 className="mt-1 text-lg font-black tracking-[0.16em] text-white md:text-xl">
              Full Screen Cover Compare
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["compare", "landing", "landing1"] as const).map((value) => {
              const active = value === mode;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold tracking-[0.12em] transition ${
                    active
                      ? "border-white bg-white text-[#091015]"
                      : "border-white/25 bg-white/10 text-white/82 hover:bg-white/18"
                  }`}
                >
                  {labels[value]}
                </button>
              );
            })}
          </div>

          {mode === "compare" && (
            <label className="flex items-center gap-3 text-xs font-bold tracking-[0.18em] text-white/84">
              SPLIT
              <input
                type="range"
                min="0"
                max="100"
                value={split}
                onChange={(event) => setSplit(Number(event.target.value))}
                className="h-2 w-52 accent-white md:w-72"
              />
              <span className="min-w-10 text-right">{split}%</span>
            </label>
          )}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="rounded-full border border-white/18 bg-black/28 px-4 py-2 text-xs font-bold tracking-[0.18em] text-white/78 backdrop-blur-md md:text-sm">
            Base: landing.jpg
            {mode === "compare" && " / Overlay: landing1.jpg"}
          </div>

          <div className="rounded-full border border-white/18 bg-black/28 px-4 py-2 text-xs font-bold tracking-[0.18em] text-white/78 backdrop-blur-md md:text-sm">
            Mode: {labels[mode]}
          </div>
        </div>
      </section>
    </main>
  );
}
