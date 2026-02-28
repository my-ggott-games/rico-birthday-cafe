import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { DraggableItem } from "./DraggableItem";

export interface CodyItem {
  id: string;
  category:
    | "hair"
    | "clothes"
    | "hair_acc"
    | "clothes_acc"
    | "hand_acc"
    | "accessories"; // Keep 'accessories' for backwards compatibility/migration if needed, but use specific ones going forward.
  label?: string;
  layers: {
    front?: string;
    back?: string;
    main?: string;
  };
}

interface DroppableCharacterProps {
  equippedIds: {
    hair: string | null;
    clothes: string | null;
    hair_acc: string | null;
    clothes_acc: string | null;
    hand_acc: string | null;
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

  // Common style for all full-size character layers (Body, Hair, Clothes, Shoes)
  const overlayStyle =
    "absolute inset-0 w-full h-full object-contain pointer-events-none select-none";

  return (
    <div
      className="relative flex items-center justify-center transition-all duration-300 pointer-events-none"
      style={{
        width: `${384 * scale}px`,
        height: `${700 * scale}px`,
      }}
    >
      <div
        className="absolute inset-0 origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        {/* [Layer 0.5] Hair_Acc Back Layer (Hairpin) (z-[-5]) */}
        {/* Placed behind Hair Back Layer */}
        {["hair_acc"].map((cat) => {
          const id = equippedIds[cat as keyof typeof equippedIds];
          if (!id) return null;
          const item = availableItems.find((i) => i.id === id);
          if (!item || !item.layers.back) return null;

          return (
            <motion.img
              key={`${cat}-back-${isFinished}`}
              layoutId={`${id}-back`}
              src={item.layers.back}
              alt={`${cat} back`}
              className={`${overlayStyle} z-[-5]`}
              initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0 }}
            />
          );
        })}

