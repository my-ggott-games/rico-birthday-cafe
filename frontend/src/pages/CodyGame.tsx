import React, { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { DraggableItem } from '../components/game/DraggableItem';
import { DroppableCharacter } from '../components/game/DroppableCharacter';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CodyGame: React.FC = () => {
    const navigate = useNavigate();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [equippedIds, setEquippedItems] = useState<{ [category: string]: string | null }>({
        top: null,
        bottom: null,
        onepiece: null
    });

    const availableItems = [
        { id: 'top-1', category: 'top', imageSrc: '/assets/cody_top_1.png' },
        { id: 'top-2', category: 'top', imageSrc: '/assets/cody_top_2.png' },
        { id: 'bottom-1', category: 'bottom', imageSrc: '/assets/cody_bottom_1.png' },
        { id: 'bottom-2', category: 'bottom', imageSrc: '/assets/cody_bottom_2.svg' },
        { id: 'onepiece-1', category: 'onepiece', imageSrc: '/assets/cody_onepiece_1.svg' },
    ];

    const handleReset = () => {
        setEquippedItems({ top: null, bottom: null, onepiece: null });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const draggedItem = availableItems.find((i) => i.id === active.id);

        if (over && draggedItem) {
            const dropZoneId = over.id as string;

            // Accept any item in character-zone
            if (dropZoneId === 'character-zone') {
                // Equipping item onto character
                setEquippedItems((prev) => {
                    const newIds = { ...prev };
                    if (draggedItem.category === 'onepiece') {
                        newIds['top'] = null;
                        newIds['bottom'] = null;
                        newIds['onepiece'] = draggedItem.id;
                    } else if (draggedItem.category === 'top' || draggedItem.category === 'bottom') {
                        newIds['onepiece'] = null;
                        newIds[draggedItem.category] = draggedItem.id;
                    } else {
                        newIds[draggedItem.category] = draggedItem.id;
                    }
                    return newIds;
                });
            } else {
                // Dropped in wrong zone - unequip if it was equipped
                setEquippedItems((prev) => {
                    const newIds = { ...prev };
                    if (Object.values(newIds).includes(draggedItem.id)) {
                        Object.keys(newIds).forEach(cat => {
                            if (newIds[cat] === draggedItem.id) {
                                newIds[cat] = null;
                            }
                        });
                    }
                    return newIds;
                });
            }
        } else {
            // Dropped outside all zones - unequip if it was equipped
            if (draggedItem) {
                setEquippedItems((prev) => {
                    const newIds = { ...prev };
                    if (Object.values(newIds).includes(draggedItem.id)) {
                        Object.keys(newIds).forEach(cat => {
                            if (newIds[cat] === draggedItem.id) {
                                newIds[cat] = null;
                            }
                        });
                    }
                    return newIds;
                });
            }
        }

        // Delay clearing activeId to allow layoutId animation to start
        setTimeout(() => {
            setActiveId(null);
        }, 50);
    };

    const activeItem = activeId ? availableItems.find(i => i.id === activeId) : null;

    const equippedImages = Object.entries(equippedIds).reduce((acc, [cat, id]) => {
        if (!id) return acc;
        const item = availableItems.find(i => i.id === id);
        if (item) acc[cat] = item.imageSrc;
        return acc;
    }, {} as { [key: string]: string });

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-orange-100 flex flex-col items-center relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-6 left-6 text-3xl animate-bounce">✨</div>
                <div className="absolute top-12 right-12 text-3xl animate-pulse">⭐</div>
                <div className="absolute bottom-12 left-1/4 text-2xl animate-bounce delay-700">🌸</div>
                <div className="absolute top-1/2 right-6 text-2xl animate-pulse delay-300">🎀</div>

                <div className="w-full py-3 px-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b-2 border-pink-300 sticky top-0 z-50">
                    <button
                        onClick={() => navigate('/lobby')}
                        className="px-4 py-1.5 bg-pink-400 text-white rounded-full font-bold shadow-md hover:bg-pink-500 transition-colors text-sm"
                    >
                        ← 로비로
                    </button>
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 drop-shadow-sm">
                        리코야 옷 입자
                    </h1>
                    <div className="w-20"></div>
                </div>

                <div className="flex flex-1 w-full max-w-7xl px-8 py-4 gap-6 items-stretch overflow-hidden">
                    {/* Wardrobe Panel */}
                    <div className="w-1/4 bg-white/90 rounded-[1.5rem] p-4 shadow-xl border-2 border-pink-200 z-10 flex flex-col overflow-hidden">
                        <h2 className="text-xl text-pink-600 mb-4 font-black text-center border-b border-pink-100 pb-2">
                            👗 My Closet
                        </h2>
                        <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar content-start">
                            {availableItems.map((item) => {
                                const isEquipped = Object.values(equippedIds).includes(item.id);
                                const isDragging = activeId === item.id;
                                return (
                                    <div key={item.id} className="aspect-square flex items-center justify-center relative group">
                                        {/* Optional subtle glow on hover */}
                                        <div className="absolute inset-0 bg-pink-200/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 pointer-events-none blur-xl" />
                                        {!isEquipped && (
                                            <motion.div
                                                layoutId={!isDragging ? item.id : undefined}
                                                className="w-full h-full flex items-center justify-center p-2"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 300,
                                                    damping: 25,
                                                    restDelta: 0.001
                                                }}
                                            >
                                                <DraggableItem id={item.id} imageSrc={item.imageSrc} category={item.category} />
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Character Stage */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
                        <div className="relative p-6 bg-white/40 rounded-full shadow-2xl border-4 border-white/50 backdrop-blur-sm flex items-center justify-center">
                            <DroppableCharacter equippedItems={equippedImages} equippedIds={equippedIds} activeId={activeId} />
                            {/* Stage Spotlight effect */}
                            <div className="absolute inset-x-0 bottom-4 h-16 bg-white/30 blur-2xl -z-10 rounded-full" />
                        </div>

                        <button className="w-full max-w-xs py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-xl font-black text-lg hover:scale-105 transition-all shadow-lg active:scale-95">
                            ✨ 완성!
                        </button>
                    </div>

                    {/* Mission Panel */}
                    <div className="w-1/4 bg-white/90 rounded-[1.5rem] p-4 shadow-xl border-2 border-pink-200 z-10 flex flex-col justify-between overflow-hidden">
                        <div>
                            <h2 className="text-xl text-purple-600 mb-4 font-black text-center border-b border-purple-50 pb-2">
                                ⭐ Mission
                            </h2>
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-2xl border-2 border-yellow-200 shadow-inner mb-4">
                                <p className="text-orange-500 font-black mb-1 text-center text-xs underline decoration-orange-200 decoration-2">Today's Theme</p>
                                <p className="text-purple-700 text-xl font-black text-center leading-tight">
                                    "저녁 산책에<br />어울리는 옷"
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleReset}
                                className="w-full py-3 bg-white text-pink-500 border-2 border-pink-200 rounded-xl font-black text-base hover:bg-pink-50 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                🔄 옷 리셋하기
                            </button>
                            <div className="bg-pink-50 p-3 rounded-xl border border-pink-100 flex items-center gap-2">
                                <span className="text-xl">🐕</span>
                                <p className="text-pink-600 font-bold text-xs">함께하는 즐거운 산책!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <DragOverlay>
                {activeItem ? (
                    <div style={{ position: 'relative', zIndex: 99999 }}>
                        <div className="w-32 h-32 flex items-center justify-center scale-110">
                            <img src={activeItem.imageSrc} alt={activeItem.category} className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default CodyGame;
