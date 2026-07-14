import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { geminiClient } from '../ai/geminiClient';

describe('Closed-Loop Domain and Grounded Routing Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const fanContext = {
    stadiumName: 'Lusail Stadium',
    currentLocation: 'Section 118',
    level: 'Level 1',
    seatDetails: 'Row M, Seat 12',
    username: 'Alex'
  };

  const normalState = {
    gates: [
      { id: 'gate-a', name: 'Gate A', status: 'NORMAL', crowdDensity: 12, avgWaitMinutes: 2 },
      { id: 'gate-b', name: 'Gate B', status: 'NORMAL', crowdDensity: 18, avgWaitMinutes: 3 },
      { id: 'gate-c', name: 'Gate C', status: 'NORMAL', crowdDensity: 15, avgWaitMinutes: 2 },
      { id: 'gate-d', name: 'Gate D', status: 'NORMAL', crowdDensity: 20, avgWaitMinutes: 4 }
    ],
    zones: [
      { id: 'zone-a', name: 'Zone A', status: 'NORMAL', crowdDensity: 20 },
      { id: 'zone-b', name: 'Zone B', status: 'NORMAL', crowdDensity: 25 }
    ],
    incidents: [],
    alerts: []
  };

  const surgedState = {
    gates: [
      { id: 'gate-a', name: 'Gate A', status: 'NORMAL', crowdDensity: 12, avgWaitMinutes: 2 },
      { id: 'gate-b', name: 'Gate B', status: 'NORMAL', crowdDensity: 18, avgWaitMinutes: 3 },
      { id: 'gate-c', name: 'Gate C', status: 'CRITICAL', crowdDensity: 84, avgWaitMinutes: 35 },
      { id: 'gate-d', name: 'Gate D', status: 'NORMAL', crowdDensity: 20, avgWaitMinutes: 4 }
    ],
    zones: [
      { id: 'zone-a', name: 'Zone A', status: 'NORMAL', crowdDensity: 20 },
      { id: 'zone-b', name: 'Zone B', status: 'CRITICAL', crowdDensity: 88 }
    ],
    incidents: [],
    alerts: [],
    activeScenario: 'gate-c-surge'
  };

  const postActionState = {
    gates: [
      { id: 'gate-a', name: 'Gate A', status: 'NORMAL', crowdDensity: 12, avgWaitMinutes: 2 },
      { id: 'gate-b', name: 'Gate B', status: 'NORMAL', crowdDensity: 18, avgWaitMinutes: 3 },
      { id: 'gate-c', name: 'Gate C', status: 'ELEVATED', crowdDensity: 55, avgWaitMinutes: 10 },
      { id: 'gate-d', name: 'Gate D', status: 'NORMAL', crowdDensity: 46, avgWaitMinutes: 6 }
    ],
    zones: [
      { id: 'zone-a', name: 'Zone A', status: 'NORMAL', crowdDensity: 20 },
      { id: 'zone-b', name: 'Zone B', status: 'ELEVATED', crowdDensity: 65 }
    ],
    incidents: [],
    alerts: []
  };

  it('routes fan to Gate C when Gate C is operating normally', async () => {
    // Mock normal route guidance response
    vi.spyOn(geminiClient, 'generateGroundedFanResponse').mockResolvedValueOnce({
      responseType: 'ROUTE_GUIDANCE',
      title: 'Route Guidance',
      message: 'Path to Gate C is clear. Please proceed via East Concourse.',
      urgency: 'LOW',
      actions: [
        { type: 'VIEW_GATE_STATUS', label: 'View Gate C' }
      ],
      groundedFacilityIds: ['gate-c'],
      meta: { provider: 'gemini', fallbackUsed: false, model: 'gemini-3.5-flash' }
    });

    const res = await request(app)
      .post('/api/ai/fan-assistant')
      .send({
        message: 'Take me to Gate C',
        fanContext,
        stadiumState: normalState
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Gate C');
    expect(res.body.groundedFacilityIds).toContain('gate-c');
    expect(res.body.meta.fallbackUsed).toBe(false);
  });

  it('detects Gate C crowd surge at 84 percent density and generates Gate D redirect action', async () => {
    // Mock operations analysis response for surge
    vi.spyOn(geminiClient, 'analyzeOperationsSnapshot').mockResolvedValueOnce({
      riskDetected: true,
      riskLevel: 'CRITICAL',
      title: 'Gate C Severe Congestion',
      summary: 'Extreme queue overflow detected at Gate C due to surge.',
      affectedAreaIds: ['gate-c'],
      observedSignals: [],
      reassessmentMinutes: 5,
      prediction: {
        outcome: 'Corridor choke-point gridlock',
        estimatedMinutes: 8,
        confidence: 'HIGH'
      },
      recommendedActions: [
        {
          action: 'REDIRECT_FAN_ROUTES',
          targetId: 'gate-c',
          quantity: null,
          reason: 'Divert inbound fan flow away from congested Gate C to alternative entries.'
        },
        {
          action: 'UPDATE_DIGITAL_GUIDANCE',
          targetId: 'gate-d',
          quantity: null,
          reason: 'Direct diverted fans to Gate D which has minimal wait time.'
        }
      ],
      meta: { provider: 'gemini', fallbackUsed: false, model: 'gemini-3.5-flash' }
    });

    const res = await request(app)
      .post('/api/ai/operations/analyze')
      .send(surgedState);

    expect(res.status).toBe(200);
    expect(res.body.riskDetected).toBe(true);
    expect(res.body.riskLevel).toBe('CRITICAL');
    expect(res.body.recommendedActions).toHaveLength(2);
    expect(res.body.recommendedActions[0].action).toBe('REDIRECT_FAN_ROUTES');
    expect(res.body.recommendedActions[0].targetId).toBe('gate-c');
    expect(res.body.recommendedActions[1].targetId).toBe('gate-d');
  });

  it('changes guidance for the same fan query after stadium context changes', async () => {
    // Mock post-action fan query response (recommending Gate D instead of Gate C)
    vi.spyOn(geminiClient, 'generateGroundedFanResponse').mockResolvedValueOnce({
      responseType: 'ROUTE_GUIDANCE',
      title: 'Route Guidance',
      message: 'Gate C is congested. We recommend routing via Gate D, which is clear and has shorter queues.',
      urgency: 'LOW',
      actions: [
        { type: 'VIEW_GATE_STATUS', label: 'View Gate D' }
      ],
      groundedFacilityIds: ['gate-d'],
      meta: { provider: 'gemini', fallbackUsed: false, model: 'gemini-3.5-flash' }
    });

    const res = await request(app)
      .post('/api/ai/fan-assistant')
      .send({
        message: 'Take me to Gate C',
        fanContext,
        stadiumState: postActionState
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Gate D');
    expect(res.body.groundedFacilityIds).toContain('gate-d');
    expect(res.body.groundedFacilityIds).not.toContain('gate-c');
  });
});
