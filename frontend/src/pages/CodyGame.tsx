import React, { useState } from "react";
import {
  pointerWithin,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { DraggableItem } from "../components/game/cody/DraggableItem";
import type {
  CodyItem,
  EquippedState,
  EquipmentSlot,
  MobileTabId,
} from "../components/game/cody/codyTypes";
import { GameContainer } from "../components/common/GameContainer";
import { PolaroidFireflyOverlay } from "../components/game/cody/polaroidEffects/PolaroidFireflyOverlay";
import { PolaroidSpringBackdrop } from "../components/game/cody/polaroidEffects/PolaroidSpringBackdrop";
import { getInventoryPreviewLayout } from "../components/game/cody/codyInventoryPreviewLayout";
import { CodyActionBar } from "../components/game/cody/CodyActionBar";
import { CodyDisplayStage } from "../components/game/cody/CodyDisplayStage";
import { CodyInventoryPanel } from "../components/game/cody/CodyInventoryPanel";
import {
  CODY_CHARACTER_CANVAS,
  getCodyCharacterScale,
  getCodyDisplayStageHeight,
  getCodyMannequinScale,
  getCodyPolaroidCharacterOffset,
  getCodyPolaroidCharacterStageClassName,
} from "../components/game/cody/codyStageLayout";
import { domToJpeg } from "modern-screenshot";
import { startCodyAssetPreload } from "../utils/codyAssetPreload";
import { AppIcon } from "../components/common/AppIcon";
import { CODY_TUTORIAL_SLIDES } from "../constants/tutorialSlides";
import { usePageBgm } from "../hooks/usePageBgm";
import { pickRandomActivityBgm } from "../utils/bgm";
import { BASE_URL } from "../utils/api";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";

type ShareNavigator = Navigator & {
  canShare?: (data?: ShareData) => boolean;
};

const EMPTY_EQUIPMENT: EquippedState = {
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

const INVALID_POLAROID_SCALE = 0.5;
const VALID_POLAROID_SCALE = 1;
const PNG_ASSET = (name: string) => `/assets/codygame/${name}.png`;

const CODY_LEGEND_ACHIEVEMENT_CODE = "CODY_LEGEND_COORDINATOR";
const CODY_DISCOVERED_COMBOS_KEY = "cody_discovered_combos";
const TOTAL_VALID_COMBOS = 5; // training 제외, 유효한 조합 수

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

const AVAILABLE_ITEMS: CodyItem[] = [
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

type Combination = {
  name: string;
  requiredItems: string[];
  backgroundClass?: string;
  backgroundUrl?: string;
};

const combinations: Combination[] = [
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

const CodyGame: React.FC = () => {
  const [bgmSrc] = useState(() => pickRandomActivityBgm());

  usePageBgm(bgmSrc);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [equippedIds, setEquippedItems] =
    useState<EquippedState>(EMPTY_EQUIPMENT);
  const [isFinished, setIsFinished] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeBackground, setActiveBackground] = useState<string | null>(null);
  const [orientalBgUrl, setOrientalBgUrl] = useState<string | null>(null);
  const [springBgUrl, setSpringFestivalBgUrl] = useState<string | null>(null);
  const [trainingBgUrl, setTrainingBgUrl] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(true);
  const [showButtons, setShowButtons] = useState(true);
  const [contentVisible, setContentVisible] = useState(true);
  const [isFlyAway, setIsFlyAway] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const polaroidRef = React.useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeTab, setActiveTab] = useState<MobileTabId>("hair");
  const codyAchievementAwardedRef = React.useRef(false);

  const { token } = useAuthStore();
  const { addToast } = useToastStore();

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    startCodyAssetPreload();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const characterScale = getCodyCharacterScale({ isMobile, windowWidth });
  const mannequinScale = getCodyMannequinScale({ isMobile, windowWidth });

  const availableItems = AVAILABLE_ITEMS;

  const applyItemToEquipment = (
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

  const isItemDisabled = (_item: CodyItem) => {
    if (isFinished) return true;
    return false;
  };

  const desktopSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );
  const sensors = isMobile ? [] : desktopSensors;

  const handleReset = () => {
    if (isFinished) {
      // "Fly away" animation first
      setIsFlyAway(true);
      setShowButtons(false);

      setTimeout(() => {
        setEquippedItems(EMPTY_EQUIPMENT);
        setIsFinished(false);
        setResultImage(null);
        setActiveBackground(null);
        setOrientalBgUrl(null);
        setSpringFestivalBgUrl(null);
        setTrainingBgUrl(null);
        setShowInventory(true);
        setShowButtons(true);
        setContentVisible(true);
        setIsFlyAway(false);
      }, 1200);
    } else {
      setEquippedItems(EMPTY_EQUIPMENT);
      setIsFinished(false);
      setResultImage(null);
      setActiveBackground(null);
      setOrientalBgUrl(null);
      setSpringFestivalBgUrl(null);
      setTrainingBgUrl(null);
      setShowInventory(true);
      setShowButtons(true);
      setContentVisible(true);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedItem = availableItems.find((i) => i.id === active.id);

    if (over && draggedItem && !isFinished) {
      if (over.id === "character-zone") {
        setEquippedItems((prev) => applyItemToEquipment(prev, draggedItem));
      }
    }
    setTimeout(() => setActiveId(null), 50);
  };

  const activeItem = activeId
    ? availableItems.find((i) => i.id === activeId)
    : null;

  const getInventoryPreviewStyles = (itemId: string, item?: CodyItem) => {
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

  const renderInventoryPreview = (item: CodyItem) => {
    const { previewOffset, previewLeftOffset, previewScale } =
      getInventoryPreviewStyles(item.id, item);

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
  const topSkirtIds = new Set(["top_1", "skirt_1"]);

  const getCardWidth = (itemId: string) => {
    const { cardSize } = getInventoryPreviewStyles(itemId);
    const widthMatch = cardSize.match(/(?:^|\s)w-(\d+)(?:\s|$)/);
    return widthMatch ? Number(widthMatch[1]) : 0;
  };

  const inventorySections: Array<{
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

  const renderInventoryCard = (
    item: CodyItem,
    index: number,
    total: number,
    overlapClass = "",
    offsetClass = "",
  ) => {
    const isEquipped = Object.values(equippedIds).includes(item.id);
    const isDragging = !isMobile && activeId === item.id;
    const isDisabled = isItemDisabled(item);
    const showRaisedEquippedBadge =
      !isMobile &&
      ["top", "skirt", "dress", "jacket"].includes(item.category);
    const handleClick = () => {
      if (isEquipped) {
        setEquippedItems((prev) => ({
          ...prev,
          [item.slot]: null,
        }));
        return;
      }

      if (!isMobile) return;

      if (!isDisabled) {
        setEquippedItems((prev) => applyItemToEquipment(prev, item));
        window.requestAnimationFrame(() => {
          window.scrollTo(0, 0);
        });
      }
    };

    const { cardSize } = getInventoryPreviewStyles(item.id);

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
            {renderInventoryPreview(item)}
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
            <span className="bg-pale-custard/95 text-[#166D77] px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-[#166D77]/10">
              <span className="inline-flex items-center gap-1">
                <AppIcon name="Sparkles" size={12} />
                장착 중
              </span>
            </span>
          </div>
        )}
      </div>
    );
  };

  const mobileStageHeight = getCodyDisplayStageHeight({
    isMobile,
    isFinished,
  });
  const polaroidCharacterOffset = getCodyPolaroidCharacterOffset({
    activeBackground,
    isFinished,
    isMobile,
  });
  const polaroidCharacterStageClassName =
    getCodyPolaroidCharacterStageClassName(activeBackground);

  const capturePolaroid = async () => {
    if (!polaroidRef.current) return;

    setIsCapturing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 300));

    try {
      const dataUrl = await domToJpeg(polaroidRef.current, {
        quality: 1,
        backgroundColor: "#FFFFF8",
        scale: 4,
      });

      if (window.innerWidth < 768) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `riko-cody-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const shareNavigator = navigator as ShareNavigator;

        if (
          shareNavigator.share &&
          shareNavigator.canShare?.({ files: [file] })
        ) {
          await shareNavigator.share({
            title: "유즈하 리코 생일 기념 리코의 외출 준비",
            text: "나만의 리코 외출 준비를 해봤어요! 여러분도 함께 축하해주세요.",
            files: [file],
          });
          return;
        }
      }

      const link = document.createElement("a");
      link.download = `riko-cody-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error saving image:", error);
      alert("이미지 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <GameContainer
        title="리코의 외출 준비"
        desc="어떤 옷이 어울릴까?"
        gameName="리코의 외출 준비"
        helpSlides={CODY_TUTORIAL_SLIDES}
        className="h-screen font-sans relative select-none bg-[#FFFFF8]"
        headerHidden={!showButtons}
        mainClassName="relative overflow-x-hidden md:overflow-y-auto"
      >
        {activeBackground === "spring" && !isFinished && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                  <PolaroidSpringBackdrop isFinished={false} />
                  <PolaroidFireflyOverlay isFinished={false} />
          </div>
        )}

        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#166D77 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div
          className={`relative z-10 w-full h-full flex ${
            isMobile
              ? `flex-col overflow-x-hidden ${isFinished ? "justify-center" : "overflow-y-auto"}`
              : `${showInventory ? "flex-row-reverse justify-between" : "flex-col justify-center"} min-h-full items-center transition-all duration-1000 px-4 md:px-16 py-10`
          }`}
        >
          {/* Left/Right: Mannequin Display */}
          <div
            className={`${isMobile ? "w-full pt-0" : `${showInventory ? "w-[35%]" : "w-full"} h-full transition-all duration-1000`} flex flex-col items-center ${isMobile ? "justify-start" : "justify-center"}`}
          >
            <CodyDisplayStage
              activeBackground={activeBackground}
              activeId={activeId}
              availableItems={availableItems}
              characterScale={mannequinScale}
              characterStageClassName={polaroidCharacterStageClassName}
              characterOffset={polaroidCharacterOffset}
              contentVisible={contentVisible}
              equippedIds={equippedIds}
              isCapturing={isCapturing}
              isFinished={isFinished}
              isFlyAway={isFlyAway}
              isMobile={isMobile}
              orientalBgUrl={orientalBgUrl}
              polaroidRef={polaroidRef}
              resultImage={resultImage}
              scaleWhenFinished={
                characterScale *
                (activeBackground?.startsWith("linear-gradient")
                  ? INVALID_POLAROID_SCALE
                  : VALID_POLAROID_SCALE)
              }
              springBgUrl={springBgUrl}
              stageHeight={mobileStageHeight}
              trainingBgUrl={trainingBgUrl}
            />

            <CodyActionBar
              isFinished={isFinished}
              isCapturing={isCapturing}
              isMobile={isMobile}
              showButtons={showButtons}
              onReset={handleReset}
              onPrimaryAction={() => {
                if (!isFinished) {
                  // Check for active combinations first
                  const equippedIdsList = Object.values(equippedIds).filter(
                    Boolean,
                  ) as string[];
                  const matchedCombo = combinations.find((combo) => {
                    const hasAllRequired = combo.requiredItems.every((reqId) =>
                      equippedIdsList.includes(reqId),
                    );
                    const hasNoExtras = equippedIdsList.every((eqId) =>
                      combo.requiredItems.includes(eqId),
                    );
                    return hasAllRequired && hasNoExtras;
                  });

                  if (matchedCombo) {
                    setTimeout(() => {
                      setIsFinished(true);
                      setResultImage(
                        [
                          "/assets/codygame/riko_body_smile.png",
                          "/assets/codygame/riko_body_wink.png",
                        ][Math.floor(Math.random() * 2)],
                      );
                      setActiveBackground(
                        matchedCombo.backgroundClass ||
                          matchedCombo.backgroundUrl ||
                          null,
                      );

                      if (matchedCombo.backgroundClass === "oriental") {
                        setOrientalBgUrl(
                          [
                            "/assets/codygame/background_2-1.jpg",
                            "/assets/codygame/background_2-2.jpg",
                            "/assets/codygame/background_2-3.jpg",
                          ][Math.floor(Math.random() * 3)],
                        );
                      } else if (matchedCombo.backgroundClass === "spring") {
                        setSpringFestivalBgUrl(
                          [
                            "/assets/codygame/background_1-1.jpg",
                            "/assets/codygame/background_1-2.jpg",
                            "/assets/codygame/background_1-3.jpg",
                          ][Math.floor(Math.random() * 3)],
                        );
                      } else if (matchedCombo.backgroundClass === "rain") {
                        setOrientalBgUrl(
                          [
                            "/assets/codygame/background_3-1.jpg",
                            "/assets/codygame/background_3-2.jpg",
                            "/assets/codygame/background_3-3.jpg",
                          ][Math.floor(Math.random() * 3)],
                        );
                      } else if (matchedCombo.backgroundClass === "beer") {
                        setOrientalBgUrl(
                          "/assets/codygame/background_6-1.jpg",
                        );
                      } else if (matchedCombo.backgroundClass === "knight") {
                        setOrientalBgUrl(
                          [
                            "/assets/codygame/background_4-1.jpg",
                            "/assets/codygame/background_4-2.jpg",
                            "/assets/codygame/background_4-3.jpg",
                          ][Math.floor(Math.random() * 3)],
                        );
                      } else if (matchedCombo.backgroundClass === "training") {
                        setTrainingBgUrl(
                          [
                            "/assets/codygame/background_5-1.jpg",
                            "/assets/codygame/background_5-2.jpg",
                            "/assets/codygame/background_5-3.jpg",
                          ][Math.floor(Math.random() * 3)],
                        );
                      }

                      setShowInventory(false);
                      setShowButtons(false);

                      // 발견한 조합 누적 기록 및 5가지 달성 시 업적 해금
                      if (matchedCombo.name !== "training") {
                        const storedRaw = localStorage.getItem(
                          CODY_DISCOVERED_COMBOS_KEY,
                        );
                        const stored: string[] = storedRaw
                          ? (JSON.parse(storedRaw) as string[])
                          : [];
                        const updated = Array.from(
                          new Set([...stored, matchedCombo.name]),
                        );
                        localStorage.setItem(
                          CODY_DISCOVERED_COMBOS_KEY,
                          JSON.stringify(updated),
                        );

                        if (
                          updated.length >= TOTAL_VALID_COMBOS &&
                          !codyAchievementAwardedRef.current &&
                          token
                        ) {
                          codyAchievementAwardedRef.current = true;
                          void (async () => {
                            try {
                              const res = await fetch(
                                `${BASE_URL}/achievements/award/${CODY_LEGEND_ACHIEVEMENT_CODE}`,
                                {
                                  method: "POST",
                                  headers: { Authorization: `Bearer ${token}` },
                                },
                              );
                              if (res.ok) {
                                const newlyAwarded =
                                  (await res.json()) === true;
                                if (newlyAwarded) {
                                  addToast({
                                    title: "전설의 코디네이터",
                                    description:
                                      "특별한 코디 조합을 전부 찾아냈다.",
                                    icon: "Shirt",
                                  });
                                }
                              }
                            } catch {
                              codyAchievementAwardedRef.current = false;
                            }
                          })();
                        }
                      }

                      setTimeout(() => {
                        setContentVisible(true);
                        setTimeout(() => setShowButtons(true), 7500);
                      }, 800);
                    }, 100);
                  } else {
                    setIsFinished(true);
                    setResultImage("/assets/codygame/riko_body_default.png");

                    const gradients = [
                      "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
                      "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
                      "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                      "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
                      "linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)",
                      "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                    ];

                    const randomGradient =
                      gradients[Math.floor(Math.random() * gradients.length)];
                    setActiveBackground(randomGradient);

                    setShowInventory(false);

                    setTimeout(() => {
                      setContentVisible(true);
                    }, 400);
                  }
                } else {
                  void capturePolaroid();
                }
              }}
              onShare={() => {
                const shareData = {
                  title: "팬메이드 유즈하 리코 생일카페",
                  text: "유즈하 리코 생일카페에 초대합니다!",
                  url: window.location.origin,
                };

                if (navigator.share) {
                  navigator
                    .share(shareData)
                    .catch((err) => console.log("Error sharing:", err));
                } else {
                  navigator.clipboard
                    .writeText(window.location.origin)
                    .then(() => alert("링크 복사 완료!"))
                    .catch(() => alert("링크 복사 실패"));
                }
              }}
            />
          </div>

          <CodyInventoryPanel
            availableItems={availableItems}
            activeTab={activeTab}
            isFinished={isFinished}
            isMobile={isMobile}
            showInventory={showInventory}
            sections={inventorySections}
            topSkirtIds={topSkirtIds}
            getCardWidth={getCardWidth}
            renderInventoryCard={renderInventoryCard}
            onTabChange={setActiveTab}
          />
        </div>
      </GameContainer>

      {!isMobile && (
        <DragOverlay>
          {activeItem ? (
            <div style={{ zIndex: 99999, pointerEvents: "none" }}>
              <div
                className={`relative ${getInventoryPreviewStyles(activeItem.id).cardSize} overflow-visible`}
              >
                {renderInventoryPreview(activeItem)}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      )}
    </DndContext>
  );
};

export default CodyGame;
