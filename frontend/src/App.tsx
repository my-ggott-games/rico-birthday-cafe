import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Lobby from './pages/Lobby';
import CodyGame from './pages/CodyGame';
import ItabagGame from './pages/ItabagGame';
import FortuneGame from './pages/FortuneGame';
import CodySample from './pages/CodySample';
import PuzzleGame from './pages/PuzzleGame';
import AsparagusMerge from './pages/AsparagusMerge';
import Credits from './pages/Credits';

import { CursorManager } from './components/game/CursorManager';
import GlobalLoading from './components/common/GlobalLoading';
import { AchievementToast } from './components/common/AchievementToast';
import NotFound from './pages/NotFound';
// import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <div>
      <AchievementToast />
      <CursorManager />
      <Router>
        <GlobalLoading />
        <Routes>
          <Route path="/" element={<LandingPage />} />

{/* <Route element={<ProtectedRoute />}> */}
            <Route path="/lobby" element={<Lobby />} />
            {/* Route placeholders for games */}
            <Route path="/game/cody" element={<CodyGame />} />
            <Route path="/sample/cody" element={<CodySample />} />
            <Route path="/game/itabag" element={<ItabagGame />} />
            <Route path="/game/fortune" element={<FortuneGame />} />
            <Route path="/game/baseball" element={
              <div className="min-h-screen bg-[#FFFFF8] text-[#166D77] flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">⚾</div>
                <h2 className="text-3xl font-black font-handwriting">Number Baseball</h2>
                <p className="mt-2 text-[#5EC7A5] font-bold">Coming Soon!</p>
              </div>
            } />
            <Route path="/game/puzzle" element={<PuzzleGame />} />
            <Route path="/game/asparagus" element={<AsparagusMerge />} />
            <Route path="/credits" element={<Credits />} />
          {/* </Route> */}

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
