import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Tile } from './Tile';
import { type Grid, type Direction } from './types';
import { GRID_SIZE } from './constants';

interface BoardProps {
    grid: Grid;
    selection: { r: number; c: number } | null;
    isSwapMode: boolean;
    onTileClick: (r: number, c: number) => void;
    onMove: (dir: Direction) => void;
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

export const Board: React.FC<BoardProps> = ({ grid, selection, isSwapMode, onTileClick, onMove }) => {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div
                className="rounded-[48px] p-6 w-full max-w-[min(800px,90vw)] aspect-square flex items-center justify-center"
                style={{ background: '#166D77', boxShadow: '0 30px 80px rgba(22, 109, 119, 0.3)' }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                        gap: 18,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {grid.map((row, r) =>
                        row.map((cell, c) => (
                            <div key={`${r}-${c}`} style={{ position: 'relative' }}>
                                <div className="absolute inset-0 rounded-3xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
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
