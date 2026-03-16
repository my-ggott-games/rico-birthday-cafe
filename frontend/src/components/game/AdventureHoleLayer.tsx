import type { RefObject } from "react";
import type { PositionedHole } from "../../types/adventure";

type AdventureHoleLayerProps = {
  holesLayerRef: RefObject<HTMLDivElement | null>;
  visibleHoles: PositionedHole[];
  hudCourseTime: number;
  playerX: number;
  pixelsPerSecond: number;
};

export function AdventureHoleLayer({
  holesLayerRef,
  visibleHoles,
  hudCourseTime,
  playerX,
  pixelsPerSecond,
}: AdventureHoleLayerProps) {
  return (
    <div
      ref={holesLayerRef}
      className="absolute inset-0 pointer-events-none will-change-transform"
    >
      {visibleHoles.map((hole) => {
        const isPast =
          hole.baseLeft + hole.width <
          playerX - 18 + hudCourseTime * pixelsPerSecond;

        return (
          <div
            key={hole.key}
            className="absolute overflow-visible"
            style={{
              left: `${hole.baseLeft}px`,
              width: `${hole.width}px`,
              top: "90%",
              height: `${hole.visualHeight}px`,
              backgroundColor: "transparent",
              opacity: isPast ? 0.45 : 1,
              boxShadow: "0 0 0 1px rgba(248, 113, 113, 0.85)",
            }}
          >
            <div
              className="absolute inset-y-[6px] left-[6px] right-[6px]"
              style={{
                backgroundColor: "transparent",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
