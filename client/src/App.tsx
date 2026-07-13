import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PulseGuide from './pages/fan/PulseGuide';
import PulseOps from './pages/ops/PulseOps';
import PulseSimPage from './pages/ops/PulseSimPage';
import { StadiumStateProvider } from './store/StadiumStateContext';

function App() {
  return (
    <StadiumStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/fan" element={<PulseGuide />} />
          <Route path="/ops" element={<PulseOps />} />
          <Route path="/ops/simulator" element={<PulseSimPage />} />
        </Routes>
      </BrowserRouter>
    </StadiumStateProvider>
  );
}

export default App;
