import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pushEvent } from "../utils/analytics";

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    pushEvent("page_view", { page_path: location.pathname });
  }, [location.pathname]);
}

export function useViewEvent(
  eventName: "view_home" | "view_game",
  params: Record<string, unknown> = {},
) {
  useEffect(() => {
    pushEvent(eventName, params);
    // intentionally runs only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
