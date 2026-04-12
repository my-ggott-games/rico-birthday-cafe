const PNG_ASSET = (name: string) => `/assets/codygame/${name}.png`;
const JPG_ASSET = (name: string) => `/assets/codygame/${name}.jpg`;

const CODY_BASE_ASSETS = [
  "/assets/codygame/riko_body_default.png",
  "/assets/codygame/riko_body_smile.png",
  "/assets/codygame/riko_body_wink.png",
];

const CODY_BACKGROUND_ASSETS = [
  "background_1-1",
  "background_1-2",
  "background_1-3",
  "background_2-1",
  "background_2-2",
  "background_2-3",
  "background_3-1",
  "background_3-2",
  "background_3-3",
  "background_4-1",
  "background_4-2",
  "background_4-3",
  "background_5-1",
  "background_5-2",
  "background_5-3",
  "background_6-1",
].map(JPG_ASSET);

const CODY_ITEM_ASSETS = [
  "top_1",
  "skirt_1",
  "dress_1",
  "dress_2",
  "dress_3",
  "dress_4",
  "dress_5",
  "jacket_1",
  "shoes_1",
  "shoes_2",
  "shoes_3",
  "shoes_4",
  "shoes_5",
  "deco_1-1",
  "deco_1-2",
  "deco_2-1",
  "deco_2-2",
  "deco_7-1",
  "deco_3-1",
  "deco_3-2",
  "deco_3-3",
  "deco_4-1",
  "deco_4-2",
  "deco_5-1",
  "deco_6-1",
  "hair_1-1",
  "hair_1-2",
  "hair_1-3",
  "hair_1-4",
  "hair_1-5",
  "hair_1-6",
  "hair_2-1",
  "hair_2-2",
  "hair_2-3",
].map(PNG_ASSET);

const EAGER_CODY_ASSETS = [
  ...CODY_BASE_ASSETS,
  "/assets/codygame/background_1-1.jpg",
  "/assets/codygame/background_2-1.jpg",
  "/assets/codygame/background_3-1.jpg",
];

const ALL_CODY_ASSETS = Array.from(
  new Set([...EAGER_CODY_ASSETS, ...CODY_BACKGROUND_ASSETS, ...CODY_ITEM_ASSETS]),
);

const requestedAssets = new Set<string>();
let hasStarted = false;

const preloadImage = (src: string) => {
  if (requestedAssets.has(src)) return;

  requestedAssets.add(src);

  const image = new Image();
  image.decoding = "async";
  image.src = src;
};

const scheduleIdlePreload = (callback: () => void) => {
  if (typeof window === "undefined") return;

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout: 1500 });
    return;
  }

  globalThis.setTimeout(callback, 250);
};

export const startCodyAssetPreload = () => {
  if (typeof window === "undefined" || hasStarted) return;

  hasStarted = true;
  EAGER_CODY_ASSETS.forEach(preloadImage);
  scheduleIdlePreload(() => {
    ALL_CODY_ASSETS.forEach(preloadImage);
  });
};
