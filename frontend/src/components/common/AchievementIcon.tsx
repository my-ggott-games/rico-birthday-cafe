import { AppIcon, type AppIconName } from "./AppIcon";

const ACHIEVEMENT_ICONS: Record<string, AppIconName> = {
  ASPARAGUS_EXCALIBUR: "Sword",
  FIRST_PUZZLE: "Puzzle",
  "LEGEND-HERO": "Sword",
  "R-GEND-HERO": "Crown",
  LUCKY_RICO_MOMENT: "ScrollText",
  RICO_DEBUT_DATE: "Eye",
  THANK_YOU_ALL: "Clapperboard",
};

const isAssetUrl = (iconUrl?: string | null) =>
  Boolean(iconUrl && /^(https?:\/\/|\/)/.test(iconUrl));

export const getAchievementIconName = (code: string): AppIconName =>
  ACHIEVEMENT_ICONS[code] ?? "Trophy";

export const AchievementIcon = ({
  code,
  iconUrl,
  size = 28,
  className,
}: {
  code: string;
  iconUrl?: string | null;
  size?: number;
  className?: string;
}) => {
  if (isAssetUrl(iconUrl)) {
    return (
      <img
        src={iconUrl ?? ""}
        alt=""
        className={className}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <AppIcon
      name={getAchievementIconName(code)}
      size={size}
      className={className}
    />
  );
};
