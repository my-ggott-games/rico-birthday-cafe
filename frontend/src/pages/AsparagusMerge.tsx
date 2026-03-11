import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BASE_URL } from '../utils/api';

import { TutorialBanner, type TutorialSlide } from '../components/common/TutorialBanner';

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_SIZE = 4;
const WIN_VALUE = 2048;

// ─── Growth Stage Data ────────────────────────────────────────────────────────
const STAGES: Record<number, { name: string; emoji: string; bg: string; text: string }> = {
    1: { name: '씨앗', emoji: '🌱', bg: '#d4edda', text: '#2d6a4f' },
    2: { name: '새싹', emoji: '🌿', bg: '#b7e4c7', text: '#1b4332' },
    4: { name: '어린 아스파라거스', emoji: '🥬', bg: '#95d5b2', text: '#1b4332' },
    8: { name: '아스파라거스 잎', emoji: '🌾', bg: '#74c69d', text: '#fff' },
    16: { name: '아스파라거스 대', emoji: '🎋', bg: '#52b788', text: '#fff' },
    32: { name: '아스파라거스 꽃', emoji: '🌼', bg: '#40916c', text: '#fff' },
    64: { name: '빛나는 아스파라거스', emoji: '✨', bg: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)', text: '#fff' },
    128: { name: '황금 아스파라거스', emoji: '🏆', bg: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)', text: '#5a3d00' },
    256: { name: '마법의 아스파라거스', emoji: '🔮', bg: 'linear-gradient(135deg, #9d4edd 0%, #5a189a 100%)', text: '#fff' },
    512: { name: '정령의 아스파라거스', emoji: '🧚', bg: 'linear-gradient(135deg, #48bfe3 0%, #0077b6 100%)', text: '#fff' },
    1024: { name: '전설의 아스파라거스', emoji: '💎', bg: 'linear-gradient(135deg, #e0aaff 0%, #7b2cbf 100%)', text: '#fff' },
    2048: { name: '성검 아스파라거스', emoji: '⚔️', bg: 'linear-gradient(135deg, #ff006e 0%, #8338ec 100%)', text: '#fff' }
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Grid = (number | null)[][];
type Direction = 'up' | 'down' | 'left' | 'right';

// ─── Tutorial Slides ──────────────────────────────────────────────────────────
const TUTORIAL_SLIDES: TutorialSlide[] = [
    {
        title: '아스파라거스를 키워봐! 🌱',
        lines: ['키보드 방향키나 스와이프로 조작해.'],
        showArrows: true,
    },
    {
        title: '타일을 밀어봐 ➡️',
        lines: ['타일들이 한쪽으로 쏠리고', '새로운 씨앗이 생겨나.'],
        highlight: null,
        showArrows: false,
    },
    {
        title: '같은 단계가 만나면? ✨',
        lines: ['두 타일이 부딪혀서 합쳐져!'],
        highlight: { a: '새싹 🌿', b: '새싹 🌿', result: '어린 아스파라거스 🥬' },
        showArrows: false,
    },
    {
        title: '끝까지 성장하면 어떤 일이 일어날까?',
        lines: ['끝까지 키우면 좋은 일이 생길지도?'],
        highlight: null,
        showArrows: false,
    },
];

// ─── Grid Helpers ─────────────────────────────────────────────────────────────
const createEmptyGrid = (): Grid =>
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

const addRandomTile = (grid: Grid): Grid => {
    const empty: [number, number][] = [];
    grid.forEach((row, r) => row.forEach((cell, c) => { if (!cell) empty.push([r, c]); }));
    if (!empty.length) return grid;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const next = grid.map(row => [...row]) as Grid;
    next[r][c] = Math.random() < 0.9 ? 1 : 2;
    return next;
};

const slideRow = (row: (number | null)[]): { row: (number | null)[]; score: number } => {
    const vals = row.filter(Boolean) as number[];
    let score = 0;
    const merged: number[] = [];
    let i = 0;
    while (i < vals.length) {
        if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
            const sum = vals[i] * 2;
            merged.push(sum);
            score += sum;
            i += 2;
        } else {
            merged.push(vals[i]);
            i++;
        }
    }
    while (merged.length < GRID_SIZE) merged.push(0);
    return { row: merged.map(v => v || null), score };
};

