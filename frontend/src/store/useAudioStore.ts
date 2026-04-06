import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AudioState {
  isMuted: boolean;
  currentBgmSrc: string | null;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  setCurrentBgmSrc: (src: string | null) => void;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      isMuted: false,
      currentBgmSrc: null,
      setMuted: (muted) => set({ isMuted: muted }),
      toggleMuted: () =>
        set((state) => ({
          isMuted: !state.isMuted,
        })),
      setCurrentBgmSrc: (src) => set({ currentBgmSrc: src }),
    }),
    {
      name: "rico-audio-settings",
      partialize: (state) => ({
        isMuted: state.isMuted,
      }),
    },
  ),
);
