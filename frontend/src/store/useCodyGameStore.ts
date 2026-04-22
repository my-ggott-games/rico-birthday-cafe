import { create } from "zustand";
import type { EquippedState, MobileTabId } from "../components/game/cody/codyTypes";
import { EMPTY_EQUIPMENT } from "../features/cody/codyGameData";

const createFormattedDate = () => {
  const today = new Date();
  return `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}. photo by 치코`;
};

type CodyGameState = {
  activeId: string | null;
  equippedIds: EquippedState;
  formattedDate: string;
  isFinished: boolean;
  resultImage: string | null;
  activeBackground: string | null;
  orientalBgUrl: string | null;
  springBgUrl: string | null;
  trainingBgUrl: string | null;
  showInventory: boolean;
  showButtons: boolean;
  contentVisible: boolean;
  isFlyAway: boolean;
  isCapturing: boolean;
  windowWidth: number;
  activeTab: MobileTabId;
};

type CodyGameActions = {
  setActiveId: (id: string | null) => void;
  setEquippedItems: (
    updater: EquippedState | ((prev: EquippedState) => EquippedState),
  ) => void;
  setFormattedDate: (date: string) => void;
  setIsFinished: (v: boolean) => void;
  setResultImage: (img: string | null) => void;
  setActiveBackground: (bg: string | null) => void;
  setOrientalBgUrl: (url: string | null) => void;
  setSpringBgUrl: (url: string | null) => void;
  setTrainingBgUrl: (url: string | null) => void;
  setShowInventory: (v: boolean) => void;
  setShowButtons: (v: boolean) => void;
  setContentVisible: (v: boolean) => void;
  setIsFlyAway: (v: boolean) => void;
  setIsCapturing: (v: boolean) => void;
  setWindowWidth: (w: number) => void;
  setActiveTab: (tab: MobileTabId) => void;
  initGame: (partialState: Partial<CodyGameState>) => void;
  resetGame: () => void;
};

const getDefaultState = (): CodyGameState => ({
  activeId: null,
  equippedIds: { ...EMPTY_EQUIPMENT },
  formattedDate: createFormattedDate(),
  isFinished: false,
  resultImage: null,
  activeBackground: null,
  orientalBgUrl: null,
  springBgUrl: null,
  trainingBgUrl: null,
  showInventory: true,
  showButtons: true,
  contentVisible: true,
  isFlyAway: false,
  isCapturing: false,
  windowWidth: typeof window !== "undefined" ? window.innerWidth : 1024,
  activeTab: "hair",
});

export const useCodyGameStore = create<CodyGameState & CodyGameActions>(
  (set) => ({
    ...getDefaultState(),
    setActiveId: (id) => set({ activeId: id }),
    setEquippedItems: (updater) =>
      set((state) => ({
        equippedIds:
          typeof updater === "function"
            ? updater(state.equippedIds)
            : updater,
      })),
    setFormattedDate: (date) => set({ formattedDate: date }),
    setIsFinished: (v) => set({ isFinished: v }),
    setResultImage: (img) => set({ resultImage: img }),
    setActiveBackground: (bg) => set({ activeBackground: bg }),
    setOrientalBgUrl: (url) => set({ orientalBgUrl: url }),
    setSpringBgUrl: (url) => set({ springBgUrl: url }),
    setTrainingBgUrl: (url) => set({ trainingBgUrl: url }),
    setShowInventory: (v) => set({ showInventory: v }),
    setShowButtons: (v) => set({ showButtons: v }),
    setContentVisible: (v) => set({ contentVisible: v }),
    setIsFlyAway: (v) => set({ isFlyAway: v }),
    setIsCapturing: (v) => set({ isCapturing: v }),
    setWindowWidth: (w) => set({ windowWidth: w }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    initGame: (partialState) =>
      set({ ...getDefaultState(), ...partialState }),
    resetGame: () => set(getDefaultState()),
  }),
);
