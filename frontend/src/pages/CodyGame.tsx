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
        top: null,
        bottom: null,
        onepiece: null
    });
    const [draggedItemSize, setDraggedItemSize] = useState<{ width: number; height: number } | null>(null);

    const availableItems = [
        { id: 'top-1', category: 'top', imageSrc: '/assets/cody_top_1.png' },
        { id: 'top-2', category: 'top', imageSrc: '/assets/cody_top_2.png' },
        { id: 'bottom-1', category: 'bottom', imageSrc: '/assets/cody_bottom_1.png' },
        { id: 'bottom-2', category: 'bottom', imageSrc: '/assets/cody_bottom_2.svg' },
        { id: 'onepiece-1', category: 'onepiece', imageSrc: '/assets/cody_onepiece_1.svg' },
    ];

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleReset = () => {
        setEquippedItems({
            top: null,
            bottom: null,
            onepiece: null
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));

        // Measure the dragged element to ensure overlay matches responsive size
        const draggedElement = document.getElementById(`draggable-item-${event.active.id}`);
        if (draggedElement) {
            const rect = draggedElement.getBoundingClientRect();
            setDraggedItemSize({ width: rect.width, height: rect.height });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const draggedItem = availableItems.find((i) => i.id === active.id);

        if (over && draggedItem) {
            const dropZoneId = over.id as string;
            if (dropZoneId === 'character-zone') {
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
                // Should not happen if only drop zone is character-zone, but safe fallback
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
        } else if (!over && draggedItem) {
            // Drop outside (unequip)
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
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-screen w-full flex flex-col overflow-hidden font-sans relative select-none">
                {/* Background: Pink Gingham Check (Tablecloth) */}
                <div className="absolute inset-0 z-0 bg-[#FFF0F5]"
                    style={{
                        backgroundImage: `
                            linear-gradient(45deg, #FFC0CB 25%, transparent 25%, transparent 75%, #FFC0CB 75%, #FFC0CB),
                            linear-gradient(45deg, #FFC0CB 25%, transparent 25%, transparent 75%, #FFC0CB 75%, #FFC0CB)
                         `,
                        backgroundPosition: '0 0, 20px 20px',
                        backgroundSize: '40px 40px',
                        opacity: 0.3
                    }}
                />

                {/* Table Decorations - Removed as per user request */}

                {/* Navbar (Simple floating buttons) */}
                <div className="absolute top-6 left-6 z-50">
                    <button
                        onClick={() => navigate('/lobby')}
                        className="bg-white/90 backdrop-blur border-2 border-[#ff9eb5] text-[#F43F5E] px-4 py-2 rounded-full font-bold shadow-md hover:scale-105 transition-transform"
                    >
                        ← Exit Table
                    </button>
                </div>

                {/* Main Workspace: Items on left, Character on mat in center/right */}
                <div className="relative z-10 w-full h-full flex items-center justify-center p-8 gap-12">

                    {/* Left: Sticker Sheet (Items) */}
                    <div className="w-1/3 h-[80%] bg-white rounded-sm shadow-xl p-2 rotate-[-2deg] relative">
                        {/* Tape effect */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#ffecb3]/80 rotate-1 backdrop-blur-sm shadow-sm" />

                        <div className="w-full h-full border-[3px] border-dashed border-gray-200 p-4 flex flex-col">
                            <h3 className="text-center text-gray-400 font-bold mb-4 font-handwriting text-2xl tracking-widest uppercase">
                                Sticker Collection
                            </h3>
                            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar grid grid-cols-2 gap-4 content-start p-2">
                                {availableItems.map((item) => {
                                    const isEquipped = Object.values(equippedIds).includes(item.id);
                                    const isDragging = activeId === item.id;
                                    return (
                                        <div key={item.id} className="relative aspect-square flex items-center justify-center">
                                            {/* Sticker Peel Effect Background */}
                                            <div className="absolute inset-2 bg-gray-100 rounded-lg opacity-50 border border-gray-200" />

                                            {!isEquipped && (
                                                <motion.div
                                                    layoutId={!isDragging ? item.id : undefined}
                                                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                                    className="relative z-10 w-full h-full p-2 cursor-grab active:cursor-grabbing transition-transform"
                                                >
                                                    {/* White outline for sticker look */}
                                                    <div
                                                        id={`draggable-item-${item.id}`}
                                                        className="w-full h-full filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]"
                                                    >
                                                        <DraggableItem id={item.id} imageSrc={item.imageSrc} category={item.category} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Center: Character Zone */}
                    <div className="flex-1 h-[85%] relative flex items-center justify-center">
                        {/* Paper Doll Character */}
                        <div className="relative z-10 filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)]">
                            {/* White paper border effect */}
                            <div className="absolute inset-[-4px] bg-white rounded-[40%] blur-[1px]" style={{ clipPath: 'content-box' }} />

                            <div className="scale-150">
                                <DroppableCharacter equippedItems={equippedImages} equippedIds={equippedIds} activeId={activeId} />
                            </div>
                        </div>

                        {/* Mission Post-it */}
                        <motion.div
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute top-10 right-10 bg-[#fff59d] w-48 p-4 shadow-md rotate-3 font-handwriting text-[#4A3b32] cursor-move"
                        >
                            <p className="font-bold border-b border-[#ffd54f] mb-2 pb-1 text-center text-3xl">오늘의 할 일</p>
                            <div className="text-2xl space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-red-500">✔</span>
                                    <span>카페 방문하기</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400">□</span>
                                    <span className="font-bold">리코 생일 축하하기</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Action Buttons - High Z-index to prevent overlapping */}
                        <div className="absolute bottom-8 flex gap-4 z-50">
                            <button
                                onClick={handleReset}
                                className="bg-white px-6 py-2 rounded-lg font-bold text-[#F43F5E] shadow-sm hover:shadow-md transition-shadow border-2 border-dashed border-[#F43F5E]"
                            >
                                다시하기
                            </button>
                            <button
                                onClick={() => alert("쨔쟌~ 리코의 생일 코디가 완성되었어요! 🎉")}
                                className="bg-[#4A3b32] text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:bg-black transition-colors rotate-[-2deg]"
                            >
                                완성하기 ✨
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            <DragOverlay>
                {activeItem ? (
                    <div style={{
                        position: 'relative',
                        zIndex: 99999,
                        pointerEvents: 'none',
                    }}>
                        <div
                            style={{
                                width: draggedItemSize ? draggedItemSize.width : '8rem', // Fallback to 32 (8rem)
                                height: draggedItemSize ? draggedItemSize.height : '8rem'
                            }}
                            className="flex items-center justify-center scale-100"
                        >
                            {/* Sticker drag appearance */}
                            <div className="filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)]">
                                <img src={activeItem.imageSrc} alt={activeItem.category} className="max-w-full max-h-full object-contain" />
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default CodyGame;
