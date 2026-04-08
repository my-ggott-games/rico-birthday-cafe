type ScoreStatCardProps = {
  label: string;
  value: number;
  background: string;
  textColor?: string;
  borderColor?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function ScoreStatCard({
  label,
  value,
  background,
  textColor = "#FFFFF8",
  borderColor = "var(--color-pale-custard)",
  className = "",
  labelClassName = "",
  valueClassName = "",
}: ScoreStatCardProps) {
  return (
    <div
      className={`flex min-w-[88px] flex-col items-center rounded-2xl border-2 px-4 py-2 shadow-[0_10px_24px_rgba(16,37,66,0.16)] ${className}`}
      style={{
        background,
        color: textColor,
        borderColor,
        fontFamily: "OneStoreMobilePop",
      }}
    >
      <span
        className={`text-[10px] font-bold uppercase tracking-[0.22em] opacity-70 ${labelClassName}`}
      >
        {label}
      </span>
      <span className={`text-xl font-black leading-tight ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}
