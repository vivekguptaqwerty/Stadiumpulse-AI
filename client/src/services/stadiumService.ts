import type { StadiumZone, Gate, FanContext, LiveEvent, OperationalState } from '../types';

export const INITIAL_ZONES: StadiumZone[] = [
  {
    id: 'zone-a',
    name: 'Zone A (West Concourse)',
    status: 'NORMAL',
    crowdDensity: 42,
    trend10Min: 2,
    fanQueriesCount: 28,
    openIncidentsCount: 0
  },
  {
    id: 'zone-b',
    name: 'Zone B (East Concourse)',
    status: 'ELEVATED',
    crowdDensity: 58,
    trend10Min: 8,
    fanQueriesCount: 84,
    openIncidentsCount: 1
  },
  {
    id: 'zone-c',
    name: 'Zone C (North Endzone)',
    status: 'NORMAL',
    crowdDensity: 35,
    trend10Min: -1,
    fanQueriesCount: 15,
    openIncidentsCount: 0
  },
  {
    id: 'zone-d',
    name: 'Zone D (South Endzone)',
    status: 'NORMAL',
    crowdDensity: 48,
    trend10Min: 4,
    fanQueriesCount: 42,
    openIncidentsCount: 0
  }
];

export const INITIAL_GATES: Gate[] = [
  {
    id: 'gate-a',
    name: 'Gate A',
    status: 'NORMAL',
    crowdDensity: 38,
    avgWaitMinutes: 5,
    flowRatePerMin: 120
  },
  {
    id: 'gate-b',
    name: 'Gate B',
    status: 'NORMAL',
    crowdDensity: 45,
    avgWaitMinutes: 8,
    flowRatePerMin: 140
  },
  {
    id: 'gate-c',
    name: 'Gate C',
    status: 'ELEVATED',
    crowdDensity: 61,
    avgWaitMinutes: 18,
    flowRatePerMin: 210
  },
  {
    id: 'gate-d',
    name: 'Gate D',
    status: 'NORMAL',
    crowdDensity: 30,
    avgWaitMinutes: 4,
    flowRatePerMin: 90
  }
];

export const INITIAL_EVENTS: LiveEvent[] = [
  {
    id: 'ev-1',
    timestamp: '15:40:05',
    category: 'system',
    message: 'StadiumPulse AI system initialized successfully',
    detail: 'All sensors and intelligence layers online'
  },
  {
    id: 'ev-2',
    timestamp: '15:40:20',
    category: 'ops',
    message: 'Gate C queue monitoring sensors calibrated',
    detail: 'Optical density reading active'
  },
  {
    id: 'ev-3',
    timestamp: '15:41:10',
    category: 'ai',
    message: 'AI Crowd flow optimizer activated',
    detail: 'Predictive routing algorithms active'
  }
];

export const MOCK_FAN_CONTEXT: FanContext = {
  stadiumName: 'MetLife Stadium',
  currentLocation: 'Section 118',
  level: 'Level 2',
  seatDetails: '118 • Row 14 • Seat 22',
  username: 'Alex'
};

export const getStatusColorClass = (status: OperationalState): string => {
  switch (status) {
    case 'NORMAL':
      return 'text-brand-accent bg-brand-accent/10 border-brand-accent/20';
    case 'ELEVATED':
      return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20';
    case 'HIGH':
      return 'text-brand-orange bg-brand-orange/10 border-brand-orange/20';
    case 'CRITICAL':
      return 'text-brand-danger bg-brand-danger/10 border-brand-danger/20';
  }
};

export const stadiumService = {
  getInitialZones: () => [...INITIAL_ZONES],
  getInitialGates: () => [...INITIAL_GATES],
  getInitialEvents: () => [...INITIAL_EVENTS],
  getFanContext: () => ({ ...MOCK_FAN_CONTEXT })
};
