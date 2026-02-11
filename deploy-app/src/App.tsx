import { HashRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { DeployPage } from './pages/DeployPage';
import { AcceptOwnershipPage } from './pages/AcceptOwnershipPage';
import { RescuePage } from './pages/RescuePage';

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <NavBar />
          <Routes>
            <Route path="/" element={<DeployPage />} />
            <Route path="/accept-ownership" element={<AcceptOwnershipPage />} />
            <Route path="/rescue" element={<RescuePage />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
