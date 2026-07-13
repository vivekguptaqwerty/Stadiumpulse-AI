import { FanGroundedResponse, FanRequestClassification, OpsAnalysisResponse } from '../types';

export const mockFallbackService = {
  // Mock Stage 1 classification
  classifyFanRequest: (message: string): FanRequestClassification => {
    const msg = message.toLowerCase();
    
    if (msg.includes('dizzy') || msg.includes('medical') || msg.includes('heart') || msg.includes('father')) {
      return {
        intent: 'MEDICAL_ASSISTANCE',
        urgency: 'HIGH',
        detectedLanguage: 'en',
        needsImmediateAssistance: true,
        requestedFacilityTypes: ['MEDICAL'],
        accessibilityNeed: false,
        querySummary: 'Fan reports that their father is feeling dizzy / needs medical aid.'
      };
    }

    if (msg.includes('gate c') || msg.includes('gate') || msg.includes('entry') || msg.includes('how to get in')) {
      return {
        intent: 'NAVIGATION',
        urgency: 'MEDIUM',
        detectedLanguage: 'en',
        needsImmediateAssistance: false,
        requestedFacilityTypes: ['GATE'],
        accessibilityNeed: false,
        querySummary: 'Fan is looking for navigation instructions to Gate C.'
      };
    }

    if (msg.includes('restroom') || msg.includes('bathroom') || msg.includes('baño') || msg.includes('toilet')) {
      return {
        intent: 'FACILITY_SEARCH',
        urgency: 'LOW',
        detectedLanguage: msg.includes('baño') ? 'es' : 'en',
        needsImmediateAssistance: false,
        requestedFacilityTypes: ['RESTROOM'],
        accessibilityNeed: false,
        querySummary: 'Fan is searching for the nearest restroom.'
      };
    }

    if (msg.includes('wheelchair') || msg.includes('accessibility') || msg.includes('step-free')) {
      return {
        intent: 'ACCESSIBILITY_ASSISTANCE',
        urgency: 'LOW',
        detectedLanguage: 'en',
        needsImmediateAssistance: false,
        requestedFacilityTypes: ['ELEVATOR'],
        accessibilityNeed: true,
        querySummary: 'Fan requests a wheelchair-accessible route.'
      };
    }

    if (msg.includes('metro') || msg.includes('train') || msg.includes('transport') || msg.includes('bus')) {
      return {
        intent: 'TRANSPORT',
        urgency: 'LOW',
        detectedLanguage: msg.includes('metro') && msg.includes('kaise') ? 'hi' : 'en',
        needsImmediateAssistance: false,
        requestedFacilityTypes: ['TRANSIT'],
        accessibilityNeed: false,
        querySummary: 'Fan is asking for train station transport information.'
      };
    }

    if (msg.includes('lost') || msg.includes('missing') || msg.includes('child') || msg.includes('find my son')) {
      return {
        intent: 'MISSING_PERSON',
        urgency: 'HIGH',
        detectedLanguage: 'en',
        needsImmediateAssistance: true,
        requestedFacilityTypes: [],
        accessibilityNeed: false,
        querySummary: 'Fan reports a missing child or person.'
      };
    }

    return {
      intent: 'GENERAL_STADIUM_HELP',
      urgency: 'LOW',
      detectedLanguage: 'en',
      needsImmediateAssistance: false,
      requestedFacilityTypes: [],
      accessibilityNeed: false,
      querySummary: 'General support query.'
    };
  },

  // Mock Stage 3 Grounded Response
  getGroundedFanResponse: (
    message: string, 
    classification: FanRequestClassification
  ): FanGroundedResponse => {
    const intent = classification.intent;
    const detectedLang = classification.detectedLanguage;

    // Multilingual response logic
    if (detectedLang === 'es' && intent === 'FACILITY_SEARCH') {
      return {
        responseType: 'FACILITY_GUIDANCE',
        title: 'Baños más cercanos',
        message: 'El baño más cercano está detrás de la Sección 116 (Nivel 2). Actualmente tiene un tiempo de espera bajo y es totalmente accesible.',
        urgency: 'LOW',
        actions: [
          { type: 'START_SAFE_ROUTE', label: 'Iniciar ruta segura' }
        ],
        groundedFacilityIds: ['RESTROOM_SEC116']
      };
    }

    if (detectedLang === 'hi' && intent === 'TRANSPORT') {
      return {
        responseType: 'TRANSPORT_GUIDANCE',
        title: 'रेलवे मेट्रो मार्ग',
        message: 'मैच के बाद एनजे ट्रांजिट मीडोलैंड्स स्टेशन की ओर जाने वाला मार्ग खुला है। कृपया गेट डी से बाहर निकलें और पूर्व की ओर बने पैदल मार्ग का अनुसरण करें।',
        routeGuidance: 'गेट डी की ओर जाएं और मुख्य ट्रेन लिंक रैंप का पालन करें।',
        urgency: 'LOW',
        actions: [
          { type: 'START_SAFE_ROUTE', label: 'मार्ग प्रारंभ करें' },
          { type: 'VIEW_TRANSPORT_OPTIONS', label: 'परिवहन समय सारणी' }
        ],
        groundedFacilityIds: ['gate-d', 'TRANSIT_METRO']
      };
    }

    switch (intent) {
      case 'MEDICAL_ASSISTANCE':
        return {
          responseType: 'EMERGENCY_GUIDANCE',
          title: 'Medical assistance nearby (Fallback)',
          message: 'The nearest medical station is M1 near Section 120, approximately 2 minutes away.',
          routeGuidance: 'Please avoid Corridor B2 due to heavy crowding and walk along the east concourse toward Section 120.',
          urgency: 'HIGH',
          actions: [
            { type: 'START_SAFE_ROUTE', label: 'Start Safe Route' },
            { type: 'REQUEST_STAFF_ASSISTANCE', label: 'Request Staff Assistance' }
          ],
          groundedFacilityIds: ['MEDICAL_M1']
        };

      case 'NAVIGATION':
        return {
          responseType: 'ROUTE_GUIDANCE',
          title: 'Gate C Crowded: Alternative Route Active (Fallback)',
          message: 'Gate C is currently experiencing heavier than normal traffic. I recommend Gate D via the east concourse. The alternate route is approximately 3 minutes longer but may reduce your total wait time.',
          routeGuidance: 'Proceed toward Gate D via the south concourse. Avoid Corridor B2 if possible.',
          urgency: 'MEDIUM',
          actions: [
            { type: 'START_SAFE_ROUTE', label: 'Start Safe Route' },
            { type: 'VIEW_GATE_STATUS', label: 'View Gate Status' }
          ],
          groundedFacilityIds: ['gate-c', 'gate-d']
        };

      case 'FACILITY_SEARCH':
        return {
          responseType: 'FACILITY_GUIDANCE',
          title: 'Nearest Restroom (Fallback)',
          message: 'The nearest restroom is located behind Section 116 (Level 2). It currently has a low wait time (under 1 minute) and is fully wheelchair accessible.',
          urgency: 'LOW',
          actions: [
            { type: 'START_SAFE_ROUTE', label: 'Guide Me There' }
          ],
          groundedFacilityIds: ['RESTROOM_SEC116']
        };

      case 'ACCESSIBILITY_ASSISTANCE':
        return {
          responseType: 'ACCESSIBILITY_GUIDANCE',
          title: 'Wheelchair Accessible Routes (Fallback)',
          message: 'Elevator E3 is located near Section 119, offering step-free access to Level 3. A low-crowd path has been generated to bypass Corridor B2.',
          routeGuidance: 'Follow the wheelchair-friendly path toward Section 119 and use Elevator E3.',
          urgency: 'LOW',
          actions: [
            { type: 'START_SAFE_ROUTE', label: 'Start Accessible Route' }
          ],
          groundedFacilityIds: ['ELEVATOR_E3']
        };

      case 'MISSING_PERSON':
        return {
          responseType: 'EMERGENCY_GUIDANCE',
          title: 'Guest Assistance Center Support',
          message: 'If your child is missing, please contact the nearest security staff immediately or report to the Guest Services Desk located behind Section 118.',
          routeGuidance: 'Follow guest safety protocols. Please report this incident directly using the action button.',
          urgency: 'HIGH',
          actions: [
            { type: 'REQUEST_STAFF_ASSISTANCE', label: 'Request Staff Assistance' },
            { type: 'REPORT_INCIDENT', label: 'Report Incident Now' }
          ],
          groundedFacilityIds: []
        };

      default:
        return {
          responseType: 'GUIDANCE',
          title: 'Tournament Companion Support (Fallback)',
          message: 'I am ready to guide you. Ask me about gate traffic, the nearest restroom, accessible pathways, food concessions, or transport options.',
          urgency: 'LOW',
          actions: [],
          groundedFacilityIds: []
        };
    }
  },

  // Mock Ops analysis snapshot
  analyzeOperations: (snapshot: any): OpsAnalysisResponse => {
    // Check if Gate C density is high or a scenario is active
    const gateC = snapshot.gates?.find((g: any) => g.id === 'gate-c');
    const isSurge = snapshot.activeScenario === 'gate-c-surge' || (gateC && gateC.crowdDensity >= 70);
    const isMedical = snapshot.activeScenario === 'medical-emergency';

    if (isSurge) {
      return {
        riskDetected: true,
        riskLevel: 'HIGH',
        title: 'Emerging congestion risk at Gate C (Fallback)',
        summary: 'Gate C crowd density has increased 34% over the last 10 minutes. Navigation requests toward Gate C are also rising.',
        affectedAreaIds: ['gate-c', 'zone-b', 'corridor-b2'],
        observedSignals: [
          { signal: 'Gate C crowd density', observation: 'Increased to 72%+' },
          { signal: 'Navigation demand', observation: '142 active queries toward Gate C' }
        ],
        prediction: {
          outcome: 'CRITICAL_CONGESTION',
          estimatedMinutes: 12,
          confidence: 'MEDIUM'
        },
        recommendedActions: [
          {
            action: 'REDIRECT_FAN_ROUTES',
            targetId: 'gate-d',
            quantity: null,
            reason: 'Gate D currently has substantially lower crowd pressure'
          },
          {
            action: 'DEPLOY_VOLUNTEERS',
            targetId: 'corridor-b2',
            quantity: 4,
            reason: 'Support crowd redirection and fan guidance'
          },
          {
            action: 'UPDATE_DIGITAL_GUIDANCE',
            targetId: 'zone-b',
            quantity: null,
            reason: 'Reduce additional movement toward Gate C'
          }
        ],
        reassessmentMinutes: 5
      };
    }

    if (isMedical) {
      return {
        riskDetected: true,
        riskLevel: 'HIGH',
        title: 'Active medical incident in Zone B (Fallback)',
        summary: 'First aid dispatch in Section 118 requires immediate access routing and crowd control.',
        affectedAreaIds: ['zone-b', 'corridor-b2'],
        observedSignals: [
          { signal: 'Medical report', observation: 'Distress at Section 118' },
          { signal: 'Corridor crowding', observation: 'Zone B concourse traffic elevated' }
        ],
        prediction: {
          outcome: 'RESPONSE_DELAY',
          estimatedMinutes: 5,
          confidence: 'HIGH'
        },
        recommendedActions: [
          {
            action: 'REDIRECT_FAN_ROUTES',
            targetId: 'gate-d',
            quantity: null,
            reason: 'Avoid corridor B2 to clear emergency path'
          },
          {
            action: 'DEPLOY_VOLUNTEERS',
            targetId: 'corridor-b2',
            quantity: 2,
            reason: 'Clear the path for first-aid responders'
          }
        ],
        reassessmentMinutes: 2
      };
    }

    // Default NORMAL state
    return {
      riskDetected: false,
      riskLevel: 'NORMAL',
      title: 'Nominal operations (Fallback)',
      summary: 'All stadium metrics are within safety margins.',
      affectedAreaIds: [],
      observedSignals: [],
      recommendedActions: [
        {
          action: 'MONITOR',
          targetId: 'all-gates',
          quantity: null,
          reason: 'Maintain continuous observations'
        }
      ],
      reassessmentMinutes: 10
    };
  }
};
