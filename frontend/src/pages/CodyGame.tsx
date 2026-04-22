import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  pointerWithin,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type { EquippedState } from "../components/game/cody/codyTypes";
import { GameContainer } from "../components/common/GameContainer";
import { PolaroidFireflyOverlay } from "../components/game/cody/polaroidEffects/PolaroidFireflyOverlay";
import { PolaroidSpringBackdrop } from "../components/game/cody/polaroidEffects/PolaroidSpringBackdrop";
import { CodyActionBar } from "../components/game/cody/CodyActionBar";
import { CodyDisplayStage } from "../components/game/cody/CodyDisplayStage";
import { CodyInventoryPanel } from "../components/game/cody/CodyInventoryPanel";
import { getCodyCharacterScale } from "../components/game/cody/codyStageLayout";
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
  LEGEND_ACHIEVEMENT_CODE,
  TOTAL_VALID_COMBOS,
  combinations,
  type ShareNavigator,
} from "../features/cody/codyGameData";
import {
  applyItemToEquipment,
  getInventoryPreviewStyles,
  renderInventoryPreview,
} from "../features/cody/codyInventory";
import { useCodyGameStore } from "../store/useCodyGameStore";

const createCodyFormattedDate = () => {
  const today = new Date();
  return `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}. photo by 치코`;
};

