export type CodyCategory =
  | "hair"
  | "top"
  | "skirt"
  | "dress"
  | "jacket"
  | "shoes"
  | "deco";

export type EquipmentSlot =
  | "hair"
  | "top"
  | "skirt"
  | "dress"
  | "jacket"
  | "shoes"
  | "deco_1"
  | "deco_2"
  | "deco_3"
  | "deco_4"
  | "deco_5"
  | "deco_6";

export type MobileTabId = "hair" | "clothes" | "shoes" | "deco";

export type EquippedState = Record<EquipmentSlot, string | null>;

export interface InventoryPreviewLayout {
  mobileCard: string;
  desktopCard: string;
  mobileOffset: string;
  desktopOffset: string;
  mobileLeftOffset: string;
  desktopLeftOffset: string;
}

export interface CodyItem {
  id: string;
  category: CodyCategory;
  slot: EquipmentSlot;
  label?: string;
  layerPriority?: number;
  layers: {
    front?: string;
    back?: string;
    main?: string;
  };
}
