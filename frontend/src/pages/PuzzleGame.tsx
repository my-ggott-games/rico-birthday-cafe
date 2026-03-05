import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// --- Constants ---
const ROWS = 4;
const COLS = 4;
const PIECE_SIZE = 100; // Reduced size to fit screen (Total 400x400)
const IMAGE_URL = '/assets/rico_puzzle_sample.png';

// --- Types ---
interface PuzzlePiece {
    id: number;
    correctX: number; // grid column index
    correctY: number; // grid row index
    currentX: number; // pixel x position (scattered)
    currentY: number; // pixel y position (scattered)
    rotation: number; // 0, 90, 180, 270
    isPlaced: boolean; // locked in correct position
    shapePath: string; // SVG path for clip-path
    edgeTypes: { top: number; right: number; bottom: number; left: number }; // 0=flat, 1=out, -1=in
}

// --- Helper to Generate Jigsaw Shapes ---

const createPieces = () => {
    const internalVertical = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS - 1 }, () => Math.random() > 0.5 ? 1 : -1)
    );
    const internalHorizontal = Array.from({ length: ROWS - 1 }, () =>
        Array.from({ length: COLS }, () => Math.random() > 0.5 ? 1 : -1)
    );

    const pieces: PuzzlePiece[] = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            // 1 = Out, -1 = In, 0 = Flat
            const top = r === 0 ? 0 : (internalHorizontal[r - 1][c] === 1 ? -1 : 1);
            const myBottom = r === ROWS - 1 ? 0 : internalHorizontal[r][c];
            const myRight = c === COLS - 1 ? 0 : internalVertical[r][c];

            pieces.push({
                id: r * COLS + c,
                correctX: c,
                correctY: r,
                currentX: 0,
                currentY: 0,
                rotation: Math.floor(Math.random() * 4) * 90,
                isPlaced: false,
                edgeTypes: {
                    top: top,
                    right: myRight,
                    bottom: myBottom,
                    left: c === 0 ? 0 : (internalVertical[r][c - 1] === 1 ? -1 : 1)
                },
                shapePath: '' // Will calculate
            });
        }
    }

    // Generate paths using the offset version
    pieces.forEach(p => {
        p.shapePath = createOffsetPath();
    });

    return pieces;
}

// Simple square path creation
const createOffsetPath = () => {
    const s = PIECE_SIZE;
    return `M 0 0 h ${s} v ${s} h ${-s} z`;
};


// --- Components ---
const PuzzlePieceComponent = ({ piece, className, isOverlay = false }: any) => {
    return (
        <div
            style={{
                width: 'var(--piece-size)',
                height: 'var(--piece-size)',
                position: 'relative',
                touchAction: 'none',
            }}
            className={`flex items-center justify-center ${className || ''}`}
        >
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${IMAGE_URL})`,
                    backgroundSize: `calc(var(--piece-size) * ${COLS}) calc(var(--piece-size) * ${ROWS})`,
                    backgroundPosition: `calc(${piece.correctX} * var(--piece-size) * -1) calc(${piece.correctY} * var(--piece-size) * -1)`,
                    boxShadow: isOverlay ? '0 10px 20px rgba(0,0,0,0.5)' : 'none',
                    // Add border to unplaced pieces using drop-shadow
                    filter: piece.isPlaced
                        ? 'brightness(1.05)'
                        : `drop-shadow(0 0 0 2px #4A3b32) drop-shadow(0 4px 6px rgba(0,0,0,0.3))`,
                }}
            />
        </div>
    );
};

// Extracted Subcomponent for cleaner code and to prevent re-creation on render
const DroppableCell = ({ id, placedPiece, completed }: any) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={`flex items-center justify-center transition-all duration-500 ${!completed ? 'border-[0.5px] border-[rgba(209,213,219,0.5)]' : 'border-transparent'} ${isOver ? 'bg-[rgba(220,252,231,0.5)]' : ''}`}
            style={{ width: 'var(--piece-size)', height: 'var(--piece-size)' }}
        >
            {placedPiece && (
                <div style={{
                    width: 'var(--piece-size)',
                    height: 'var(--piece-size)',
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        width: '100%', height: '100%',
                        backgroundImage: `url(${IMAGE_URL})`,
                        backgroundSize: `calc(var(--piece-size) * ${COLS}) calc(var(--piece-size) * ${ROWS})`,
                        backgroundPosition: `calc(${placedPiece.correctX} * var(--piece-size) * -1) calc(${placedPiece.correctY} * var(--piece-size) * -1)`,
                        filter: 'brightness(1.05) drop-shadow(0 0 1px rgba(0,0,0,0.1))',
                    }} />
                </div>
            )}
        </div>
    );
};

