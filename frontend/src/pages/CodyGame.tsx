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
        shoes: null,
        accessories: null
    });
    const [isFinished, setIsFinished] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    React.useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);

        // Optimization: Pre-load results and character bodies
        const imagesToPreload = [
            '/assets/codygame/riko_body_smile.png',
            '/assets/codygame/riko_body_wink.png',
            '/assets/codygame/riko_body_default.png',
            '/assets/codygame/riko_hair_back_long.png',
            '/assets/codygame/rico_hair_front_long.png',
            '/assets/codygame/rico_hair_front_twintail.png',
            '/assets/codygame/riko_hair_back_twintail.png',
            '/assets/codygame/riko_clothes_training.png',
            '/assets/codygame/riko_clothes_peasantdress.png',
            '/assets/codygame/riko_ accessories_flowers.png'
        ];
        imagesToPreload.forEach(src => {
            const img = new Image();
            img.src = src;
        });

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const characterScale = isMobile ? 1.1 : (windowWidth > 1440 ? 1.3 : 1.1);

    const availableItems = [
        { id: 'hair-1', category: 'hair', imageSrc: '/assets/codygame/rico_hair_front_long.png', backImageSrc: '/assets/codygame/riko_hair_back_long.png' },
        { id: 'hair-2', category: 'hair', imageSrc: '/assets/codygame/rico_hair_front_twintail.png', backImageSrc: '/assets/codygame/riko_hair_back_twintail.png' },
        { id: 'onepiece-1', category: 'onepiece', imageSrc: '/assets/codygame/riko_clothes_training.png' },
        { id: 'onepiece-2', category: 'onepiece', imageSrc: '/assets/codygame/riko_clothes_peasantdress.png' },
        { id: 'accessories-1', category: 'accessories', imageSrc: '/assets/codygame/riko_ accessories_flowers.png' },
    ];

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: isMobile
                ? { delay: 250, tolerance: 5 } // hold for 250ms to drag on mobile (allows scroll)
                : { distance: 8 }
        })
    );

    const handleReset = () => {
        setEquippedItems({ hair: null, top: null, bottom: null, onepiece: null, shoes: null, accessories: null });
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
                    <button onClick={() => navigate('/lobby')} className="btn-secondary">
                        ← 돌아가기
                    </button>
                </div>

                <div className={`relative z-10 w-full h-full flex ${isMobile ? 'flex-col overflow-y-auto' : 'items-center justify-between px-16 py-10'}`}>

                    {/* Left: Mannequin Display */}
                    <div className={`${isMobile ? 'w-full min-h-[650px] pt-16' : 'w-[45%] h-full'} flex flex-col items-center justify-center`}>
                        <div className={`relative z-10 w-full ${isMobile ? 'h-[550px]' : 'h-[700px]'} flex items-center justify-center`}>
                            <DroppableCharacter
                                equippedItems={equippedImages}
                                equippedIds={equippedIds}
                                activeId={activeId}
                                isFinished={isFinished}
                                resultImage={resultImage}
                                scale={characterScale}
                                isMobile={isMobile}
                                availableItems={availableItems}
                            />
                        </div>

                        <div className={`relative z-50 flex gap-4 ${isMobile ? 'mt-2 mb-4' : 'mt-8'}`}>
                            <button onClick={handleReset} className="btn-secondary">
                                다시하기
                            </button>
                            <button
                                onClick={() => { if (!isFinished) { setIsFinished(true); setResultImage(['/assets/codygame/riko_body_smile.png', '/assets/codygame/riko_body_wink.png'][Math.floor(Math.random() * 2)]); } }}
                                className={isFinished ? "btn-disabled" : "btn-primary"}
                            >
                                {isFinished ? "공유하기 ✨" : "코디 끝!✨"}
                            </button>
                        </div>
                    </div>

                    {/* Right: Wardrobe */}
                    <div className={`${isMobile ? 'w-full px-4' : 'w-[45%] h-full'} flex flex-col`}>
                        <div className={`flex-1 ${isMobile ? '' : 'overflow-y-auto custom-scrollbar'} transition-opacity ${isFinished ? 'opacity-30 pointer-events-none' : ''}`}>
                            {/* Hair Section */}
                            <div className="mb-8">
                                <div className={`flex ${isMobile ? 'gap-2' : 'gap-4'} overflow-x-auto px-4 pb-4`}>
                                    {availableItems.filter(item => item.category === 'hair').map((item) => {
                                        const isEquipped = Object.values(equippedIds).includes(item.id);
                                        const isDragging = activeId === item.id;
                                        const handleClick = () => {
                                            if (isMobile && !isFinished && !isEquipped) {
                                                setEquippedItems((prev) => ({
                                                    ...prev,
                                                    [item.category]: item.id
                                                }));
                                            }
                                        };

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={handleClick}
                                                className={`relative ${isMobile ? 'w-40 h-48 ml-1' : 'w-60 h-64'} overflow-hidden border-2 border-dashed border-[#4A3b32]/30 rounded-3xl flex-shrink-0 bg-[#FDFBF7]/50 transition-transform active:scale-95`}
                                            >
                                                {/* Hidden stable target for return animation */}
                                                <div className="absolute w-[384px] h-[700px] opacity-0 pointer-events-none" style={{ top: isMobile ? '-120px' : '-70px', left: '50%', transform: `translateX(-50%) scale(${characterScale})` }}>
                                                    <motion.div
                                                        layoutId={item.id}
                                                        className="w-full h-full"
                                                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                                    />
                                                    {item.category === 'hair' && (
                                                        <motion.div
                                                            layoutId={`${item.id}-back`}
                                                            className="w-full h-full"
                                                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Back Hair Layer for Preview - Hide when equipped or dragging */}
                                                {!isEquipped && !isDragging && (
                                                    <div className="absolute w-[384px] h-[700px] opacity-100 pointer-events-none" style={{ top: isMobile ? '-120px' : '-70px', left: '50%', transform: `translateX(-50%) scale(${characterScale})` }}>
                                                        <img src={item.backImageSrc || "/assets/codygame/riko_hair_back_long.png"} className="w-full h-full object-contain" alt="back-preview" />
                                                    </div>
                                                )}

                                                {!isEquipped && !isDragging && (
                                                    <div
                                                        className="absolute w-[384px] h-[700px] cursor-grab active:cursor-grabbing"
                                                        style={{ top: isMobile ? '-120px' : '-70px', left: '50%', transform: `translateX(-50%) scale(${characterScale})` }}
                                                    >
                                                        <DraggableItem id={item.id} imageSrc={item.imageSrc} category={item.category} className="w-full h-full p-0" />
                                                    </div>
                                                )}
                                                {/* Equipped items are hidden in inventory */}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Clothes Section */}
                            <div className="mb-8">
                                <div className={`flex ${isMobile ? 'gap-2' : 'gap-4'} overflow-x-auto px-4 pb-4`}>
                                    {availableItems.filter(item => ['top', 'bottom', 'onepiece'].includes(item.category)).map((item) => {
                                        const isEquipped = Object.values(equippedIds).includes(item.id);
                                        const isDragging = activeId === item.id;
                                        const handleClick = () => {
                                            if (isMobile && !isFinished && !isEquipped) {
                                                setEquippedItems((prev) => {
                                                    const newIds = { ...prev };
                                                    if (item.category === 'onepiece') {
                                                        newIds['top'] = null;
                                                        newIds['bottom'] = null;
                                                        newIds['onepiece'] = item.id;
                                                    } else if (item.category === 'top' || item.category === 'bottom') {
                                                        newIds['onepiece'] = null;
                                                        newIds[item.category] = item.id;
                                                    }
                                                    return newIds;
                                                });
                                            }
                                        };

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={handleClick}
                                                className={`relative ${isMobile ? 'w-40 h-60 ml-1' : 'w-60 h-120'} overflow-hidden border-2 border-dashed border-[#4A3b32]/30 rounded-3xl flex-shrink-0 bg-[#FDFBF7]/50 transition-transform active:scale-95`}
                                            >
                                                {/* Hidden stable target for return animation */}
                                                <div className="absolute w-[384px] h-[700px] opacity-0 pointer-events-none" style={{ top: isMobile ? '-140px' : '-128px', left: '50%', transform: `translateX(-50%) scale(${characterScale})` }}>
                                                    <motion.div
                                                        layoutId={item.id}
                                                        className="w-full h-full"
                                                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                                    />
                                                </div>

                                                {!isEquipped && !isDragging && (
                                                    <div
                                                        className="absolute w-[384px] h-[700px] cursor-grab active:cursor-grabbing"
                                                        style={{ top: isMobile ? '-140px' : '-128px', left: '50%', transform: `translateX(-50%) scale(${characterScale})` }}
                                                    >
                                                        <DraggableItem id={item.id} imageSrc={item.imageSrc} category={item.category} className="w-full h-full p-0" />
                                                    </div>
                                                )}
                                                {/* Equipped items are hidden in inventory */}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Accessories Section */}
                            <div className="mb-8">
                                <div className={`flex ${isMobile ? 'gap-2' : 'gap-4'} overflow-x-auto px-4 pb-4`}>
                                    {availableItems.filter(item => item.category === 'accessories').map((item) => {
                                        const isEquipped = Object.values(equippedIds).includes(item.id);
                                        const isDragging = activeId === item.id;
                                        const handleClick = () => {
                                            if (isMobile && !isFinished && !isEquipped) {
                                                setEquippedItems((prev) => ({
                                                    ...prev,
                                                    [item.category]: item.id
                                                }));
                                            }
                                        };

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={handleClick}
                                                className={`relative ${isMobile ? 'w-40 h-48 ml-1' : 'w-60 h-64'} overflow-hidden border-2 border-dashed border-[#4A3b32]/30 rounded-3xl flex-shrink-0 bg-[#FDFBF7]/50 transition-transform active:scale-95`}
                                            >
                                                {/* Hidden stable target for return animation */}
                                                <div className="absolute w-[384px] h-[700px] opacity-0 pointer-events-none" style={{ top: isMobile ? '-120px' : '-70px', left: '50%', transform: `translateX(-50%) scale(${characterScale})` }}>
                                                    <motion.div
                                                        layoutId={item.id}
                                                        className="w-full h-full"
                                                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                                    />
                                                </div>

                                                {!isEquipped && !isDragging && (
                                                    <div
                                                        className="absolute w-[384px] h-[700px] cursor-grab active:cursor-grabbing"
                                                        style={{ top: isMobile ? '-120px' : '-70px', left: '50%', transform: `translateX(-50%) scale(${characterScale})` }}
                                                    >
                                                        <DraggableItem id={item.id} imageSrc={item.imageSrc} category={item.category} className="w-full h-full p-0" />
                                                    </div>
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
                        <div className="relative" style={{ width: 384 * characterScale, height: 700 * characterScale }}>
                            <div className="absolute inset-0 origin-top-left" style={{ transform: `scale(${characterScale})` }}>
                                {/* Hair back layer - only for hair category - BEHIND mannequin (z-0) */}
                                {activeItem.category === 'hair' && activeItem.backImageSrc && (
                                    <img
                                        src={activeItem.backImageSrc}
                                        alt="hair-back"
                                        className="absolute inset-0 w-[384px] h-[700px] object-contain z-0"
                                    />
                                )}
                                {/* Front layer (or only layer for non-hair) - IN FRONT of mannequin (z-50) */}
                                <img
                                    src={activeItem.imageSrc}
                                    alt="dragging"
                                    className="absolute inset-0 w-[384px] h-[700px] object-contain z-50"
                                />
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default CodyGame;
