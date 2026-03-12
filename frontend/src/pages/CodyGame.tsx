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
import { ReturnButton } from "../components/common/ReturnButton";
import { motion } from "framer-motion";

import { SpringFestivalBackground, SpringFestivalPetals } from "../components/game/SpringFestivalBackground";
import { FireflyBackground } from "../components/game/FireflyBackground";
import { PolaroidFrame } from "../components/game/PolaroidFrame";
import { domToJpeg } from "modern-screenshot";

const CodyGame: React.FC = () => {

  const [activeId, setActiveId] = useState<string | null>(null);
  const [equippedIds, setEquippedItems] = useState<{
    hair: string | null;
    clothes: string | null;
    hair_acc: string | null;
    clothes_acc: string | null;
    hand_acc: string | null;
    accessories: string | null;
  }>({
    hair: null,
    clothes: null,
    hair_acc: null,
    clothes_acc: null,
    hand_acc: null,
    accessories: null,
  });
  const [isFinished, setIsFinished] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeBackground, setActiveBackground] = useState<string | null>(null);
  const [orientalBgUrl, setOrientalBgUrl] = useState<string | null>(null);
  const [springFestivalBgUrl, setSpringFestivalBgUrl] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(true);
  const [showButtons, setShowButtons] = useState(true);
  const [contentVisible, setContentVisible] = useState(true);
  const [isFlyAway, setIsFlyAway] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const polaroidRef = React.useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeTab, setActiveTab] = useState<"hair" | "clothes" | "hair_acc" | "body_acc">("hair");

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Optimization: Pre-load results and character bodies
    const imagesToPreload = [
      "/assets/codygame/riko_body_smile.png",
      "/assets/codygame/riko_body_wink.png",
      "/assets/codygame/riko_body_default.png",
      "/assets/codygame/rico_hair_front_long.png",
      "/assets/codygame/riko_hair_back_long.png",
      "/assets/codygame/rico_hair_front_twintail.png",
      "/assets/codygame/riko_hair_back_twintail.png",
      "/assets/codygame/rico_hair_front_short.png",
      "/assets/codygame/riko_hair_back_short.png",
      "/assets/codygame/riko_clothes_training.png",
      "/assets/codygame/riko_clothes_peasantdress.png",
      "/assets/codygame/riko_clothes_hanbok.png",
      "/assets/codygame/riko_clothes_ ribbons.png",
      "/assets/codygame/riko_clothes_ jeogori.png",
      "/assets/codygame/riko_ accessories_flowers.png",
      "/assets/codygame/riko_ accessories_ hairpin.png",
      "/assets/codygame/riko_ accessories_ norigae.png",
      "/assets/codygame/riko_ accessories_sword.png",
      "/assets/codygame/riko_ accessories_flowercrown.png",
      "/assets/codygame/background_1.jpg",
      "/assets/codygame/background_2.jpg",
      "/assets/codygame/background_3.jpg",
      "/assets/codygame/background_4.jpg",
    ];
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const characterScale = isMobile ? 1.1 : windowWidth > 1440 ? 1.3 : 1.1;

  const availableItems: CodyItem[] = [
    // Hair
    {
      id: "hair-1",
      category: "hair",
      layers: {
        front: "/assets/codygame/rico_hair_front_long.png",
        back: "/assets/codygame/riko_hair_back_long.png",
      },
    },
    {
      id: "hair-2",
      category: "hair",
      layers: {
        front: "/assets/codygame/rico_hair_front_twintail.png",
        back: "/assets/codygame/riko_hair_back_twintail.png",
      },
    },
    {
      id: "hair-3",
      category: "hair",
      layers: {
        front: "/assets/codygame/rico_hair_front_short.png",
        back: "/assets/codygame/riko_hair_back_short.png",
      },
    },
    // Clothes
    {
      id: "clothes-1",
      category: "clothes",
      layers: { main: "/assets/codygame/riko_clothes_training.png" },
    },
    {
      id: "clothes-2",
      category: "clothes",
      layers: { main: "/assets/codygame/riko_clothes_peasantdress.png" },
    },
    {
      id: "clothes-3",
      category: "clothes",
      layers: {
        back: "/assets/codygame/riko_clothes_hanbok.png",
        main: "/assets/codygame/riko_clothes_ jeogori.png",
        front: "/assets/codygame/riko_clothes_ ribbons.png",
      },
    }, // Combined Hanbok
    // Accessories (Specific Slots)
    // Leaving flowers as a full "accessories" composite, or migrating it? The user said: "flowers 는 헤어+옷+손 액세서리가 합쳐져 있어. 다른 액세서리를 추가로 장착할 수 없지."
    // We will just keep flowers under a generic 'accessories' for logic checks if needed, but since it takes up ALL slots ideally we clear others or map it to a specific slot that conflicts.
    // Actually, let's treat it as a master `accessories` and we'll handle conflicts on drop.
    {
      id: "accessories-1",
      category: "accessories",
      layers: { main: "/assets/codygame/riko_ accessories_flowers.png" },
    },
    {
      id: "accessories-2",
      category: "hair_acc",
      layers: { back: "/assets/codygame/riko_ accessories_ hairpin.png" },
    }, // Changed to back layer to go behind short hair
    {
      id: "accessories-3",
      category: "clothes_acc",
      layers: { main: "/assets/codygame/riko_ accessories_ norigae.png" },
    },
    {
      id: "accessories-4",
      category: "hand_acc",
      layers: { back: "/assets/codygame/riko_ accessories_sword.png" },
    }, // Sword goes behind
    {
      id: "accessories-5",
      category: "hair_acc",
      layers: { front: "/assets/codygame/riko_ accessories_flowercrown.png" },
    },
  ];

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
      requiredItems: ["hair-1", "clothes-1"], // Long Hair + Training Clothes
      backgroundClass: "bg-[#f0fdf4]", // Standard hex instead of Tailwind v4 oklch
    },
    {
      name: "peasantdress",
      requiredItems: ["hair-2", "clothes-2", "accessories-1", "accessories-5"], // Twintails + Peasant Dress + Flowers + Flowercrown
      backgroundClass: "spring-festival",
    },
    {
      name: "hanbok",
      requiredItems: [
        "hair-3",
        "clothes-3",
        "accessories-2",
        "accessories-3",
        "accessories-4",
      ], // Short Hair + Hanbok Set + Hairpin + Norigae + Sword
      backgroundClass: "oriental",
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
      setIsFlyAway(true);
      setShowButtons(false);

      setTimeout(() => {
        setEquippedItems({
          hair: null,
          clothes: null,
          hair_acc: null,
          clothes_acc: null,
          hand_acc: null,
          accessories: null,
        });
        setIsFinished(false);
        setResultImage(null);
        setActiveBackground(null);
        setShowInventory(true);
        setShowButtons(true);
        setContentVisible(true);
        setIsFlyAway(false);
      }, 1200);
    } else {
      setEquippedItems({
        hair: null,
        clothes: null,
        hair_acc: null,
        clothes_acc: null,
        hand_acc: null,
        accessories: null,
      });
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
        setEquippedItems((prev) => {
          const nextState = { ...prev };

          // Conflict Resolution
          if (draggedItem.id === "accessories-1") {
            // The flowers accessory prevents hand_acc and clothes_acc
            nextState.clothes_acc = null;
            nextState.hand_acc = null;
          } else if (
            ["clothes_acc", "hand_acc"].includes(
              draggedItem.category,
            )
          ) {
            // If equipping a specific accessory, remove the full flowers accessory if equipped
            nextState.accessories = null;
          }

          return {
            ...nextState,
            [draggedItem.category]: draggedItem.id,
          };
        });
      }
    }
    setTimeout(() => setActiveId(null), 50);
  };

  const activeItem = activeId
    ? availableItems.find((i) => i.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`h-screen w-full flex flex-col overflow-hidden font-sans relative select-none bg-[#FFFFF8]`}
      >
        {activeBackground === "spring-festival" && !isFinished && (
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

        {/* ─── Lobby Button: Fixed Top-Left ─── */}
        <div
          className={`fixed top-4 left-4 z-[9999] transition-opacity duration-1000 ${!showButtons ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <ReturnButton
            gameName="리코 옷입히기"
            className="px-3 py-2 rounded-2xl font-bold text-sm lg:text-base lg:px-6 lg:py-3 flex items-center gap-1 border-2 bg-pale-custard text-[#166D77] border-[#bef264] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
          />
        </div>

        <div
          className={`relative z-10 w-full h-full flex ${isMobile
            ? `flex-col ${isFinished ? "justify-center" : "overflow-y-auto"}`
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
                  characterOffset={
                    activeBackground?.startsWith("linear-gradient")
                      ? { x: 0, y: 75 }  // 알맞지 않은 조합 (그라데이션)
                      : { x: 0, y: 500 }  // 알맞은 조합
                  }
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
                      {!activeBackground?.startsWith("linear-gradient") && activeBackground === "spring-festival" && (
                        <div className="absolute inset-0 z-0">
                          <img
                            src={springFestivalBgUrl || "/assets/codygame/background_1.jpg"}
                            className="w-full h-full object-cover object-[center_30%]"
                            alt="background-scene"
                          />
                        </div>
                      )}
                      {!activeBackground?.startsWith("linear-gradient") && activeBackground === "oriental" && (
                        <div className="absolute inset-0 z-0">
                          <img
                            src={orientalBgUrl || "/assets/codygame/background_3.jpg"}
                            className="w-full h-full object-cover object-[center_10%]"
                            alt="background-scene"
                          />
                        </div>
                      )}
                    </>
                  }
                  overlayContent={
                    <>
                      {!isCapturing && activeBackground === "spring-festival" && (
                        <FireflyBackground isFinished={true} />
                      )}
                      {!isCapturing && activeBackground === "oriental" && (
                        <SpringFestivalPetals isFinished={true} isFlyAway={isFlyAway} />
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
                      scale={characterScale * (activeBackground?.startsWith("linear-gradient") ? 0.7 : 1)}
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
                              "/assets/codygame/background_3.jpg",
                              "/assets/codygame/background_4.jpg",
                            ][Math.floor(Math.random() * 2)]
                          );
                        } else if (matchedCombo.backgroundClass === "spring-festival") {
                          setSpringFestivalBgUrl(
                            [
                              "/assets/codygame/background_1.jpg",
                              "/assets/codygame/background_2.jpg",
                            ][Math.floor(Math.random() * 2)]
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
                        "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
                      ];

                      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
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
                    // Handle JPG save
                    if (!polaroidRef.current) return;

                    setIsCapturing(true);

                    // Small delay to ensure state update settles (hides animations)
                    setTimeout(() => {
                      domToJpeg(polaroidRef.current!, {
                        quality: 1,
                        backgroundColor: '#FFFFF8',
                        scale: 4, // 초고해상도 캡처 (4배 확대)
                      })
                        .then((dataUrl) => {
                          const link = document.createElement('a');
                          link.download = `riko-cody-${new Date().getTime()}.jpg`;
                          link.href = dataUrl;
                          link.click();
                          setIsCapturing(false);
                        })
                        .catch((error) => {
                          console.error('Error saving image:', error);
                          setIsCapturing(false);
                          alert('이미지 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                        });
                    }, 300); // 렌더링 안정을 위해 지연 시간을 조금 더 확보
                  }
                }}
                className={isCapturing ? "btn-disabled" : "btn-primary"}
              >
                {isCapturing ? "작업 중..." : (isFinished ? "이미지 저장 📸" : "코디 끝!✨")}
              </button>

              {isFinished && (
                <button
                  onClick={() => {
                    const shareData = {
                      title: '유즈하 리코 생일 기념 코디 게임',
                      text: '나만의 리코를 코디해봤어요! 여러분도 함께 축하해주세요 🎀',
                      url: window.location.origin
                    };

                    if (navigator.share) {
                      navigator.share(shareData)
                        .catch((err) => console.log('Error sharing:', err));
                    } else {
                      navigator.clipboard.writeText(window.location.origin)
                        .then(() => alert('공유 링크가 클립보드에 복사되었습니다!'))
                        .catch(() => alert('공유 링크 복사에 실패했습니다.'));
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
              <div className="relative z-50 flex mb-6 mt-4 mx-4 overflow-x-auto gap-2 bg-transparent border-0 scrollbar-hide">
                {[
                  { id: "hair", label: "헤어" },
                  { id: "clothes", label: "의상" },
                  { id: "hair_acc", label: "헤어 액세서리" },
                  { id: "body_acc", label: "바디 액세서리" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative z-50 whitespace-nowrap py-3 px-3 rounded-xl text-sm font-black transition-all ${activeTab === tab.id
                      ? "bg-[#166D77] text-pale-custard shadow-md transform scale-105"
                      : "text-[#166D77]/60 hover:bg-pale-custard/50"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <div
              className={`flex-1 ${isMobile ? "" : "overflow-y-auto custom-scrollbar px-6 pb-20"} transition-opacity ${isFinished ? "opacity-30 pointer-events-none" : ""}`}
            >
              {[
                { id: "hair", label: "헤어", filter: (i: any) => i.category === "hair" },
                { id: "clothes", label: "의상", filter: (i: any) => i.category === "clothes" },
                { id: "hair_acc", label: "헤어 액세서리", filter: (i: any) => ["hair_acc"].includes(i.category) },
                { id: "body_acc", label: "바디 액세서리", filter: (i: any) => ["accessories", "clothes_acc", "hand_acc"].includes(i.category) },
              ]
                .filter(section => !isMobile || activeTab === section.id)
                .map((section) => (
                  <div key={section.id} className="mb-0">
                    <div
                      className={`flex ${isMobile ? "overflow-x-auto" : "flex-wrap justify-start"}`}
                    >
                      {availableItems
                        .filter(section.filter)
                        .map((item) => {
                          const isEquipped = Object.values(equippedIds).includes(
                            item.id,
                          );
                          const isDragging = activeId === item.id;
                          const handleClick = () => {
                            // 모바일이 아닌 경우(PC 환경) 클릭으로 장착하지 않음
                            if (!isMobile) return;

                            if (!isFinished && !isEquipped) {
                              if (["accessories", "clothes_acc", "hand_acc", "hair_acc"].includes(item.category)) {
                                setEquippedItems((prev) => {
                                  const nextState = { ...prev };
                                  if (item.id === "accessories-1") {
                                    nextState.clothes_acc = null;
                                    nextState.hand_acc = null;
                                  } else if (["clothes_acc", "hand_acc"].includes(item.category)) {
                                    nextState.accessories = null;
                                  }
                                  return {
                                    ...nextState,
                                    [item.category]: item.id,
                                  };
                                });
                              } else {
                                setEquippedItems((prev) => ({
                                  ...prev,
                                  [item.category]: item.id,
                                }));
                              }
                            }
                          };

                          // 모바일 인벤토리 전용 스케일 적용
                          const inventoryScale = isMobile ? characterScale * 0.75 : characterScale;

                          // 카테고리별 아이템 카드 크기 및 위치 설정 (PC/모바일 분기)
                          let cardSize = "";
                          let previewOffset = "";

                          if (item.category === "clothes") {
                            cardSize = isMobile ? "w-32 h-48" : "w-72 h-[36rem]"; // PC 의상 높이 대폭 확장 (rem 대신 직관적인 px 사용)
                            previewOffset = isMobile ? "-200px" : "-120px"; // 모바일 이미지 위치 위로 더 끌어올림
                          } else {
                            // hair, accessories
                            cardSize = isMobile ? "w-28 h-40" : "w-60 h-60";
                            previewOffset = isMobile ? "-150px" : "-40px"; // 모바일 이미지 위치 위로 더 끌어올림
                          }

                          return (
                            <div
                              key={item.id}
                              onClick={handleClick}
                              className={`relative ${cardSize} overflow-hidden border-2 border-dashed border-[#166D77]/30 rounded-3xl flex-shrink-0 bg-[#FDFBF7]/50 transition-all hover:border-[#D46A6A]/50 hover:bg-pale-custard/80 active:scale-95 group shadow-sm`}
                            >
                              <div
                                className="absolute w-[384px] h-[700px] opacity-0 pointer-events-none"
                                style={{
                                  top: previewOffset,
                                  left: "50%",
                                  transform: `translateX(-50%) scale(${inventoryScale})`,
                                }}
                              >
                                <motion.div
                                  layoutId={item.id}
                                  className="w-full h-full"
                                  transition={{
                                    duration: 0.3,
                                    ease: [0.23, 1, 0.32, 1],
                                  }}
                                />
                                {item.layers.back && (
                                  <motion.div
                                    layoutId={`${item.id}-back`}
                                    className="w-full h-full"
                                    transition={{
                                      duration: 0.3,
                                      ease: [0.23, 1, 0.32, 1],
                                    }}
                                  />
                                )}
                              </div>

                              {!isEquipped && !isDragging && (
                                <>
                                  {item.layers.back && (
                                    <div
                                      className="absolute w-[384px] h-[700px] opacity-100 pointer-events-none"
                                      style={{
                                        top: previewOffset,
                                        left: "50%",
                                        transform: `translateX(-50%) scale(${inventoryScale})`,
                                      }}
                                    >
                                      <img
                                        src={item.layers.back}
                                        className="w-full h-full object-contain"
                                        alt="back-preview"
                                      />
                                    </div>
                                  )}
                                  <div
                                    className="absolute w-[384px] h-[700px] cursor-grab active:cursor-grabbing"
                                    style={{
                                      top: previewOffset,
                                      left: "50%",
                                      transform: `translateX(-50%) scale(${inventoryScale})`,
                                    }}
                                  >
                                    <DraggableItem
                                      id={item.id}
                                      layers={{
                                        front: item.layers.front,
                                        main: item.layers.main,
                                      }}
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
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

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
    </DndContext >
  );
};

export default CodyGame;
