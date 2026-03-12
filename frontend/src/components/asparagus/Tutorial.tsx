import React from 'react';
import { TutorialBanner } from '../common/TutorialBanner';
import { TUTORIAL_SLIDES } from './constants';

export const Tutorial: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="w-full max-w-[400px]">
                <TutorialBanner slides={TUTORIAL_SLIDES} className="h-[250px] shadow-xl rounded-3xl" />
            </div>
        </div>
    );
};
