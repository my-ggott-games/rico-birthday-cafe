import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { DraggableItem } from './DraggableItem';

interface DroppableCharacterProps {
    equippedItems: { [key: string]: string | null };
    equippedIds: { [key: string]: string | null };
    activeId: string | null;
}

export const DroppableCharacter: React.FC<DroppableCharacterProps> = ({ equippedItems, equippedIds, activeId }) => {
    const { setNodeRef } = useDroppable({
        id: 'character-zone',
    });

    return (
        <div className="relative w-80 h-[500px] flex items-center justify-center scale-90 lg:scale-100">
            {/* Base Character */}
            <img
                src="/assets/cody_base.png"
                alt="Base Character"
                className="h-full object-contain absolute z-0 pointer-events-none select-none"
            />

            {/* Character Drop Zone - for all items */}
            <div
                ref={setNodeRef}
                className="absolute z-0 w-36 h-[400px] pointer-events-auto"
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
            />

            {/* Top Overlay - Use layoutId for smooth animations */}
            {equippedIds['top'] && equippedItems['top'] && (
                <div className="absolute z-10 w-40 top-[110px] flex justify-center pointer-events-auto">
                    {activeId !== equippedIds['top'] && (
                        <motion.div
                            layoutId={equippedIds['top']}
                            className="w-full"
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        >
                            <DraggableItem
                                id={equippedIds['top']}
                                imageSrc={equippedItems['top']}
                                category="top"
                            />
                        </motion.div>
                    )}
                </div>
            )}

            {/* Bottom Overlay - Use layoutId for smooth animations */}
            {equippedIds['bottom'] && equippedItems['bottom'] && (
                <div className="absolute z-20 w-36 top-[230px] flex justify-center pointer-events-auto">
                    {activeId !== equippedIds['bottom'] && (
                        <motion.div
                            layoutId={equippedIds['bottom']}
                            className="w-full"
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        >
                            <DraggableItem
                                id={equippedIds['bottom']}
                                imageSrc={equippedItems['bottom']}
                                category="bottom"
                            />
                        </motion.div>
                    )}
                </div>
            )}

            {/* Onepiece Overlay - Covers both top and bottom areas */}
            {equippedIds['onepiece'] && equippedItems['onepiece'] && (
                <div className="absolute z-30 w-40 top-[80px] flex justify-center pointer-events-auto">
                    {activeId !== equippedIds['onepiece'] && (
                        <motion.div
                            layoutId={equippedIds['onepiece']}
                            className="w-full"
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        >
                            <DraggableItem
                                id={equippedIds['onepiece']}
                                imageSrc={equippedItems['onepiece']}
                                category="onepiece"
                            />
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};
