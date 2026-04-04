import { useEffect, useRef } from "react";
import {
  isPageTransitionLoading,
  PAGE_TRANSITION_LOADING_EVENT,
} from "../utils/pageTransitionLoading";
import { useAudioStore } from "../store/useAudioStore";

type UsePageBgmOptions = {
  loop?: boolean;
  volume?: number;
};

export const usePageBgm = (
  src: string,
  { loop = true, volume = 1 }: UsePageBgmOptions = {},
) => {
  const isMuted = useAudioStore((state) => state.isMuted);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tryStartPlaybackRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = volume;
    audio.preload = "auto";
    audio.muted = useAudioStore.getState().isMuted;
    audioRef.current = audio;
    audio.addEventListener("error", () => {
      console.error("BGM load/play error", {
        src,
        networkState: audio.networkState,
        readyState: audio.readyState,
      });
    });

    let isDisposed = false;
    let unlockListenersAttached = false;

    const removeUnlockListeners = () => {
      if (!unlockListenersAttached) {
        return;
      }

      window.removeEventListener("pointerdown", handleUnlock);
      window.removeEventListener("keydown", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
      unlockListenersAttached = false;
    };

    const addUnlockListeners = () => {
      if (unlockListenersAttached || isPageTransitionLoading()) {
        return;
      }

      window.addEventListener("pointerdown", handleUnlock, { once: true });
      window.addEventListener("keydown", handleUnlock, { once: true });
      window.addEventListener("touchstart", handleUnlock, { once: true });
      unlockListenersAttached = true;
    };

    const tryStartPlayback = async () => {
      if (isDisposed || isPageTransitionLoading()) {
        return;
      }

      try {
        await audio.play();
        removeUnlockListeners();
      } catch (error) {
        console.warn("BGM autoplay blocked or failed", { src, error });
        addUnlockListeners();
      }
    };
    tryStartPlaybackRef.current = tryStartPlayback;

    const handleUnlock = () => {
      void tryStartPlayback();
    };

    const handleLoadingChange = (event: Event) => {
      const { detail } = event as CustomEvent<{ loading?: boolean }>;

      if (detail.loading) {
        removeUnlockListeners();
        return;
      }

      void tryStartPlayback();
    };

    window.addEventListener(
      PAGE_TRANSITION_LOADING_EVENT,
      handleLoadingChange as EventListener,
    );

    audio.load();
    void tryStartPlayback();

    return () => {
      isDisposed = true;
      removeUnlockListeners();
      window.removeEventListener(
        PAGE_TRANSITION_LOADING_EVENT,
        handleLoadingChange as EventListener,
      );
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      tryStartPlaybackRef.current = null;
      audio.pause();
      audio.currentTime = 0;
    };
  }, [loop, src, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.muted = isMuted;

    if (!isMuted) {
      void tryStartPlaybackRef.current?.();
    }
  }, [isMuted]);
};
