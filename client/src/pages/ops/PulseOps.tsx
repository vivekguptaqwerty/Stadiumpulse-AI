import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  Bell, 
  Play, 
  Clock, 
  ShieldAlert, 
  Compass, 
  UserCheck, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useStadiumState } from '../../store/StadiumStateContext';
import { getStatusColorClass } from '../../services/stadiumService';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const PulseOps: React.FC = () => {
  const {
    zones,
    gates,
    incidents,
    alerts,
    recommendation,
    events,
    activeScenario,
    simulationTime,
    selectedZoneId,
    actionPlanApplied,
    actionPlanState,
    chartData,
    opsAnalyzing,
    lastAnalysisTime,
    isFallbackActive,
    activeModel,
    applyActionPlan,
    setSelectedZoneId,
    runOperationsAnalysis
  } = useStadiumState();

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'mock'>('gemini');

  // Focus trap and restoration refs for dialog
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (showPlanModal) {
      // Record the triggering button
      triggerRef.current = document.activeElement as HTMLButtonElement;

      // Focus the first focusable child
      const timer = setTimeout(() => {
        const focusable = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>;
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowPlanModal(false);
        }

        if (e.key === 'Tab') {
          const focusable = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as NodeListOf<HTMLElement>;
          if (focusable && focusable.length > 0) {
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
              if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
              }
            } else {
              if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }
  }, [showPlanModal]);

  // Check AI configured status on load
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const res = await fetch('/api/ai/status');
        if (res.ok) {
          const data = await res.json();
          setAiProvider(data.provider || 'gemini');
        }
      } catch (err) {
        console.warn('[PulseOps] Failed to fetch AI status, defaulted to mock UI visual.', err);
        setAiProvider('mock');
      }
    };
    checkAIStatus();
  }, []);

  // Derive counts
  const fansCount = activeScenario === 'post-match-surge' ? 74812 : 72481;
  const activeIncidentsCount = incidents.filter(i => i.status !== 'resolved').length;
  const riskZonesCount = zones.filter(z => z.status !== 'NORMAL').length;
  const aiAlertsCount = alerts.length + (recommendation && !recommendation.applied ? 1 : 0);

  const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[1];

  const getZoneFillClass = useCallback((status: string) => {
    switch (status) {
      case 'NORMAL':
        return 'fill-emerald-500/10 stroke-emerald-500/30 hover:fill-emerald-500/20';
      case 'ELEVATED':
        return 'fill-amber-500/20 stroke-amber-500/50 hover:fill-amber-500/30';
      case 'HIGH':
        return 'fill-orange-500/30 stroke-orange-500/60 hover:fill-orange-500/40 animate-pulse';
      case 'CRITICAL':
        return 'fill-red-500/40 stroke-red-500/70 hover:fill-red-500/50 animate-pulse';
      default:
        return 'fill-slate-800 stroke-slate-700';
    }
  }, []);

  const getGateBadgeClass = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'ELEVATED': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'HIGH': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'CRITICAL': return 'bg-red-500/15 text-red-400 border-red-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-750';
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden selection:bg-brand-primary/30 selection:text-white">
      
      {/* Top Banner / Header */}
      <header className="bg-slate-950 border-b border-slate-900 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
            <Activity className="h-5 w-5 text-brand-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">StadiumPulse AI</span>
              <span className="text-[10px] bg-brand-primary/15 text-brand-primary border border-brand-primary/30 font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                PulseOps
              </span>
              
              {/* AI Active Badge */}
              <span className={`text-[9px] border px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 shadow-sm ${
                isFallbackActive || aiProvider === 'mock'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                  isFallbackActive || aiProvider === 'mock' ? 'bg-amber-400' : 'bg-purple-400'
                }`}></span>
                {isFallbackActive || aiProvider === 'mock' ? 'Demo Fallback Active' : 'Gemini Intelligence Active'}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>FIFA World Cup 2026</span>
              <span className="text-slate-655">&bull;</span>
              <span>MetLife Stadium Command Center</span>
            </div>
          </div>
        </div>

        {/* Live Clock & Action Navigation */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono">
            <Clock className="h-3.5 w-3.5 text-brand-primary animate-spin-slow" />
            <span className="text-slate-400">SIM TIME:</span>
            <span className="text-white font-bold">{simulationTime}</span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE
          </div>

          <Link 
            to="/ops/simulator" 
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <Play className="h-3 w-3 text-brand-warning" />
            <span>Control Twin</span>
          </Link>
        </div>
      </header>

      {/* Main Grid Deck */}
      <div className="flex-grow p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Metrics & Stadium map */}
        <div className="xl:col-span-8 space-y-6 flex flex-col">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0f172a]/55 border border-slate-850 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fans in Venue</span>
                <span className="text-2xl font-black text-white leading-none font-mono">{fansCount.toLocaleString()}</span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-brand-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-[#0f172a]/55 border border-slate-850 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Incidents</span>
                <span className={`text-2xl font-black leading-none font-mono ${activeIncidentsCount > 0 ? 'text-brand-danger' : 'text-slate-400'}`}>
                  {activeIncidentsCount}
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-brand-danger">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-[#0f172a]/55 border border-slate-850 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Risk Zones</span>
                <span className={`text-2xl font-black leading-none font-mono ${riskZonesCount > 0 ? 'text-brand-warning' : 'text-slate-400'}`}>
                  {riskZonesCount} / 4
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-brand-warning">
                <Compass className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-[#0f172a]/55 border border-slate-850 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI alerts active</span>
                <span className={`text-2xl font-black leading-none font-mono ${aiAlertsCount > 0 ? 'text-brand-primary animate-pulse' : 'text-slate-400'}`}>
                  {aiAlertsCount}
                </span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Bell className="h-5 w-5 animate-bounce-slow" />
              </div>
            </div>
          </div>

          {/* Interactive SVG Stadium Schematic card */}
          <div className="bg-[#0f172a]/40 border border-slate-850 rounded-xl p-5 flex-grow flex flex-col justify-between relative shadow-lg min-h-[460px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.2),transparent_70%)] pointer-events-none" />
            
            <div className="flex justify-between items-center z-10 mb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">MetLife Live Schematic Layout</h2>
                <span className="text-[10px] text-slate-400">Click zones on the map to query structural density trends.</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded border border-slate-800">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-accent"></span>
                  <span>Normal</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-warning"></span>
                  <span>Elevated</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse"></span>
                  <span>High</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-danger animate-pulse"></span>
                  <span>Critical</span>
                </div>
              </div>
            </div>

            {/* Stadium Visual */}
            <div className="flex-grow flex justify-center items-center my-4 z-10">
              <StadiumSchematic 
                zones={zones}
                activeScenario={activeScenario}
                actionPlanApplied={actionPlanApplied}
                setSelectedZoneId={setSelectedZoneId}
                getZoneFillClass={getZoneFillClass}
              />
            </div>

            {/* Bottom Status Grid (Gates) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 z-10 border-t border-slate-900 pt-4">
              {gates.map((g) => (
                <div key={g.id} className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">{g.name}</span>
                    <span className={`text-[8px] font-semibold border px-1.5 py-0.5 rounded ${getGateBadgeClass(g.status)}`}>
                      {g.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-white font-mono">{g.crowdDensity}%</span>
                    <span className="text-[9px] text-slate-500 font-mono">density</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5">Wait: <strong className="text-slate-200 font-mono">{g.avgWaitMinutes} min</strong></span>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Right Column: AI briefs, Selected Zone Details & Live stream */}
        <div className="xl:col-span-4 space-y-6 flex flex-col justify-between">
          
          {/* AI Operational Brief Panel */}
          <div className="bg-[#0f172a]/55 border border-slate-850 rounded-xl p-5 flex flex-col justify-between gap-3 shadow-md relative overflow-hidden min-h-[190px]">
            <div className="absolute top-0 right-0 h-24 w-24 bg-brand-primary/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-brand-primary animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-white">AI Operational Brief</h2>
              </div>
              <span className="text-[9px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded font-bold font-mono">PREDICTIVE</span>
            </div>

            {opsAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 space-y-2">
                <RefreshCw className="h-6 w-6 text-brand-primary animate-spin" />
                <span className="text-xs font-mono animate-pulse">Analyzing live signals...</span>
              </div>
            ) : alerts.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 bg-red-955 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                  <ShieldAlert className="h-4.5 w-4.5 text-brand-danger shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-red-200 block">{alerts[0].title}</span>
                    <p className="text-slate-350 text-slate-300 mt-1">{alerts[0].description}</p>
                    {alerts[0].prediction && (
                      <div className="mt-2 text-brand-orange bg-brand-orange/5 p-2 rounded border border-brand-orange/15 font-mono text-[10px]">
                        <strong>PREDICTION:</strong> {alerts[0].prediction}
                      </div>
                    )}
                  </div>
                </div>

                {recommendation && !recommendation.applied && (
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="w-full py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary/95 text-white font-semibold text-xs tracking-wide transition-all shadow-md shadow-brand-primary/10 flex items-center justify-center gap-1.5"
                  >
                    <span>Review Action Plan</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : recommendation && recommendation.applied ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 bg-emerald-950/25 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                  <CheckCircle className="h-4.5 w-4.5 text-brand-accent shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-200 block">Action Plan Active</span>
                    <p className="text-slate-300 mt-1">Crowd redirect policies and auxiliary staff deployments are currently active.</p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>Applied Sim Time:</span>
                  <span>{recommendation.appliedTimestamp}</span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 space-y-3">
                <p>System operating normally.</p>
                <div className="flex justify-center">
                  <button
                    onClick={() => runOperationsAnalysis(true)}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-mono hover:text-white transition-colors"
                  >
                    Run AI Analysis Scan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Intelligence System Status Panel */}
          <div className="bg-[#0f172a]/55 border border-slate-850 rounded-xl p-5 flex flex-col gap-3 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">AI Intelligence Status</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono mt-1">
              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Provider Status</span>
                <span className={`font-bold ${isFallbackActive || aiProvider === 'mock' ? 'text-brand-orange' : 'text-brand-accent'}`}>
                  {isFallbackActive || aiProvider === 'mock' ? 'Demo Fallback' : 'Gemini Active'}
                </span>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Model Pinned</span>
                <span className="text-slate-200 font-semibold">{activeModel || 'gemini-3.5-flash'}</span>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Last Analysis</span>
                <span className="text-slate-200 font-semibold">{lastAnalysisTime || 'None'}</span>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Decision Mode</span>
                <span className="text-slate-300">Human Approval</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-850 pt-2 flex flex-col gap-1">
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider font-mono text-[9px] block">Grounding Mode</span>
                Trusted Stadium Context (MetLife Grounded Registry)
              </div>
            </div>
          </div>

          {/* Selected Zone Intelligence Panel with Chart */}
          <div className="bg-[#0f172a]/55 border border-slate-855 border-slate-850 rounded-xl p-5 flex flex-col justify-between gap-3 shadow-md flex-grow">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Zone Details</span>
                  <h2 className="text-base font-bold text-white leading-none mt-0.5">{selectedZone.name}</h2>
                </div>
                <span className={`text-[10px] font-bold border px-2 py-0.5 rounded ${getStatusColorClass(selectedZone.status)}`}>
                  {selectedZone.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900/50 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[9px] text-slate-500 block">Crowd Density</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-lg font-black text-white font-mono">{selectedZone.crowdDensity}%</span>
                    <span className={`text-[10px] flex items-center gap-0.5 font-bold ${selectedZone.trend10Min >= 0 ? 'text-brand-orange' : 'text-brand-accent'}`}>
                      {selectedZone.trend10Min >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>{selectedZone.trend10Min >= 0 ? `+${selectedZone.trend10Min}%` : `${selectedZone.trend10Min}%`}</span>
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[9px] text-slate-500 block">Queries / Incidents</span>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    <span className="text-white font-mono">{selectedZone.fanQueriesCount}</span> q <span className="text-slate-655 font-mono">/</span> <span className={`${selectedZone.openIncidentsCount > 0 ? 'text-brand-danger font-mono' : 'text-slate-400 font-mono'}`}>{selectedZone.openIncidentsCount}</span> inc
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts Crowd Trend Chart */}
            <div className="h-28 w-full z-10">
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest block mb-1">30 Min Density Trend</span>
              <CrowdTrendChart chartData={chartData} />
            </div>
          </div>

          {/* Live Event Stream Panel */}
          <div className="bg-[#0f172a]/55 border border-slate-850 rounded-xl p-5 flex flex-col justify-between gap-3 shadow-md h-52">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">Live Event Stream</h2>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse"></span>
                POLLING ACTIVE
              </div>
            </div>

            {/* Event List scroll container */}
            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2 pr-1">
              <AnimatePresence initial={false}>
                {events.map((ev) => (
                  <motion.div 
                    key={ev.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2 bg-slate-900/60 rounded border border-slate-800 flex items-start gap-2 text-[11px]"
                  >
                    <span className="font-mono text-slate-500 font-medium shrink-0 mt-0.5">{ev.timestamp}</span>
                    <div className="flex-grow">
                      <span className="font-medium text-slate-200 block leading-tight">{ev.message}</span>
                      {ev.detail && <span className="text-[9px] text-slate-400 block mt-0.5 leading-none">{ev.detail}</span>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>

      {/* Action Plan Modal overlay */}
      <AnimatePresence>
        {showPlanModal && recommendation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <motion.div 
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4.5 w-4.5 text-brand-primary animate-pulse" />
                  <span id="modal-title" className="font-bold text-white">AI Mitigation Plan</span>
                </div>
                <button 
                  onClick={() => setShowPlanModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-300">Plan Title:</h3>
                  <span className="text-base font-extrabold text-white">{recommendation.title}</span>
                </div>

                <div className="space-y-1 bg-slate-950 border border-slate-850 p-3 rounded-lg text-xs">
                  <span className="font-bold text-brand-primary uppercase tracking-wider text-[9px] block">Impact Prediction</span>
                  <p className="text-slate-200">{recommendation.prediction}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Action Checklists:</span>
                  <div className="space-y-2 text-xs">
                    {recommendation.actions.map((act, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="h-4.5 w-4.5 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center text-[10px] text-brand-primary shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-slate-300 leading-normal">{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execution States */}
                {actionPlanState !== 'idle' && (
                  <div className="border-t border-slate-850 pt-4 space-y-1.5 text-[11px] font-mono">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Plan Execution Status</span>
                    
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-slate-300">Routing policies updating...</span>
                    </div>
                    {actionPlanState === 'applying' && (
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-slate-400">Triggering action executors...</span>
                      </div>
                    )}
                    {actionPlanState === 'applied' && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                          <span className="text-slate-300">Action items successfully executed on layout!</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-950 border-t border-slate-850 flex justify-end gap-3">
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => {
                    applyActionPlan();
                    setTimeout(() => {
                      setShowPlanModal(false);
                    }, 2000);
                  }}
                  disabled={actionPlanState !== 'idle'}
                  className="px-6 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-brand-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {actionPlanState === 'applying' ? (
                    <>
                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Applying...</span>
                    </>
                  ) : actionPlanState === 'applied' ? (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span>Applied!</span>
                    </>
                  ) : (
                    <span>Apply Action Plan</span>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

interface StadiumSchematicProps {
  zones: any[];
  activeScenario: string;
  actionPlanApplied: boolean;
  setSelectedZoneId: (id: string) => void;
  getZoneFillClass: (status: string) => string;
}

const StadiumSchematic = React.memo(({
  zones,
  activeScenario,
  actionPlanApplied,
  setSelectedZoneId,
  getZoneFillClass
}: StadiumSchematicProps) => {
  return (
    <svg className="w-full max-w-[420px] aspect-square" viewBox="0 0 100 100">
      {/* Stadium Outer Border */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="#1e293b" strokeWidth="1" />
      
      {/* Interactive Quadrants (Zones) */}
      <path 
        onClick={() => setSelectedZoneId('zone-c')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedZoneId('zone-c');
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Zone C (North Endzone). Status is ${(zones.find(z => z.id === 'zone-c')?.status || 'NORMAL').toLowerCase()}.`}
        d="M 50 50 L 50 6 A 44 44 0 0 1 94 50 Z" 
        className={`cursor-pointer transition-all duration-300 ${getZoneFillClass(zones.find(z => z.id === 'zone-c')?.status || 'NORMAL')} focus:outline-none focus:stroke-slate-100 focus:stroke-[1.5]`} 
        strokeWidth="0.8" 
      />
      
      <path 
        onClick={() => setSelectedZoneId('zone-b')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedZoneId('zone-b');
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Zone B (East Concourse). Status is ${(zones.find(z => z.id === 'zone-b')?.status || 'NORMAL').toLowerCase()}.`}
        d="M 50 50 L 94 50 A 44 44 0 0 1 50 94 Z" 
        className={`cursor-pointer transition-all duration-300 ${getZoneFillClass(zones.find(z => z.id === 'zone-b')?.status || 'NORMAL')} focus:outline-none focus:stroke-slate-100 focus:stroke-[1.5]`} 
        strokeWidth="0.8" 
      />
      
      <path 
        onClick={() => setSelectedZoneId('zone-d')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedZoneId('zone-d');
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Zone D (South Endzone). Status is ${(zones.find(z => z.id === 'zone-d')?.status || 'NORMAL').toLowerCase()}.`}
        d="M 50 50 L 50 94 A 44 44 0 0 1 6 50 Z" 
        className={`cursor-pointer transition-all duration-300 ${getZoneFillClass(zones.find(z => z.id === 'zone-d')?.status || 'NORMAL')} focus:outline-none focus:stroke-slate-100 focus:stroke-[1.5]`} 
        strokeWidth="0.8" 
      />
      
      <path 
        onClick={() => setSelectedZoneId('zone-a')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedZoneId('zone-a');
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Zone A (West Concourse). Status is ${(zones.find(z => z.id === 'zone-a')?.status || 'NORMAL').toLowerCase()}.`}
        d="M 50 50 L 6 50 A 44 44 0 0 1 50 6 Z" 
        className={`cursor-pointer transition-all duration-300 ${getZoneFillClass(zones.find(z => z.id === 'zone-a')?.status || 'NORMAL')} focus:outline-none focus:stroke-slate-100 focus:stroke-[1.5]`} 
        strokeWidth="0.8" 
      />

      {/* Gate Points */}
      <circle cx="20" cy="20" r="2.5" fill="#020617" stroke="#3b82f6" strokeWidth="0.8" />
      <text x="20" y="20.5" fill="#3b82f6" fontSize="2" fontWeight="bold" textAnchor="middle">GA</text>

      <circle cx="80" cy="20" r="2.5" fill="#020617" stroke="#3b82f6" strokeWidth="0.8" />
      <text x="80" y="20.5" fill="#3b82f6" fontSize="2" fontWeight="bold" textAnchor="middle">GB</text>

      <circle cx="80" cy="80" r="2.8" fill="#020617" stroke="#ef4444" strokeWidth="0.8" />
      <text x="80" y="80.5" fill="#ef4444" fontSize="2" fontWeight="bold" textAnchor="middle">GC</text>
      {activeScenario === 'gate-c-surge' && !actionPlanApplied && (
        <circle cx="80" cy="80" r="4.5" fill="none" stroke="#ef4444" strokeWidth="0.5" className="animate-ping" />
      )}

      <circle cx="20" cy="80" r="2.5" fill="#020617" stroke="#10b981" strokeWidth="0.8" />
      <text x="20" y="80.5" fill="#10b981" fontSize="2" fontWeight="bold" textAnchor="middle">GD</text>

      {/* Corridor B2 */}
      <line x1="68" y1="58" x2="78" y2="68" stroke={activeScenario === 'gate-c-surge' && !actionPlanApplied ? '#ef4444' : '#f59e0b'} strokeWidth="1.2" strokeDasharray="1.5 1" />
      <text x="76" y="62" fill="#94a3b8" fontSize="1.8" fontWeight="bold">Corridor B2</text>

      {/* Central pitch */}
      <rect x="36" y="28" width="28" height="44" rx="1.5" fill="#020617" stroke="#475569" strokeWidth="0.8" transform="rotate(45 50 50)" />
      <line x1="36" y1="50" x2="64" y2="50" stroke="#475569" strokeWidth="0.5" transform="rotate(45 50 50)" />
      <circle cx="50" cy="50" r="4.5" fill="none" stroke="#475569" strokeWidth="0.5" />
      <text x="50" y="50.8" fill="#475569" fontSize="2.2" textAnchor="middle">PITCH</text>

      {/* Labels */}
      <text x="50" y="16" fill="#f8fafc" fontSize="2.8" fontWeight="extrabold" textAnchor="middle">ZONE C</text>
      <text x="82" y="51" fill="#f8fafc" fontSize="2.8" fontWeight="extrabold" textAnchor="middle">ZONE B</text>
      <text x="50" y="87" fill="#f8fafc" fontSize="2.8" fontWeight="extrabold" textAnchor="middle">ZONE D</text>
      <text x="18" y="51" fill="#f8fafc" fontSize="2.8" fontWeight="extrabold" textAnchor="middle">ZONE A</text>
    </svg>
  );
});
StadiumSchematic.displayName = 'StadiumSchematic';

interface CrowdTrendChartProps {
  chartData: { name: string; density: number }[];
}

const CrowdTrendChart = React.memo(({ chartData }: CrowdTrendChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
        <YAxis stroke="#475569" fontSize={9} domain={[0, 100]} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '10px' }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Area type="monotone" dataKey="density" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDensity)" />
      </AreaChart>
    </ResponsiveContainer>
  );
});
CrowdTrendChart.displayName = 'CrowdTrendChart';

export default PulseOps;
