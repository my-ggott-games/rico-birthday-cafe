export const LOBBY_BGM_SRC = "/sound/lobby-bgm-128k.m4a";

export const ACTIVITY_BGM_SOURCES = [
  "/sound/activity-bgm-1.m4a",
  "/sound/activity-bgm-2.m4a",
] as const;

export const pickRandomActivityBgm = () =>
  ACTIVITY_BGM_SOURCES[
    Math.floor(Math.random() * ACTIVITY_BGM_SOURCES.length)
  ];

const bgmAudioBySrc = new Map<string, HTMLAudioElement>();

// One element per track, shared by the preload queue and usePageBgm, so a
// track is never downloaded twice. Nothing loads until someone asks for it.
export const getBgmAudio = (src: string) => {
  let audio = bgmAudioBySrc.get(src);
  if (!audio) {
    audio = new Audio();
    audio.preload = "none";
    audio.src = src;
    bgmAudioBySrc.set(src, audio);
  }
  return audio;
};
