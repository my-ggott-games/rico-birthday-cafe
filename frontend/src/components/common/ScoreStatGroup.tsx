import { ScoreStatCard } from "./ScoreStatCard";

type ScoreStatItem = {
  label: string;
  value: number;
  background: string;
  textColor?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

type ScoreStatGroupProps = {
  items: ScoreStatItem[];
  className?: string;
};

export function ScoreStatGroup({
  items,
  className = "",
}: ScoreStatGroupProps) {
  return (
    <div
      className={`select-none flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-3 ${className}`}
    >
      {items.map((item) => (
        <ScoreStatCard
          key={item.label}
          label={item.label}
          value={item.value}
          background={item.background}
          textColor={item.textColor}
          className={item.className}
          labelClassName={item.labelClassName}
          valueClassName={item.valueClassName}
        />
      ))}
    </div>
  );
}
