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
    scale?: number;
    isMobile?: boolean;
    availableItems?: Array<{ id: string; category: string; imageSrc: string; backImageSrc?: string }>;
}

export const DroppableCharacter: React.FC<DroppableCharacterProps> = ({
    equippedItems,
    equippedIds,
    activeId,
    isFinished = false,
    resultImage = null,
    scale = 1,
    isMobile = false,
    availableItems = []
}) => {
    const { setNodeRef } = useDroppable({
        id: 'character-zone',
    });

    // Common style for all full-size character layers (Body, Hair, Clothes, Shoes)
    const overlayStyle = "absolute inset-0 w-full h-full object-contain pointer-events-none select-none";

    return (
        <div className="relative w-96 h-[700px] flex items-center justify-center transition-transform duration-300" style={{ transform: `scale(${scale})` }}>
            {/* 1. Base Character Background (Decorative) */}
            {/* 1. Base Character Background removed as requested */}

            {/* [Layer 1] Hair Back Layer - Behind Body */}
            {equippedIds['hair'] && (() => {
                const equippedHairItem = availableItems.find(item => item.id === equippedIds['hair']);
                const backHairSrc = equippedHairItem?.backImageSrc || "/assets/codygame/riko_hair_back_long.png";
                return (
                    <motion.img
                        key={`hair-back-${isFinished}`}
                        layoutId={`${equippedIds['hair']}-back`}
                        src={backHairSrc}
                        alt="Hair Back"
                        className={`${overlayStyle} z-0`}
                        initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0 }}
                    />
                );
            })()}

            {/* [Layer 2] Base Character Body / Expressions */}
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

            {/* [Layer 3] Droppable Zone & Clothes Overlays */}
            <div
                ref={setNodeRef}
                className={`absolute z-10 pointer-events-auto bg-transparent border-2 border-dashed border-[#F43F5E]/40 ${isMobile ? 'border-none' : ''}`}
                style={{
                    width: '180px',
                    height: isMobile ? '350px' : '450px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                }}
            />

            {/* Clothes: Top (z-20) */}
            {equippedIds['top'] && equippedItems['top'] && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {activeId !== equippedIds['top'] && (
                        <motion.div
                            key={`top-${isFinished}`}
                            layoutId={equippedIds['top']}
                            className="w-full h-full pointer-events-none"
                            initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0 }}
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

            {/* Clothes: Bottom (z-20) */}
            {equippedIds['bottom'] && equippedItems['bottom'] && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {activeId !== equippedIds['bottom'] && (
                        <motion.div
                            key={`bottom-${isFinished}`}
                            layoutId={equippedIds['bottom']}
                            className="w-full h-full pointer-events-none"
                            initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0 }}
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

            {/* Clothes: Onepiece (z-30) */}
            {equippedIds['onepiece'] && equippedItems['onepiece'] && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                    {activeId !== equippedIds['onepiece'] && (
                        <motion.div
                            key={`onepiece-${isFinished}`}
                            layoutId={equippedIds['onepiece']}
                            className="w-full h-full pointer-events-none"
                            initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0 }}
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

            {/* [Layer 4] Hair Front Layer (z-40) */}
            {equippedIds['hair'] && equippedItems['hair'] && (
                <div className="absolute inset-0 z-40 pointer-events-none">
                    {activeId !== equippedIds['hair'] && (
                        <motion.div
                            key={`hair-front-${isFinished}`}
                            layoutId={equippedIds['hair']}
                            className="w-full h-full pointer-events-none"
                            initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0 }}
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

            {/* [Layer 5] Shoes Overlay (z-20, behind front hair? or z-35?) Assuming shoes are below hair but above body. z-20 for now matching clothes. */}
            {equippedIds['shoes'] && equippedItems['shoes'] && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {activeId !== equippedIds['shoes'] && (
                        <motion.div
                            layoutId={equippedIds['shoes']}
                            className="w-full h-full pointer-events-none"
                            transition={{ duration: 0 }}
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

            {/* [Layer 6] Accessories Layer - On top of everything (z-50) */}
            {equippedIds['accessories'] && equippedItems['accessories'] && (
                <div className="absolute inset-0 z-50 pointer-events-none">
                    {activeId !== equippedIds['accessories'] && (
                        <motion.div
                            key={`accessories-${isFinished}`}
                            layoutId={equippedIds['accessories']}
                            className="w-full h-full pointer-events-none"
                            initial={isFinished ? { opacity: 0 } : { opacity: 1 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0 }}
                        >
                            <DraggableItem
                                id={equippedIds['accessories']}
                                imageSrc={equippedItems['accessories']}
                                category="accessories"
                                className="w-full h-full p-0"
                            />
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};
