import type { AppIconName } from "./AppIcon";

const ACHIEVEMENT_ICONS: Record<string, AppIconName> = {
  ASPARAGUS_EXCALIBUR: "Sword",
  ASPARAGUS_GARDENER: "Sprout",
  ASPARAGUS_GAEDENER: "Sprout",
  SPECIAL_ASPARAGUS: "Sparkles",
  FIRST_PUZZLE: "Puzzle",
  "LEGEND-HERO": "Sword",
  "R-GEND-HERO": "Crown",
  LUCKY_RICO_MOMENT: "ScrollText",
  RICO_DEBUT_DATE: "Eye",
  THANK_YOU_ALL: "Clapperboard",
  WHO_ARE_YOU: "KeyRound",
  LOST_IN_THE_WAY: "FileQuestionMark",
  SLOGAN_COLLECTOR: "Hand",
};

export const getAchievementIconName = (code: string): AppIconName =>
  ACHIEVEMENT_ICONS[code] ?? "Trophy";
