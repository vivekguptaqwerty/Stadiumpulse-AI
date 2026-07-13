import type { AIRecommendation, OperationalAlert } from '../types';

export const MOCK_OPERATIONAL_ALERT: OperationalAlert = {
  id: 'alert-1',
  title: 'Emerging congestion risk',
  type: 'congestion',
  severity: 'warning',
  description: 'Gate C crowd density has increased 34% over the last 10 minutes. Navigation requests toward Gate C are also rising.',
  prediction: 'At the current growth rate, Gate C may reach critical congestion within approximately 12 minutes.',
  timestamp: '15:42:00'
};

export const MOCK_RECOMMENDATION: AIRecommendation = {
  id: 'rec-1',
  title: 'Optimize Gate C Flow & Reroute',
  alertId: 'alert-1',
  description: 'Redirect new navigation requests away from Gate C toward Gate D and deploy auxiliary crowd control staff to Corridor B2.',
  prediction: 'Executing this plan is predicted to reduce Gate C peak density by 22% and stabilize traffic within 8 minutes.',
  actions: [
    'Redirect new fan routes through Gate D.',
    'Deploy 4 volunteers to Corridor B2.',
    'Update nearby digital guidance.',
    'Reassess conditions in 5 minutes.'
  ],
  applied: false
};

export const intelligenceService = {
  getOperationalAlert: (): OperationalAlert => ({ ...MOCK_OPERATIONAL_ALERT }),
  getRecommendation: (): AIRecommendation => ({ ...MOCK_RECOMMENDATION }),
  
  // Method to get emergency responses for the Fan Assistant
  getFanQueryResponse: (queryText: string) => {
    const cleanQuery = queryText.toLowerCase();
    
    if (cleanQuery.includes('gate c')) {
      return {
        answer: "Gate C is currently experiencing heavier than normal traffic. I recommend Gate D via the east concourse. The alternate route is approximately 3 minutes longer but may reduce your total wait time.",
        metadata: {
          context: "Live crowd conditions considered",
          updated: "Route updated moments ago"
        },
        actions: [
          { label: "Start Safe Route", actionType: "start_route" },
          { label: "View Gate Status", actionType: "view_status" }
        ]
      };
    } else if (cleanQuery.includes('dizzy') || cleanQuery.includes('medical') || cleanQuery.includes('father')) {
      return {
        answer: "The nearest medical station is M1 near Section 120, approximately 2 minutes away. Avoid Corridor B2 due to heavy crowding and use the east concourse.",
        metadata: {
          context: "Emergency dispatch informed",
          updated: "Medical team alert triggered"
        },
        actions: [
          { label: "Start Safe Route", actionType: "start_route_emergency" },
          { label: "Request Staff Assistance", actionType: "request_assistance" }
        ],
        emergency: true
      };
    } else if (cleanQuery.includes('restroom')) {
      return {
        answer: "The nearest restroom is located behind Section 116 (Level 2). It currently has a low wait time (under 1 minute) and is fully wheelchair accessible.",
        metadata: {
          context: "Facility status active",
          updated: "Wait times refreshed 1 min ago"
        },
        actions: [
          { label: "Guide Me There", actionType: "start_route" }
        ]
      };
    } else if (cleanQuery.includes('food') || cleanQuery.includes('drink')) {
      return {
        answer: "For Food & Drinks, concessions near Section 114 (Touchdown Grill) and Section 122 (Punt & Pass Pizza) are open. Section 114 currently has shorter lines (approx 4 min wait).",
        metadata: {
          context: "Queue sensor active",
          updated: "Wait times based on live sensor data"
        },
        actions: [
          { label: "View Menu", actionType: "view_menu" },
          { label: "Navigate to Section 114", actionType: "start_route" }
        ]
      };
    } else if (cleanQuery.includes('accessibility')) {
      return {
        answer: "Elevator E3 is located near Section 119, offering step-free access to Level 3. Standard routes through Corridor B2 are busy, so an accessible, low-crowd path has been generated.",
        metadata: {
          context: "Accessibility layer active",
          updated: "Step-free routing active"
        },
        actions: [
          { label: "Start Accessible Route", actionType: "start_route" }
        ]
      };
    } else {
      return {
        answer: "I am ready to guide you. Ask me about gate traffic, the nearest restroom, accessible pathways, food concessions, or transport options.",
        metadata: {
          context: "StadiumPulse Assistant online",
          updated: "Real-time updates active"
        },
        actions: []
      };
    }
  }
};
