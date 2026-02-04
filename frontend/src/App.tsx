import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Lobby from './pages/Lobby';
import CodyGame from './pages/CodyGame';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lobby" element={<Lobby />} />
        {/* Route placeholders for games */}
        <Route path="/game/cody" element={<CodyGame />} />
        <Route path="/game/itabag" element={<div className="min-h-screen bg-black text-white flex items-center justify-center text-2xl font-bold">Itabag Decoration (Coming Soon)</div>} />
        <Route path="/game/baseball" element={<div className="min-h-screen bg-black text-white flex items-center justify-center text-2xl font-bold">Number Baseball (Coming Soon)</div>} />
      </Routes>
    </Router>
  );
}

export default App;
