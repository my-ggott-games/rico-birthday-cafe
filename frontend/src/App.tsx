import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Lobby from "./pages/Lobby";

import { CursorManager } from "./components/game/CursorManager";
import GlobalLoading from "./components/common/GlobalLoading";
import { AchievementToast } from "./components/common/AchievementToast";
import NotFound from "./pages/NotFound";
import { startCodyAssetPreload } from "./utils/codyAssetPreload";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import LandingCompareSample from "./pages/LandingCompareSample";

const CodyGame = lazy(() => import("./pages/CodyGame"));
const ItabagGame = lazy(() => import("./pages/ItabagGame"));
const FortuneGame = lazy(() => import("./pages/FortuneGame"));
const AdventureSample = lazy(() => import("./pages/AdventureSample"));
const CodySample = lazy(() => import("./pages/CodySample"));
const PuzzleGame = lazy(() => import("./pages/PuzzleGame"));
const PuzzleSandbox = lazy(() => import("./pages/PuzzleSandbox"));
const HologramPlayground = lazy(() => import("./pages/HologramPlayground"));
const AsparagusMerge = lazy(() => import("./pages/AsparagusMerge"));
const AsparagusShowcase = lazy(() => import("./pages/AsparagusShowcase"));
const Credits = lazy(() => import("./pages/Credits"));
const TakeoutCupShowcase = lazy(() => import("./pages/TakeoutCupShowcase"));

function App() {
  useEffect(() => {
    startCodyAssetPreload();
  }, []);

  return (
    <div>
      <AchievementToast />
      <CursorManager />
      <Router>
        <GlobalLoading />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/sample/landing-compare" element={<LandingCompareSample />} />
            <Route path="/sample/takeout-cup" element={<TakeoutCupShowcase />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/game/cody" element={<CodyGame />} />
              <Route path="/sample/cody" element={<CodySample />} />
              <Route path="/game/itabag" element={<ItabagGame />} />
              <Route path="/game/fortune" element={<FortuneGame />} />
              <Route path="/game/adventure" element={<AdventureSample />} />
              <Route path="/sample/adventure" element={<AdventureSample />} />
              <Route path="/game/puzzle" element={<PuzzleGame />} />
              <Route path="/sample/puzzle" element={<PuzzleSandbox />} />
              <Route path="/sample/hologram" element={<HologramPlayground />} />
              <Route path="/game/asparagus" element={<AsparagusMerge />} />
              <Route path="/sample/asparagus" element={<AsparagusShowcase />} />
              <Route path="/credits" element={<Credits />} />
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
