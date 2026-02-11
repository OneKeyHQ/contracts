import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { DeployPage } from './pages/DeployPage';
import { RescuePage } from './pages/RescuePage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <NavBar />
          <Routes>
            <Route path="/" element={<DeployPage />} />
            <Route path="/rescue" element={<RescuePage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
