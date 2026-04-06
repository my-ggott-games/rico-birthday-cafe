export const CODY_CHARACTER_CANVAS = {
  width: 384,
  height: 700,
} as const;

const MOBILE_CHARACTER_SCALE = 1.1;
const MOBILE_MANNEQUIN_SCALE = 0.92;
const DESKTOP_CHARACTER_SCALE = 1.1;
const WIDE_DESKTOP_CHARACTER_SCALE = 1.3;
const MOBILE_MANNEQUIN_STAGE_HEIGHT = "500px";
const MOBILE_POLAROID_STAGE_HEIGHT = "500px";

type CodyStageLayoutParams = {
  isMobile: boolean;
  windowWidth: number;
};

type PolaroidOffsetParams = {
  activeBackground: string | null;
  isFinished: boolean;
  isMobile: boolean;
};

export const getCodyCharacterScale = ({
  isMobile,
  windowWidth,
}: CodyStageLayoutParams) =>
  isMobile
    ? MOBILE_CHARACTER_SCALE
    : windowWidth > 1440
      ? WIDE_DESKTOP_CHARACTER_SCALE
      : DESKTOP_CHARACTER_SCALE;

export const getCodyMannequinScale = (params: CodyStageLayoutParams) =>
  params.isMobile ? MOBILE_MANNEQUIN_SCALE : getCodyCharacterScale(params);

export const getCodyDisplayStageHeight = ({
  isMobile,
  isFinished,
}: {
  isMobile: boolean;
  isFinished: boolean;
}) => {
  if (!isMobile) {
    return undefined;
  }

  return isFinished
    ? MOBILE_POLAROID_STAGE_HEIGHT
    : MOBILE_MANNEQUIN_STAGE_HEIGHT;
};

export const getCodyPolaroidCharacterStageClassName = (
  activeBackground: string | null,
) =>
  activeBackground?.startsWith("linear-gradient")
    ? "h-[420px] md:h-[470px]"
    : "h-[600px] md:h-[640px]";

export const getCodyPolaroidCharacterOffset = ({
  activeBackground,
  isFinished,
  isMobile,
}: PolaroidOffsetParams) => {
  const isValidComboResult =
    isFinished &&
    !!activeBackground &&
    !activeBackground.startsWith("linear-gradient");
  const mobileOffsetY = !isMobile ? 0 : isValidComboResult ? -75 : 0;

  if (activeBackground?.startsWith("linear-gradient")) {
    return { x: 0, y: 72 + mobileOffsetY };
  }

  switch (activeBackground) {
    case "spring":
      return { x: -2, y: 470 + mobileOffsetY };
    case "oriental":
      return { x: -4, y: 488 + mobileOffsetY };
    case "rain":
      return { x: -6, y: 492 + mobileOffsetY };
    case "beer":
      return { x: 6, y: 482 + mobileOffsetY };
    case "knight":
      return { x: 4, y: 486 + mobileOffsetY };
    default:
      return { x: 0, y: 485 + mobileOffsetY };
  }
};
