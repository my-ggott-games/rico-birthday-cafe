import React from 'react';
import { ReturnButton } from './ReturnButton';
import { CommonTitle } from './CommonTitle';
import { GameHelp } from './GameHelp';
import type { TutorialSlide } from './TutorialBanner';

interface GameContainerProps {
  title: string;
  desc?: string;
  gameName?: string;
  helpSlides: TutorialSlide[];
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  mainClassName?: string;
  desktopHelpClassName?: string;
  showDesktopHelp?: boolean;
  headerHidden?: boolean;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  title,
  desc,
  gameName = '로비',
  helpSlides,
  children,
  headerRight,
  className = '',
  mainClassName = '',
  desktopHelpClassName = '',
  showDesktopHelp = true,
  headerHidden = false,
}) => {
  const hiddenClass = headerHidden ? 'opacity-0 pointer-events-none' : 'opacity-100';

  return (
    <div className={`w-full min-h-[100dvh] flex flex-col overflow-x-hidden ${className}`}>
      <div className={`fixed top-4 left-4 z-40 lg:hidden transition-opacity duration-500 ${hiddenClass}`}>
        <ReturnButton
          gameName={gameName}
          label="Go to Lobby"
          className="px-3 py-2 rounded-2xl font-bold text-sm flex items-center gap-1 border-2 whitespace-nowrap bg-pale-custard text-[#166D77] border-[#bef264] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 items-center px-4 sm:px-8 pt-10 pb-6 gap-4">
        <div className={`hidden lg:flex justify-start order-1 transition-opacity duration-500 ${hiddenClass}`}>
          <ReturnButton
            gameName={gameName}
            label="Go to Lobby"
            className="px-4 py-2 rounded-2xl font-bold text-sm flex items-center gap-1.5 border-2 whitespace-nowrap"
            style={{ background: '#FFFFF8', color: '#166D77', borderColor: '#bef264', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          />
        </div>

        <div className={`flex flex-col items-center text-center order-1 lg:order-2 pt-8 lg:pt-0 transition-opacity duration-500 ${hiddenClass}`}>
          <CommonTitle
            title={title}
            subtitle={desc}
            helpSlot={<GameHelp slides={helpSlides} mobileOnly />}
          />
        </div>

        <div className="flex justify-center lg:justify-end gap-3 order-2 lg:order-3">
          {headerRight}
        </div>
      </div>

      {showDesktopHelp && (
        <div className={`hidden lg:flex w-full justify-center px-8 pb-4 ${desktopHelpClassName}`}>
          <div className="w-full max-w-[420px]">
            <GameHelp slides={helpSlides} desktopOnly />
          </div>
        </div>
      )}

      <main className={`flex-1 ${mainClassName}`}>
        {children}
      </main>
    </div>
  );
};
