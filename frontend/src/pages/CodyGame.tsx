import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { DraggableItem } from "../components/game/DraggableItem";
import { DroppableCharacter } from "../components/game/DroppableCharacter";
import type {
  CodyItem,
  EquippedState,
  EquipmentSlot,
  MobileTabId,
} from "../components/game/codyTypes";
import { GameContainer } from "../components/common/GameContainer";
import type { TutorialSlide } from "../components/common/TutorialBanner";

import {
  SpringFestivalBackground,
  SpringFestivalPetals,
} from "../components/game/SpringFestivalBackground";
import { FireflyBackground } from "../components/game/FireflyBackground";
import { PolaroidFrame } from "../components/game/PolaroidFrame";
import { getInventoryPreviewLayout } from "../components/game/codyInventoryPreviewLayout";
import { domToJpeg } from "modern-screenshot";

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
};

const INVALID_POLAROID_SCALE = 0.5;
const VALID_POLAROID_SCALE = 1;
const PNG_ASSET = (name: string) => `/assets/codygame/${name}.png`;

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
    requiredItems: ["deco_2-2", "deco_3-3", "dress_3", "hair_1-4", "shoes_1"],
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
    backgroundClass: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
  },
];

const CODY_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "옷을 고르자!",
    lines: [
      "PC: 아이템을 드래그해서 코디 존에 넣어봐!",
      "모바일: 아이템을 탭해봐!",
    ],
    showArrows: false,
  },
  {
    title: "코디가 끝났다면",
    lines: ['"코디 끝!" 버튼을 눌러줘.', "사진을 찍어줄게!"],
    showArrows: false,
  },
  {
    title: "사진을 저장하자!",
    lines: ["코디가 끝나면 이미지 저장 버튼으로", "추억을 남기자!"],
    showArrows: false,
  },
  {
    title: "장착 규칙 확인",
    lines: [
      "dress는 top, skirt와 함께 입을 수 없어.",
      "deco는 같은 번호끼리만 서로 교체돼.",
    ],
    showArrows: false,
  },
];

