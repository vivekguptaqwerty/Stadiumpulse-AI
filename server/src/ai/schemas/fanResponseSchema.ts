import { Type } from '@google/genai';

export const fanResponseSchema = {
  type: Type.OBJECT,
  properties: {
    responseType: {
      type: Type.STRING,
      enum: [
        'GUIDANCE',
        'ROUTE_GUIDANCE',
        'FACILITY_GUIDANCE',
        'ACCESSIBILITY_GUIDANCE',
        'EMERGENCY_GUIDANCE',
        'TRANSPORT_GUIDANCE',
        'CLARIFICATION'
      ],
      description: 'The type of guidance response generated.'
    },
    title: {
      type: Type.STRING,
      description: 'A short descriptive title for the guidance card.'
    },
    message: {
      type: Type.STRING,
      description: 'The primary message response to display to the fan. Must be generated in their selected or detected language.'
    },
    routeGuidance: {
      type: Type.STRING,
      description: 'Optional specific step-by-step route directions. Must bypass congested/closed corridors if reported in the context.'
    },
    urgency: {
      type: Type.STRING,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      description: 'The urgency level matching the query context.'
    },
    actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: [
              'START_SAFE_ROUTE',
              'VIEW_GATE_STATUS',
              'REQUEST_STAFF_ASSISTANCE',
              'VIEW_FACILITY',
              'VIEW_TRANSPORT_OPTIONS',
              'REPORT_INCIDENT',
              'NONE'
            ],
            description: 'Action execution type.'
          },
          label: {
            type: Type.STRING,
            description: 'The button text for the UI.'
          }
        },
        required: ['type', 'label']
      },
      description: 'Allowable actions to present to the fan.'
    },
    groundedFacilityIds: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING
      },
      description: 'List of matching facility IDs referenced in the response (e.g. MEDICAL_M1, RESTROOM_SEC116).'
    }
  },
  required: [
    'responseType',
    'title',
    'message',
    'urgency',
    'actions',
    'groundedFacilityIds'
  ]
};
