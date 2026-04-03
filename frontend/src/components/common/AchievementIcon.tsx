import { AppIcon, isAppIconName } from "./AppIcon";
import { getAchievementIconName } from "./achievementIcons";

const isAssetUrl = (iconUrl?: string | null) =>
  Boolean(iconUrl && /^(https?:\/\/|\/)/.test(iconUrl));

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

  if (iconUrl && isAppIconName(iconUrl)) {
    return <AppIcon name={iconUrl} size={size} className={className} />;
  }

  return (
    <AppIcon
      name={getAchievementIconName(code)}
      size={size}
      className={className}
    />
  );
};
