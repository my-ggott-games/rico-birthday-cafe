import type { AppIconName } from "../components/common/appIconRegistry";
import { isAppIconName } from "../components/common/appIconRegistry";
import type { ToastMessage } from "../store/useToastStore";
import { pushEvent } from "./analytics";

export interface AchievementPayload {
  code: string;
  title: string;
  description: string;
  iconUrl: string;
  unlockedAt: string | null;
  earned: boolean;
  active: boolean;
}

export interface AchievementAwardResponse {
  awarded: boolean;
  achievement: AchievementPayload | null;
}

export const parseAchievementAwardResponse = async (
  response: Response,
): Promise<AchievementAwardResponse | null> => {
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as
    | boolean
    | AchievementAwardResponse;

  if (typeof payload === "boolean") {
    return {
      awarded: payload,
      achievement: null,
    };
  }

  return payload;
};

export const addAchievementToast = (
  addToast: (toast: Omit<ToastMessage, "id">) => void,
  achievement: AchievementPayload | null,
  game_name?: string,
) => {
  if (!achievement) {
    return;
  }

  pushEvent("unlock_achievement", {
    achievement_id: achievement.code,
    achievement_name: achievement.title,
    game_name: game_name ?? "unknown",
  });

  const toast = {
    title: achievement.title,
    description: achievement.description,
    ...(isAppIconName(achievement.iconUrl)
      ? { icon: achievement.iconUrl as AppIconName }
      : {}),
  };

  addToast(toast);
};