const CodyGame: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [equippedIds, setEquippedItems] =
    useState<EquippedState>(EMPTY_EQUIPMENT);
  const [isFinished, setIsFinished] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeBackground, setActiveBackground] = useState<string | null>(null);
  const [orientalBgUrl, setOrientalBgUrl] = useState<string | null>(null);
  const [springBgUrl, setSpringFestivalBgUrl] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(true);
  const [showButtons, setShowButtons] = useState(true);
  const [contentVisible, setContentVisible] = useState(true);
  const [isFlyAway, setIsFlyAway] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const polaroidRef = React.useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeTab, setActiveTab] = useState<MobileTabId>("hair");

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Optimization: Pre-load results and character bodies
    const imagesToPreload = [
      "/assets/codygame/riko_body_smile.png",
      "/assets/codygame/riko_body_wink.png",
      "/assets/codygame/riko_body_default.png",
      "/assets/codygame/background_1-1.jpg",
      "/assets/codygame/background_2-1.jpg",
      "/assets/codygame/background_3-1.jpg",
    ];
    // Add all category items to preload if needed, but keeping it small for now.
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const characterScale = isMobile ? 1.1 : windowWidth > 1440 ? 1.3 : 1.1;

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
      if (!isMobile) {
        setIsFlyAway(true);
      }
      setShowButtons(false);

      setTimeout(() => {
        setEquippedItems(EMPTY_EQUIPMENT);
        setIsFinished(false);
        setResultImage(null);
        setActiveBackground(null);
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

  const getInventoryPreviewStyles = (itemId: string) => {
    const layout = getInventoryPreviewLayout(itemId);

    return {
      cardSize: isMobile ? layout.mobileCard : layout.desktopCard,
      previewOffset: isMobile ? layout.mobileOffset : layout.desktopOffset,
      previewLeftOffset: isMobile
        ? layout.mobileLeftOffset
        : layout.desktopLeftOffset,
      previewScale: isMobile ? characterScale * 0.75 : characterScale,
    };
  };

  const renderInventoryPreview = (item: CodyItem) => {
    const { previewOffset, previewLeftOffset, previewScale } =
      getInventoryPreviewStyles(item.id);

    return (
      <div
        className="pointer-events-none absolute w-[384px] h-[700px]"
        style={{
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

  const getPolaroidCharacterOffset = () => {
    if (activeBackground?.startsWith("linear-gradient")) {
      return { x: 0, y: 72 };
    }

    switch (activeBackground) {
      case "spring":
        return { x: -2, y: 470 };
      case "oriental":
        return { x: -4, y: 488 };
      case "rain":
        return { x: -6, y: 492 };
      case "beer":
        return { x: 6, y: 482 };
      case "knight":
        return { x: 4, y: 486 };
      default:
        return { x: 0, y: 485 };
    }
  };

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
            title: "유즈하 리코 생일 기념 코디 게임",
            text: "나만의 리코를 코디해봤어요! 여러분도 함께 축하해주세요 🎀",
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <GameContainer
        title="리코 옷입히기"
        desc="어떤 옷이 어울릴까?"
        gameName="리코 옷입히기"
        helpSlides={CODY_TUTORIAL_SLIDES}
        className="h-screen font-sans relative select-none bg-[#FFFFF8]"
        headerHidden={!showButtons}
        mainClassName="relative overflow-hidden"
      >
        {activeBackground === "spring" && !isFinished && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <SpringFestivalBackground isFinished={false} />
            <FireflyBackground isFinished={false} />
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
              ? `flex-col ${isFinished ? "justify-center" : "overflow-y-auto pb-32"}`
              : `${showInventory ? "flex-row-reverse justify-between" : "flex-col justify-center"} items-center transition-all duration-1000 px-4 md:px-16 py-10`
          }`}
        >
          {/* Left/Right: Mannequin Display */}
          <div
            className={`${isMobile ? "w-full pt-8" : `${showInventory ? "w-[35%]" : "w-full"} h-full transition-all duration-1000`} flex flex-col items-center justify-center`}
          >
            <div
              className={`relative z-10 w-full ${isMobile ? "h-[550px]" : "h-[700px]"} flex items-center justify-center`}
            >
              {isFinished ? (
                <PolaroidFrame
                  isFlyAway={isFlyAway}
                  activeBackground={activeBackground}
                  characterOffset={getPolaroidCharacterOffset()}
                  polaroidRef={polaroidRef}
                  hideAnimations={isCapturing}
                  backgroundContent={
                    <>
                      {/* 그라데이션 배경, 배경색 배경용 로직 유지 */}
                      {activeBackground?.startsWith("linear-gradient") && (
                        <div className="absolute inset-0 z-0 bg-transparent" />
                      )}

                      {/* 올바른 조합 배경을 이미지로 직접 렌더링 */}
                      {!activeBackground?.startsWith("linear-gradient") &&
                        activeBackground === "spring" && (
                          <div className="absolute inset-0 z-0">
                            <img
                              src={
                                springBgUrl ||
                                "/assets/codygame/background_1-1.jpg"
                              }
                              className="w-full h-full object-cover object-[center_30%]"
                              alt="background-scene"
                            />
                          </div>
                        )}
                      {!activeBackground?.startsWith("linear-gradient") &&
                        ["oriental", "rain", "beer", "knight"].includes(
                          activeBackground || "",
                        ) && (
                          <div className="absolute inset-0 z-0">
                            <img
                              src={
                                orientalBgUrl ||
                                "/assets/codygame/background_3-1.jpg"
                              }
                              className="w-full h-full object-cover object-[center_10%]"
                              alt="background-scene"
                            />
                          </div>
                        )}
                    </>
                  }
                  overlayContent={
                    <>
                      {!isCapturing && activeBackground === "spring" && (
                        <FireflyBackground isFinished={true} />
                      )}
                      {!isCapturing && activeBackground === "oriental" && (
                        <SpringFestivalPetals
                          isFinished={true}
                          isFlyAway={isFlyAway}
                        />
                      )}
                    </>
                  }
                >
                  <div className="relative">
                    <DroppableCharacter
                      equippedIds={equippedIds}
                      activeId={activeId}
                      isFinished={isFinished}
                      resultImage={resultImage}
                      scale={
                        characterScale *
                        (activeBackground?.startsWith("linear-gradient")
                          ? INVALID_POLAROID_SCALE
                          : VALID_POLAROID_SCALE)
                      }
                      isMobile={isMobile}
                      availableItems={availableItems}
                    />
                  </div>
                </PolaroidFrame>
              ) : (
                <div
                  className={`transition-opacity duration-300 ${contentVisible ? "opacity-100" : "opacity-0"}`}
                >
                  <DroppableCharacter
                    equippedIds={equippedIds}
                    activeId={activeId}
                    isFinished={isFinished}
                    resultImage={resultImage}
                    scale={characterScale}
                    isMobile={isMobile}
                    availableItems={availableItems}
                  />
                </div>
              )}
            </div>

            <div
              className={`z-[100] flex gap-4 transition-opacity duration-1000 ${!showButtons ? "opacity-0 pointer-events-none" : "opacity-100"} ${isMobile ? "fixed bottom-4 left-0 right-0 justify-center" : "relative mt-8"}`}
            >
              <button onClick={handleReset} className="btn-secondary">
                다시하기
              </button>

              <button
                onClick={() => {
                  if (!isFinished) {
                    // Check for active combinations first
                    const equippedIdsList = Object.values(equippedIds).filter(
                      Boolean,
                    ) as string[];
                    const matchedCombo = combinations.find((combo) => {
                      const hasAllRequired = combo.requiredItems.every(
                        (reqId) => equippedIdsList.includes(reqId),
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
                            [
                              "/assets/codygame/background_4-1.jpg",
                              "/assets/codygame/background_4-2.jpg",
                              "/assets/codygame/background_4-3.jpg",
                            ][Math.floor(Math.random() * 3)],
                          );
                        } else if (matchedCombo.backgroundClass === "knight") {
                          setOrientalBgUrl(
                            [
                              "/assets/codygame/background_4-1.jpg",
                              "/assets/codygame/background_4-2.jpg",
                              "/assets/codygame/background_4-3.jpg",
                            ][Math.floor(Math.random() * 3)],
                          );
                        }

                        setShowInventory(false);
                        setShowButtons(false);

                        // 슬로우 페이드 인 (총 약 7.5~8초 소요)
                        setTimeout(() => {
                          setContentVisible(true);
                          setTimeout(() => setShowButtons(true), 7500); // 애니메이션 끝난 후 버튼 표시
                        }, 800);
                      }, 100);
                    } else {
                      // No combo matched (그라데이션 배경)
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
                      setShowButtons(false);

                      // 패스트 페이드 인 (총 약 1.7~2초 소요)
                      setTimeout(() => {
                        setContentVisible(true);
                        setTimeout(() => setShowButtons(true), 1500); // 빠른 연출 후 버튼 표시
                      }, 400);
                    }
                  } else {
                    void capturePolaroid();
                  }
                }}
                className={isCapturing ? "btn-disabled" : "btn-primary"}
              >
                {isCapturing
                  ? "작업 중..."
                  : isFinished
                    ? "이미지 저장 📸"
                    : "코디 끝!✨"}
              </button>

              {isFinished && (
                <button
                  onClick={() => {
                    const shareData = {
                      title: "유즈하 리코 생일 기념 코디 게임",
                      text: "나만의 리코를 코디해봤어요! 여러분도 함께 축하해주세요 🎀",
                      url: window.location.origin,
                    };

                    if (navigator.share) {
                      navigator
                        .share(shareData)
                        .catch((err) => console.log("Error sharing:", err));
                    } else {
                      navigator.clipboard
                        .writeText(window.location.origin)
                        .then(() =>
                          alert("공유 링크가 클립보드에 복사되었습니다!"),
                        )
                        .catch(() => alert("공유 링크 복사에 실패했습니다."));
                    }
                  }}
                  className="btn-secondary"
                >
                  공유하기 🔗
                </button>
              )}
            </div>
          </div>

          {/* Background/Right: Wardrobe */}
          <div
            className={`${isMobile ? `w-full ${showInventory ? "px-4" : "h-0 p-0"}` : "w-[65%] h-full"} flex flex-col transition-all duration-1000 ${showInventory ? "opacity-100" : "opacity-0 w-[0%] overflow-hidden pointer-events-none"}`}
          >
            {/* Mobile Tab UI - PC는 탭 없이 통합 뷰 제공 */}
            {isMobile && !isFinished && (
              <div className="relative z-50 flex mb-6 mt-4 mx-4 overflow-x-auto overflow-y-hidden gap-2 bg-transparent border-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  { id: "hair", label: "헤어" },
                  { id: "clothes", label: "의상" },
                  { id: "shoes", label: "신발" },
                  { id: "deco", label: "장식" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setActiveTab(tab.id as MobileTabId)}
                    className={`relative z-50 shrink-0 whitespace-nowrap py-3 px-3 rounded-xl text-sm font-black transition-colors ${
                      activeTab === tab.id
                        ? "bg-[#166D77] text-pale-custard shadow-md"
                        : "text-[#166D77]/60 hover:bg-pale-custard/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <div
              className={`flex-1 ${isMobile ? "pb-40" : "overflow-y-auto custom-scrollbar px-6 pb-20"} transition-opacity ${isFinished ? "opacity-30 pointer-events-none" : ""}`}
            >
              {[
                {
                  id: "hair",
                  label: "헤어",
                  filter: (i: CodyItem) => i.category === "hair",
                },
                {
                  id: "clothes",
                  label: "의상",
                  filter: (i: CodyItem) =>
                    ["top", "skirt", "dress", "jacket"].includes(i.category),
                },
                {
                  id: "shoes",
                  label: "신발",
                  filter: (i: CodyItem) => i.category === "shoes",
                },
                {
                  id: "deco",
                  label: "장식",
                  filter: (i: CodyItem) => i.category === "deco",
                },
              ]
                .filter((section) => !isMobile || activeTab === section.id)
                .map((section) => (
                  <div key={section.id} className="mb-0">
                    <div
                      className={`flex ${isMobile ? "overflow-x-auto" : "flex-wrap justify-start"}`}
                    >
                      {availableItems.filter(section.filter).map((item) => {
                        const isEquipped = Object.values(equippedIds).includes(
                          item.id,
                        );
                        const isDragging = !isMobile && activeId === item.id;
                        const isDisabled = isItemDisabled(item);
                        const handleClick = () => {
                          // 모바일이 아닌 경우(PC 환경) 클릭으로 장착하지 않음
                          if (!isMobile) return;

                          if (!isEquipped && !isDisabled) {
                            setEquippedItems((prev) =>
                              applyItemToEquipment(prev, item),
                            );
                          }
                        };

                        const { cardSize } = getInventoryPreviewStyles(item.id);

                        return (
                          <div
                            key={item.id}
                            onClick={handleClick}
                            className={`relative ${cardSize} overflow-visible border-2 border-dashed rounded-3xl flex-shrink-0 bg-[#FDFBF7]/50 transition-all group shadow-sm ${
                              isDisabled
                                ? "border-[#166D77]/10 opacity-45 cursor-not-allowed"
                                : `border-[#166D77]/30 hover:border-[#D46A6A]/50 hover:bg-pale-custard/80 active:scale-95 ${!isMobile ? "cursor-grab active:cursor-grabbing" : ""}`
                            }`}
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
                              <div className="absolute inset-0 bg-[#166D77]/10 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="bg-pale-custard/90 text-[#166D77] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                  장착 중 ✨
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
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
