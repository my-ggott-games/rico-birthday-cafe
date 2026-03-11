import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Lobby from './pages/Lobby';
import CodyGame from './pages/CodyGame';
import PuzzleGame from './pages/PuzzleGame';
import AsparagusMerge from './pages/AsparagusMerge';

import { CursorManager } from './components/game/CursorManager';
import GlobalLoading from './components/common/GlobalLoading';
import { AchievementToast } from './components/common/AchievementToast';
import NotFound from './pages/NotFound';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <div>
      <AchievementToast />
      <CursorManager />
      <Router>
        <GlobalLoading />
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/lobby" element={<Lobby />} />
            {/* Route placeholders for games */}
            <Route path="/game/cody" element={<CodyGame />} />
            <Route path="/game/itabag" element={
              <div className="min-h-screen bg-[#FFFDF7] text-[#4A3b32] flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">🎒</div>
                <h2 className="text-3xl font-black font-handwriting">Itabag Decoration</h2>
                <p className="mt-2 text-[#F43F5E] font-bold">Coming Soon!</p>
              </div>
            } />
            <Route path="/game/baseball" element={
              <div className="min-h-screen bg-[#FFFDF7] text-[#4A3b32] flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">⚾</div>
                <h2 className="text-3xl font-black font-handwriting">Number Baseball</h2>
                <p className="mt-2 text-[#F43F5E] font-bold">Coming Soon!</p>
              </div>
            } />
            <Route path="/game/puzzle" element={<PuzzleGame />} />
            <Route path="/game/asparagus" element={<AsparagusMerge />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