        {/* [Layer 1] Hair Back Layer (z-0) */}
        {["hair"].map((cat) => {
          const id = equippedIds[cat as keyof typeof equippedIds];
          if (!id) return null;
          const item = availableItems.find((i) => i.id === id);
          if (!item || !item.layers.back) return null;

          return (
            <motion.img
              key={`${cat}-back-${isFinished}`}
              layoutId={`${id}-back`}
              src={item.layers.back}
              alt={`${cat} back`}
              className={`${overlayStyle} z-0`}
              initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0 }}
            />
          );
        })}

        {/* [Layer 2] Base Character Body / Expressions (z-10) */}
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

        {/* [Layer 3] Droppable Zone */}
        <div
          ref={setNodeRef}
          className={`absolute z-10 pointer-events-auto bg-transparent ${isMobile ? "border-none" : ""}`}
          style={{
            width: "180px",
            height: isMobile ? "350px" : "450px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* [Layer 4] Clothes Back (Hanbok Skirt) (z-15) */}
        {equippedIds["clothes"] &&
          (() => {
            const id = equippedIds["clothes"];
            const item = availableItems.find((i) => i.id === id);
            if (!item || !item.layers.back) return null;
            return (
              <div className="absolute inset-0 z-15 pointer-events-none">
                {activeId !== id && (
                  <motion.img
                    key={`clothes-back-${isFinished}`}
                    layoutId={`${id}-back`}
                    src={item.layers.back}
                    alt="clothes back"
                    className={`${overlayStyle} z-15`}
                    initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0 }}
                  />
                )}
              </div>
            );
          })()}

        {/* [Layer 4.5] Hand_Acc (Sword) (z-18) */}
        {/* Placed ABOVE hanbok skirt (z-15) and BELOW norigae (z-20) / clothes.main (Jeogori z-25) */}
        {equippedIds["hand_acc"] &&
          (() => {
            const id = equippedIds["hand_acc"];
            const item = availableItems.find((i) => i.id === id);
            if (!item) return null;
            return (
              <div className="absolute inset-0 z-[18] pointer-events-none">
                {activeId !== id && (
                  <motion.div
                    key={`hand_acc-${isFinished}`}
                    layoutId={id}
                    className="w-full h-full pointer-events-none"
                    initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0 }}
                  >
                    <DraggableItem
                      id={id}
                      category="hand_acc"
                      layers={item.layers}
                      className="w-full h-full p-0"
                    />
                  </motion.div>
                )}
              </div>
            );
          })()}

        {/* [Layer 5] Clothes_Acc (Norigae) (z-20) */}
        {/* Norigae goes OVER hanbok skirt (z-15) & sword (z-18), UNDER jeogori (z-25) */}
        {equippedIds["clothes_acc"] &&
          (() => {
            const id = equippedIds["clothes_acc"];
            const item = availableItems.find((i) => i.id === id);
            if (!item) return null;
            return (
              <div className="absolute inset-0 z-20 pointer-events-none">
                {activeId !== id && (
                  <motion.div
                    key={`clothes_acc-${isFinished}`}
                    layoutId={id}
                    className="w-full h-full pointer-events-none"
                    initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0 }}
                  >
                    <DraggableItem
                      id={id}
                      category="clothes_acc"
                      layers={{
                        front: item.layers.front,
                        main: item.layers.main,
                      }}
                      className="w-full h-full p-0"
                    />
                  </motion.div>
                )}
              </div>
            );
          })()}

        {/* [Layer 6] Clothes Main (Jeogori) (z-25) */}
        {equippedIds["clothes"] &&
          (() => {
            const id = equippedIds["clothes"];
            const item = availableItems.find((i) => i.id === id);
            if (!item) return null;
            return (
              <div className="absolute inset-0 z-25 pointer-events-none">
                {activeId !== id && (
                  <motion.div
                    key={`clothes-${isFinished}`}
                    layoutId={id}
                    className="w-full h-full pointer-events-none"
                    initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0 }}
                  >
                    <DraggableItem
                      id={id}
                      category="clothes"
                      layers={{ main: item.layers.main }} // Front and Back are separated
                      className="w-full h-full p-0"
                    />
                  </motion.div>
                )}
              </div>
            );
          })()}

        {/* [Layer 6.7] Clothes Front (Ribbons) (z-27) */}
        {equippedIds["clothes"] &&
          (() => {
            const id = equippedIds["clothes"];
            const item = availableItems.find((i) => i.id === id);
            if (!item || !item.layers.front) return null;
            return (
              <div className="absolute inset-0 z-27 pointer-events-none">
                {activeId !== id && (
                  <motion.img
                    key={`clothes-front-${isFinished}`}
                    layoutId={`${id}-front`}
                    src={item.layers.front}
                    alt="clothes front"
                    className={`${overlayStyle} z-27`}
                    initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0 }}
                  />
                )}
              </div>
            );
          })()}

        {/* [Layer 7] Hair Front (z-30) */}
        {equippedIds["hair"] &&
          (() => {
            const id = equippedIds["hair"];
            const item = availableItems.find((i) => i.id === id);
            if (!item) return null;
            return (
              <div className="absolute inset-0 z-30 pointer-events-none">
                {activeId !== id && (
                  <motion.div
                    key={`hair-front-${isFinished}`}
                    layoutId={id}
                    className="w-full h-full pointer-events-none"
                    initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0 }}
                  >
                    <DraggableItem
                      id={id}
                      category="hair"
                      layers={{
                        front: item.layers.front,
                        main: item.layers.main,
                      }} // Back is handled in z-0
                      className="w-full h-full p-0"
                    />
                  </motion.div>
                )}
              </div>
            );
          })()}

        {/* [Layer 8] Hair_Acc & Full Accessories (Flowers) (z-40) */}
        {["hair_acc", "accessories"].map((accType) => {
          const id = equippedIds[accType as keyof typeof equippedIds];
          if (!id) return null;
          const item = availableItems.find((i) => i.id === id);
          if (!item) return null;
          return (
            <div
              key={accType}
              className="absolute inset-0 z-40 pointer-events-none"
            >
              {activeId !== id && (
                <motion.div
                  key={`${accType}-${isFinished}`}
                  layoutId={id}
                  className="w-full h-full pointer-events-none"
                  initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0 }}
                >
                  <DraggableItem
                    id={id}
                    category={item.category}
                    layers={{
                      front: item.layers.front,
                      main: item.layers.main,
                    }} // Back handled in z-0
                    className="w-full h-full p-0"
                  />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
