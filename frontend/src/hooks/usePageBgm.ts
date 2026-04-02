import { useEffect } from "react";

type UsePageBgmOptions = {
  loop?: boolean;
  volume?: number;
};

export const usePageBgm = (
  src: string,
  { loop = true, volume = 1 }: UsePageBgmOptions = {},
) => {
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = volume;
    audio.preload = "auto";

    let isDisposed = false;

    const removeUnlockListeners = () => {
      window.removeEventListener("pointerdown", handleUnlock);
      window.removeEventListener("keydown", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
    };

    const handleUnlock = () => {
      if (isDisposed) {
        return;
      }

      void audio.play().then(removeUnlockListeners).catch(() => undefined);
    };

    const startPlayback = async () => {
      try {
        await audio.play();
      } catch {
        window.addEventListener("pointerdown", handleUnlock, { once: true });
        window.addEventListener("keydown", handleUnlock, { once: true });
        window.addEventListener("touchstart", handleUnlock, { once: true });
      }
    };

    audio.load();
    void startPlayback();

    return () => {
      isDisposed = true;
      removeUnlockListeners();
      audio.pause();
      audio.currentTime = 0;
    };
  }, [loop, src, volume]);
};
