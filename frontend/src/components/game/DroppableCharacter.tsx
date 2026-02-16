import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { DraggableItem } from './DraggableItem';

interface DroppableCharacterProps {
    equippedItems: { [key: string]: string | null };
    equippedIds: { [key: string]: string | null };
    activeId: string | null;
    isFinished?: boolean;
    resultImage?: string | null;
}

export const DroppableCharacter: React.FC<DroppableCharacterProps> = ({
    equippedItems,
    equippedIds,
    activeId,
    isFinished = false,
    resultImage = null
}) => {
    const { setNodeRef } = useDroppable({
        id: 'character-zone',
    });

    // Common style for all full-size character layers (Body, Hair, Clothes, Shoes)
    const overlayStyle = "absolute inset-0 w-full h-full object-contain pointer-events-none select-none";

    return (
        <div className="relative w-96 h-[700px] flex items-center justify-center">
            {/* 1. Base Character Background (Decorative) */}
            <div className="absolute inset-x-10 inset-y-4 bg-transparent rounded-[40%] blur-[2px] z-0 pointer-events-none" />

            {/* [Layer 1] Hair Back Layer - Behind everything */}
            {equippedIds['hair'] && (
                <motion.img
                    key={`hair-back-${isFinished}`}
                    src="/assets/riko_hair_back_long.png"
                    alt="Hair Back"
                    className={`${overlayStyle} z-[-1]`}
                    initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={isFinished ? { delay: 0.15, duration: 0.3 } : { type: "spring", stiffness: 1000, damping: 60 }}
                />
            )}

            {/* [Layer 2] Base Character Body / Expressions */}
            <motion.img
                src="/assets/riko_body_default.png"
                alt="Base Character"
                className={`${overlayStyle} z-0`}
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
                    className={`${overlayStyle} z-0`}
                />
            )}

            {/* [Layer 3] Droppable Zone & Clothes Overlays */}
            <div
                ref={setNodeRef}
                className="absolute z-10 pointer-events-auto bg-transparent border-2 border-dashed border-[#F43F5E]/40"
                style={{
                    width: '180px',
                    height: '550px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                }}
            />

            {/* Clothes: Top */}
            {equippedIds['top'] && equippedItems['top'] && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {activeId !== equippedIds['top'] && (
                        <motion.div
                            key={`top-${isFinished}`}
                            layoutId={equippedIds['top']}
                            className="w-full h-full"
                            initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                            animate={{ opacity: 1 }}
                            transition={isFinished ? { delay: 0.01, duration: 0.05 } : { type: "spring", stiffness: 1000, damping: 60 }}
                        >
                            <DraggableItem
                                id={equippedIds['top']}
                                imageSrc={equippedItems['top']}
                                category="top"
                                className="w-full h-full p-0"
                            />
                        </motion.div>
                    )}
                </div>
            )}

            {/* Clothes: Bottom */}
            {equippedIds['bottom'] && equippedItems['bottom'] && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {activeId !== equippedIds['bottom'] && (
                        <motion.div
                            key={`bottom-${isFinished}`}
                            layoutId={equippedIds['bottom']}
                            className="w-full h-full"
                            initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                            animate={{ opacity: 1 }}
                            transition={isFinished ? { delay: 0.01, duration: 0.05 } : { type: "spring", stiffness: 1000, damping: 60 }}
                        >
                            <DraggableItem
                                id={equippedIds['bottom']}
                                imageSrc={equippedItems['bottom']}
                                category="bottom"
                                className="w-full h-full p-0"
                            />
                        </motion.div>
                    )}
                </div>
            )}

            {/* Clothes: Onepiece */}
            {equippedIds['onepiece'] && equippedItems['onepiece'] && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                    {activeId !== equippedIds['onepiece'] && (
                        <motion.div
                            key={`onepiece-${isFinished}`}
                            layoutId={equippedIds['onepiece']}
                            className="w-full h-full"
                            initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                            animate={{ opacity: 1 }}
                            transition={isFinished ? { delay: 0.1, duration: 0.3 } : { type: "spring", stiffness: 1000, damping: 60 }}
                        >
                            <DraggableItem
                                id={equippedIds['onepiece']}
                                imageSrc={equippedItems['onepiece']}
                                category="onepiece"
                                className="w-full h-full p-0"
                            />
                        </motion.div>
                    )}
                </div>
            )}

            {/* [Layer 4] Hair Front Layer */}
            {equippedIds['hair'] && equippedItems['hair'] && (
                <div className="absolute inset-0 z-[40] pointer-events-none">
                    {activeId !== equippedIds['hair'] && (
                        <motion.div
                            key={`hair-front-${isFinished}`}
                            layoutId={equippedIds['hair']}
                            className="w-full h-full"
                            initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                            animate={{ opacity: 1 }}
                            transition={isFinished ? { delay: 0.15, duration: 0.3 } : { type: "spring", stiffness: 1000, damping: 60 }}
                        >
                            <DraggableItem
                                id={equippedIds['hair']}
                                imageSrc={equippedItems['hair']}
                                category="hair"
                                className="w-full h-full p-0"
                            />
                        </motion.div>
                    )}
                </div>
            )}

            {/* [Layer 5] Shoes Overlay */}
            {equippedIds['shoes'] && equippedItems['shoes'] && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {activeId !== equippedIds['shoes'] && (
                        <motion.div
                            layoutId={equippedIds['shoes']}
                            className="w-full h-full"
                            transition={{ type: "spring", stiffness: 1000, damping: 60 }}
                        >
                            <DraggableItem
                                id={equippedIds['shoes']}
                                imageSrc={equippedItems['shoes']}
                                category="shoes"
                                className="w-full h-full p-0"
                            />
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};
