import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Activity, 
  Settings, 
  RefreshCw, 
  Sliders, 
  Users, 
  HeartHandshake, 
  HelpCircle,
  Truck,
  MonitorCheck
} from 'lucide-react';
import { useStadiumState } from '../../store/StadiumStateContext';
import { simulationService } from '../../services/simulationService';

const PulseSimPage: React.FC = () => {
  const {
    activeScenario,
    simulationTime,
    triggerScenario,
    resetSimulation
  } = useStadiumState();

  const scenarios = simulationService.getScenarios();

  // Helper to map scenario icon
  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'normal':
        return <MonitorCheck className="h-5 w-5 text-brand-accent" />;
      case 'gate-c-surge':
        return <Users className="h-5 w-5 text-brand-primary" />;
      case 'medical-emergency':
        return <HeartHandshake className="h-5 w-5 text-brand-danger" />;
      case 'accessibility-help':
        return <HelpCircle className="h-5 w-5 text-brand-warning" />;
      case 'post-match-surge':
        return <Truck className="h-5 w-5 text-brand-orange" />;
      default:
        return <Settings className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <Link 
            to="/ops" 
            className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-750 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white leading-none">Digital Stadium Twin</span>
              <span className="text-[9px] bg-brand-warning/15 text-brand-warning border border-brand-warning/30 font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                PulseSim
              </span>
            </div>
            <span className="text-[10px] text-slate-450 block mt-0.5">Simulation Sandboxed Environment</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={resetSimulation}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition-all flex items-center gap-1.5"
            title="Reset Simulation"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset Scenario</span>
          </button>
          
          <Link
            to="/ops"
            className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold transition-all shadow-md shadow-brand-primary/10 flex items-center gap-1"
          >
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-10 flex-grow w-full space-y-8">
        
        {/* Intro Block */}
        <div className="bg-[#0f172a]/40 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-brand-warning uppercase tracking-widest block">Digital Stadium Simulation</span>
            <h1 className="text-xl sm:text-2xl font-black text-white">StadiumPulse Twin Sandbox</h1>
            <p className="text-slate-450 text-xs sm:text-sm font-light max-w-xl">
              Simulate changing stadium crowd flows, safety incidents, queue bottlenecks, and transportation surges to test the real-time response of the StadiumPulse AI operations layer.
            </p>
          </div>
          
          {/* Status Display Card */}
          <div className="w-full md:w-64 bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <span className="text-slate-500">Twin Clock:</span>
              <span className="text-white font-bold">{simulationTime}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <span className="text-slate-500">Engine State:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                RUNNING
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <span className="text-slate-500">Active Scenario:</span>
              <span className="text-brand-warning font-bold text-right uppercase max-w-[120px] truncate">
                {activeScenario.replace(/-/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Event Rate:</span>
              <span className="text-slate-300 font-semibold">1.8 eps (nominal)</span>
            </div>
          </div>
        </div>

        {/* Deck Title */}
        <div className="flex items-center space-x-2">
          <Sliders className="h-4.5 w-4.5 text-brand-primary" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Trigger Stadium Scenarios</h2>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((sc) => {
            const isCurrent = activeScenario === sc.id;
            
            return (
              <div 
                key={sc.id}
                className={`bg-[#0f172a]/55 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 shadow-sm relative overflow-hidden ${
                  isCurrent 
                    ? 'border-brand-primary/50 bg-[#0f172a]/80 ring-1 ring-brand-primary/25' 
                    : 'border-slate-850 hover:border-slate-750'
                }`}
              >
                {/* Active Tag Overlay */}
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-brand-primary text-white text-[8px] font-bold px-3 py-1 rounded-bl-lg tracking-wider uppercase font-mono">
                    Active
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${
                      isCurrent 
                        ? 'bg-brand-primary/10 border-brand-primary/30' 
                        : 'bg-slate-900 border-slate-800'
                    }`}>
                      {getScenarioIcon(sc.id)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{sc.name}</h3>
                      <span className="text-[9px] text-slate-500 font-mono">SCENARIO ID: {sc.id}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    {sc.description}
                  </p>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Affected Stadium Components:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {sc.affectedSystems.map((sys, idx) => (
                        <span key={idx} className="bg-slate-950 border border-slate-900 px-2 py-0.5 rounded text-[9px] text-slate-400 font-mono">
                          {sys}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-900 flex justify-end">
                  <button
                    onClick={() => triggerScenario(sc.id)}
                    disabled={isCurrent}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed'
                        : 'bg-slate-900 border border-slate-850 hover:border-brand-primary/40 hover:text-white text-slate-300'
                    }`}
                  >
                    <span>Trigger Scenario</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 bg-slate-950/80 text-xs text-center text-slate-500 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-brand-primary" />
            <span className="font-semibold text-slate-400">StadiumPulse AI</span>
            <span>&bull;</span>
            <span>Digital Twin Simulation Console</span>
          </div>
          <span>MetLife Stadium Local Sandbox Mode</span>
        </div>
      </footer>

    </div>
  );
};

export default PulseSimPage;
