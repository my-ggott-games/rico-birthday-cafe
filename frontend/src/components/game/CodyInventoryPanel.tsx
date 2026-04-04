import React from "react";
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

  return (
    <div
      className={`${isMobile ? `w-full ${showInventory ? "px-4" : "h-0 p-0"}` : "w-[65%] h-full"} flex flex-col transition-all duration-1000 ${showInventory ? "opacity-100" : "opacity-0 w-[0%] overflow-hidden pointer-events-none"}`}
    >
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
              onClick={() => onTabChange(tab.id as MobileTabId)}
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
        {sections
          .filter((section) => !isMobile || activeTab === section.tab)
          .map((section) => {
            const useOverlap = section.overlap && !(isMobile && section.id === "dress");
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

            return (
              <div key={section.id} className="mb-0">
                <div
                  className={`${
                    section.id === "dress"
                      ? "flex items-end overflow-visible px-4 pb-4"
                      : `flex ${
                          useOverlap
                            ? "overflow-visible flex-nowrap px-4 pb-4"
                            : "flex-wrap justify-start"
                        }`
                  }`}
                >
                  <div
                    className={`${
                      section.id === "dress" ? "relative z-10 " : ""
                    }flex ${
                      useOverlap
                        ? `${section.id === "shoes" ? "items-end " : ""}overflow-visible flex-nowrap`
                        : "flex-wrap justify-start"
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
                      className={`relative flex shrink-0 self-end flex-col overflow-visible pb-2 ${
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
              </div>
            );
          })}
      </div>
    </div>
  );
};
