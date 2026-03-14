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
import type { CodyItem } from "../components/game/DroppableCharacter";
import { GameContainer } from "../components/common/GameContainer";
import type { TutorialSlide } from "../components/common/TutorialBanner";

import {
  SpringFestivalBackground,
  SpringFestivalPetals,
} from "../components/game/SpringFestivalBackground";
import { FireflyBackground } from "../components/game/FireflyBackground";
import { PolaroidFrame } from "../components/game/PolaroidFrame";
import { domToJpeg } from "modern-screenshot";

type MobileTabId = "hair" | "clothes" | "shoes" | "hair_acc" | "body_acc";
type EquippedState = {
  hair_front: string | null;
  hair_back: string | null;
  clothes: string | null;
  clothes_back: string | null;
  hair_acc: string | null;
  clothes_acc: string | null;
  hand_acc: string | null;
  shoes: string | null;
  accessories: string | null;
};
type ShareNavigator = Navigator & {
  canShare?: (data?: ShareData) => boolean;
};

const EMPTY_EQUIPMENT: EquippedState = {
  hair_front: null,
  hair_back: null,
  clothes: null,
  clothes_back: null,
  hair_acc: null,
  clothes_acc: null,
  hand_acc: null,
  shoes: null,
  accessories: null,
};

const ONE_PIECE_IDS = new Set(["1-3", "2-3", "4-3"]);
const RIBBON_ACCESSORY_IDS = new Set(["3-10", "4-5"]);

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
    title: "특별한 조합이 있어",
    lines: ["모든 조합을 찾으면 좋은 일이 생길지도?"],
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

  const availableItems: CodyItem[] = [
    // --- Training (1) ---
    {
      id: "1-1",
      category: "hair_front",
      layers: {
        front: "/assets/codygame/training_1-1.png",
        back: "/assets/codygame/training_1-2.png",
      },
    },
    {
      id: "1-3",
      category: "clothes",
      isOnePiece: true,
      layers: { main: "/assets/codygame/training_1-3.png" },
    },
    {
      id: "1-4",
      category: "shoes",
      layers: { main: "/assets/codygame/training_1-4.png" },
    },

    // --- Peasant Dress (2) ---
    {
      id: "2-1",
      category: "hair_front",
      layers: {
        front: "/assets/codygame/peasantdress_2-1.png",
        back: "/assets/codygame/peasantdress_2-2.png",
      },
    },
    {
      id: "2-3",
      category: "clothes",
      isOnePiece: true,
      layers: { main: "/assets/codygame/peasantdress_2-3.png" },
    },
    {
      id: "2-4",
      category: "shoes",
      layers: { main: "/assets/codygame/peasantdress_2-4.png" },
    },
    {
      id: "2-5",
      category: "hair_acc",
      layerPriority: 35,
      layers: { front: "/assets/codygame/peasantdress_2-5.png" },
    },
    {
      id: "2-6",
      category: "accessories",
      layers: { main: "/assets/codygame/peasantdress_2-6.png" },
    },

    // --- Hanbok / Rain (3) ---
    {
      id: "3-1",
      category: "hair_front",
      layers: {
        front: "/assets/codygame/hanbok_3-1.png",
        back: "/assets/codygame/hanbok_3-2.png",
      },
    },
    {
      id: "3-3",
      category: "clothes",
      layers: { main: "/assets/codygame/hanbok_3-3.png" },
    },
    {
      id: "3-4",
      category: "clothes_back",
      layers: { back: "/assets/codygame/hanbok_3-4.png" },
    },
    {
      id: "3-5",
      category: "shoes",
      layers: { back: "/assets/codygame/hanbok_3-5.png" },
    },
    {
      id: "3-6",
      category: "hair_acc",
      layers: { main: "/assets/codygame/hanbok_3-6.png" },
    },
    {
      id: "3-7",
      category: "hand_acc",
      layerPriority: 24,
      layers: { back: "/assets/codygame/hanbok_3-7.png" },
    },
    {
      id: "3-8",
      category: "hand_acc",
      layers: { main: "/assets/codygame/hanbok_3-8.png" },
    },
    {
      id: "3-10",
      category: "clothes_acc",
      layerPriority: 31,
      layers: { main: "/assets/codygame/hanbok_3-10.png" },
    },

    // --- Beer / Knight (4) ---
    {
      id: "4-1",
      category: "hair_front",
      layers: {
        front: "/assets/codygame/beer_4-1.png",
        back: "/assets/codygame/beer_4-2.png",
      },
    },
    {
      id: "4-3",
      category: "clothes",
      isOnePiece: true,
      layers: { main: "/assets/codygame/beer_4-3.png" },
    },
    {
      id: "4-4",
      category: "shoes",
      layers: { back: "/assets/codygame/beer_4-4.png" },
    },
    {
      id: "4-5",
      category: "clothes_acc",
      layerPriority: 31,
      layers: { main: "/assets/codygame/beer_4-5.png" },
    },
    {
      id: "4-6",
      category: "hand_acc",
      layers: { back: "/assets/codygame/beer_4-6.png" },
    },
    {
      id: "4-7",
      category: "accessories",
      layers: { main: "/assets/codygame/beer_4-7.png" },
    },

    // --- Others ---
    {
      id: "0-1",
      category: "hair_front",
      layers: { front: "/assets/codygame/others_0-1.png" },
    },
  ];

  const isOnePieceActive =
    !!equippedIds.clothes && ONE_PIECE_IDS.has(equippedIds.clothes);

  const applyItemToEquipment = (
    prev: EquippedState,
    item: CodyItem,
  ): EquippedState => {
    const nextState: EquippedState = { ...prev };

    if (item.id === "2-6") {
      nextState.clothes_acc = null;
      nextState.hand_acc = null;
    } else if (["clothes_acc", "hand_acc"].includes(item.category)) {
      nextState.accessories = null;
    }

    if (RIBBON_ACCESSORY_IDS.has(item.id)) {
      nextState.clothes_acc = null;
    }

    if (item.isOnePiece) {
      nextState.clothes_back = null;
    }

    if (
      item.category === "clothes_back" &&
      nextState.clothes &&
      ONE_PIECE_IDS.has(nextState.clothes)
    ) {
      return nextState;
    }

    if (item.category === "hair_front") {
      nextState.hair_front = item.id;
      nextState.hair_back = item.id;
      return nextState;
    }

    return { ...nextState, [item.category]: item.id };
  };

  const isItemDisabled = (item: CodyItem) => {
    if (isFinished) return true;
    return item.category === "clothes_back" && isOnePieceActive;
  };

  // Combination logic for background changes
  type Combination = {
    name: string;
    requiredItems: string[];
    backgroundClass?: string;
    backgroundUrl?: string;
  };

  const combinations: Combination[] = [
    {
      name: "training",
      requiredItems: ["1-1", "1-3", "1-4"],
      backgroundClass: "bg-[#f0fdf4]",
    },
    {
      name: "peasantdress",
      requiredItems: ["2-1", "2-3", "2-4", "2-5", "2-6"],
      backgroundClass: "spring",
    },
    {
      name: "hanbok",
      requiredItems: ["3-1", "3-3", "3-4", "3-5", "3-6", "3-7"],
      backgroundClass: "oriental",
    },
    {
      name: "rain",
      requiredItems: ["3-1", "3-3"],
      backgroundClass: "rain",
    },
    {
      name: "beer",
      requiredItems: ["4-1", "4-3", "4-4", "4-5", "4-6", "4-7"],
      backgroundClass: "beer",
    },
    {
      name: "knight",
      requiredItems: ["4-1", "4-3"],
      backgroundClass: "knight",
    },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: isMobile
        ? { delay: 250, tolerance: 5 } // hold for 250ms to drag on mobile (allows scroll)
        : { distance: 8 },
    }),
  );

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
                  isSquare={true}
                  hideShadow={!activeBackground?.startsWith("linear-gradient")}
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
                          ? 0.7
                          : 1)
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
                  { id: "hair_acc", label: "헤어 액세서리" },
                  { id: "body_acc", label: "액세서리" },
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
                  filter: (i: any) =>
                    ["hair_front", "hair_back"].includes(i.category),
                },
                {
                  id: "clothes",
                  label: "의상",
                  filter: (i: any) =>
                    ["clothes", "clothes_back"].includes(i.category),
                },
                {
                  id: "shoes",
                  label: "신발",
                  filter: (i: any) => ["shoes"].includes(i.category),
                },
                {
                  id: "hair_acc",
                  label: "헤어 액세서리",
                  filter: (i: any) => ["hair_acc"].includes(i.category),
                },
                {
                  id: "body_acc",
                  label: "액세서리",
                  filter: (i: any) =>
                    ["accessories", "clothes_acc", "hand_acc"].includes(
                      i.category,
                    ),
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
                        const isDragging = activeId === item.id;
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

                        // 모바일 인벤토리 전용 스케일 적용
                        const inventoryScale = isMobile
                          ? characterScale * 0.75
                          : characterScale;

                        // 카테고리별 아이템 카드 크기 및 위치 설정 (PC/모바일 분기)
                        let cardSize = "";
                        let previewOffset = "";

                        if (item.category === "clothes") {
                          cardSize = isMobile ? "w-32 h-48" : "w-72 h-[36rem]"; // PC 의상 높이 대폭 확장 (rem 대신 직관적인 px 사용)
                          previewOffset = isMobile ? "-200px" : "-120px"; // 모바일 이미지 위치 위로 더 끌어올림
                        } else if (item.category === "shoes") {
                          cardSize = isMobile ? "w-28 h-28" : "w-52 h-52";
                          previewOffset = isMobile ? "-310px" : "-165px";
                        } else {
                          // hair, accessories
                          cardSize = isMobile ? "w-28 h-40" : "w-60 h-60";
                          previewOffset = isMobile ? "-150px" : "-40px"; // 모바일 이미지 위치 위로 더 끌어올림
                        }

                        return (
                          <div
                            key={item.id}
                            onClick={handleClick}
                            className={`relative ${cardSize} overflow-hidden border-2 border-dashed rounded-3xl flex-shrink-0 bg-[#FDFBF7]/50 transition-all group shadow-sm ${
                              isDisabled
                                ? "border-[#166D77]/10 opacity-45 cursor-not-allowed"
                                : "border-[#166D77]/30 hover:border-[#D46A6A]/50 hover:bg-pale-custard/80 active:scale-95"
                            }`}
                          >
                            {!isEquipped && !isDragging && (
                              <>
                                <div
                                  className={`absolute w-[384px] h-[700px] ${isDisabled ? "pointer-events-none" : "cursor-grab active:cursor-grabbing"}`}
                                  style={{
                                    top: previewOffset,
                                    left: "50%",
                                    transform: `translateX(-50%) scale(${inventoryScale})`,
                                  }}
                                >
                                  <DraggableItem
                                    id={item.id}
                                    layers={item.layers}
                                    category={item.category}
                                    className="w-full h-full p-0"
                                  />
                                </div>
                              </>
                            )}

                            {isEquipped && (
                              <div className="absolute inset-0 bg-[#166D77]/10 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="bg-pale-custard/90 text-[#166D77] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                  장착 중 ✨
                                </span>
                              </div>
                            )}

                            {isDisabled && !isEquipped && (
                              <div className="absolute inset-x-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-center text-[10px] font-bold text-white">
                                원피스 착용 중
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

      <DragOverlay>
        {activeItem ? (
          <div style={{ zIndex: 99999, pointerEvents: "none" }}>
            <div
              className="relative"
              style={{
                width: 384 * characterScale,
                height: 700 * characterScale,
              }}
            >
              <div
                className="absolute inset-0 origin-top-left"
                style={{ transform: `scale(${characterScale})` }}
              >
                {/* Back Layer - BEHIND mannequin theoretically, but handled by order in overlay */}
                {activeItem.layers.back && (
                  <img
                    src={activeItem.layers.back}
                    alt={`${activeItem.category}-back`}
                    className="absolute inset-0 w-[384px] h-[700px] object-contain z-0"
                  />
                )}

                {/* Main Layer (z-50) */}
                {activeItem.layers.main && (
                  <img
                    src={activeItem.layers.main}
                    alt={`${activeItem.category}-main`}
                    className="absolute inset-0 w-[384px] h-[700px] object-contain z-40"
                  />
                )}

                {/* Front Layer (z-50) */}
                {activeItem.layers.front && (
                  <img
                    src={activeItem.layers.front}
                    alt={`${activeItem.category}-front`}
                    className="absolute inset-0 w-[384px] h-[700px] object-contain z-50"
                  />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default CodyGame;
