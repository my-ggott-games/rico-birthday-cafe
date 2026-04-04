export const LOBBY_BGM_SRC = "/sound/lobby-bgm.m4a";

export const ACTIVITY_BGM_SOURCES = [
  "/sound/activity-bgm-1.m4a",
  "/sound/activity-bgm-2.m4a",
] as const;

export const pickRandomActivityBgm = () =>
  ACTIVITY_BGM_SOURCES[
    Math.floor(Math.random() * ACTIVITY_BGM_SOURCES.length)
  ];