const DraggablePiece = React.memo(({ piece, onRotate }: { piece: PuzzlePiece, onRotate: (id: number) => void }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: piece.id,
        disabled: piece.isPlaced
    });

    const startRef = React.useRef<{ x: number, y: number, time: number } | null>(null);
    const movedRef = React.useRef(false);

    // If placed, don't render here (rendered in grid)
    if (piece.isPlaced) return null;

    // Extract onPointerDown to wrap it, spread user listeners safely
    const { onPointerDown: dndOnPointerDown, ...otherListeners } = listeners || {};

    return (
        <div
            ref={setNodeRef}
            style={{
                position: 'absolute',
                left: `clamp(10px, ${piece.currentX}px, 100svw - var(--piece-size) - 10px)`,
                top: `clamp(120px, ${piece.currentY}px, 100svh - var(--piece-size) - 10px)`,
                width: 'var(--piece-size)',
                height: 'var(--piece-size)',
                zIndex: isDragging ? 0 : 10,
                opacity: isDragging ? 0 : 1,
                touchAction: 'none'
            }}
            {...attributes}
            {...otherListeners}
            onPointerDown={(e) => {
                // 1. Record start condition for Click detection
                startRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                movedRef.current = false; // Reset movement flag

                // 2. Trigger dnd-kit drag start
                if (dndOnPointerDown) dndOnPointerDown(e);
            }}
            onPointerMove={(e) => {
                // Track movement during pointer down
                if (!startRef.current) return;

                const deltaX = Math.abs(e.clientX - startRef.current.x);
                const deltaY = Math.abs(e.clientY - startRef.current.y);

                // If moved more than 3px, mark as dragged
                if (deltaX > 3 || deltaY > 3) {
                    movedRef.current = true;
                }
            }}
            onPointerUp={() => {
                if (!startRef.current) return;

                const deltaTime = Date.now() - startRef.current.time;

                // If dragging or moved, DO NOT rotate
                if (isDragging || movedRef.current) {
                    startRef.current = null;
                    return;
                }

                // Strict Click Rule: No movement AND quick press (< 200ms)
                if (deltaTime < 200) {
                    onRotate(piece.id);
                }

                startRef.current = null;
            }}
            className="cursor-pointer"
        >
            <motion.div
                initial={false} // Disable initial animation
                animate={{ rotate: piece.rotation }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                <PuzzlePieceComponent piece={piece} isOverlay={false} />
            </motion.div>
        </div>
    )
}, (prev, next) => prev.piece === next.piece);




