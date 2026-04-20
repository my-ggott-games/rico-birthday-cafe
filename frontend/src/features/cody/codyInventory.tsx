import React from "react";
import { AppIcon } from "../../components/common/AppIcon";
import { DraggableItem } from "../../components/game/cody/DraggableItem";
import { CODY_CHARACTER_CANVAS } from "../../components/game/cody/codyStageLayout";
import { getInventoryPreviewLayout } from "../../components/game/cody/codyInventoryPreviewLayout";
import type {
  CodyItem,
  EquippedState,
  MobileTabId,
} from "../../components/game/cody/codyTypes";

export const applyItemToEquipment = (
  prev: EquippedState,
  item: CodyItem,
): EquippedState => {
  const nextState: EquippedState = { ...prev };

  if (item.category === "dress") {
    nextState.top = null;
    nextState.skirt = null;
  }

  if (item.category === "top" || item.category === "skirt") {
    nextState.dress = null;
  }

  nextState[item.slot] = item.id;
  return nextState;
};

export const getInventoryPreviewStyles = (
  itemId: string,
  item: CodyItem | undefined,
  isMobile: boolean,
  characterScale: number,
) => {
  const layout = getInventoryPreviewLayout(itemId);
  const mobileOutfitScale =
    isMobile &&
    item &&
    ["top", "skirt", "dress", "jacket"].includes(item.category)
      ? 0.86
      : 1;

  return {
    cardSize: isMobile ? layout.mobileCard : layout.desktopCard,
    previewOffset: isMobile ? layout.mobileOffset : layout.desktopOffset,
    previewLeftOffset: isMobile
      ? layout.mobileLeftOffset
      : layout.desktopLeftOffset,
    previewScale: isMobile
      ? characterScale * 0.75 * mobileOutfitScale
      : characterScale,
  };
};

export const renderInventoryPreview = (
  item: CodyItem,
  isMobile: boolean,
  characterScale: number,
) => {
  const { previewOffset, previewLeftOffset, previewScale } =
    getInventoryPreviewStyles(item.id, item, isMobile, characterScale);

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        width: `${CODY_CHARACTER_CANVAS.width}px`,
        height: `${CODY_CHARACTER_CANVAS.height}px`,
        top: previewOffset,
        left: "50%",
        transform: `translateX(calc(-50% + ${previewLeftOffset})) scale(${previewScale})`,
      }}
    >
      {item.layers.back && (
        <img
          src={item.layers.back}
          alt={`${item.category}-back`}
          className="absolute inset-0 h-full w-full object-contain pointer-events-none"
          style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.05))" }}
        />
      )}
      {item.layers.main && (
        <img
          src={item.layers.main}
          alt={`${item.category}-main`}
          className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        />
      )}
      {item.layers.front && (
        <img
          src={item.layers.front}
          alt={`${item.category}-front`}
          className="absolute inset-0 h-full w-full object-contain pointer-events-none"
          style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.05))" }}
        />
      )}
    </div>
  );
};

const hairDecoIds = new Set(["deco_3-1", "deco_3-2", "deco_3-3"]);
const swordDecoIds = new Set(["deco_4-1", "deco_4-2"]);
export const topSkirtIds = new Set(["top_1", "skirt_1"]);

export const getCardWidth = (
  itemId: string,
  isMobile: boolean,
  characterScale: number,
) => {
  const { cardSize } = getInventoryPreviewStyles(
    itemId,
    undefined,
    isMobile,
    characterScale,
  );
  const widthMatch = cardSize.match(/(?:^|\s)w-(\d+)(?:\s|$)/);
  return widthMatch ? Number(widthMatch[1]) : 0;
};

export const inventorySections: Array<{
  id: string;
  tab: MobileTabId;
  overlap: boolean;
  mobileOverlapClass?: string;
  desktopOverlapClass?: string;
  filter: (item: CodyItem) => boolean;
}> = [
  {
    id: "hair",
    tab: "hair",
    overlap: false,
    filter: (item) => item.category === "hair",
  },
  {
    id: "hair-deco",
    tab: "deco",
    overlap: false,
    filter: (item) => hairDecoIds.has(item.id),
  },
  {
    id: "dress",
    tab: "clothes",
    overlap: true,
    mobileOverlapClass: "-ml-12",
    desktopOverlapClass: "-ml-30",
    filter: (item) => item.category === "dress" || item.category === "jacket",
  },
  {
    id: "deco",
    tab: "deco",
    overlap: false,
    filter: (item) =>
      item.category === "deco" &&
      !hairDecoIds.has(item.id) &&
      !swordDecoIds.has(item.id),
  },
  {
    id: "sword",
    tab: "deco",
    overlap: false,
    filter: (item) => swordDecoIds.has(item.id),
  },
  {
    id: "shoes",
    tab: "shoes",
    overlap: false,
    filter: (item) => item.category === "shoes",
  },
];

type RenderInventoryCardArgs = {
  item: CodyItem;
  index: number;
  total: number;
  overlapClass?: string;
  offsetClass?: string;
  equippedIds: EquippedState;
  activeId: string | null;
  isMobile: boolean;
  isFinished: boolean;
  characterScale: number;
  setEquippedItems: React.Dispatch<React.SetStateAction<EquippedState>>;
};

export const renderInventoryCard = ({
  item,
  index,
  total,
  overlapClass = "",
  offsetClass = "",
  equippedIds,
  activeId,
  isMobile,
  isFinished,
  characterScale,
  setEquippedItems,
}: RenderInventoryCardArgs) => {
  const isEquipped = Object.values(equippedIds).includes(item.id);
  const isDragging = !isMobile && activeId === item.id;
  const isDisabled = isFinished;
  const showRaisedEquippedBadge =
    !isMobile && ["top", "skirt", "dress", "jacket"].includes(item.category);

  const handleClick = () => {
    if (isEquipped) {
      setEquippedItems((prev) => ({
        ...prev,
        [item.slot]: null,
      }));
      return;
    }

    if (!isMobile || isDisabled) {
      return;
    }

    setEquippedItems((prev) => applyItemToEquipment(prev, item));
    window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  };

  const { cardSize } = getInventoryPreviewStyles(
    item.id,
    item,
    isMobile,
    characterScale,
  );

  return (
    <div
      key={item.id}
      onClick={handleClick}
      className={`relative ${cardSize} overflow-visible rounded-3xl flex-shrink-0 transition-all group bg-transparent border-transparent ${
        item.category === "shoes" ? "self-end" : ""
      } ${offsetClass} ${index > 0 ? overlapClass : ""} ${
        isDisabled
          ? "opacity-45 cursor-not-allowed"
          : `hover:z-20 active:scale-95 ${!isMobile ? "cursor-grab active:cursor-grabbing" : ""}`
      }`}
      style={{
        zIndex: isDragging ? total + 1 : isEquipped ? 0 : total - index,
      }}
    >
      {!isEquipped && !isDragging && (
        <>
          {renderInventoryPreview(item, isMobile, characterScale)}
          {!isMobile && !isDisabled && (
            <DraggableItem
              id={item.id}
              layers={item.layers}
              category={item.category}
              className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
              renderPreview={false}
            />
          )}
        </>
      )}

      {isEquipped && (
        <div
          className={`absolute z-30 flex justify-center ${
            showRaisedEquippedBadge
              ? "left-1/2 top-0 w-max -translate-x-1/2 -translate-y-[60%]"
              : "inset-0 items-center"
          }`}
        >
          <span className="whitespace-nowrap bg-pale-custard/95 text-[#166D77] px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-[#166D77]/10">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <AppIcon name="Sparkles" size={12} />
              장착 중
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
