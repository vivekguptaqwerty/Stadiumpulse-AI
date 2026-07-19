import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StadiumStateProvider } from './store/StadiumStateContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const PulseGuide = lazy(() => import('./pages/fan/PulseGuide'));
const PulseOps = lazy(() => import('./pages/ops/PulseOps'));
const PulseSimPage = lazy(() => import('./pages/ops/PulseSimPage'));

const PageLoader = () => (
  <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center font-sans">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
      <span className="text-xs text-slate-400 font-medium tracking-wide">Loading StadiumPulse...</span>
    </div>
  </div>
);

function App() {
  return (
    <StadiumStateProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/fan" element={<PulseGuide />} />
            <Route path="/ops" element={<PulseOps />} />
            <Route path="/ops/simulator" element={<PulseSimPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </StadiumStateProvider>
  );
}

export default App;
