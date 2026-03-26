const DIRIRING_SRC = encodeURI("/diriring.mp3");

let diriringAudio: HTMLAudioElement | null = null;
let lastPlayedAt = 0;

const getDiriringAudio = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!diriringAudio) {
    diriringAudio = new Audio(DIRIRING_SRC);
    diriringAudio.preload = "auto";
  }

  return diriringAudio;
};

export const playDiriringSfx = async () => {
  const audio = getDiriringAudio();
  if (!audio) return;

  const now = Date.now();
  if (now - lastPlayedAt < 150) {
    return;
  }

  lastPlayedAt = now;

  try {
    audio.pause();
    audio.currentTime = 0;
    await audio.play();
  } catch (error) {
    console.warn("Failed to play diriring effect", error);
  }
};

export const preloadDiriringSfx = () => {
  const audio = getDiriringAudio();
  audio?.load();
};
