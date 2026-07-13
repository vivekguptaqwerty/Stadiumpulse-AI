import { Type } from '@google/genai';

export const fanClassifierSchema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: [
        'NAVIGATION',
        'FACILITY_SEARCH',
        'ACCESSIBILITY_ASSISTANCE',
        'MEDICAL_ASSISTANCE',
        'SAFETY_ASSISTANCE',
        'MISSING_PERSON',
        'TRANSPORT',
        'FOOD_AND_BEVERAGE',
        'GENERAL_STADIUM_HELP',
        'UNKNOWN'
      ],
      description: 'The classified primary intent of the fan request.'
    },
    urgency: {
      type: Type.STRING,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      description: 'The interpreted urgency level of the request.'
    },
    detectedLanguage: {
      type: Type.STRING,
      description: 'The language code (e.g. en, es, fr, hi, pt) detected from the input.'
    },
    needsImmediateAssistance: {
      type: Type.BOOLEAN,
      description: 'Set to true if this represents an active safety, emergency or medical distress issue.'
    },
    requestedFacilityTypes: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        enum: ['RESTROOM', 'MEDICAL', 'ELEVATOR', 'CONCESSION', 'GATE', 'TRANSIT']
      },
      description: 'Any requested facility types detected from the message.'
    },
    accessibilityNeed: {
      type: Type.BOOLEAN,
      description: 'Whether the request indicates an accessibility or mobility impairment need.'
    },
    querySummary: {
      type: Type.STRING,
      description: 'A brief 1-sentence English summary of the query.'
    }
  },
  required: [
    'intent',
    'urgency',
    'detectedLanguage',
    'needsImmediateAssistance',
    'requestedFacilityTypes',
    'accessibilityNeed',
    'querySummary'
  ]
};