const moveGrid = (grid: Grid, dir: Direction): { grid: Grid; score: number; moved: boolean } => {
    let totalScore = 0;
    let moved = false;
    let next: Grid = createEmptyGrid();

    const processRow = (row: (number | null)[]) => {
        const result = slideRow(row);
        totalScore += result.score;
        if (JSON.stringify(row) !== JSON.stringify(result.row)) moved = true;
        return result.row;
    };

    if (dir === 'left') {
        next = grid.map(row => processRow([...row]));
    } else if (dir === 'right') {
        next = grid.map(row => processRow([...row].reverse()).reverse());
    } else if (dir === 'up') {
        for (let c = 0; c < GRID_SIZE; c++) {
            const col = grid.map(row => row[c]);
            const result = processRow([...col]);
            result.forEach((v, r) => { next[r][c] = v; });
        }
    } else { // down
        for (let c = 0; c < GRID_SIZE; c++) {
            const col = grid.map(row => row[c]).reverse();
            const result = processRow([...col]).reverse();
            result.forEach((v, r) => { next[r][c] = v; });
        }
    }

    return { grid: next, score: totalScore, moved };
};

const checkGameOver = (grid: Grid): boolean => {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (!grid[r][c]) return false;
            if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
            if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
        }
    }
    return true;
};

const checkWin = (grid: Grid): boolean =>
    grid.some(row => row.some(cell => cell === WIN_VALUE));

// ─── Sub-components ───────────────────────────────────────────────────────────
const Tile = ({ value }: { value: number | null }) => {
    if (!value) {
        return (
            <div className="rounded-2xl" style={{ background: 'rgba(74,59,50,0.08)', width: '100%', height: '100%' }} />
        );
    }
    const stage = STAGES[value] ?? { name: String(value), emoji: '🌿', bg: '#2d6a4f', text: '#fff' };
    const isGradient = stage.bg.includes('gradient');
    return (
        <motion.div
            key={value}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="rounded-2xl flex flex-col items-center justify-center select-none"
            style={{
                background: isGradient ? stage.bg : stage.bg,
                color: stage.text,
                width: '100%',
                height: '100%',
                boxShadow: value === WIN_VALUE
                    ? '0 0 24px 6px rgba(255,200,0,0.4)'
                    : '0 2px 8px rgba(0,0,0,0.10)',
                border: value === WIN_VALUE ? '3px solid #ffd700' : 'none',
            }}
        >
            <span style={{ fontSize: 'clamp(16px, 4vw, 28px)', lineHeight: 1 }}>{stage.emoji}</span>
            <span className="font-black text-center leading-tight" style={{ fontSize: 'clamp(8px, 1.8vw, 11px)', marginTop: 2, opacity: 0.85, padding: '0 2px' }}>
                {stage.name}
            </span>
        </motion.div>
    );
};

const ArrowButton = ({ dir, onClick }: { dir: Direction; onClick: () => void }) => {
    const icons: Record<Direction, string> = { up: '↑', down: '↓', left: '←', right: '→' };
    return (
        <button
            onClick={onClick}
            className="w-12 h-12 rounded-2xl font-bold text-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: '#4A3b32', color: '#fff', boxShadow: '0 3px 0 rgba(0,0,0,0.25)' }}
        >
            {icons[dir]}
        </button>
    );
};