const PuzzleGame: React.FC = () => {
    const navigate = useNavigate();
    const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [completed, setCompleted] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    const triggerFireworks = () => {
        const duration = 15 * 1000; // Increased duration
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 0, colors: ['#F43F5E', '#bef264', '#FFD700', '#ffffff'] };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 70 * (timeLeft / duration); // Increased density
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 } });
        }, 300);
    };

    // Trigger fireworks and popup on completion
    useEffect(() => {
        if (completed) {
            triggerFireworks();
            setShowPopup(true);
        }
    }, [completed]);


    // Sensors - increase distance to prevent rotation during drag
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
    );

    useEffect(() => {
        // Init pieces
        const newPieces = createPieces();

        // Calculate grid areas for scattering
        // Header height: 120px
        // Bottom height: 200px
        // Middle area height: window.innerHeight - 120 - 200

        const headerHeight = 120;
        const bottomHeight = 200;
        const middleHeight = window.innerHeight - headerHeight - bottomHeight;

        // Puzzle board width ~ (TOTAL_WIDTH + padding) ~ 500-600px
        // Let's assume board takes up center.
        const boardWidth = 600;
        const remainingWidth = window.innerWidth - boardWidth;
        const sideWidth = remainingWidth / 2;

        const zones = [
            // Left Zone
            { x: 20, y: headerHeight + 20, w: sideWidth - 40, h: middleHeight - 40 },
            // Right Zone
            { x: window.innerWidth - sideWidth + 20, y: headerHeight + 20, w: sideWidth - 40, h: middleHeight - 40 },
            // Bottom Zone
            { x: 50, y: window.innerHeight - bottomHeight + 20, w: window.innerWidth - 100, h: bottomHeight - 40 }
        ];

        const placedRects: { x: number, y: number }[] = [];
        const PIECE_BOUND = PIECE_SIZE + 40; // Approximate bounding box including tabs

        newPieces.forEach(p => {
            p.shapePath = createOffsetPath();

            // Try 50 times to find a non-overlapping spot
            let found = false;
            for (let i = 0; i < 50; i++) {
                // Pick a random zone
                const zone = zones[Math.floor(Math.random() * zones.length)];
                if (zone.w <= PIECE_BOUND || zone.h <= PIECE_BOUND) continue;

                const tx = zone.x + Math.random() * (zone.w - PIECE_BOUND);
                const ty = zone.y + Math.random() * (zone.h - PIECE_BOUND);

                // Check overlap
                const overlap = placedRects.some(r => Math.abs(r.x - tx) < PIECE_BOUND * 0.8 && Math.abs(r.y - ty) < PIECE_BOUND * 0.8);

                if (!overlap) {
                    p.currentX = tx;
                    p.currentY = ty;
                    placedRects.push({ x: tx, y: ty });
                    found = true;
                    break;
                }
            }

            // Fallback if full
            if (!found) {
                p.currentX = Math.random() * (window.innerWidth - 100);
                p.currentY = Math.random() * (window.innerHeight - 100);
            }
        });
        setPieces(newPieces);
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        const id = Number(event.active.id);
        setActiveId(id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta } = event;
        const id = Number(active.id);

        setPieces(prev => prev.map(p => {
            if (p.id !== id) return p;

            // 1. Try to place it
            if (over && String(over.id).startsWith('cell-')) {
                const [_, cx, cy] = String(over.id).split('-').map(Number);
                if (p.correctX === cx && p.correctY === cy && p.rotation % 360 === 0) {
                    return { ...p, isPlaced: true, currentX: -999, currentY: -999 };
                }
            }

            // 2. If not placed, update its persistent position
            return {
                ...p,
                currentX: p.currentX + delta.x,
                currentY: p.currentY + delta.y
            };
        }));

        setActiveId(null);
    };

    // Rotate handler using useCallback to keep identity stable
    const handleRotate = React.useCallback((id: number) => {
        setPieces(prev => prev.map(p =>
            p.id === id ? { ...p, rotation: p.rotation + 90 } : p
        ));
    }, []);

    // Check completion
    useEffect(() => {
        if (pieces.length > 0 && pieces.every(p => p.isPlaced)) {
            setCompleted(true);
        }
    }, [pieces]);


    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div
                className="w-full h-screen bg-[#FFFDF7] relative overflow-hidden select-none touch-none flex flex-col"
                style={{ '--piece-size': 'min(18svw, 100px)' } as React.CSSProperties}
            >
                {/* 1. Header Area (Fixed Height) */}
                <div className="h-[120px] w-full flex items-center px-10 relative z-20 bg-white/30 backdrop-blur-sm">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/lobby')}
                        className="bg-white px-6 py-3 rounded-2xl shadow-lg font-bold text-[#4A3b32] hover:bg-[#f3f4f6] border-2 border-[#bef264] flex items-center gap-2 mr-8"
                    >
                        <span>←</span> Lobby
                    </motion.button>
                    <div className="flex flex-col">
                        <span className="font-handwriting text-5xl font-black text-[#4A3b32] drop-shadow-sm">Puzzle Challenge!</span>
                        <span className="text-[#F43F5E] font-bold mt-1 text-sm">✨ 리코의 생일을 축하하는 그림을 맞춰보세요! (조각을 클릭하면 회전합니다)</span>
                    </div>
                </div>

                {/* 2. Main Content Area (Left | Board | Right) */}
                <div className="flex-1 w-full flex overflow-hidden">
                    {/* Left Scatter Area */}
                    <div className="flex-1 relative bg-[rgba(239,246,255,0.1)] hidden lg:block" id="area-left">
                        {/* Pieces will be absolutely positioned here by coordinates */}
                    </div>

                    {/* Center Board Area */}
                    <div className="flex-none flex items-center justify-center p-4 z-10">
                        <div
                            className="relative bg-white/50 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-[#4A3b32] rounded-3xl p-6"
                        >
                            <div
                                className="relative bg-[#fafafa] overflow-hidden"
                                style={{ width: `calc(var(--piece-size) * ${COLS})`, height: `calc(var(--piece-size) * ${ROWS})` }}
                            >
                                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-0">
                                    {Array.from({ length: ROWS * COLS }).map((_, i) => {
                                        const c = i % COLS;
                                        const r = Math.floor(i / COLS);
                                        const cellId = `cell-${c}-${r}`;
                                        const placedPiece = pieces.find(p => p.isPlaced && p.correctX === c && p.correctY === r);

                                        return (
                                            <DroppableCell
                                                key={i}
                                                id={cellId}
                                                placedPiece={placedPiece}
                                                completed={completed}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Scatter Area */}
                    <div className="flex-1 relative bg-[rgba(254,242,242,0.1)] hidden lg:block" id="area-right">

                    </div>
                </div>

                {/* 3. Bottom Scatter Area */}
                <div className="h-[200px] w-full bg-[rgba(240,253,244,0.1)] relative" id="area-bottom">

                </div>


                {/* Absolute Layer for Pieces (Positioned relative to Screen 0,0) */}
                <div className="absolute inset-0 pointer-events-none z-[50]">
                    <div className="pointer-events-auto">
                        {pieces.map(p => (
                            <DraggablePiece key={p.id} piece={p} onRotate={handleRotate} />
                        ))}
                    </div>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeId !== null ? (
                        <div className="pointer-events-none">
                            <PuzzlePieceComponent piece={pieces.find(p => p.id === activeId)} isOverlay />
                        </div>
                    ) : null}
                </DragOverlay>

                {/* Completion Effects (Cute Modal - Smaller and at Bottom) */}
                <AnimatePresence>
                    {showPopup && (
                        <div className="fixed inset-x-0 bottom-10 z-[100] flex items-center justify-center pointer-events-none">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0, y: 100 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.8, opacity: 0, y: 100 }}
                                className="bg-white/95 backdrop-blur-md p-4 rounded-[30px] text-center shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-8 border-[#FFFDF7] pointer-events-auto relative max-w-lg mx-4"
                            >
                                {/* Decorative elements */}
                                <div className="absolute -top-6 -left-6 text-4xl animate-bounce">🎈</div>
                                <div className="absolute -top-6 -right-6 text-4xl animate-bounce delay-100">🎁</div>

                                <h1 className="font-handwriting text-6xl text-[#F43F5E] mb-3 drop-shadow-sm select-none">
                                    Happy Birthday!
                                </h1>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="bg-[#bef264] hover:bg-[#a8e04b] text-[#4A3b32] px-8 py-3 rounded-2xl font-black text-xl shadow-lg transition-all hover:scale-105 active:scale-95 border-b-4 border-black/10"
                                    >
                                        다시 하기
                                    </button>
                                    <button
                                        onClick={() => setShowPopup(false)}
                                        className="bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#6b7280] px-6 py-3 rounded-2xl font-bold text-lg transition-all border-b-4 border-black/5"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Persistent Play Again Button after closing popup */}
                <AnimatePresence>
                    {completed && !showPopup && (
                        <motion.button
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            onClick={() => window.location.reload()}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] bg-[#F43F5E] text-white px-10 py-4 rounded-full font-black text-2xl shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:scale-110 active:scale-95 transition-all border-b-4 border-black/20"
                        >
                            다시하기
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </DndContext>
    );
};

export default PuzzleGame;
