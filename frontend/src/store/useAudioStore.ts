import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AudioState {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      isMuted: false,
      setMuted: (muted) => set({ isMuted: muted }),
      toggleMuted: () =>
        set((state) => ({
          isMuted: !state.isMuted,
        })),
    }),
    {
      name: "rico-audio-settings",
    },
  ),
);
