import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import { usePageTracking } from "./hooks/usePageTracking";

import { AdminOnlyRoute } from "./components/auth/AdminOnlyRoute";
import { useAuthStore } from "./store/useAuthStore";

const Lobby = lazy(() => import("./pages/Lobby"));
const CodyGame = lazy(() => import("./pages/CodyGame"));
const AdventureGame = lazy(() => import("./pages/AdventureGame"));
const CodySample = lazy(() => import("./pages/CodySample"));
const PuzzleGame = lazy(() => import("./pages/PuzzleGame"));
const PuzzleSandbox = lazy(() => import("./pages/PuzzleSandbox"));
const HologramPlayground = lazy(() => import("./pages/HologramPlayground"));
const PuzzleHoloSample = lazy(() => import("./pages/PuzzleHoloSample"));
const AsparagusMerge = lazy(() => import("./pages/AsparagusMerge"));
const AsparagusShowcase = lazy(() => import("./pages/AsparagusShowcase"));
const Credits = lazy(() => import("./pages/Credits"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LandingCompareSample = lazy(() => import("./pages/LandingCompareSample"));

const CursorManager = lazy(() =>
  import("./components/game/CursorManager").then((m) => ({
    default: m.CursorManager,
  })),
);
const GlobalLoading = lazy(() => import("./components/common/GlobalLoading"));
const AchievementToast = lazy(() => import("./components/common/AchievementToast").then(m => ({ default: m.AchievementToast })));
const GlobalAudioToggle = lazy(() => import("./components/common/GlobalAudioToggle").then(m => ({ default: m.GlobalAudioToggle })));

function PageTracker() {
  usePageTracking();
  return null;
}

function DeferredCursorManager() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) {
      return;
    }

    let timeoutId: number | null = null;

    const enable = () => {
      setShouldRender(true);
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
    };

    window.addEventListener("pointerdown", enable, { once: true });
    window.addEventListener("keydown", enable, { once: true });

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(enable, { timeout: 5000 });
    } else {
      timeoutId = window.setTimeout(enable, 3500);
    }

    return () => {
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <CursorManager />
    </Suspense>
  );
}

function AuthHydrator() {
  const { pathname } = useLocation();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);

  useLayoutEffect(() => {
    if (pathname === "/" || hasHydrated) {
      return;
    }

    hydrateFromStorage();
  }, [hasHydrated, hydrateFromStorage, pathname]);

  return null;
}

function NonLandingGlobals() {
  const { pathname } = useLocation();

  if (pathname === "/") {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <GlobalLoading />
      <AchievementToast />
      <GlobalAudioToggle />
    </Suspense>
  );
}

function App() {
  return (
    <div>
      <DeferredCursorManager />
      <Router>
        <AuthHydrator />
        <PageTracker />
        <NonLandingGlobals />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/sample/puzzle-holo" element={<PuzzleHoloSample />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/game/cody" element={<CodyGame />} />
            <Route path="/game/cody/shared" element={<CodyGame />} />
            <Route path="/game/adventure" element={<AdventureGame />} />
            <Route path="/game/puzzle" element={<PuzzleGame />} />
            <Route path="/game/asparagus" element={<AsparagusMerge />} />
            <Route path="/credits" element={<Credits />} />

            <Route element={<AdminOnlyRoute />}>
              <Route
                path="/sample/landing-compare"
                element={<LandingCompareSample />}
              />
              <Route path="/sample/cody" element={<CodySample />} />
              <Route path="/sample/puzzle" element={<PuzzleSandbox />} />
              <Route path="/sample/hologram" element={<HologramPlayground />} />
              <Route path="/sample/asparagus" element={<AsparagusShowcase />} />
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
}

export default App;
