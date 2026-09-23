import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import type { LobbyNoteKey } from "../lobbyNotes";
import { ChikoActor, type ChikoArea, type ChikoPosition } from "./ChikoActor";
import { LOBBY_CHIKO_GAMES, type LobbyChikoGame } from "./chikoConfig";

const DESKTOP_FIXED_POSITIONS: ChikoPosition[] = LOBBY_CHIKO_GAMES.map(
  (_, index) => ({
    rx: (index + 0.5) / LOBBY_CHIKO_GAMES.length,
    ry: 0.75,
  }),
);

const MOBILE_FIXED_POSITIONS: ChikoPosition[] = LOBBY_CHIKO_GAMES.map(
  (_, index) => ({
    rx: index % 2 === 0 ? 0.2 : 0.8,
    ry: index < 2 ? 0.35 : 0.95,
  }),
);

const getRootFontSize = () =>
  parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

type ChikoPlaygroundProps = {
  isMobile: boolean;
  isReducedMotion: boolean;
  noteVisible: boolean;
  onOpenNote: (key: LobbyNoteKey) => void;
};

export const ChikoPlayground: React.FC<ChikoPlaygroundProps> = ({
  isMobile,
  isReducedMotion,
  noteVisible,
  onOpenNote,
}) => {
  const navigate = useNavigate();
  const areaRef = useRef<HTMLDivElement>(null);
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });
  const [isCoarsePointer] = useState(
    () => window.matchMedia("(pointer: coarse)").matches,
  );
  const [selectedId, setSelectedId] = useState<LobbyNoteKey | null>(null);
  const [selectionMotionMode, setSelectionMotionMode] =
    useState(isReducedMotion);
  if (selectionMotionMode !== isReducedMotion) {
    setSelectionMotionMode(isReducedMotion);
    setSelectedId(null);
  }
  const [initialPositions] = useState<ChikoPosition[]>(() =>
    LOBBY_CHIKO_GAMES.map(() => ({ rx: Math.random(), ry: Math.random() })),
  );

  useLayoutEffect(() => {
    const element = areaRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setAreaSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  const area = useMemo<ChikoArea>(
    () => ({
      ...areaSize,
      spriteHeight: (isMobile ? 5 : 7) * getRootFontSize(),
    }),
    [areaSize, isMobile],
  );

  const getAreaRect = useCallback(
    () => areaRef.current?.getBoundingClientRect() ?? null,
    [],
  );

  const handleEnter = useCallback(
    (game: LobbyChikoGame) => navigate(game.to),
    [navigate],
  );

  const fixedPositions = isMobile
    ? MOBILE_FIXED_POSITIONS
    : DESKTOP_FIXED_POSITIONS;

  return (
    <div
      className={`relative flex-1 ${isMobile ? "mt-2 min-h-[18rem]" : "mt-6 min-h-[22rem]"}`}
    >
      <div
        ref={areaRef}
        className={`absolute inset-x-0 top-0 ${isMobile ? "bottom-10" : "bottom-8"}`}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            setSelectedId(null);
          }
        }}
      >
        {LOBBY_CHIKO_GAMES.map((game, index) => (
          <ChikoActor
            key={game.id}
            game={game}
            area={area}
            initialPosition={initialPositions[index]}
            fixedPosition={fixedPositions[index]}
            isReducedMotion={isReducedMotion}
            isCoarsePointer={isCoarsePointer}
            isMobile={isMobile}
            isSelected={selectedId === game.id}
            noteVisible={noteVisible}
            getAreaRect={getAreaRect}
            onSelect={setSelectedId}
            onEnter={handleEnter}
            onOpenNote={onOpenNote}
          />
        ))}
      </div>
    </div>
  );
};
