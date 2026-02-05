import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableItemProps {
    id: string;
    imageSrc: string;
    category: string;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({ id, imageSrc, category }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: id,
        data: { category, imageSrc },
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
            className="w-full h-full p-2 cursor-grab active:cursor-grabbing transition-all flex items-center justify-center"
        >
            <img src={imageSrc} alt={category} className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-xl" />
        </div>
    );
};
