import { useSyncExternalStore } from "react";
import {
  isAssetLoaded,
  subscribeAssetProgress,
} from "../utils/assetPreloadQueue";

// True once the preload queue has fetched this asset.
export const useIsAssetLoaded = (key: string) =>
  useSyncExternalStore(subscribeAssetProgress, () => isAssetLoaded(key));
