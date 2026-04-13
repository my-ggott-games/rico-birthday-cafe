type DataLayerWindow = Window & {
  dataLayer?: Record<string, unknown>[];
};

type EventParams = {
  page_location?: string;
  page_title?: string;
  timestamp?: string;
  game_name?: string;
  stage?: number;
  score?: number;
  [key: string]: unknown;
};

const PAGE_TITLES: Record<string, string> = {
  "/": "Landing",
  "/lobby": "Lobby",
  "/game/cody": "Cody Game",
  "/game/adventure": "Adventure Game",
  "/game/puzzle": "Puzzle Game",
  "/game/asparagus": "Asparagus Merge",
  "/credits": "Credits",
  "/sample/landing-compare": "Landing Compare Sample",
  "/sample/cody": "Cody Sample",
  "/sample/adventure": "Adventure Sample",
  "/sample/puzzle": "Puzzle Sandbox",
  "/sample/hologram": "Hologram Playground",
  "/sample/asparagus": "Asparagus Showcase",
};

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? document.title;
}

function pushEvent(event: string, params: EventParams = {}) {
  const w = window as DataLayerWindow;
  if (!w.dataLayer) return;

  const pathname = window.location.pathname;
  w.dataLayer.push({
    event,
    page_location: window.location.href,
    page_title: getPageTitle(pathname),
    path_name: pathname,
    timestamp: new Date().toISOString(),
    ...params,
  });
}

export { pushEvent };
