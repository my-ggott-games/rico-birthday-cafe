const WEBP_ASSET = (name: string) => `/assets/codygame/${name}.webp`;

const CODY_BASE_ASSETS = [
  "/assets/codygame/riko_body_default.webp",
  "/assets/codygame/riko_body_smile.webp",
  "/assets/codygame/riko_body_wink.webp",
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
].map(WEBP_ASSET);

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
].map(WEBP_ASSET);

export const CODY_EAGER_ASSETS = [
  ...CODY_BASE_ASSETS,
  "/assets/codygame/background_1-1.webp",
  "/assets/codygame/background_2-1.webp",
  "/assets/codygame/background_3-1.webp",
];

export const CODY_ALL_ASSETS = Array.from(
  new Set([...CODY_EAGER_ASSETS, ...CODY_BACKGROUND_ASSETS, ...CODY_ITEM_ASSETS]),
);
