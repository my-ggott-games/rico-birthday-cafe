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
}) => {
  const hiddenClass = headerHidden
    ? "opacity-0 pointer-events-none"
    : "opacity-100";
  const preventTextDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  const containerLayoutVars = {
    "--container-gutter": "clamp(1rem, 5vw, 3rem)",
    "--header-top-padding": "clamp(1rem, 8vh, 3rem)",
    "--header-bottom-padding": "clamp(0.875rem, 3vh, 1.5rem)",
    "--header-gap": "clamp(0.75rem, 2vw, 1.25rem)",
  } as React.CSSProperties;

  return (
    <div
      className={`w-full min-h-[100dvh] flex flex-col overflow-x-hidden ${className}`}
      style={containerLayoutVars}
    >
      <div
        className={`fixed z-40 select-none lg:hidden transition-opacity duration-500 ${hiddenClass}`}
        draggable={false}
        onDragStart={preventTextDrag}
        style={{
          top: "var(--container-gutter)",
          left: "var(--container-gutter)",
        }}
      >
        <ReturnButton
          gameName={gameName}
          label="돌아가기"
        />
      </div>

      <div
        className="grid grid-cols-1 items-center select-none lg:grid-cols-3"
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
          className={`hidden lg:flex justify-start order-1 transition-opacity duration-500 ${hiddenClass}`}
        >
          <ReturnButton
            gameName={gameName}
            label="돌아가기"
          />
        </div>

        <div
          className={`flex flex-col items-center text-center order-1 lg:order-2 transition-opacity duration-500 ${hiddenClass}`}
        >
          <CommonTitle
            title={title}
            subtitle={desc}
            helpSlot={<GameHelp slides={helpSlides} />}
          />
        </div>

        <div className="flex justify-center lg:justify-end gap-3 order-2 lg:order-3">
          {headerRight}
        </div>
      </div>

      <main className={`flex-1 ${mainClassName}`}>{children}</main>
    </div>
  );
};
