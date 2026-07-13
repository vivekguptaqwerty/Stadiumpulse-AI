import { Type } from '@google/genai';

export const opsAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    riskDetected: {
      type: Type.BOOLEAN,
      description: 'Whether any operational anomaly, congestion surge, safety or queue bottleneck risk is identified.'
    },
    riskLevel: {
      type: Type.STRING,
      enum: ['NORMAL', 'ELEVATED', 'HIGH', 'CRITICAL'],
      description: 'The overall risk level evaluated.'
    },
    title: {
      type: Type.STRING,
      description: 'A summary headline for the operational alert brief.'
    },
    summary: {
      type: Type.STRING,
      description: 'A 2-3 sentence overview describing the emerging risk.'
    },
    affectedAreaIds: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING
      },
      description: 'List of affected zones, gates or corridors (e.g. gate-c, zone-b, corridor-b2).'
    },
    observedSignals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          signal: {
            type: Type.STRING,
            description: 'The indicator name (e.g. Gate C density, active navigation queries).'
          },
          observation: {
            type: Type.STRING,
            description: 'The observed trend or values (e.g. +34% over 10m).'
          }
        },
        required: ['signal', 'observation']
      },
      description: 'Specific data points and anomalies observed in the state.'
    },
    prediction: {
      type: Type.OBJECT,
      properties: {
        outcome: {
          type: Type.STRING,
          description: 'The predicted outcome if no mitigation actions are taken.'
        },
        estimatedMinutes: {
          type: Type.INTEGER,
          description: 'Approximate time in minutes until critical threshold is reached.'
        },
        confidence: {
          type: Type.STRING,
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'The confidence level of this prediction.'
        }
      },
      required: ['outcome', 'estimatedMinutes', 'confidence'],
      description: 'Predictive timeline output.'
    },
    recommendedActions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            enum: [
              'REDIRECT_FAN_ROUTES',
              'DEPLOY_VOLUNTEERS',
              'UPDATE_DIGITAL_GUIDANCE',
              'OPEN_ALTERNATE_GATE',
              'REQUEST_SECURITY_REVIEW',
              'REQUEST_MEDICAL_RESPONSE',
              'MONITOR',
              'NO_ACTION'
            ],
            description: 'The recommended mitigation action type.'
          },
          targetId: {
            type: Type.STRING,
            description: 'The target gate, zone, corridor, or area (e.g. gate-d, corridor-b2).'
          },
          quantity: {
            type: Type.INTEGER,
            description: 'Optional count (e.g. number of volunteers to deploy). Use null if not applicable.'
          },
          reason: {
            type: Type.STRING,
            description: 'The rationale for recommending this action.'
          }
        },
        required: ['action', 'targetId', 'reason']
      },
      description: 'Mitigation action items. Only recommend existing stadium gates, corridors, or zones.'
    },
    reassessmentMinutes: {
      type: Type.INTEGER,
      description: 'Recommended timeframe in minutes to run the next AI reassessment scan.'
    }
  },
  required: [
    'riskDetected',
    'riskLevel',
    'title',
    'summary',
    'affectedAreaIds',
    'observedSignals',
    'recommendedActions',
    'reassessmentMinutes'
  ]
};
