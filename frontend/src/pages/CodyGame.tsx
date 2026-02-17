import React, { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { DraggableItem } from '../components/game/DraggableItem';
import { DroppableCharacter } from '../components/game/DroppableCharacter';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CodyGame: React.FC = () => {
    const navigate = useNavigate();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [equippedIds, setEquippedItems] = useState<{ [category: string]: string | null }>({
        hair: null,
        top: null,
        bottom: null,
        onepiece: null,
        shoes: null
    });
    const [isFinished, setIsFinished] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const availableItems = [
        { id: 'hair-1', category: 'hair', imageSrc: '/assets/codygame/rico_hair_front_long.png' },
        { id: 'onepiece-2', category: 'onepiece', imageSrc: '/assets/codygame/riko_clothes_training.png' },
    ];

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleReset = () => {
        setEquippedItems({ hair: null, top: null, bottom: null, onepiece: null, shoes: null });
        setIsFinished(false);
        setResultImage(null);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const draggedItem = availableItems.find((i) => i.id === active.id);

        if (over && draggedItem && !isFinished) {
            if (over.id === 'character-zone') {
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
            }
        } else if (!over && draggedItem) {
            setEquippedItems((prev) => {
                const newIds = { ...prev };
                Object.keys(newIds).forEach(cat => {
                    if (newIds[cat] === draggedItem.id) newIds[cat] = null;
                });
                return newIds;
            });
        }
        setTimeout(() => setActiveId(null), 50);
    };

    const activeItem = activeId ? availableItems.find(i => i.id === activeId) : null;

    const equippedImages = Object.entries(equippedIds).reduce((acc, [cat, id]) => {
        if (!id) return acc;
        const item = availableItems.find(i => i.id === id);
        if (item) acc[cat] = item.imageSrc;
        return acc;
    }, {} as { [key: string]: string });

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-screen w-full flex flex-col overflow-hidden font-sans relative select-none bg-[#FFFDF7]">
                <div className="absolute inset-0 z-0 opacity-[0.03]"
                    style={{ backgroundImage: `radial-gradient(#4A3b32 1px, transparent 1px)`, backgroundSize: '32px 32px' }}
                />

                <div className="absolute top-6 left-6 z-50">
                    <button onClick={() => navigate('/lobby')} className="bg-white border-2 border-[#4A3b32]/10 text-[#4A3b32] px-6 py-2 rounded-full font-bold shadow-md active:scale-95 transition-all">
                        ← Back to Cafe
                    </button>
                </div>

                <div className="relative z-10 w-full h-full flex items-center justify-between px-16 py-10">

                    {/* Left: Mannequin Display (Fixed position relative to container) */}
                    <div className="w-[45%] h-full flex flex-col items-center justify-center">
                        <div className="relative z-10 w-full h-[700px] flex items-center justify-center">
                            <DroppableCharacter
                                equippedItems={equippedImages}
                                equippedIds={equippedIds}
                                activeId={activeId}
                                isFinished={isFinished}
                                resultImage={resultImage}
                            />
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button onClick={handleReset} className="bg-white px-8 py-3 rounded-2xl font-bold text-[#4A3b32] border-2 border-[#4A3b32]/10 active:scale-95">다시하기</button>
                            <button onClick={() => { if (!isFinished) { setIsFinished(true); setResultImage(['/assets/codygame/riko_body_smile.png', '/assets/codygame/riko_body_wink.png'][Math.floor(Math.random() * 2)]); } }}
                                className={`px-10 py-3 rounded-2xl font-bold text-white transition-all ${isFinished ? 'bg-gray-400' : 'bg-[#4A3b32] hover:scale-105'}`}>
                                {isFinished ? "Perfect! ✨" : "코디 끝!✨"}
                            </button>
                        </div>
                    </div>

                    {/* Right: Wardrobe (Full height list, no partitions, items appear at their natural scale) */}
                    <div className="w-[45%] h-full flex flex-col">
                        <div className={`flex-1 overflow-y-auto custom-scrollbar transition-opacity ${isFinished ? 'opacity-30 pointer-events-none' : ''}`}>
                            {/* Hair Section */}
                            <div className="mb-8">
                                <div className="flex gap-4 overflow-x-auto px-4 pb-4">
                                    {availableItems.filter(item => item.category === 'hair').map((item) => {
                                        const isEquipped = Object.values(equippedIds).includes(item.id);
                                        const isDragging = activeId === item.id;
                                        return (
                                            <div key={item.id} className="relative w-60 h-64 overflow-hidden border-2 border-dashed border-[#4A3b32]/30 rounded-3xl flex-shrink-0 bg-[#FDFBF7]/50">
                                                {/* Back Hair Layer for Preview - Hide when equipped or dragging */}
                                                {!isEquipped && !isDragging && (
                                                    <div className="absolute w-[384px] h-[700px] -top-[70px] left-1/2 -translate-x-1/2 opacity-100 pointer-events-none">
                                                        <img src="/assets/codygame/riko_hair_back_long.png" className="w-full h-full object-contain" alt="back-preview" />
                                                    </div>
                                                )}

                                                {!isEquipped && !isDragging && (
                                                    <motion.div
                                                        layoutId={item.id}
                                                        className="absolute w-[384px] h-[700px] -top-[70px] left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                                                    >
                                                        <DraggableItem id={item.id} imageSrc={item.imageSrc} category={item.category} className="w-full h-full p-0" />
                                                    </motion.div>
                                                )}
                                                {/* Equipped items are hidden in inventory */}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Clothes Section */}
                            <div className="mb-8">
                                <div className="flex gap-4 overflow-x-auto px-4 pb-4">
                                    {availableItems.filter(item => ['top', 'bottom', 'onepiece'].includes(item.category)).map((item) => {
                                        const isEquipped = Object.values(equippedIds).includes(item.id);
                                        const isDragging = activeId === item.id;
                                        return (
                                            <div key={item.id} className="relative w-60 h-120 overflow-hidden border-2 border-dashed border-[#4A3b32]/30 rounded-3xl flex-shrink-0 bg-[#FDFBF7]/50">
                                                {!isEquipped && !isDragging && (
                                                    <motion.div
                                                        layoutId={item.id}
                                                        className="absolute w-[384px] h-[700px] -top-32 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                                                    >
                                                        <DraggableItem id={item.id} imageSrc={item.imageSrc} category={item.category} className="w-full h-full p-0" />
                                                    </motion.div>
                                                )}
                                                {/* Equipped items are hidden in inventory */}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <DragOverlay>
                {activeItem ? (
                    <div style={{ zIndex: 99999, pointerEvents: 'none' }}>
                        <div className="w-[384px] h-[700px] relative">
                            {/* Hair back layer - only for hair category */}
                            {activeItem.category === 'hair' && (
                                <img
                                    src="/assets/codygame/riko_hair_back_long.png"
                                    alt="hair-back"
                                    className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl z-[-1]"
                                />
                            )}
                            {/* Front layer (or only layer for non-hair) */}
                            <img
                                src={activeItem.imageSrc}
                                alt="dragging"
                                className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl z-[40]"
                            />
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default CodyGame;
