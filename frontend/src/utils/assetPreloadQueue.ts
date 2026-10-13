import {
  ADVENTURE_EAGER_ASSET_PATHS,
  ADVENTURE_PLAYER_TEXTURE_PATHS,
} from "../features/adventure/adventureAssets";
import {
  PUZZLE_DETAIL_IMAGE_URL,
  PUZZLE_GAMEPLAY_IMAGE_URL,
} from "../constants/puzzle";
import { CODY_ALL_ASSETS, CODY_EAGER_ASSETS } from "./codyAssets";

export type AssetGroupId = "lobby" | "cody" | "puzzle" | "asparagus" | "adventure";

type AssetGroup = {
  path: string;
  chunks: (() => Promise<unknown>)[];
  // Needed for the first screen; the loading screen waits for these.
  eager: string[];
  // Fetched after every group's eager assets, or right away once prioritized.
  rest: string[];
};

const ASSET_GROUPS: Record<AssetGroupId, AssetGroup> = {
  lobby: {
    path: "/lobby",
    // Loading screen first: it covers the lobby while the rest arrives.
    chunks: [
      () => import("../components/common/GlobalLoading"),
      () => import("../pages/Lobby"),
    ],
    eager: [
      "/pages/lobby/background-thumb.jpg",
      "/pages/lobby/background-mid.webp",
      "/pages/lobby/chiko/atlas.webp",
      "/pages/lobby/decor/ezipia.png",
      "/slogan/happybirthday.jpg",
      "/pages/lobby/background-full-2560.webp",
    ],
    rest: [],
  },
  cody: {
    path: "/game/cody",
    chunks: [() => import("../pages/CodyGame")],
    eager: CODY_EAGER_ASSETS,
    rest: CODY_ALL_ASSETS.filter((src) => !CODY_EAGER_ASSETS.includes(src)),
  },
  puzzle: {
    path: "/game/puzzle",
    chunks: [() => import("../pages/PuzzleGame")],
    eager: [PUZZLE_GAMEPLAY_IMAGE_URL],
    rest: [PUZZLE_DETAIL_IMAGE_URL],
  },
  asparagus: {
    path: "/game/asparagus",
    chunks: [() => import("../pages/AsparagusMerge")],
    eager: [],
    rest: [],
  },
  adventure: {
    path: "/game/adventure",
    chunks: [() => import("../pages/AdventureGame")],
    eager: ADVENTURE_EAGER_ASSET_PATHS,
    rest: [
      ...ADVENTURE_PLAYER_TEXTURE_PATHS.shock,
      ...ADVENTURE_PLAYER_TEXTURE_PATHS.anger,
    ],
  },
};

// Background prefetch order from the lobby. Reorder by game popularity.
const BACKGROUND_GAME_ORDER: AssetGroupId[] = [
  "cody",
  "puzzle",
  "asparagus",
  "adventure",
];

const MAX_CONCURRENT_JOBS = 2;

type Job = {
  key: string;
  group: AssetGroupId;
  tier: "eager" | "rest";
  urgent: boolean;
  run: (urgent: boolean) => Promise<unknown>;
};

const pending: Job[] = [];
const queuedKeys = new Set<string>();
const finishedKeys = new Set<string>();
let runningJobs = 0;

const loadImage = (src: string, urgent: boolean) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = urgent ? "high" : "low";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });

const groupJobs = (id: AssetGroupId, tier: Job["tier"]): Job[] => {
  const group = ASSET_GROUPS[id];
  const images = tier === "eager" ? group.eager : group.rest;
  const chunkJobs: Job[] =
    tier === "eager"
      ? group.chunks.map((load, index) => ({
          key: `${id}:chunk:${index}`,
          group: id,
          tier,
          urgent: false,
          run: load,
        }))
      : [];

  return [
    ...chunkJobs,
    ...images.map((src) => ({
      key: src,
      group: id,
      tier,
      urgent: false,
      run: (urgent: boolean) => loadImage(src, urgent),
    })),
  ];
};

const pump = () => {
  while (runningJobs < MAX_CONCURRENT_JOBS && pending.length > 0) {
    const job = pending.shift()!;
    runningJobs += 1;
    job
      .run(job.urgent)
      .catch(() => undefined)
      .finally(() => {
        runningJobs -= 1;
        finishedKeys.add(job.key);
        pump();
      });
  }
};

const enqueue = (jobs: Job[], position: "front" | "back") => {
  const fresh = jobs.filter(
    (job) => !queuedKeys.has(job.key) && !finishedKeys.has(job.key),
  );
  fresh.forEach((job) => queuedKeys.add(job.key));

  if (position === "back") {
    pending.push(...fresh);
  } else {
    const keys = new Set(jobs.map((job) => job.key));
    const moved = pending.filter((job) => keys.has(job.key));
    const others = pending.filter((job) => !keys.has(job.key));
    const front = [...fresh, ...moved].sort(
      (a, b) =>
        jobs.findIndex((job) => job.key === a.key) -
        jobs.findIndex((job) => job.key === b.key),
    );
    front.forEach((job) => {
      job.urgent = true;
    });
    pending.splice(0, pending.length, ...front, ...others);
  }

  pump();
};

// Queue a group's first-screen assets behind everything already waiting.
export const enqueueAssetGroup = (id: AssetGroupId) => {
  enqueue(groupJobs(id, "eager"), "back");
};

// Move a group to the front: first-screen assets, then the rest of the group.
export const prioritizeAssetGroup = (id: AssetGroupId) => {
  enqueue([...groupJobs(id, "eager"), ...groupJobs(id, "rest")], "front");
};

// After the lobby is up: game code and first screens in popularity order, then
// every game's remaining assets.
export const startBackgroundGamePreload = () => {
  BACKGROUND_GAME_ORDER.forEach(enqueueAssetGroup);
  enqueue(
    BACKGROUND_GAME_ORDER.flatMap((id) => groupJobs(id, "rest")),
    "back",
  );
};

export const getAssetGroupForPath = (pathname: string) =>
  (Object.keys(ASSET_GROUPS) as AssetGroupId[]).find(
    (id) => ASSET_GROUPS[id].path === pathname,
  ) ?? null;

const eagerKeysByGroup = new Map<AssetGroupId, string[]>();

// Read every animation frame by the loading screen, so keys are cached.
export const getAssetGroupProgress = (id: AssetGroupId) => {
  let keys = eagerKeysByGroup.get(id);
  if (!keys) {
    keys = groupJobs(id, "eager").map((job) => job.key);
    eagerKeysByGroup.set(id, keys);
  }
  const loaded = keys.filter((key) => finishedKeys.has(key)).length;
  return { loaded, total: keys.length };
};
