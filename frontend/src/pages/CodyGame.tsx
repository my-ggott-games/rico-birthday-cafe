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
import type {
  CodyItem,
  EquippedState,
  MobileTabId,
} from "../components/game/cody/codyTypes";
import { GameContainer } from "../components/common/GameContainer";
import { PolaroidFireflyOverlay } from "../components/game/cody/polaroidEffects/PolaroidFireflyOverlay";
import { PolaroidSpringBackdrop } from "../components/game/cody/polaroidEffects/PolaroidSpringBackdrop";
import { CodyActionBar } from "../components/game/cody/CodyActionBar";
import { CodyDisplayStage } from "../components/game/cody/CodyDisplayStage";
import { CodyInventoryPanel } from "../components/game/cody/CodyInventoryPanel";
import {
  getCodyCharacterScale,
  getCodyDisplayStageHeight,
  getCodyMannequinScale,
  getCodyPolaroidCharacterOffset,
  getCodyPolaroidCharacterStageClassName,
} from "../components/game/cody/codyStageLayout";
import { domToJpeg } from "modern-screenshot";
import { startCodyAssetPreload } from "../utils/codyAssetPreload";
import { CODY_TUTORIAL_SLIDES } from "../constants/tutorialSlides";
import { usePageBgm } from "../hooks/usePageBgm";
import { pickRandomActivityBgm } from "../utils/bgm";
import { BASE_URL } from "../utils/api";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import {
  addAchievementToast,
  parseAchievementAwardResponse,
} from "../utils/achievementAwards";
import { pushEvent } from "../utils/analytics";
import { useViewEvent } from "../hooks/usePageTracking";
import {
  AVAILABLE_ITEMS,
  CODY_DISCOVERED_COMBOS_KEY,
  EMPTY_EQUIPMENT,
  INVALID_POLAROID_SCALE,
  LEGEND_ACHIEVEMENT_CODE,
  TOTAL_VALID_COMBOS,
  VALID_POLAROID_SCALE,
  combinations,
  type ShareNavigator,
} from "../features/cody/codyGameData";
import {
  applyItemToEquipment,
  getCardWidth,
  getInventoryPreviewStyles,
  inventorySections,
  renderInventoryCard,
  renderInventoryPreview,
  topSkirtIds,
} from "../features/cody/codyInventory";

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
  const hasStartedRef = React.useRef(false);
  const completedEventFiredRef = React.useRef(false);

  useViewEvent("view_game", { game_name: "리코의 외출 준비" });

  const { token } = useAuthStore();
  const { addToast } = useToastStore();

  React.useEffect(() => {
    const hasAnyEquipped = Object.values(equippedIds).some(Boolean);
    if (hasAnyEquipped && !hasStartedRef.current) {
      hasStartedRef.current = true;
      pushEvent("start_game", { game_name: "리코의 외출 준비" });
    }
  }, [equippedIds]);

  React.useEffect(() => {
    if (isFinished && !completedEventFiredRef.current) {
      completedEventFiredRef.current = true;
      pushEvent("complete_game", { game_name: "리코의 외출 준비" });
    }
  }, [isFinished]);

  React.useEffect(() => {
    if (!token) {
      codyAchievementAwardedRef.current = false;
      return;
    }

    let cancelled = false;

    const hydrateCodyAchievement = async () => {
      try {
        const response = await fetch(`${BASE_URL}/achievements/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok || cancelled) {
          return;
        }

        const achievements = (await response.json()) as Array<{
          code?: string;
          earned?: boolean;
        }>;

        codyAchievementAwardedRef.current = achievements.some(
          (achievement) =>
            achievement.code === LEGEND_ACHIEVEMENT_CODE && achievement.earned,
        );
      } catch (error) {
        console.error("Failed to hydrate Cody achievement state", error);
      }
    };

    void hydrateCodyAchievement();

    return () => {
      cancelled = true;
    };
  }, [token]);

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

  const desktopSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );
  const sensors = isMobile ? [] : desktopSensors;

  const handleReset = () => {
    if (isFinished) {
      pushEvent("retry_game", { game_name: "리코의 외출 준비" });
      hasStartedRef.current = false;
      completedEventFiredRef.current = false;
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
  const getInventoryCardWidth = (itemId: string) =>
    getCardWidth(itemId, isMobile, characterScale);
  const renderCodyInventoryCard = (
    item: CodyItem,
    index: number,
    total: number,
    overlapClass = "",
    offsetClass = "",
  ) =>
    renderInventoryCard({
      item,
      index,
      total,
      overlapClass,
      offsetClass,
      equippedIds,
      activeId,
      isMobile,
      isFinished,
      characterScale,
      setEquippedItems,
    });

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
          pushEvent("click_share", { game_name: "리코의 외출 준비" });
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
        autoShowHelpKey="game_help_seen_cody"
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
                        setOrientalBgUrl("/assets/codygame/background_6-1.jpg");
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
                                `${BASE_URL}/achievements/award/${LEGEND_ACHIEVEMENT_CODE}`,
                                {
                                  method: "POST",
                                  headers: { Authorization: `Bearer ${token}` },
                                },
                              );
                              if (res.ok) {
                                const awardResult =
                                  await parseAchievementAwardResponse(res);
                                if (awardResult?.awarded) {
                                  addAchievementToast(
                                    addToast,
                                    awardResult.achievement,
                                    "cody",
                                  );
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
            getCardWidth={getInventoryCardWidth}
            renderInventoryCard={renderCodyInventoryCard}
            onTabChange={setActiveTab}
          />
        </div>
      </GameContainer>

      {!isMobile && (
        <DragOverlay>
          {activeItem ? (
            <div style={{ zIndex: 99999, pointerEvents: "none" }}>
              <div
                className={`relative ${getInventoryPreviewStyles(activeItem.id, activeItem, isMobile, characterScale).cardSize} overflow-visible`}
              >
                {renderInventoryPreview(activeItem, isMobile, characterScale)}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      )}
    </DndContext>
  );
};

export default CodyGame;
