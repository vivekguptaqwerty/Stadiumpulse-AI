import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import type { StadiumZone, Gate, Incident, OperationalAlert, AIRecommendation, LiveEvent, FanContext, OperationalState } from '../types';
import { stadiumService } from '../services/stadiumService';
import { mockFallbackService } from '../services/mockFallbackService';

interface StadiumStateContextType {
  zones: StadiumZone[];
  gates: Gate[];
  incidents: Incident[];
  alerts: OperationalAlert[];
  recommendation: AIRecommendation | null;
  events: LiveEvent[];
  activeScenario: string;
  isSimulating: boolean;
  simulationTime: string;
  fanContext: FanContext;
  selectedZoneId: string;
  actionPlanApplied: boolean;
  actionPlanState: 'idle' | 'applying' | 'applied';
  chartData: { name: string; density: number }[];
  opsAnalyzing: boolean;
  lastAnalysisTime: string;
  isFallbackActive: boolean;
  activeModel: string;
  triggerScenario: (scenarioId: string) => void;
  applyActionPlan: () => void;
  addLiveEvent: (category: LiveEvent['category'], message: string, detail?: string) => void;
  setSelectedZoneId: (zoneId: string) => void;
  resetSimulation: () => void;
  runOperationsAnalysis: (force?: boolean) => Promise<void>;
}

const StadiumStateContext = createContext<StadiumStateContextType | undefined>(undefined);

export const useStadiumState = () => {
  const context = useContext(StadiumStateContext);
  if (!context) {
    throw new Error('useStadiumState must be used within a StadiumStateProvider');
  }
  return context;
};

