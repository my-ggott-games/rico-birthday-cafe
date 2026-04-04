import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import type { CodyItem, EquippedState, EquipmentSlot } from "./codyTypes";

interface DroppableCharacterProps {
  equippedIds: EquippedState;
  activeId: string | null;
  isFinished?: boolean;
  resultImage?: string | null;
  scale?: number;
  isMobile?: boolean;
  availableItems?: CodyItem[];
}

export const DroppableCharacter: React.FC<DroppableCharacterProps> = ({
  equippedIds,
  activeId,
  isFinished = false,
  resultImage = null,
  scale = 1,
  isMobile = false,
  availableItems = [],
}) => {
  const { setNodeRef } = useDroppable({
    id: "character-zone",
    disabled: isMobile || isFinished,
  });

  const overlayStyle =
    "absolute inset-0 w-full h-full object-contain pointer-events-none select-none";
  const zIndexMap: Partial<Record<EquipmentSlot, number>> = {
    shoes: 20,
    skirt: 22,
    top: 24,
    dress: 24,
    jacket: 26,
    deco_1: 45,
    deco_2: 34,
    deco_3: 45,
    deco_4: 34,
    deco_5: 45,
    deco_6: 21,
  };

  const getItem = (slot: EquipmentSlot) => {
    const id = equippedIds[slot];
    if (!id) return null;
    return availableItems.find((i) => i.id === id) ?? null;
  };

  const renderHairBackLayer = () => {
    const item = getItem("hair");
    if (!item?.layers.back || activeId === item.id) return null;
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <div className="w-full h-full pointer-events-none">
          <img
            src={item.layers.back}
            className={overlayStyle}
            alt={`${item.id} hair-back`}
          />
        </div>
      </div>
    );
  };

  const renderHairFrontLayer = () => {
    const item = getItem("hair");
    if (!item?.layers.front || activeId === item.id) return null;
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 30 }}
      >
        <div className="w-full h-full pointer-events-none">
          <img
            src={item.layers.front}
            className={overlayStyle}
            alt={`${item.id} hair-front`}
          />
        </div>
      </div>
    );
  };

  const renderItemLayer = (slot: EquipmentSlot, zIndex?: number) => {
    if (slot === "hair") return null;
    const id = equippedIds[slot];
    if (!id) return null;
    const item = availableItems.find((i) => i.id === id);
    if (!item) return null;
    const itemZIndex = zIndex ?? item.layerPriority ?? zIndexMap[slot] ?? 30;

    return (
      <div
        key={slot}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: itemZIndex }}
      >
        {activeId !== id && (
          <div className="w-full h-full pointer-events-none">
            {item.layers.back && (
              <img
                src={item.layers.back}
                className={overlayStyle}
                style={{ zIndex: -1 }} // Relative to the motion.div's zIndex
                alt={`${id} back`}
              />
            )}
            {item.layers.main && (
              <img
                src={item.layers.main}
                className={overlayStyle}
                style={{ zIndex: 0 }}
                alt={`${id} main`}
              />
            )}
            {item.layers.front && (
              <img
                src={item.layers.front}
                className={overlayStyle}
                style={{ zIndex: 1 }}
                alt={`${id} front`}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="relative flex items-center justify-center transition-all duration-300 pointer-events-none overflow-hidden"
      style={{
        width: `${384 * scale}px`,
        height: `${700 * scale}px`,
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: "384px",
          height: "700px",
          transform: `scale(${scale})`,
        }}
      >
        {/* Layer order */}
        {renderHairBackLayer()}

        {/* Body */}
        <motion.img
          src="/assets/codygame/riko_body_default.png"
          alt="Base Character"
          className={`${overlayStyle} z-10`}
          animate={{ opacity: isFinished ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        />

        {isFinished && resultImage && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.05 }}
            src={resultImage}
            alt="Finished Character"
            className={`${overlayStyle} z-10`}
          />
        )}

        {!isMobile && (
          <div
            ref={setNodeRef}
            className="absolute z-10 cursor-pointer pointer-events-auto"
            style={{
              width: "250px",
              height: "450px",
              left: "calc(50% - 125px)",
              top: "calc(50% - 225px)",
              backgroundColor: "transparent",
              pointerEvents: isFinished ? "none" : "auto",
            }}
          />
        )}

        {renderItemLayer("shoes")}
        {renderItemLayer("deco_6")}
        {renderItemLayer("skirt")}
        {renderItemLayer("top")}
        {renderItemLayer("dress")}
        {renderItemLayer("jacket")}
        {renderItemLayer("deco_2")}
        {renderItemLayer("deco_4")}
        {renderHairFrontLayer()}
        {renderItemLayer("deco_1")}
        {renderItemLayer("deco_3")}
        {renderItemLayer("deco_5")}
      </div>
    </div>
  );
};
