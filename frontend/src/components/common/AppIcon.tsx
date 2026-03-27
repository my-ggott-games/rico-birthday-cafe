import type { SVGProps } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  ArrowUpToLine,
  Backpack,
  BadgeCheck,
  Camera,
  CalendarCheck,
  CalendarDays,
  CircleDot,
  Clapperboard,
  Coffee,
  Crown,
  DoorOpen,
  Eye,
  Flower2,
  Frown,
  Gift,
  Handbag,
  IdCardLanyard,
  KeyRound,
  Leaf,
  Lock,
  Medal,
  PartyPopper,
  Puzzle,
  RefreshCw,
  Ribbon,
  RotateCcw,
  Save,
  Scissors,
  Shirt,
  ScrollText,
  Share2,
  Shield,
  Sparkles,
  Sprout,
  Sword,
  Swords,
  Trees,
  TrendingUp,
  Trophy,
  Utensils,
  Volume2,
  VolumeX,
  WandSparkles,
  Wrench,
} from "lucide-react";

const APP_ICONS = {
  ArrowLeftRight,
  ArrowUpToLine,
  Backpack,
  BadgeCheck,
  Camera,
  CalendarCheck,
  CalendarDays,
  CircleDot,
  Clapperboard,
  Coffee,
  Crown,
  DoorOpen,
  Eye,
  Flower2,
  Frown,
  Gift,
  Handbag,
  IdCardLanyard,
  KeyRound,
  Leaf,
  Lock,
  Medal,
  PartyPopper,
  Puzzle,
  RefreshCw,
  Ribbon,
  RotateCcw,
  Save,
  Scissors,
  Shirt,
  ScrollText,
  Share2,
  Shield,
  Sparkles,
  Sprout,
  Sword,
  Swords,
  Trees,
  TrendingUp,
  Trophy,
  Utensils,
  Volume2,
  VolumeX,
  WandSparkles,
  Wrench,
};

export type AppIconName = keyof typeof APP_ICONS;

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
