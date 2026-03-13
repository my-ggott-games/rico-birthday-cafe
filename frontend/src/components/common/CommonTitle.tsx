import React from 'react';

interface CommonTitleProps {
    title: string;
    subtitle?: string;
    /** Optional slot — e.g. a mobile help toggle button rendered beside the title */
    helpSlot?: React.ReactNode;
}

/**
 * Reusable game title block.
 * Renders the title in the brand teal (#166D77), an optional subtitle, and
 * an optional helpSlot element displayed inline with the title (used for the
 * mobile "?" help-toggle button).
 */
export const CommonTitle: React.FC<CommonTitleProps> = ({ title, subtitle, helpSlot }) => {
    return (
        <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
                <span className="font-black text-3xl lg:text-4xl" style={{ color: '#166D77' }}>
                    {title}
                </span>
                {helpSlot && <span className="lg:hidden">{helpSlot}</span>}
            </div>
            {subtitle && (
                <span className="text-xs lg:text-sm font-bold" style={{ color: '#5EC7A5' }}>
                    {subtitle}
                </span>
            )}
        </div>
    );
};
