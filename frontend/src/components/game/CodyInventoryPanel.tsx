import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppIcon, type AppIconName } from "../common/AppIcon";
import type { CodyItem, MobileTabId } from "./codyTypes";

type InventorySection = {
  id: string;
  tab: MobileTabId;
  overlap: boolean;
  mobileOverlapClass?: string;
  desktopOverlapClass?: string;
  filter: (item: CodyItem) => boolean;
};

type CodyInventoryPanelProps = {
  availableItems: CodyItem[];
  activeTab: MobileTabId;
  isFinished: boolean;
  isMobile: boolean;
  showInventory: boolean;
  sections: InventorySection[];
  topSkirtIds: Set<string>;
  getCardWidth: (itemId: string) => number;
  renderInventoryCard: (
    item: CodyItem,
    index: number,
    total: number,
    overlapClass?: string,
    offsetClass?: string,
  ) => React.ReactNode;
  onTabChange: (tab: MobileTabId) => void;
};

export const CodyInventoryPanel: React.FC<CodyInventoryPanelProps> = ({
  availableItems,
  activeTab,
  isFinished,
  isMobile,
  showInventory,
  sections,
  topSkirtIds,
  getCardWidth,
  renderInventoryCard,
  onTabChange,
}) => {
  const mobileHairOrder = [
    "hair_1-4",
    "hair_1-2",
    "hair_1-6",
    "hair_1-3",
    "hair_1-5",
    "hair_1-1",
  ];
  const mobileHairOrderMap = new Map(
    mobileHairOrder.map((itemId, index) => [itemId, index]),
  );
  const mobileOutfitOrder = [
    "dress_1",
    "dress_4",
    "dress_2",
    "jacket_1",
    "dress_3",
    "dress_5",
    "top_1",
    "skirt_1",
  ];
  const mobileOutfitOrderMap = new Map(
    mobileOutfitOrder.map((itemId, index) => [itemId, index]),
  );
  const mobileTabs: Array<{
    id: MobileTabId;
    label: string;
    icon: AppIconName;
  }> = [
    { id: "hair", label: "헤어", icon: "Smile" },
    { id: "clothes", label: "의상", icon: "Shirt" },
    { id: "shoes", label: "신발", icon: "Footprints" },
    { id: "deco", label: "장식", icon: "Sparkles" },
  ];
  const desktopSlides: Array<{
    id: string;
    label: string;
    icon: AppIconName;
    sectionIds: InventorySection["id"][];
  }> = [
    { id: "hair", label: "헤어", icon: "Smile", sectionIds: ["hair"] },
    {
      id: "outfit",
      label: "의상",
      icon: "Shirt",
      sectionIds: ["dress", "shoes"],
    },
    {
      id: "accessory",
      label: "장식",
      icon: "Sparkles",
      sectionIds: ["hair-deco", "deco", "sword"],
    },
  ];
  const [desktopSlideIndex, setDesktopSlideIndex] = React.useState(0);
  const [desktopSlideDirection, setDesktopSlideDirection] = React.useState(1);

  React.useEffect(() => {
    if (!showInventory) {
      setDesktopSlideIndex(0);
    }
  }, [showInventory]);

  const moveDesktopSlide = (direction: number) => {
    setDesktopSlideDirection(direction);
    setDesktopSlideIndex(
      (prev) =>
        (prev + direction + desktopSlides.length) % desktopSlides.length,
    );
  };

  const activeDesktopSlide = desktopSlides[desktopSlideIndex];
  const visibleSections = isMobile
    ? sections.filter((section) => activeTab === section.tab)
    : sections
        .filter((section) => activeDesktopSlide.sectionIds.includes(section.id))
        .sort(
          (a, b) =>
            activeDesktopSlide.sectionIds.indexOf(a.id) -
            activeDesktopSlide.sectionIds.indexOf(b.id),
        );

  if (!isMobile && !showInventory) {
    return null;
  }

  return (
    <div
      className={`${isMobile ? `w-full ${showInventory ? "px-4" : "h-0 p-0"}` : "w-[65%] h-full"} flex flex-col transition-all duration-1000 ${showInventory ? "opacity-100" : "opacity-0 overflow-hidden pointer-events-none"}`}
    >
      {isMobile && !isFinished && (
        <div className="relative z-50 mx-4 mb-4 mt-4">
          <div className="grid grid-cols-4 items-stretch gap-3">
            {mobileTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onTabChange(tab.id)}
                className={`relative z-50 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-0 py-2 text-sm font-black transition-colors ${
                  activeTab === tab.id
                    ? "border-[#166D77] text-[#166D77]"
                    : "border-transparent text-[#166D77]/45"
                }`}
              >
                <AppIcon name={tab.icon} size={16} strokeWidth={2.4} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isMobile && !isFinished && (
        <div className="mb-5 flex items-center justify-between gap-3 px-6">
          <button
            type="button"
            onClick={() => moveDesktopSlide(-1)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#3f9e80] bg-[#5EC7A5] text-pale-custard shadow-[0_6px_0_#3f9e80] transition-all hover:translate-y-1 hover:shadow-[0_2px_0_#3f9e80] active:translate-y-1.5 active:shadow-none"
            aria-label="이전 슬라이드"
          >
            <AppIcon name="ArrowBigLeft" size={24} />
          </button>

          <div className="flex items-center gap-3 rounded-[1.75rem] border border-[#166D77]/15 bg-[#fffaf0]/90 px-5 py-3 text-[#166D77] shadow-[0_10px_30px_rgba(22,109,119,0.08)]">
            <AppIcon name={activeDesktopSlide.icon} size={22} />
            <p className="text-base font-black">{activeDesktopSlide.label}</p>
          </div>

          <button
            type="button"
            onClick={() => moveDesktopSlide(1)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#3f9e80] bg-[#5EC7A5] text-pale-custard shadow-[0_6px_0_#3f9e80] transition-all hover:translate-y-1 hover:shadow-[0_2px_0_#3f9e80] active:translate-y-1.5 active:shadow-none"
            aria-label="다음 슬라이드"
          >
            <AppIcon name="ArrowBigRight" size={24} />
          </button>
        </div>
      )}

      <div
        className={`flex-1 ${isMobile ? "" : "overflow-x-clip overflow-y-visible px-6 pb-20"} transition-opacity ${isFinished ? "opacity-30 pointer-events-none" : ""}`}
      >
        <AnimatePresence initial={false} mode={isMobile ? "sync" : "wait"}>
          <motion.div
            key={isMobile ? activeTab : activeDesktopSlide.id}
            initial={
              isMobile
                ? false
                : { opacity: 0, x: desktopSlideDirection > 0 ? 36 : -36 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={
              isMobile
                ? undefined
                : { opacity: 0, x: desktopSlideDirection > 0 ? -36 : 36 }
            }
            transition={{ duration: 0.24, ease: "easeOut" }}
            className={
              isMobile
                ? "pt-6"
                : "flex h-full flex-col justify-start pt-6 xl:pt-10"
            }
          >
            {visibleSections.map((section) => {
              const useOverlap =
                section.overlap && !(isMobile && section.id === "dress");
              const sectionItems = availableItems
                .filter(section.filter)
                .sort((a, b) => {
                  if (isMobile && section.id === "hair") {
                    const aOrder = mobileHairOrderMap.get(a.id);
                    const bOrder = mobileHairOrderMap.get(b.id);

                    if (aOrder !== undefined || bOrder !== undefined) {
                      return (
                        (aOrder ?? Number.MAX_SAFE_INTEGER) -
                        (bOrder ?? Number.MAX_SAFE_INTEGER)
                      );
                    }
                  }

                  const widthDiff = getCardWidth(a.id) - getCardWidth(b.id);
                  if (widthDiff !== 0) return widthDiff;
                  return a.id.localeCompare(b.id);
                });
              const topSkirtItems =
                section.id === "dress"
                  ? availableItems.filter((item) => topSkirtIds.has(item.id))
                  : [];
              const mobileDressItems =
                section.id === "dress" && isMobile
                  ? [...sectionItems, ...topSkirtItems].sort((a, b) => {
                      const aOrder = mobileOutfitOrderMap.get(a.id);
                      const bOrder = mobileOutfitOrderMap.get(b.id);

                      if (aOrder !== undefined || bOrder !== undefined) {
                        return (
                          (aOrder ?? Number.MAX_SAFE_INTEGER) -
                          (bOrder ?? Number.MAX_SAFE_INTEGER)
                        );
                      }

                      return a.id.localeCompare(b.id);
                    })
                  : [];

              return (
                <div
                  key={section.id}
                  className={`${isMobile ? "mb-0 px-0 py-0" : "mb-5 px-3 py-2"}`}
                >
                  {section.id === "dress" && isMobile ? (
                    <div className="grid grid-cols-3 justify-items-center gap-x-2 gap-y-3 px-4 pb-4">
                      {mobileDressItems.map((item, index) =>
                        renderInventoryCard(
                          item,
                          index,
                          mobileDressItems.length,
                          "",
                          "",
                        ),
                      )}
                    </div>
                  ) : (
                    <div
                      className={`${
                        section.id === "dress"
                          ? `flex overflow-visible px-4 pb-4 ${isMobile ? "items-start" : "items-start justify-center"}`
                          : `flex ${
                              useOverlap
                                ? "overflow-visible flex-nowrap px-4 pb-4"
                                : `flex-wrap ${isMobile ? "justify-start" : "justify-center"} ${section.tab === "deco" && !isMobile ? "gap-x-4" : ""}`
                            } ${section.id === "shoes" ? "items-end" : "items-start"}`
                      }`}
                    >
                      <div
                        className={`${
                          section.id === "dress" ? "relative z-10 " : ""
                        }flex ${
                          useOverlap
                            ? `${section.id === "shoes" ? "items-end " : "items-start "}overflow-visible flex-nowrap`
                            : `flex-wrap ${isMobile ? "justify-start" : "justify-center"} ${section.id === "shoes" ? "items-end" : "items-start"} ${section.tab === "deco" && !isMobile ? "gap-x-4" : ""}`
                        }`}
                      >
                        {sectionItems.map((item, index) =>
                          renderInventoryCard(
                            item,
                            index,
                            sectionItems.length,
                            useOverlap
                              ? isMobile
                                ? section.mobileOverlapClass || "-ml-8"
                                : section.desktopOverlapClass || "-ml-12"
                              : "",
                          ),
                        )}
                      </div>

                      {section.id === "dress" && topSkirtItems.length > 0 && (
                        <div
                          className={`relative flex shrink-0 ${isMobile ? "self-end" : "self-start"} flex-col overflow-visible pb-2 ${
                            useOverlap
                              ? isMobile
                                ? section.mobileOverlapClass || "-ml-8"
                                : section.desktopOverlapClass || "-ml-12"
                              : ""
                          }`}
                          style={{ zIndex: 0 }}
                        >
                          {topSkirtItems.map((item, index) =>
                            renderInventoryCard(
                              item,
                              index,
                              topSkirtItems.length,
                              isMobile ? "-mt-12" : "-mt-16",
                              item.id === "top_1"
                                ? isMobile
                                  ? "-ml-1"
                                  : "-ml-5"
                                : isMobile
                                  ? "ml-2"
                                  : "ml-5",
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
