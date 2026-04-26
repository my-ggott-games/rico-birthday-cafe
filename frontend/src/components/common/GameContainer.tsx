import React from "react";
import { ReturnButton } from "./ReturnButton";
import { CommonTitle } from "./CommonTitle";
import { GameHelp } from "./GameHelp";
import type { TutorialSlide } from "./TutorialBanner";

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
  returnButtonVariant?: "mint" | "cream";
  /** localStorage key used by GameHelp to auto-open on first visit */
  autoShowHelpKey?: string;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  title,
  desc,
  gameName = "로비",
  helpSlides,
  children,
  headerRight,
  className = "",
  mainClassName = "",
  desktopHelpClassName: _desktopHelpClassName = "",
  showDesktopHelp: _showDesktopHelp = true,
  headerHidden = false,
  returnButtonVariant = "mint",
  autoShowHelpKey,
}) => {
  const hiddenClass = headerHidden
    ? "opacity-0 pointer-events-none"
    : "opacity-100";
  const preventTextDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  const containerLayoutVars = {
    "--container-gutter": "clamp(1rem, 5vw, 3rem)",
    "--header-top-padding": "clamp(0.35rem, 2vh, 1.25rem)",
    "--header-bottom-padding": "clamp(0.25rem, 1.2vh, 0.75rem)",
    "--header-gap": "clamp(0.5rem, 1.5vw, 1rem)",
  } as React.CSSProperties;

  return (
    <div
      className={`w-full min-h-screen min-h-[100svh] flex flex-col overflow-x-hidden ${className}`}
      style={containerLayoutVars}
    >
      <div
        className="relative flex min-h-[3.9rem] items-center justify-center select-none lg:min-h-[5.25rem]"
        draggable={false}
        onDragStart={preventTextDrag}
        style={{
          paddingInline: "var(--container-gutter)",
          paddingTop: "var(--header-top-padding)",
          paddingBottom: "var(--header-bottom-padding)",
          gap: "var(--header-gap)",
        }}
      >
        <div
          className={`absolute left-[var(--container-gutter)] top-1/2 z-[1] flex -translate-y-1/2 items-center transition-opacity duration-500 ${hiddenClass}`}
        >
          <ReturnButton
            gameName={gameName}
            variant={returnButtonVariant}
            className="h-10 w-10 px-0 py-0 text-xs lg:h-auto lg:w-auto lg:min-w-[9.5rem] lg:px-6 lg:py-3 lg:text-base"
          />
        </div>

        <div
          className={`flex min-w-0 max-w-full flex-col items-center px-[5.5rem] text-center transition-opacity duration-500 lg:px-[10rem] ${hiddenClass}`}
        >
          <CommonTitle
            title={title}
            subtitle={desc}
            helpSlot={
              <GameHelp
                slides={helpSlides}
                autoShowHelpKey={autoShowHelpKey}
              />
            }
          />
        </div>

        <div className="absolute right-[var(--container-gutter)] top-1/2 flex -translate-y-1/2 items-center justify-end gap-3">
          {headerRight}
        </div>
      </div>

      <main className={`flex-1 ${mainClassName}`}>{children}</main>
    </div>
  );
};
