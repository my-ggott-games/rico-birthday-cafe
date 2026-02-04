import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableItemProps {
    id: string;
    imageSrc: string;
    category: string;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({ id, imageSrc, category }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: { category, imageSrc },
    });

    const style: React.CSSProperties | undefined = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.3 : 1,
    } : {
        transition: 'transform 0.3s ease', // Add smooth return animation
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="w-full h-full p-2 cursor-grab active:cursor-grabbing hover:scale-110 transition-all flex items-center justify-center"
        >
            <img src={imageSrc} alt={category} className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-xl" />
        </div>
    );
};
