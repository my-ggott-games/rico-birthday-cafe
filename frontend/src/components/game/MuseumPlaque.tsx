type MuseumPlaqueProps = {
  className?: string;
};

export const MuseumPlaque = ({
  className = "mt-5",
}: MuseumPlaqueProps) => (
  <div className={`${className} flex justify-center`}>
    <div
      className="w-full rounded-[1.35rem] p-[6px]"
      style={{
        background:
          "linear-gradient(145deg, #4B331C 0%, #7D5A35 22%, #BC9159 48%, #E8D2A8 76%, #8D673F 100%)",
        boxSizing: "border-box",
      }}
    >
      <div
        className="pointer-events-none rounded-[1.05rem] border border-[#fff6df]/35 p-[3px]"
        style={{ boxSizing: "border-box" }}
      >
        <div
          className="rounded-[0.9rem] border border-[#fff7eb] bg-[linear-gradient(180deg,#f8f4ea_0%,#ede5d3_100%)] px-6 py-4 text-center text-[#4b331c]"
          style={{
            boxSizing: "border-box",
            boxShadow:
              "inset 0 1px 0 rgba(255, 247, 235, 0.32), inset 0 -8px 14px rgba(75, 51, 28, 0.14)",
          }}
        >
          <h3 className="mt-2 text-2xl font-semibold tracking-[0.02em]">
            Birthday Banquet
          </h3>
          <p className="mt-2 text-sm tracking-[0.12em] text-[#6f5130]">
            상승새 (2026)
          </p>
        </div>
      </div>
    </div>
  </div>
);