export const StadiumStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [zones, setZones] = useState<StadiumZone[]>(() => stadiumService.getInitialZones());
  const [gates, setGates] = useState<Gate[]>(() => stadiumService.getInitialGates());
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>(() => stadiumService.getInitialEvents());
  const [activeScenario, setActiveScenario] = useState<string>('normal');
  const [isSimulating] = useState<boolean>(true);
  const [simulationTime, setSimulationTime] = useState<string>('15:42:00');
  const [fanContext] = useState<FanContext>(() => stadiumService.getFanContext());
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-b');
  const [actionPlanApplied, setActionPlanApplied] = useState<boolean>(false);
  const [actionPlanState, setActionPlanState] = useState<'idle' | 'applying' | 'applied'>('idle');
  const [opsAnalyzing, setOpsAnalyzing] = useState<boolean>(false);

  // AI system status states
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>('');
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.5-flash');

  // Chart data for selected zone trend (last 30 minutes in 5-minute increments)
  const [chartData, setChartData] = useState<{ name: string; density: number }[]>([]);

  const surgeTimerRef = useRef<any>(null);
  const clockTimerRef = useRef<any>(null);
  const lastFingerprintRef = useRef<string>('');

  // Helper to generate simulated time increments
  useEffect(() => {
    clockTimerRef.current = setInterval(() => {
      setSimulationTime((prev) => {
        const [h, m, s] = prev.split(':').map(Number);
        let ns = s + 1;
        let nm = m;
        let nh = h;
        if (ns >= 60) {
          ns = 0;
          nm += 1;
        }
        if (nm >= 60) {
          nm = 0;
          nh += 1;
        }
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(nh)}:${pad(nm)}:${pad(ns)}`;
      });
    }, 1000);

    return () => {
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    };
  }, []);

  // Update chart data based on selected zone and crowd density
  useEffect(() => {
    const selectedZone = zones.find(z => z.id === selectedZoneId);
    if (!selectedZone) return;

    const baseDensity = selectedZone.crowdDensity;
    // Generate a simulated history ending at the current density
    const history = [
      { name: '-25m', density: Math.max(20, Math.round(baseDensity - 15 + Math.random() * 6)) },
      { name: '-20m', density: Math.max(20, Math.round(baseDensity - 10 + Math.random() * 6)) },
      { name: '-15m', density: Math.max(20, Math.round(baseDensity - 8 + Math.random() * 4)) },
      { name: '-10m', density: Math.max(20, Math.round(baseDensity - 4 + Math.random() * 4)) },
      { name: '-5m', density: Math.max(20, Math.round(baseDensity - 2 + Math.random() * 2)) },
      { name: 'Live', density: baseDensity },
    ];
    setChartData(history);
  }, [selectedZoneId, zones]);

  const addLiveEvent = (category: LiveEvent['category'], message: string, detail?: string) => {
    setEvents((prev) => {
      const timeStr = simulationTime;
      const newEvent: LiveEvent = {
        id: `ev-${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
        category,
        message,
        detail
      };
      return [newEvent, ...prev].slice(0, 50);
    });
  };

  const resetSimulation = () => {
    if (surgeTimerRef.current) {
      clearTimeout(surgeTimerRef.current);
      surgeTimerRef.current = null;
    }
    setZones(stadiumService.getInitialZones());
    setGates(stadiumService.getInitialGates());
    setIncidents([]);
    setAlerts([]);
    setActionPlanApplied(false);
    setActionPlanState('idle');
    setRecommendation(null);
    setActiveScenario('normal');
    lastFingerprintRef.current = '';
    setLastAnalysisTime('');
    setIsFallbackActive(false);
    addLiveEvent('system', 'Simulation reset to Normal Operations');
  };

  // Structured Ops analysis trigger (calls Express server with client-side fallback)
  const runOperationsAnalysis = async (force = false) => {
    setOpsAnalyzing(true);
    addLiveEvent('ai', 'Triggered operational AI analysis', 'Analyzing live signals...');

    // Expose only relevant data in operations snapshot
    const snapshot = {
      zones,
      gates,
      incidents,
      alerts,
      activeScenario
    };

    // Cooldown check based on simple fingerprint
    const gateC = gates.find(g => g.id === 'gate-c');
    const fingerprint = `${activeScenario}-${gateC?.crowdDensity}-${incidents.length}`;
    
    if (!force && fingerprint === lastFingerprintRef.current) {
      setOpsAnalyzing(false);
      console.log('[OpsAnalysis] Unchanged state snapshot. Skipping duplicate request.');
      return;
    }
    lastFingerprintRef.current = fingerprint;

    try {
      const res = await fetch('/api/ai/operations/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot)
      });

      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }

      const data = await res.json();
      applyAnalysisResult(data);
    } catch (err) {
      console.warn('[OpsAnalysis] Server connection failed. Using local fallback provider.', err);
      const fallbackResult = mockFallbackService.analyzeOperations(snapshot);
      applyAnalysisResult(fallbackResult);
    } finally {
      setOpsAnalyzing(false);
    }
  };

  const applyAnalysisResult = (data: any) => {
    // Record AI metadata statuses
    setLastAnalysisTime(simulationTime);
    setIsFallbackActive(!!data.meta?.fallbackUsed);
    setActiveModel(data.meta?.model || 'gemini-3.5-flash');

    if (data.riskDetected) {
      // Set operational alerts matching response
      setAlerts([{
        id: `alert-ops-${Date.now()}`,
        title: data.title,
        type: 'congestion',
        severity: data.riskLevel === 'CRITICAL' ? 'critical' : 'warning',
        description: data.summary,
        prediction: data.prediction ? `${data.prediction.outcome} in ~${data.prediction.estimatedMinutes}m (${data.prediction.confidence} conf)` : undefined,
        timestamp: simulationTime
      }]);

      // Set Recommendation actions
      setRecommendation({
        id: `rec-ops-${Date.now()}`,
        title: data.title,
        alertId: `alert-ops-${Date.now()}`,
        description: data.summary,
        prediction: data.prediction ? `Outcome: ${data.prediction.outcome}` : 'Mitigations recommended',
        actions: data.recommendedActions.map((a: any) => `${a.action} on ${a.targetId}: ${a.reason}`),
        applied: false,
        // Custom attribute to hold raw recommended actions for deterministic executor
        rawActions: data.recommendedActions
      } as any);

      addLiveEvent('ai', `AI Risk Alert: ${data.title}`, `Level: ${data.riskLevel}`);
    } else {
      setAlerts([]);
      setRecommendation(null);
      addLiveEvent('ai', 'AI Analysis Scan complete: no operational risks detected.');
    }
  };

  const triggerScenario = (scenarioId: string) => {
    if (surgeTimerRef.current) {
      clearTimeout(surgeTimerRef.current);
      surgeTimerRef.current = null;
    }

    setActiveScenario(scenarioId);
    setActionPlanApplied(false);
    setActionPlanState('idle');
    setRecommendation(null);
    setAlerts([]);

    if (scenarioId === 'normal') {
      resetSimulation();
      return;
    }

    addLiveEvent('system', `Scenario Triggered: ${scenarioId.toUpperCase().replace(/-/g, ' ')}`);

    if (scenarioId === 'gate-c-surge') {
      setGates(prev => prev.map(g => g.id === 'gate-c' ? { ...g, crowdDensity: 45, status: 'NORMAL', avgWaitMinutes: 5 } : g));
      setZones(prev => prev.map(z => z.id === 'zone-b' ? { ...z, crowdDensity: 58, status: 'ELEVATED', trend10Min: 4 } : z));
      addLiveEvent('ops', 'Gate C Surge initiated: baseline density 45%');

      let step = 1;
      const densities = [52, 61, 72, 84];
      const waitTimes = [8, 14, 21, 35];
      const statuses: OperationalState[] = ['ELEVATED', 'ELEVATED', 'HIGH', 'CRITICAL'];

      const runSurgeStep = () => {
        if (step > densities.length) {
          // Trigger analysis at critical threshold
          runOperationsAnalysis(true);
          return;
        }

        const d = densities[step - 1];
        const wt = waitTimes[step - 1];
        const st = statuses[step - 1];

        setGates(prev => prev.map(g => {
          if (g.id === 'gate-c') {
            return {
              ...g,
              crowdDensity: d,
              status: st,
              avgWaitMinutes: wt,
              flowRatePerMin: Math.round(150 + d * 1.5)
            };
          }
          return g;
        }));

        setZones(prev => prev.map(z => {
          if (z.id === 'zone-b') {
            const nextDensity = Math.round(58 + (d - 45) * 0.7);
            return {
              ...z,
              crowdDensity: nextDensity,
              status: st,
              trend10Min: step * 3,
              fanQueriesCount: z.fanQueriesCount + 15,
              openIncidentsCount: step >= 3 ? 2 : z.openIncidentsCount
            };
          }
          return z;
        }));

        addLiveEvent('ops', `Gate C density increased to ${d}%`, `Wait time is now ${wt} min (${st})`);
        
        if (step === 2) {
          addLiveEvent('query', '14 fan navigation queries registered targeting Gate C');
        }
        if (step === 3) {
          addLiveEvent('ops', 'Volunteer report: Queue overflow in Corridor B2');
          // Trigger operations analysis when transitioning to HIGH
          runOperationsAnalysis(true);
        }

        step++;
        surgeTimerRef.current = setTimeout(runSurgeStep, 4000);
      };

      surgeTimerRef.current = setTimeout(runSurgeStep, 4000);
    } 
    
    else if (scenarioId === 'medical-emergency') {
      const medicalIncident: Incident = {
        id: `inc-med-${Date.now()}`,
        zoneId: 'zone-b',
        type: 'medical',
        severity: 'high',
        description: 'Fan reports dizzy feeling / potential heat distress at Section 118',
        location: 'Section 118',
        timestamp: simulationTime,
        status: 'reported'
      };
      setIncidents([medicalIncident]);
      setZones(prev => prev.map(z => z.id === 'zone-b' ? { ...z, openIncidentsCount: z.openIncidentsCount + 1 } : z));
      addLiveEvent('incident', 'Medical Incident reported at Section 118', 'First-aid squad M1 dispatched');

      // Trigger analysis immediately for incident
      setTimeout(() => runOperationsAnalysis(true), 500);
    }

    else if (scenarioId === 'accessibility-help') {
      addLiveEvent('ops', 'Accessibility assistance request in Zone D (elevator queue)');
      setZones(prev => prev.map(z => z.id === 'zone-d' ? { ...z, fanQueriesCount: z.fanQueriesCount + 20 } : z));
      setTimeout(() => runOperationsAnalysis(true), 500);
    }

    else if (scenarioId === 'post-match-surge') {
      setGates(prev => prev.map(g => ({
        ...g,
        crowdDensity: g.id === 'gate-a' ? 78 : g.id === 'gate-b' ? 82 : g.id === 'gate-c' ? 88 : 72,
        status: 'HIGH',
        avgWaitMinutes: g.id === 'gate-c' ? 30 : 20
      })));
      setZones(prev => prev.map(z => ({
        ...z,
        crowdDensity: 82,
        status: 'HIGH',
        trend10Min: 15
      })));
      addLiveEvent('ops', 'Post-Match Egress Surge initiated: 72k+ fans moving toward exits');
      setTimeout(() => runOperationsAnalysis(true), 500);
    }
  };

  // Deterministic Action Executor consumes AI recommendedActions
  const applyActionPlan = () => {
    setActionPlanState('applying');
    
    setTimeout(() => {
      setActionPlanApplied(true);
      setActionPlanState('applied');

      addLiveEvent('ai', 'AI Action Plan applied successfully');

      const rawActions = (recommendation as any)?.rawActions || [];

      if (rawActions.length > 0) {
        rawActions.forEach((act: any) => {
          const actionType = act.action;
          const target = act.targetId;
          const reason = act.reason;

          if (actionType === 'REDIRECT_FAN_ROUTES') {
            // Apply redirection rules in local states
            setGates(prev => prev.map(g => {
              if (g.id === 'gate-c') {
                return { ...g, crowdDensity: 55, status: 'ELEVATED', avgWaitMinutes: 10 };
              }
              if (g.id === 'gate-d') {
                return { ...g, crowdDensity: 46, status: 'NORMAL', avgWaitMinutes: 6 };
              }
              return g;
            }));

            setZones(prev => prev.map(z => {
              if (z.id === 'zone-b') {
                return { ...z, crowdDensity: 65, status: 'ELEVATED', trend10Min: -2, openIncidentsCount: 0 };
              }
              return z;
            }));

            addLiveEvent('ops', `Fan routing policy updated (Gate D prioritized). Target: ${target}`, reason);
          } 
          
          else if (actionType === 'DEPLOY_VOLUNTEERS') {
            addLiveEvent('ops', `Deployed ${act.quantity || 4} volunteers to target: ${target}`, reason);
          } 
          
          else if (actionType === 'UPDATE_DIGITAL_GUIDANCE') {
            addLiveEvent('system', `Digital signages updated for target: ${target}`, reason);
          } 
          
          else if (actionType === 'MONITOR') {
            addLiveEvent('ops', `Continuous surveillance active for target: ${target}`);
          }

          else if (actionType === 'REQUEST_SECURITY_REVIEW') {
            addLiveEvent('incident', `Security team dispatched to target: ${target}`, reason);
          }

          else if (actionType === 'REQUEST_MEDICAL_RESPONSE') {
            addLiveEvent('incident', `Medical response dispatched to target: ${target}`, reason);
            setIncidents(prev => prev.map(i => i.type === 'medical' ? { ...i, status: 'dispatched' } : i));
          }
        });
      } else {
        // Fallback hardcoded executor if no structured recommendations are present
        if (activeScenario === 'gate-c-surge') {
          setGates(prev => prev.map(g => g.id === 'gate-c' ? { ...g, crowdDensity: 55, status: 'ELEVATED', avgWaitMinutes: 10 } : g));
        }
      }

      setRecommendation(prev => prev ? { ...prev, applied: true, appliedTimestamp: simulationTime } : null);
      setAlerts([]);
    }, 1500);
  };

  return (
    <StadiumStateContext.Provider
      value={{
        zones,
        gates,
        incidents,
        alerts,
        recommendation,
        events,
        activeScenario,
        isSimulating,
        simulationTime,
        fanContext,
        selectedZoneId,
        actionPlanApplied,
        actionPlanState,
        chartData,
        opsAnalyzing,
        lastAnalysisTime,
        isFallbackActive,
        activeModel,
        triggerScenario,
        applyActionPlan,
        addLiveEvent,
        setSelectedZoneId,
        resetSimulation,
        runOperationsAnalysis
      }}
    >
      {children}
    </StadiumStateContext.Provider>
  );
};
