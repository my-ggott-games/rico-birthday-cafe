import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    angle: number;
    velocity: number;
    size: number;
    rotation: number;
}

export const CursorManager: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    // Green color variations
    const greenColors = ['#84cc16', '#22c55e', '#10b981', '#06b6d4', '#4ade80', '#059669'];

    useEffect(() => {

        const handleClick = (e: MouseEvent) => {
            const clickX = e.clientX;
            const clickY = e.clientY;

            // Create burst particles
            const newParticles: Particle[] = Array.from({ length: 12 }).map((_, i) => ({
                id: Date.now() + i,
                x: clickX,
                y: clickY,
                color: greenColors[Math.floor(Math.random() * greenColors.length)],
                angle: (Math.PI * 2 * i) / 12 + (Math.random() * 0.5), // Spread around circle
                velocity: 50 + Math.random() * 100, // Speed
                size: 14 + Math.random() * 10,
                rotation: Math.random() * 360,
            }));

            setParticles((prev) => [...prev, ...newParticles]);

            // Cleanup particles after animation
            setTimeout(() => {
                setParticles((prev) => prev.filter(p => !newParticles.find(np => np.id === p.id)));
            }, 1000);
        };
        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[10000]">
            {/* Custom Cursor: Light Green Clover - Disabled to fix Naver Whale bug
            <AnimatePresence>
                {window.innerWidth > 768 && (
                    <motion.div
                        className="fixed top-0 left-0 pointer-events-none z-[10001] flex items-center justify-center"
                        animate={{
                            x: mousePos.x - 20, // Center the cursor (40px / 2 = 20)
                            y: mousePos.y - 20,
                        }}
                        transition={{ type: 'spring', damping: 40, stiffness: 800, mass: 0.3 }}
                    >
                        <div className="text-3xl filter drop-shadow-[0_0_2px_#bef264] drop-shadow-[0_0_5px_#22c55e]">🍀</div>
                    </motion.div>
                )}
            </AnimatePresence>
            */}

            {/* Click Burst Effects: Small Clovers */}
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{
                            x: p.x - p.size / 2,
                            y: p.y - p.size / 2,
                            scale: 1,
                            opacity: 1,
                            rotate: p.rotation
                        }}
                        animate={{
                            x: p.x - p.size / 2 + Math.cos(p.angle) * p.velocity,
                            y: p.y - p.size / 2 + Math.sin(p.angle) * p.velocity,
                            scale: 0.5,
                            opacity: 0,
                            rotate: p.rotation + 180
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="fixed select-none"
                        style={{
                            fontSize: p.size,
                            color: p.color
                        }}
                    >
                        ☘️
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
