import React, { useRef } from "react";
import { motion } from "framer-motion";

interface PolaroidFrameProps {
    isFlyAway?: boolean;
    activeBackground?: string | null;
    backgroundContent?: React.ReactNode;
    overlayContent?: React.ReactNode;
    children?: React.ReactNode;
    characterOffset?: { x?: number; y?: number };
    polaroidRef?: React.RefObject<HTMLDivElement | null>;
    hideAnimations?: boolean;
    isSquare?: boolean;
    hideShadow?: boolean;
}

export const PolaroidFrame: React.FC<PolaroidFrameProps> = ({
    isFlyAway,
    activeBackground,
    backgroundContent,
    overlayContent,
    children,
    characterOffset,
    polaroidRef,
    hideAnimations,
    isSquare,
    hideShadow,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const isFastReveal = !!activeBackground?.startsWith("linear-gradient");
    const revealDuration = isFastReveal ? 0 : 7.0;
    const revealDelay = isFastReveal ? 0 : 0.5;

    const today = new Date();
    const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}. Yuzuha Riko`;

    return (
        <div className="absolute inset-0 z-40 overflow-y-auto overflow-x-hidden flex p-4 md:p-0">
            <motion.div
                ref={polaroidRef}
                initial={{ opacity: 0, scale: 1, y: 0 }}
                animate={
                    isFlyAway
                        ? {
                            y: (Math.random() - 0.5) * 100, // Small random y wiggle
                            x: window.innerWidth + 500,
                            rotate: 15,
                            scale: 0.8,
                            opacity: 0,
                        }
                        : {
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }
                }
                transition={{
                    duration: isFlyAway ? 2.5 : 0.2, // Fast pop-in
                    delay: 0,
                    ease: isFlyAway ? "easeInOut" : "easeOut",
                }}
                className="relative p-4 pb-16 md:pb-20 max-w-full m-auto md:my-auto shrink-0"
                style={{
                    backgroundColor: "#FFFFF8",
                    borderRadius: "2px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                }}
            >
                <div
                    ref={containerRef}
                    className={`relative w-[300px] md:w-[340px] overflow-hidden ${isSquare ? "h-[300px] md:h-[340px]" : "h-[450px] md:h-[510px]"} ${activeBackground?.startsWith("bg-") ? activeBackground : ""
                        }`}
                    style={{
                        background: activeBackground?.startsWith("linear-gradient")
                            ? activeBackground
                            : undefined,
                        backgroundColor:
                            !activeBackground || activeBackground === "spring-festival"
                                ? "transparent"
                                : undefined,
                        borderRadius: "1px",
                        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
                    }}
                >
                    {/* Background Content */}
                    <motion.div
                        initial={{ opacity: hideAnimations ? 1 : (isFastReveal ? 1 : 0) }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: hideAnimations ? 0 : revealDuration,
                            delay: hideAnimations ? 0 : revealDelay,
                            ease: [0.42, 0, 1, 1],
                        }}
                        className="absolute inset-0 z-0 pointer-events-none"
                    >
                        {backgroundContent}
                    </motion.div>

                    {/* Character and Shadow */}
                    <div
                        className="absolute z-10 pointer-events-none left-0 right-0 flex justify-center"
                        style={{
                            height: "600px",
                            bottom: "2%",
                            transform: `translate(${characterOffset?.x || 0}px, ${characterOffset?.y || 0}px)`,
                        }}
                    >
                        {!hideShadow && (
                            <motion.img
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{
                                    duration: revealDuration,
                                    delay: revealDelay,
                                    ease: [0.42, 0, 1, 1],
                                }}
                                src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%2240%22%20viewBox%3D%220%200%20100%2040%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22shadowG%22%20cx%3D%2250%25%22%20cy%3D%2250%25%22%20r%3D%2250%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22rgba(0%2C0%2C0%2C0.6)%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22rgba(0%2C0%2C0%2C0)%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cellipse%20cx%3D%2250%22%20cy%3D%2220%22%20rx%3D%2250%22%20ry%3D%2220%22%20fill%3D%22url(%23shadowG)%22%2F%3E%3C%2Fsvg%3E"
                                alt="shadow"
                                className="absolute left-1/2 -translate-x-1/2 object-contain mix-blend-multiply"
                                style={{
                                    width: isFastReveal ? "75px" : "64px",
                                    height: isFastReveal ? "50px" : "32px",
                                    bottom: isFastReveal ? "100px" : "80px",
                                }}
                            />
                        )}

                        <motion.div
                            initial={{ opacity: 0, scale: 1, x: 0, y: 0 }}
                            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                            transition={{
                                duration: revealDuration,
                                delay: revealDelay,
                                ease: [0.42, 0, 1, 1],
                            }}
                            className="absolute bottom-0 pointer-events-auto"
                        >
                            {children}
                        </motion.div>
                    </div>

                    {/* This renders using the bounds of containerRef! */}
                    {!hideAnimations && (
                        <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
                            {overlayContent}
                        </div>
                    )}
                </div>

                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                    <span
                        className="font-marker font-bold text-[24px] md:text-[24px] tracking-wider select-none"
                        style={{
                            color: "#111827",
                            fontFamily: "'OneStoreMobilePop', 'Permanent Marker', cursive",
                            fontWeight: 800,
                            transform: "rotate(-2deg)",
                        }}
                    >
                        {formattedDate}
                    </span>
                </div>
            </motion.div>
        </div>
    );
};
