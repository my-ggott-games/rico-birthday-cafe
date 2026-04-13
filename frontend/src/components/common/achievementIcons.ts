import type { AppIconName } from "./appIconRegistry";

const ACHIEVEMENT_ICONS: Record<string, AppIconName> = {
  LEGEND_GARDENER: "Sprout",
  LEGEND_COORDINATOR: "Shirt",
  FIRST_PUZZLE: "Puzzle",
  "R-GEND-HERO": "Crown",
  RICO_DEBUT_DATE: "Eye",
  THANK_YOU_ALL: "Clapperboard",
  WHO_ARE_YOU: "KeyRound",
  LOST_IN_THE_WAY: "FileQuestionMark",
  SLOGAN_COLLECTOR: "Hand",
};

export const getAchievementIconName = (code: string): AppIconName =>
  ACHIEVEMENT_ICONS[code] ?? "Trophy";
