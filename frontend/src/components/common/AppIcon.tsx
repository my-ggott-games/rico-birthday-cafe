import type { SVGProps } from "react";
import type { LucideIcon } from "lucide-react";
import { APP_ICONS, type AppIconName } from "./appIconRegistry";

type AppIconProps = SVGProps<SVGSVGElement> & {
  name: AppIconName;
  size?: number;
  strokeWidth?: number;
};

export const AppIcon = ({
  name,
  size = 20,
  strokeWidth = 2,
  ...props
}: AppIconProps) => {
  const Icon = APP_ICONS[name] as LucideIcon;

  return (
    <Icon
      aria-hidden
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
};
