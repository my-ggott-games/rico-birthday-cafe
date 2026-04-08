import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Lobby from "./pages/Lobby";

import { CursorManager } from "./components/game/CursorManager";
import GlobalLoading from "./components/common/GlobalLoading";
import { AchievementToast } from "./components/common/AchievementToast";
import { GlobalAudioToggle } from "./components/common/GlobalAudioToggle";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminOnlyRoute } from "./components/auth/AdminOnlyRoute";
import LandingCompareSample from "./pages/LandingCompareSample";
import AchievementListShowcase from "./pages/AchievementListShowcase";

const CodyGame = lazy(() => import("./pages/CodyGame"));
const ItabagGame = lazy(() => import("./pages/ItabagGame"));
const FortuneGame = lazy(() => import("./pages/FortuneGame"));
const AdventureGame = lazy(() => import("./pages/AdventureGame"));
const CodySample = lazy(() => import("./pages/CodySample"));
const PuzzleGame = lazy(() => import("./pages/PuzzleGame"));
const PuzzleSandbox = lazy(() => import("./pages/PuzzleSandbox"));
const HologramPlayground = lazy(() => import("./pages/HologramPlayground"));
const AsparagusMerge = lazy(() => import("./pages/AsparagusMerge"));
const AsparagusShowcase = lazy(() => import("./pages/AsparagusShowcase"));
const Credits = lazy(() => import("./pages/Credits"));
const TakeoutCupShowcase = lazy(() => import("./pages/TakeoutCupShowcase"));

function App() {
  return (
    <div>
      <AchievementToast />
      <CursorManager />
      <Router>
        <GlobalLoading />
        <GlobalAudioToggle />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/game/cody" element={<CodyGame />} />
              <Route path="/game/itabag" element={<ItabagGame />} />
              <Route path="/game/fortune" element={<FortuneGame />} />
              <Route path="/game/adventure" element={<AdventureGame />} />
              <Route path="/game/puzzle" element={<PuzzleGame />} />
              <Route path="/game/asparagus" element={<AsparagusMerge />} />
              <Route path="/credits" element={<Credits />} />
            </Route>

            <Route element={<AdminOnlyRoute />}>
              <Route
                path="/sample/landing-compare"
                element={<LandingCompareSample />}
              />
              <Route
                path="/sample/takeout-cup"
                element={<TakeoutCupShowcase />}
              />
              <Route
                path="/sample/achievements"
                element={<AchievementListShowcase />}
              />
              <Route path="/sample/cody" element={<CodySample />} />
              <Route path="/sample/adventure" element={<AdventureGame />} />
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
