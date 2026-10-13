import { useEffect, useState } from "react";
import { peekActivityBgm, rerollActivityBgm } from "../utils/bgm";

// Random activity track for this visit of the page; matches what the preload
// queue fetched for it.
export const useActivityBgm = () => {
  const [src] = useState(peekActivityBgm);

  useEffect(() => rerollActivityBgm, []);

  return src;
};
