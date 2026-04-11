type ScoreStatCardProps = {
  label: string;
  value: number;
  background: string;
  textColor?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function ScoreStatCard({
  label,
  value,
  background,
  textColor = "#FFFFF8",
  className = "",
  labelClassName = "",
  valueClassName = "",
}: ScoreStatCardProps) {
  return (
    <div
      className={`flex min-w-[88px] flex-col items-center rounded-2xl px-4 py-2 ${className}`}
      style={{
        background,
        color: textColor,
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
