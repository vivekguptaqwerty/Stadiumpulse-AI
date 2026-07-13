export type OperationalState = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface StadiumZone {
  id: string; // 'zone-a', 'zone-b', 'zone-c', 'zone-d'
  name: string;
  status: OperationalState;
  crowdDensity: number;
  trend10Min: number;
  fanQueriesCount: number;
  openIncidentsCount: number;
}

export interface Gate {
  id: string; // 'gate-a', 'gate-b', 'gate-c', 'gate-d'
  name: string;
  status: OperationalState;
  crowdDensity: number;
  avgWaitMinutes: number;
  flowRatePerMin: number;
}

export interface Incident {
  id: string;
  zoneId: string;
  type: 'medical' | 'crowding' | 'security' | 'accessibility' | 'infrastructure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  timestamp: string;
  status: 'reported' | 'dispatched' | 'active' | 'resolved';
}

export interface OperationalAlert {
  id: string;
  title: string;
  type: 'congestion' | 'medical' | 'security' | 'accessibility';
  severity: 'info' | 'warning' | 'critical';
  description: string;
  prediction?: string;
  timestamp: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  alertId?: string;
  description: string;
  prediction: string;
  actions: string[];
  applied: boolean;
  appliedTimestamp?: string;
}

export interface LiveEvent {
  id: string;
  timestamp: string;
  category: 'system' | 'incident' | 'query' | 'ops' | 'ai';
  message: string;
  detail?: string;
}

export interface FanContext {
  stadiumName: string;
  currentLocation: string;
  level: string;
  seatDetails: string;
  username: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  affectedSystems: string[];
}

export interface FanRequestClassification {
  intent: 'NAVIGATION' | 'FACILITY_SEARCH' | 'ACCESSIBILITY_ASSISTANCE' | 'MEDICAL_ASSISTANCE' | 'SAFETY_ASSISTANCE' | 'MISSING_PERSON' | 'TRANSPORT' | 'FOOD_AND_BEVERAGE' | 'GENERAL_STADIUM_HELP' | 'UNKNOWN';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedLanguage: string;
  needsImmediateAssistance: boolean;
  requestedFacilityTypes: string[];
  accessibilityNeed: boolean;
  querySummary: string;
}

export interface FanGroundedResponse {
  responseType: 'GUIDANCE' | 'ROUTE_GUIDANCE' | 'FACILITY_GUIDANCE' | 'ACCESSIBILITY_GUIDANCE' | 'EMERGENCY_GUIDANCE' | 'TRANSPORT_GUIDANCE' | 'CLARIFICATION';
  title: string;
  message: string;
  routeGuidance?: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actions: {
    type: 'START_SAFE_ROUTE' | 'VIEW_GATE_STATUS' | 'REQUEST_STAFF_ASSISTANCE' | 'VIEW_FACILITY' | 'VIEW_TRANSPORT_OPTIONS' | 'REPORT_INCIDENT' | 'NONE';
    label: string;
  }[];
  groundedFacilityIds: string[];
  meta?: {
    provider: 'gemini' | 'mock';
    fallbackUsed: boolean;
    model: string;
  };
}

export interface OpsAnalysisResponse {
  riskDetected: boolean;
  riskLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  title: string;
  summary: string;
  affectedAreaIds: string[];
  observedSignals: {
    signal: string;
    observation: string;
  }[];
  prediction?: {
    outcome: string;
    estimatedMinutes: number;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  recommendedActions: {
    action: 'REDIRECT_FAN_ROUTES' | 'DEPLOY_VOLUNTEERS' | 'UPDATE_DIGITAL_GUIDANCE' | 'OPEN_ALTERNATE_GATE' | 'REQUEST_SECURITY_REVIEW' | 'REQUEST_MEDICAL_RESPONSE' | 'MONITOR' | 'NO_ACTION';
    targetId: string;
    quantity: number | null;
    reason: string;
  }[];
  reassessmentMinutes: number;
  meta?: {
    provider: 'gemini' | 'mock';
    fallbackUsed: boolean;
    model: string;
  };
}

