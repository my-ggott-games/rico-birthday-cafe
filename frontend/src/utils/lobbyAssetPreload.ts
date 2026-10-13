const LOBBY_PRELOAD_ASSETS = [
  "/pages/lobby/background-thumb.jpg",
  "/pages/lobby/background-mid.webp",
  "/pages/lobby/chiko/atlas.webp",
  "/pages/lobby/decor/ezipia.png",
  "/slogan/happybirthday.jpg",
];

let hasStarted = false;

export const startLobbyAssetPreload = () => {
  if (typeof window === "undefined" || hasStarted) return;

  hasStarted = true;
  LOBBY_PRELOAD_ASSETS.forEach((src) => {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
  });
};
