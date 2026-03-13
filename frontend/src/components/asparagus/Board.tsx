import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Tile } from './Tile';
import { type Grid, type Direction } from './types';
import { GRID_SIZE } from './constants';

// Tile radius: 16px (rounded-2xl), gap: 18px.
// Board padding: 20px → Board outer radius = 16 + 20 = 36px
const TILE_RADIUS = 16;
const BOARD_PADDING = 20;
const BOARD_RADIUS = TILE_RADIUS + BOARD_PADDING; // 36

interface BoardProps {
    grid: Grid;
    selection: { r: number; c: number } | null;
    isSwapMode: boolean;
    onTileClick: (r: number, c: number) => void;
    onMove: (dir: Direction) => void;
    onTouchStart?: (e: React.TouchEvent) => void;
    onTouchEnd?: (e: React.TouchEvent) => void;
}

const ArrowButton = ({ dir, onClick }: { dir: Direction; onClick: () => void }) => {
    const icons: Record<Direction, string> = { up: '↑', down: '↓', left: '←', right: '→' };
    return (
        <button
            onClick={onClick}
            className="w-12 h-12 rounded-2xl font-bold text-xl flex items-center justify-center transition-all active:scale-90 select-none"
            style={{ background: '#166D77', color: '#FFFFF8', boxShadow: '0 3px 0 rgba(0,0,0,0.25)' }}
        >
            {icons[dir]}
        </button>
    );
};

export const Board: React.FC<BoardProps> = ({ grid, selection, isSwapMode, onTileClick, onMove, onTouchStart, onTouchEnd }) => {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div
                className="w-full aspect-square flex items-center justify-center"
                style={{
                    maxWidth: 'min(500px, calc(100vw - 3rem))',
                    background: '#166D77',
                    borderRadius: BOARD_RADIUS,
                    padding: BOARD_PADDING,
                    boxShadow: '0 30px 80px rgba(22, 109, 119, 0.3)',
                    touchAction: 'none', // Prevents body scrolling when swiping inside the board
                }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                        gap: 'clamp(8px, 2vw, 18px)',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {grid.map((row, r) =>
                        row.map((cell, c) => (
                            <div key={`${r}-${c}`} style={{ position: 'relative', width: '100%', height: '100%', aspectRatio: '1 / 1' }}>
                                <div className="absolute inset-0 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
                                <AnimatePresence mode="popLayout">
                                    <div className="absolute inset-0">
                                        <Tile
                                            value={cell}
                                            isSelected={selection?.r === r && selection?.c === c}
                                            onClick={isSwapMode ? () => onTileClick(r, c) : undefined}
                                        />
                                    </div>
                                </AnimatePresence>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                        <ArrowButton dir="up" onClick={() => onMove('up')} />
                    </div>
                    <div className="flex gap-2">
                        <ArrowButton dir="left" onClick={() => onMove('left')} />
                        <ArrowButton dir="down" onClick={() => onMove('down')} />
                        <ArrowButton dir="right" onClick={() => onMove('right')} />
                    </div>
                </div>
            </div>
        </div>
    );
};
