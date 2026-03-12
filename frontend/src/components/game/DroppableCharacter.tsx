import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";

export interface CodyItem {
  id: string;
  category:
  | "hair_front"
  | "hair_back"
  | "clothes"
  | "clothes_back"
  | "hair_acc"
  | "clothes_acc"
  | "hand_acc"
  | "shoes"
  | "accessories";
  label?: string;
  layers: {
    front?: string;
    back?: string;
    main?: string;
  };
}

interface DroppableCharacterProps {
  equippedIds: {
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
  });

  const overlayStyle = "absolute inset-0 w-full h-full object-contain pointer-events-none select-none";

  const renderItemLayer = (category: keyof DroppableCharacterProps["equippedIds"], zIndex: number) => {
    const id = equippedIds[category];
    if (!id) return null;
    const item = availableItems.find((i) => i.id === id);
    if (!item) return null;

    return (
      <div key={category} className="absolute inset-0 pointer-events-none" style={{ zIndex }}>
        {activeId !== id && (
          <motion.div
            layoutId={id}
            className="w-full h-full pointer-events-none"
            initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0 }}
          >
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
          </motion.div>
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
        style={{ width: "384px", height: "700px", transform: `scale(${scale})` }}
      >
        {/* Layer order */}
        {renderItemLayer("hair_back", 0)}
        
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

        {/* Drop Zone */}
        <div
          ref={setNodeRef}
          className="absolute z-10 pointer-events-auto bg-transparent"
          style={{
            width: "180px",
            height: isMobile ? "350px" : "450px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {renderItemLayer("clothes_back", 15)}
        {renderItemLayer("shoes", 20)}
        {renderItemLayer("clothes", 25)}
        {renderItemLayer("hand_acc", 26)}
        {renderItemLayer("clothes_acc", 27)}
        {renderItemLayer("hair_front", 30)}
        {renderItemLayer("hair_acc", 40)}
        {renderItemLayer("accessories", 50)}
      </div>
    </div>
  );
};
