import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableItemProps {
    id: string;
    category: 'hair' | 'clothes' | 'hair_acc' | 'clothes_acc' | 'hand_acc' | 'accessories';
    layers: {
        front?: string;
        back?: string;
        main?: string;
    };
    className?: string; // Add optional className
}

export const DraggableItem: React.FC<DraggableItemProps> = ({ id, category, layers, className }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: id,
        data: { category, layers },
    });

    const style: React.CSSProperties = {
        // We use DragOverlay for the visual, so we hide the original item while dragging.
        // We do NOT apply transform here to avoid horizontal scroll expansion within the container.
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={className || "w-full h-full p-2 cursor-grab active:cursor-grabbing transition-all flex items-center justify-center relative"}
        >
            {/* Render Back Layer */}
            {layers.back && (
                <img src={layers.back} alt={`${category}-back`} className={`absolute inset-0 w-full h-full object-contain pointer-events-none`} style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }} />
            )}

            {/* Render Main Layer */}
            {layers.main && (
                <img src={layers.main} alt={`${category}-main`} className={`absolute inset-0 w-full h-full object-contain pointer-events-none`} style={{ filter: !className ? 'drop-shadow(0 20px 13px rgba(0,0,0,0.03)) drop-shadow(0 8px 5px rgba(0,0,0,0.08))' : undefined }} />
            )}

            {/* Render Front Layer */}
            {layers.front && (
                <img src={layers.front} alt={`${category}-front`} className={`absolute inset-0 w-full h-full object-contain pointer-events-none`} style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }} />
            )}
        </div>
    );
};
