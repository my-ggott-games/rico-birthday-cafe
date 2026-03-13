import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Board } from '../components/asparagus/Board';
import { Items } from '../components/asparagus/Items';
import { GameHelp } from '../components/common/GameHelp';
import { GameContainer } from '../components/common/GameContainer';
import { useAsparagusGame } from '../hooks/useAsparagusGame';
import { type Direction } from '../components/asparagus/types';
import { TUTORIAL_SLIDES } from '../components/asparagus/constants';

const AsparagusMerge: React.FC = () => {
    const {
        grid,
        score,
        best,
        won,
        gameOver,
        continueAfterWin,
        history,
        undoCount,
        swapCount,
        isSwapMode,
        selection,
        startGame,
        handleUndo,
        handleTileClick,
        move,
        setContinueAfterWin,
        setIsSwapMode,
        setSelection,
        touchStart
    } = useAsparagusGame();

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

    // Touch swipe — handlers for Board area only
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
        <GameContainer
            title="아스파라거스 키우기"
            desc="아스파라거스도 리코도 건강만 해다오"
            gameName="아스파라거스 키우기"
            helpSlides={TUTORIAL_SLIDES}
            className="select-none"
            showDesktopHelp={false}
            headerRight={
                <>
                    <div className="flex flex-col items-center px-4 py-2 rounded-2xl" style={{ background: '#166D77', color: '#FFFFF8', minWidth: '85px' }}>
                        <span className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">Score</span>
                        <span className="font-black text-xl leading-tight">{score}</span>
                    </div>
                    <div className="flex flex-col items-center px-4 py-2 rounded-2xl" style={{ background: '#2d6a4f', color: '#bef264', minWidth: '85px' }}>
                        <span className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">Best</span>
                        <span className="font-black text-xl leading-tight">{best}</span>
                    </div>
                </>
            }
        >
            {/* ─── Main Content: Horizontal 3 DIV ─── */}
            <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-3 px-10 pb-12 gap-8">

                {/* [Left] Tutorial: Desktop only (hidden on mobile — modal replaces it) */}
                <div className="hidden lg:flex flex-col items-center justify-start lg:pt-10">
                    <div className="w-full max-w-[420px] flex flex-col items-center">
                        <GameHelp slides={TUTORIAL_SLIDES} desktopOnly />
                    </div>
                </div>

                {/* [Center] Board: swipe only on the board element */}
                <div className="flex flex-col items-center justify-start lg:pt-10">
                    <Board
                        grid={grid}
                        selection={selection}
                        isSwapMode={isSwapMode}
                        onTileClick={handleTileClick}
                        onMove={move}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    />
                </div>

                {/* [Right] Items */}
                <div className="flex flex-col items-center justify-start lg:pt-10">
                    <div className="flex flex-col items-center gap-2 w-full">
                        <Items
                            undoCount={undoCount}
                            swapCount={swapCount}
                            historyLength={history.length}
                            isSwapMode={isSwapMode}
                            onUndo={handleUndo}
                            onToggleSwapMode={() => {
                                setIsSwapMode(!isSwapMode);
                                setSelection(null);
                            }}
                            onRestart={startGame}
                        />
                    </div>
                </div>
            </div>

            {/* Win/Game Over Modals */}
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
                            <h2 className="font-black text-2xl" style={{ color: '#166D77' }}>성검 완성!</h2>
                            <p className="text-sm font-bold" style={{ color: '#b45309' }}>축하합니다!<br />성검을 획득하셨습니다! 🎉</p>
                            <p className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background: '#166D77', color: '#bef264' }}>최종 점수: {score}</p>
                            <div className="flex flex-col gap-2 w-full">
                                <button onClick={() => setContinueAfterWin(true)} className="w-full py-2.5 rounded-2xl font-bold text-sm bg-gray-100 text-gray-500">계속하기</button>
                                <button onClick={startGame} className="w-full py-2.5 rounded-2xl font-black text-sm bg-[#5EC7A5] text-white">새 게임</button>
                                <button onClick={() => window.location.href='/lobby'} className="w-full py-2.5 rounded-2xl font-black text-sm bg-[#166D77] text-white">로비로 이동</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {gameOver && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.7, opacity: 0 }}
                            className="rounded-3xl p-8 max-w-xs w-full mx-4 flex flex-col items-center gap-4 text-center"
                            style={{ background: '#FFFFF8', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
                        >
                            <div style={{ fontSize: 56 }}>🥀</div>
                            <h2 className="font-black text-2xl" style={{ color: '#166D77' }}>아스파라거스가 시들었습니다...</h2>
                            <p className="text-sm font-bold" style={{ color: '#9ca3af' }}>다시 도전해서 성검을 완성해보세요!</p>
                            <p className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background: '#166D77', color: '#bef264' }}>최종 점수: {score}</p>
                            <div className="flex gap-2 w-full mt-2">
                                <button onClick={startGame} className="flex-1 py-3 rounded-2xl font-black text-sm bg-[#5EC7A5] text-white">재도전</button>
                                <button onClick={() => window.location.href='/lobby'} className="flex-1 py-3 rounded-2xl font-black text-sm bg-[#166D77] text-white">로비</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </GameContainer>
    );
};

export default AsparagusMerge;
