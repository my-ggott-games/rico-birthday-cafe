import { lazy, Suspense, useLayoutEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import { usePageTracking } from "./hooks/usePageTracking";

import { CursorManager } from "./components/game/CursorManager";
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

const GlobalLoading = lazy(() => import("./components/common/GlobalLoading"));
const AchievementToast = lazy(() => import("./components/common/AchievementToast").then(m => ({ default: m.AchievementToast })));
const GlobalAudioToggle = lazy(() => import("./components/common/GlobalAudioToggle").then(m => ({ default: m.GlobalAudioToggle })));

function PageTracker() {
  usePageTracking();
  return null;
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
  if (pathname === "/") return null;
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
      <CursorManager />
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
