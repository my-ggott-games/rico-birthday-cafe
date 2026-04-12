export const ADVENTURE_PLAYER_TEXTURE_PATHS = {
  default: [
    "/assets/adventuregame/riko-default-frames/frame-0.png",
    "/assets/adventuregame/riko-default-frames/frame-1.png",
    "/assets/adventuregame/riko-default-frames/frame-2.png",
    "/assets/adventuregame/riko-default-frames/frame-3.png",
    "/assets/adventuregame/riko-default-frames/frame-4.png",
    "/assets/adventuregame/riko-default-frames/frame-5.png",
  ],
  shock: [
    "/assets/adventuregame/riko-shock-frames/frame-0.png",
    "/assets/adventuregame/riko-shock-frames/frame-1.png",
    "/assets/adventuregame/riko-shock-frames/frame-2.png",
    "/assets/adventuregame/riko-shock-frames/frame-3.png",
    "/assets/adventuregame/riko-shock-frames/frame-4.png",
    "/assets/adventuregame/riko-shock-frames/frame-5.png",
  ],
  anger: [
    "/assets/adventuregame/riko-anger-frames/frame-0.png",
    "/assets/adventuregame/riko-anger-frames/frame-1.png",
    "/assets/adventuregame/riko-anger-frames/frame-2.png",
    "/assets/adventuregame/riko-anger-frames/frame-3.png",
    "/assets/adventuregame/riko-anger-frames/frame-4.png",
    "/assets/adventuregame/riko-anger-frames/frame-5.png",
  ],
} as const;

export const ADVENTURE_PLAYER_FRAME_PATHS = ADVENTURE_PLAYER_TEXTURE_PATHS.default;

export const ADVENTURE_CAKE_ASSET_PATHS = Array.from(
  { length: 13 },
  (_, index) => `/assets/adventuregame/cake${index}.png`,
);

const ADVENTURE_EAGER_ASSET_PATHS = Array.from(
  new Set([...ADVENTURE_PLAYER_FRAME_PATHS, ...ADVENTURE_CAKE_ASSET_PATHS]),
);

const requestedAdventureAssets = new Set<string>();
let hasStartedAdventureAssetPreload = false;

const preloadAdventureImage = (src: string) => {
  if (typeof window === "undefined" || requestedAdventureAssets.has(src)) return;

  requestedAdventureAssets.add(src);

  const image = new Image();
  image.decoding = "async";
  image.src = src;

  void image.decode().catch(() => undefined);
};

export const startAdventureAssetPreload = () => {
  if (typeof window === "undefined" || hasStartedAdventureAssetPreload) return;

  hasStartedAdventureAssetPreload = true;
  ADVENTURE_EAGER_ASSET_PATHS.forEach(preloadAdventureImage);
};
