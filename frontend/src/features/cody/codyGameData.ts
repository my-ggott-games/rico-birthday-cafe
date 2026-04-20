import type {
  CodyItem,
  EquippedState,
  EquipmentSlot,
} from "../../components/game/cody/codyTypes";

export type ShareNavigator = Navigator & {
  canShare?: (data?: ShareData) => boolean;
};

export const EMPTY_EQUIPMENT: EquippedState = {
  hair: null,
  top: null,
  skirt: null,
  dress: null,
  jacket: null,
  shoes: null,
  deco_1: null,
  deco_2: null,
  deco_3: null,
  deco_4: null,
  deco_5: null,
  deco_6: null,
  hand_acc: null,
};

export const INVALID_POLAROID_SCALE = 0.5;
export const VALID_POLAROID_SCALE = 1;
const PNG_ASSET = (name: string) => `/assets/codygame/${name}.png`;

export const LEGEND_ACHIEVEMENT_CODE = "LEGEND_COORDINATOR";
export const CODY_DISCOVERED_COMBOS_KEY = "cody_discovered_combos";
export const TOTAL_VALID_COMBOS = 5;

const HAIR_PAIRINGS: Array<[string, string]> = [
  ["hair_1-1", "hair_2-1"],
  ["hair_1-2", "hair_2-1"],
  ["hair_1-3", "hair_2-2"],
  ["hair_1-4", "hair_2-1"],
  ["hair_1-5", "hair_2-3"],
  ["hair_1-6", "hair_2-1"],
];

const DECO_ITEMS: Array<{
  id: string;
  slot: EquipmentSlot;
  layerPriority: number;
}> = [
  { id: "deco_1-1", slot: "deco_1", layerPriority: 45 },
  { id: "deco_1-2", slot: "deco_1", layerPriority: 45 },
  { id: "deco_2-1", slot: "deco_2", layerPriority: 34 },
  { id: "deco_2-2", slot: "deco_2", layerPriority: 34 },
  { id: "deco_3-1", slot: "deco_3", layerPriority: 29 },
  { id: "deco_3-2", slot: "deco_3", layerPriority: 45 },
  { id: "deco_3-3", slot: "deco_3", layerPriority: 45 },
  { id: "deco_4-1", slot: "deco_4", layerPriority: 34 },
  { id: "deco_4-2", slot: "deco_4", layerPriority: 26 },
  { id: "deco_5-1", slot: "deco_5", layerPriority: 27 },
  { id: "deco_6-1", slot: "deco_6", layerPriority: 21 },
  { id: "deco_7-1", slot: "hand_acc", layerPriority: 27 },
];

export const AVAILABLE_ITEMS: CodyItem[] = [
  ...HAIR_PAIRINGS.map(([front, back]) => ({
    id: front,
    category: "hair" as const,
    slot: "hair" as const,
    layers: {
      front: PNG_ASSET(front),
      back: PNG_ASSET(back),
    },
  })),
  {
    id: "top_1",
    category: "top",
    slot: "top",
    layerPriority: 28,
    layers: { main: PNG_ASSET("top_1") },
  },
  {
    id: "skirt_1",
    category: "skirt",
    slot: "skirt",
    layers: { main: PNG_ASSET("skirt_1") },
  },
  ...["dress_1", "dress_2", "dress_3", "dress_4", "dress_5"].map((id) => ({
    id,
    category: "dress" as const,
    slot: "dress" as const,
    layers: { main: PNG_ASSET(id) },
  })),
  {
    id: "jacket_1",
    category: "jacket",
    slot: "jacket",
    layerPriority: 32,
    layers: { main: PNG_ASSET("jacket_1") },
  },
  ...["shoes_1", "shoes_2", "shoes_3", "shoes_4", "shoes_5"].map((id) => ({
    id,
    category: "shoes" as const,
    slot: "shoes" as const,
    layers: { main: PNG_ASSET(id) },
  })),
  ...DECO_ITEMS.map(({ id, slot, layerPriority }) => ({
    id,
    category: "deco" as const,
    slot,
    layerPriority,
    layers: { main: PNG_ASSET(id) },
  })),
];

export type Combination = {
  name: string;
  requiredItems: string[];
  backgroundClass?: string;
  backgroundUrl?: string;
};

export const combinations: Combination[] = [
  {
    name: "beer",
    requiredItems: ["deco_1-1", "deco_2-1", "dress_1", "hair_1-2", "shoes_4"],
    backgroundClass: "beer",
  },
  {
    name: "hanbok",
    requiredItems: [
      "deco_1-2",
      "deco_3-1",
      "deco_4-2",
      "deco_5-1",
      "hair_1-3",
      "shoes_5",
      "skirt_1",
      "top_1",
    ],
    backgroundClass: "oriental",
  },
  {
    name: "spring",
    requiredItems: [
      "deco_2-2",
      "deco_7-1",
      "deco_3-3",
      "dress_3",
      "hair_1-4",
      "shoes_1",
    ],
    backgroundClass: "spring",
  },
  {
    name: "rain",
    requiredItems: ["deco_3-2", "dress_2", "hair_1-1", "jacket_1", "shoes_4"],
    backgroundClass: "rain",
  },
  {
    name: "knight",
    requiredItems: ["deco_1-1", "deco_4-1", "dress_4", "hair_1-2", "shoes_3"],
    backgroundClass: "knight",
  },
  {
    name: "training",
    requiredItems: ["deco_6-1", "dress_5", "hair_1-5", "shoes_2"],
    backgroundClass: "training",
  },
];
