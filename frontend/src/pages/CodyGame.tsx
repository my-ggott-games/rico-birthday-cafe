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
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { SpringFestivalBackground } from "../components/game/SpringFestivalBackground";

const CodyGame: React.FC = () => {
  const navigate = useNavigate();

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
  const [showInventory, setShowInventory] = useState(true);
  const [showButtons, setShowButtons] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [isFlyAway, setIsFlyAway] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
      requiredItems: ["hair-2", "clothes-2", "accessories-1"], // Twintails + Peasant Dress + Flowers
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
      backgroundClass: "bg-[#fef2f2]",
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
        setShowFlash(false);
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
      setShowFlash(false);
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
            // The flowers accessory prevents other accessories
            nextState.hair_acc = null;
            nextState.clothes_acc = null;
            nextState.hand_acc = null;
          } else if (
            ["hair_acc", "clothes_acc", "hand_acc"].includes(
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
        className={`h-screen w-full flex flex-col overflow-hidden font-sans relative select-none bg-[#FFFDF7] transition-colors duration-500 ${activeBackground?.startsWith("bg-") ? activeBackground : ""}`}
        style={
          activeBackground &&
          !activeBackground.startsWith("bg-") &&
          activeBackground !== "spring-festival"
            ? {
                backgroundImage: `url(${activeBackground})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
      >
        {activeBackground === "spring-festival" && !isFinished && (
          <div className="absolute inset-0 z-0">
            <SpringFestivalBackground />
          </div>
        )}

        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#4A3b32 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div
          className={`absolute top-6 left-6 z-50 transition-opacity duration-1000 ${!showButtons ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <button onClick={() => navigate("/lobby")} className="btn-secondary">
            ← 돌아가기
          </button>
        </div>

        <div
          className={`relative z-10 w-full h-full flex ${isMobile ? "flex-col overflow-y-auto" : "flex-row-reverse items-center justify-between px-16 py-10"}`}
        >
          {/* Left/Right: Mannequin Display */}
          <div
            className={`${isMobile ? "w-full min-h-[650px] pt-16" : `${showInventory ? "w-[45%]" : "w-full"} h-full transition-all duration-1000`} flex flex-col items-center justify-center`}
          >
            <div
              className={`relative z-10 w-full ${isMobile ? "h-[550px]" : "h-[700px]"} flex items-center justify-center`}
            >
              {isFinished && activeBackground === "spring-festival" ? (
                <SpringFestivalBackground isFinished isFlyAway={isFlyAway}>
                  <div className="relative">
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
                </SpringFestivalBackground>
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
              className={`relative z-50 flex gap-4 ${isMobile ? "mt-2 mb-4" : "mt-8"} transition-opacity duration-1000 ${!showButtons ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              <button onClick={handleReset} className="btn-secondary">
                다시하기
              </button>

              <button
                onClick={() => {
                  if (!isFinished) {
                    // 찰칵! Flash effect sequence
                    setShowFlash(true);
                    setContentVisible(false);

                    setTimeout(() => {
                      setIsFinished(true);
                      setResultImage(
                        [
                          "/assets/codygame/riko_body_smile.png",
                          "/assets/codygame/riko_body_wink.png",
                        ][Math.floor(Math.random() * 2)],
                      );

                      // Check for active combinations
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
                        setActiveBackground(
                          matchedCombo.backgroundClass ||
                            matchedCombo.backgroundUrl ||
                            null,
                        );
                        setShowInventory(false);
                        setShowButtons(false);

                        // Fade in the Polaroid content
                        setTimeout(() => {
                          setContentVisible(true);
                          setShowFlash(false);
                          setTimeout(() => setShowButtons(true), 1000);
                        }, 800);
                      } else {
                        // No combo matched, still show finish state but maybe generic
                        setShowInventory(false);
                        setTimeout(() => {
                          setContentVisible(true);
                          setShowFlash(false);
                        }, 800);
                      }
                    }, 300);
                  }
                }}
                className={isFinished ? "btn-disabled" : "btn-primary"}
              >
                {isFinished ? "공유하기 ✨" : "코디 끝!✨"}
              </button>
            </div>
          </div>

          {/* Background/Right: Wardrobe */}
          <div
            className={`${isMobile ? "w-full px-4" : "w-[45%] h-full"} flex flex-col transition-all duration-1000 ${showInventory ? "opacity-100" : "opacity-0 w-[0%] overflow-hidden pointer-events-none"}`}
          >
            <div
              className={`flex-1 ${isMobile ? "" : "overflow-y-auto custom-scrollbar"} transition-opacity ${isFinished ? "opacity-30 pointer-events-none" : ""}`}
            >
              {/* Hair Section */}
              <div className="mb-8">
                <div
                  className={`flex ${isMobile ? "gap-2" : "gap-4"} overflow-x-auto px-4 pb-4`}
                >
                  {availableItems
                    .filter((item) => item.category === "hair")
                    .map((item) => {
                      const isEquipped = Object.values(equippedIds).includes(
                        item.id,
                      );
                      const isDragging = activeId === item.id;
                      const handleClick = () => {
                        if (isMobile && !isFinished && !isEquipped) {
                          setEquippedItems((prev) => ({
                            ...prev,
                            [item.category]: item.id,
                          }));
                        }
                      };

                      return (
                        <div
                          key={item.id}
                          onClick={handleClick}
                          className={`relative ${isMobile ? "w-40 h-48 ml-1" : "w-60 h-64"} overflow-hidden border-2 border-dashed border-[#4A3b32]/30 rounded-3xl flex-shrink-0 bg-[#FDFBF7]/50 transition-transform active:scale-95`}
                        >
                          {/* Hidden stable target for return animation */}
                          <div
                            className="absolute w-[384px] h-[700px] opacity-0 pointer-events-none"
                            style={{
                              top: isMobile ? "-120px" : "-70px",
                              left: "50%",
                              transform: `translateX(-50%) scale(${characterScale})`,
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

                          {/* Back Hair Layer for Preview - Hide when equipped or dragging */}
                          {!isEquipped && !isDragging && item.layers.back && (
                            <div
                              className="absolute w-[384px] h-[700px] opacity-100 pointer-events-none"
                              style={{
                                top: isMobile ? "-120px" : "-70px",
                                left: "50%",
                                transform: `translateX(-50%) scale(${characterScale})`,
                              }}
                            >
                              <img
                                src={item.layers.back}
                                className="w-full h-full object-contain"
                                alt="back-preview"
                              />
                            </div>
                          )}

                          {!isEquipped && !isDragging && (
                            <div
                              className="absolute w-[384px] h-[700px] cursor-grab active:cursor-grabbing"
                              style={{
                                top: isMobile ? "-120px" : "-70px",
                                left: "50%",
                                transform: `translateX(-50%) scale(${characterScale})`,
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
                          )}
                          {/* Equipped items are hidden in inventory */}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Clothes Section */}
              <div className="mb-8">
                <div
                  className={`flex ${isMobile ? "gap-2" : "gap-4"} overflow-x-auto px-4 pb-4`}
                >
                  {availableItems
                    .filter((item) => item.category === "clothes")
                    .map((item) => {
                      const isEquipped = Object.values(equippedIds).includes(
                        item.id,
                      );
                      const isDragging = activeId === item.id;
                      const handleClick = () => {
                        if (isMobile && !isFinished && !isEquipped) {
                          setEquippedItems((prev) => ({
                            ...prev,
                            [item.category]: item.id,
                          }));
                        }
                      };

                      return (
                        <div
                          key={item.id}
                          onClick={handleClick}
                          className={`relative ${isMobile ? "w-40 h-60 ml-1" : "w-60 h-120"} overflow-hidden border-2 border-dashed border-[#4A3b32]/30 rounded-3xl flex-shrink-0 bg-[#FDFBF7]/50 transition-transform active:scale-95`}
                        >
                          {/* Hidden stable target for return animation */}
                          <div
                            className="absolute w-[384px] h-[700px] opacity-0 pointer-events-none"
                            style={{
                              top: isMobile ? "-140px" : "-128px",
                              left: "50%",
                              transform: `translateX(-50%) scale(${characterScale})`,
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
                          </div>

                          {!isEquipped && !isDragging && (
                            <div
                              className="absolute w-[384px] h-[700px] cursor-grab active:cursor-grabbing"
                              style={{
                                top: isMobile ? "-140px" : "-128px",
                                left: "50%",
                                transform: `translateX(-50%) scale(${characterScale})`,
                              }}
                            >
                              <DraggableItem
                                id={item.id}
                                layers={item.layers}
                                category={item.category}
                                className="w-full h-full p-0"
                              />
                            </div>
                          )}
                          {/* Equipped items are hidden in inventory */}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Accessories Section */}
              <div className="mb-8">
                <div
                  className={`flex ${isMobile ? "gap-2" : "gap-4"} overflow-x-auto px-4 pb-4`}
                >
                  {availableItems
                    .filter((item) =>
                      [
                        "accessories",
                        "hair_acc",
                        "clothes_acc",
                        "hand_acc",
                      ].includes(item.category),
                    )
                    .map((item) => {
                      const isEquipped = Object.values(equippedIds).includes(
                        item.id,
                      );
                      const isDragging = activeId === item.id;
                      const handleClick = () => {
                        if (isMobile && !isFinished && !isEquipped) {
                          setEquippedItems((prev) => {
                            const nextState = { ...prev };
                            if (item.id === "accessories-1") {
                              nextState.hair_acc = null;
                              nextState.clothes_acc = null;
                              nextState.hand_acc = null;
                            } else if (
                              ["hair_acc", "clothes_acc", "hand_acc"].includes(
                                item.category,
                              )
                            ) {
                              nextState.accessories = null;
                            }
                            return {
                              ...nextState,
                              [item.category]: item.id,
                            };
                          });
                        }
                      };

                      return (
                        <div
                          key={item.id}
                          onClick={handleClick}
                          className={`relative ${isMobile ? "w-40 h-48 ml-1" : "w-60 h-64"} overflow-hidden border-2 border-dashed border-[#4A3b32]/30 rounded-3xl flex-shrink-0 bg-[#FDFBF7]/50 transition-transform active:scale-95`}
                        >
                          {/* Hidden stable target for return animation */}
                          <div
                            className="absolute w-[384px] h-[700px] opacity-0 pointer-events-none"
                            style={{
                              top: isMobile ? "-120px" : "-70px",
                              left: "50%",
                              transform: `translateX(-50%) scale(${characterScale})`,
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

                          {/* Back Layer for Preview */}
                          {!isEquipped && !isDragging && item.layers.back && (
                            <div
                              className="absolute w-[384px] h-[700px] opacity-100 pointer-events-none"
                              style={{
                                top: isMobile ? "-120px" : "-70px",
                                left: "50%",
                                transform: `translateX(-50%) scale(${characterScale})`,
                              }}
                            >
                              <img
                                src={item.layers.back}
                                className="w-full h-full object-contain"
                                alt="back-preview"
                              />
                            </div>
                          )}

                          {!isEquipped && !isDragging && (
                            <div
                              className="absolute w-[384px] h-[700px] cursor-grab active:cursor-grabbing"
                              style={{
                                top: isMobile ? "-120px" : "-70px",
                                left: "50%",
                                transform: `translateX(-50%) scale(${characterScale})`,
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
                          )}
                          {/* Equipped items are hidden in inventory */}
                        </div>
                      );
                    })}
                </div>
              </div>
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
      {/* Flash Effect Overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: showFlash ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-white z-[1000] pointer-events-none"
      />
    </DndContext>
  );
};

export default CodyGame;