const CodyGame: React.FC = () => {
  const navigate = useNavigate();
  const [bgmSrc] = useState(() => pickRandomActivityBgm());

  usePageBgm(bgmSrc);

  const {
    activeId,
    activeBackground,
    equippedIds,
    isFinished,
    showInventory,
    showButtons,
    windowWidth,
    setActiveId,
    setEquippedItems,
    setFormattedDate,
    setIsFinished,
    setResultImage,
    setActiveBackground,
    setOrientalBgUrl,
    setSpringBgUrl,
    setTrainingBgUrl,
    setShowInventory,
    setShowButtons,
    setContentVisible,
    setIsFlyAway,
    setIsCapturing,
    setWindowWidth,
    initGame,
    resetGame,
  } = useCodyGameStore();

  const isMobile = windowWidth < 768;
  const characterScale = getCodyCharacterScale({ isMobile, windowWidth });

  // Resolve initial state from URL params and apply to store on first render
  const [isSharedView, setIsSharedView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const itemsParam = params.get("items");
    if (itemsParam === null) {
      initGame({});
      return false;
    }

    const formattedDate =
      params.get("formattedDate")?.trim() || createCodyFormattedDate();
    const equipped: EquippedState = { ...EMPTY_EQUIPMENT };
    itemsParam.split(",").filter(Boolean).forEach((id) => {
      const item = AVAILABLE_ITEMS.find((i) => i.id === id);
      if (item) equipped[item.slot] = id;
    });

    const equippedIdsList = Object.values(equipped).filter(Boolean) as string[];
    const matchedCombo = combinations.find((combo) => {
      const hasAllRequired = combo.requiredItems.every((id) =>
        equippedIdsList.includes(id),
      );
      const hasNoExtras = equippedIdsList.every((id) =>
        combo.requiredItems.includes(id),
      );
      return hasAllRequired && hasNoExtras;
    });

    if (matchedCombo) {
      const bgMap: Record<string, string> = {
        oriental: "/assets/codygame/background_2-1.jpg",
        rain: "/assets/codygame/background_3-1.jpg",
        beer: "/assets/codygame/background_6-1.jpg",
        knight: "/assets/codygame/background_4-1.jpg",
      };
      initGame({
        equippedIds: equipped,
        formattedDate,
        resultImage: "/assets/codygame/riko_body_smile.png",
        activeBackground:
          matchedCombo.backgroundClass || matchedCombo.backgroundUrl || null,
        orientalBgUrl: bgMap[matchedCombo.backgroundClass ?? ""] ?? null,
        springBgUrl:
          matchedCombo.backgroundClass === "spring"
            ? "/assets/codygame/background_1-1.jpg"
            : null,
        trainingBgUrl:
          matchedCombo.backgroundClass === "training"
            ? "/assets/codygame/background_5-1.jpg"
            : null,
        isFinished: true,
        showInventory: false,
      });
    } else {
      initGame({
        equippedIds: equipped,
        formattedDate,
        resultImage: "/assets/codygame/riko_body_default.png",
        activeBackground: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
        isFinished: true,
        showInventory: false,
      });
    }

    return true;
  });

  const codyAchievementAwardedRef = React.useRef(false);
  const hasStartedRef = React.useRef(false);
  const completedEventFiredRef = React.useRef(false);
  const polaroidRef = React.useRef<HTMLDivElement>(null);

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
  }, [setWindowWidth]);

  const desktopSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );
  const sensors = isMobile ? [] : desktopSensors;

  React.useEffect(() => {
    if (isSharedView) {
      pushEvent("view_shared_link", { game_name: "리코의 외출 준비" });
    }
  }, [isSharedView]);

  const handleReset = () => {
    if (isSharedView) {
      pushEvent("click_try_shared_game", { game_name: "리코의 외출 준비" });
      setIsSharedView(false);
    }

    const currentParams = new URLSearchParams(window.location.search);
    if (
      currentParams.has("items") ||
      currentParams.has("formattedDate") ||
      window.location.pathname.endsWith("/shared")
    ) {
      navigate("/game/cody", { replace: true });
    }

    if (isFinished) {
      pushEvent("retry_game", { game_name: "리코의 외출 준비" });
      hasStartedRef.current = false;
      completedEventFiredRef.current = false;
      setIsFlyAway(true);
      setShowButtons(false);

      setTimeout(() => {
        resetGame();
      }, 1200);
    } else {
      resetGame();
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedItem = AVAILABLE_ITEMS.find((i) => i.id === active.id);

    if (over && draggedItem && !isFinished) {
      if (over.id === "character-zone") {
        setEquippedItems((prev) => applyItemToEquipment(prev, draggedItem));
      }
    }
    setTimeout(() => setActiveId(null), 50);
  };

  const handlePrimaryAction = () => {
    if (!isFinished) {
      setFormattedDate(createCodyFormattedDate());
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
            matchedCombo.backgroundClass || matchedCombo.backgroundUrl || null,
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
            setSpringBgUrl(
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

          if (matchedCombo.name !== "training") {
            const storedRaw = localStorage.getItem(CODY_DISCOVERED_COMBOS_KEY);
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
                    const awardResult = await parseAchievementAwardResponse(res);
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

  const activeItem = activeId
    ? AVAILABLE_ITEMS.find((i) => i.id === activeId)
    : null;

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
        {isSharedView && (
          <div className="absolute top-[80%] left-[50%] -translate-x-[50%] -translate-y-[50%] z-[200] w-[90%] max-w-[320px] bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-gray-100 flex flex-col items-center animate-in slide-in-from-bottom flex-shrink-0 text-center gap-3">
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[16px] font-bold text-gray-800 tracking-tight">누군가 코디한 리코예요!</span>
              <span className="text-[13px] text-gray-500 tracking-tight">나만의 리코 코디를 만들어볼까요?</span>
            </div>
            <div className="flex w-full gap-2 mt-1">
              <button
                onClick={() => setIsSharedView(false)}
                className="flex-1 py-3 text-[13px] rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 text-[13px] rounded-xl font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors"
              >
                나도 코디하기
              </button>
            </div>
          </div>
        )}

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
          <div
            className={`${isMobile ? "w-full pt-0" : `${showInventory ? "w-[35%]" : "w-full"} h-full transition-all duration-1000`} flex flex-col items-center ${isMobile ? "justify-start" : "justify-center"}`}
          >
            <CodyDisplayStage polaroidRef={polaroidRef} />

            <CodyActionBar
              onReset={handleReset}
              onCapturePolaroid={capturePolaroid}
              onPrimaryAction={handlePrimaryAction}
            />
          </div>

          <CodyInventoryPanel />
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