// ─── Main Game Component ──────────────────────────────────────────────────────
const AsparagusMerge: React.FC = () => {
    const navigate = useNavigate();

    // Get or create a unique ID for this device to track personal bests
    const getUid = () => {
        let uid = localStorage.getItem('user-uid');
        if (!uid) {
            uid = Math.random().toString(36).substring(2, 10);
            localStorage.setItem('user-uid', uid);
        }
        return uid;
    };
    const uid = getUid();
    const bestScoreKey = `asparagus-best-${uid}`;

    const [grid, setGrid] = useState<Grid>(createEmptyGrid);
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(() => Number(localStorage.getItem(bestScoreKey) ?? 0));
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [continueAfterWin, setContinueAfterWin] = useState(false);

    // Touch tracking
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    const startGame = useCallback(() => {
        let g = createEmptyGrid();
        g = addRandomTile(g);
        g = addRandomTile(g);
        setGrid(g);
        setScore(0);
        setGameOver(false);
        setWon(false);
        setContinueAfterWin(false);
    }, []);

    // Sync best score from server
    useEffect(() => {
        const fetchScore = async () => {
            try {
                const res = await fetch(`${BASE_URL}/asparagus/score/${uid}`);
                if (res.ok) {
                    const serverBest = await res.json();
                    setBest((b) => {
                        const highest = Math.max(b, serverBest);
                        localStorage.setItem(bestScoreKey, String(highest));
                        return highest;
                    });
                }
            } catch (err) {
                console.warn('Failed to fetch best score from DB:', err);
            }
        };
        fetchScore();
    }, [uid, bestScoreKey]);

    // Start immediately on mount
    useEffect(() => {
        startGame();
    }, [startGame]);

    const triggerConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#ffd700', '#bef264', '#F43F5E', '#ffffff', '#ffaa00'],
        });
    };

    const move = useCallback((dir: Direction) => {
        if (gameOver || (won && !continueAfterWin)) return;
        setGrid(prev => {
            const result = moveGrid(prev, dir);
            if (!result.moved) return prev;

            const withNew = addRandomTile(result.grid);

            setScore(s => {
                const ns = s + result.score;
                setBest(b => {
                    const nb = Math.max(b, ns);
                    if (nb > b) {
                        localStorage.setItem(bestScoreKey, String(nb));
                        fetch(`${BASE_URL}/asparagus/score`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ uid, bestScore: nb })
                        }).catch(err => console.warn('Failed to save score to DB', err));
                    }
                    return nb;
                });
                return ns;
            });

            const didWin = !continueAfterWin && checkWin(withNew);
            if (didWin) {
                setWon(true);
                setTimeout(triggerConfetti, 200);
            }
            if (!didWin && checkGameOver(withNew)) {
                setGameOver(true);
            }

            return withNew;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameOver, won, continueAfterWin, score]);

    // Keyboard
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const map: Record<string, Direction> = {
                ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
            };
            if (map[e.key]) {
                e.preventDefault();
                move(map[e.key]);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [move]);

    // Touch swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];
        touchStart.current = { x: t.clientX, y: t.clientY };
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStart.current.x;
        const dy = t.clientY - touchStart.current.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (Math.max(absDx, absDy) < 30) return;
        if (absDx > absDy) {
            move(dx > 0 ? 'right' : 'left');
        } else {
            move(dy > 0 ? 'down' : 'up');
        }
        touchStart.current = null;
    };

    return (
        <div
            className="w-full min-h-screen flex flex-col overflow-x-hidden"
            style={{ background: '#FFFDF7', fontFamily: 'inherit' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2 flex-wrap">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/lobby')}
                    className="px-4 py-2 rounded-2xl font-bold text-sm flex items-center gap-1.5 border-2"
                    style={{ background: '#fff', color: '#4A3b32', borderColor: '#bef264', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                >
                    ← Lobby
                </motion.button>

                <div className="flex flex-col items-center">
                    <span className="font-black text-2xl" style={{ color: '#4A3b32' }}>아스파라거스 키우기</span>
                    <span className="text-xs font-bold" style={{ color: '#F43F5E' }}>⚔️ 성검 아스파라거스를 만들어봐!</span>
                </div>

                {/* Score */}
                <div className="flex gap-2">
                    <div className="flex flex-col items-center px-3 py-1 rounded-2xl" style={{ background: '#4A3b32', color: '#fff', minWidth: 56 }}>
                        <span className="text-[10px] font-bold opacity-70">SCORE</span>
                        <span className="font-black text-base leading-tight">{score}</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1 rounded-2xl" style={{ background: '#2d6a4f', color: '#bef264', minWidth: 56 }}>
                        <span className="text-[10px] font-bold opacity-70">BEST</span>
                        <span className="font-black text-base leading-tight">{best}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center pb-4 px-4 w-full gap-4">
                {/* Fixed Tutorial Banner */}
                <TutorialBanner slides={TUTORIAL_SLIDES} />

                <div
                    className="rounded-[28px] p-3 w-full max-w-[min(400px,100vw)] aspect-square"
                    style={{ background: '#4A3b32', boxShadow: '0 8px 30px rgba(74,59,50,0.25)' }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                            gap: 12,
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        {grid.map((row, r) =>
                            row.map((cell, c) => (
                                <div key={`${r}-${c}`} style={{ position: 'relative' }}>
                                    {/* Background empty cell */}
                                    <div className="absolute inset-0 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
                                    {/* Tile */}
                                    <AnimatePresence mode="popLayout">
                                        {cell && (
                                            <div className="absolute inset-0">
                                                <Tile value={cell} />
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Direction buttons */}
                <div className="mt-5 flex flex-col items-center gap-1">
                    <div className="flex gap-1 justify-center">
                        <ArrowButton dir="up" onClick={() => move('up')} />
                    </div>
                    <div className="flex gap-1">
                        <ArrowButton dir="left" onClick={() => move('left')} />
                        <ArrowButton dir="down" onClick={() => move('down')} />
                        <ArrowButton dir="right" onClick={() => move('right')} />
                    </div>
                </div>

                {/* Help + New Game */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={startGame}
                        className="px-4 py-2 rounded-2xl font-black text-sm"
                        style={{ background: '#F43F5E', color: '#fff', boxShadow: '0 3px 0 rgba(0,0,0,0.15)' }}
                    >
                        다시하기
                    </button>
                </div>
            </div>

            {/* Win Modal */}
            <AnimatePresence>
                {won && !continueAfterWin && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.7, opacity: 0 }}
                            className="rounded-3xl p-8 max-w-xs w-full mx-4 flex flex-col items-center gap-4 text-center"
                            style={{ background: 'linear-gradient(135deg,#fffbe6,#fff9c4)', boxShadow: '0 0 40px rgba(255,200,0,0.4)' }}
                        >
                            <div style={{ fontSize: 64 }}>⚔️</div>
                            <h2 className="font-black text-2xl" style={{ color: '#4A3b32' }}>성검 아스파라거스 완성!</h2>
                            <p className="text-sm font-bold" style={{ color: '#b45309' }}>
                                축하해! 전설의 아스파라거스 성검을<br />손에 넣었어! 🎉
                            </p>
                            <p className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background: '#4A3b32', color: '#bef264' }}>
                                SCORE: {score}
                            </p>
                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={() => { setContinueAfterWin(true); }}
                                    className="flex-1 py-2.5 rounded-2xl font-bold text-sm"
                                    style={{ background: '#f3f4f6', color: '#6b7280' }}
                                >
                                    계속하기
                                </button>
                                <button
                                    onClick={startGame}
                                    className="flex-1 py-2.5 rounded-2xl font-black text-sm"
                                    style={{ background: '#F43F5E', color: '#fff' }}
                                >
                                    새 게임
                                </button>
                                <button
                                    onClick={() => navigate('/lobby')}
                                    className="flex-1 py-2.5 rounded-2xl font-black text-sm"
                                    style={{ background: '#4A3b32', color: '#fff' }}
                                >
                                    로비로
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Game Over Modal */}
            <AnimatePresence>
                {gameOver && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.7, opacity: 0 }}
                            className="rounded-3xl p-8 max-w-xs w-full mx-4 flex flex-col items-center gap-4 text-center"
                            style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
                        >
                            <div style={{ fontSize: 56 }}>🥀</div>
                            <h2 className="font-black text-2xl" style={{ color: '#4A3b32' }}>아스파라거스가 시들었어...</h2>
                            <p className="text-sm font-bold" style={{ color: '#9ca3af' }}>더 이상 이동할 수 없어.<br />하지만 다음엔 성검에 도달할 수 있을 거야!</p>
                            <p className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background: '#4A3b32', color: '#bef264' }}>
                                SCORE: {score}
                            </p>
                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={startGame}
                                    className="flex-1 py-2.5 rounded-2xl font-black text-sm"
                                    style={{ background: '#F43F5E', color: '#fff' }}
                                >
                                    다시 하기
                                </button>
                                <button
                                    onClick={() => navigate('/lobby')}
                                    className="flex-1 py-2.5 rounded-2xl font-black text-sm"
                                    style={{ background: '#4A3b32', color: '#fff' }}
                                >
                                    로비로
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AsparagusMerge;
