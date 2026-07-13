export interface Facility {
  id: string;
  name: string;
  type: 'RESTROOM' | 'MEDICAL' | 'ELEVATOR' | 'CONCESSION' | 'GATE' | 'TRANSIT';
  location: string;
  level: string;
  details: string;
}

export const STADIUM_FACILITIES: Facility[] = [
  {
    id: 'RESTROOM_SEC116',
    name: 'Restroom Section 116',
    type: 'RESTROOM',
    location: 'Section 116',
    level: 'Level 2',
    details: 'Accessible restroom with diaper changing tables, low wait time.'
  },
  {
    id: 'RESTROOM_SEC124',
    name: 'Restroom Section 124',
    type: 'RESTROOM',
    location: 'Section 124',
    level: 'Level 2',
    details: 'Standard restroom, step-free access.'
  },
  {
    id: 'MEDICAL_M1',
    name: 'First-Aid Station M1',
    type: 'MEDICAL',
    location: 'Section 120',
    level: 'Level 2',
    details: 'Equipped with defibrillators and trauma supplies. Direct access from Section 118 concourse.'
  },
  {
    id: 'MEDICAL_M2',
    name: 'First-Aid Station M2',
    type: 'MEDICAL',
    location: 'Section 106',
    level: 'Level 1',
    details: 'Primary triage station, ambulance bay connection.'
  },
  {
    id: 'ELEVATOR_E3',
    name: 'Elevator E3',
    type: 'ELEVATOR',
    location: 'Section 119',
    level: 'Level 2',
    details: 'Step-free access to Level 3 wheelchair bays.'
  },
  {
    id: 'ELEVATOR_E1',
    name: 'Elevator E1',
    type: 'ELEVATOR',
    location: 'Section 105',
    level: 'Level 1',
    details: 'Serves Suites level and Level 1 concourse.'
  },
  {
    id: 'CONCESSION_SEC114',
    name: 'Touchdown Grill',
    type: 'CONCESSION',
    location: 'Section 114',
    level: 'Level 2',
    details: 'Burgers, fries, soft drinks, and beer. Standard wait time 4 mins.'
  },
  {
    id: 'CONCESSION_SEC122',
    name: 'Punt & Pass Pizza',
    type: 'CONCESSION',
    location: 'Section 122',
    level: 'Level 2',
    details: 'Pizza slices, pretzels, cold beer. Busy concourse area.'
  },
  {
    id: 'gate-a',
    name: 'Gate A',
    type: 'GATE',
    location: 'West side',
    level: 'Level 1',
    details: 'West entrance, low crowd density.'
  },
  {
    id: 'gate-b',
    name: 'Gate B',
    type: 'GATE',
    location: 'North side',
    level: 'Level 1',
    details: 'North entrance.'
  },
  {
    id: 'gate-c',
    name: 'Gate C',
    type: 'GATE',
    location: 'East side',
    level: 'Level 1',
    details: 'Main shuttle bus dropping point, critical congestion zone.'
  },
  {
    id: 'gate-d',
    name: 'Gate D',
    type: 'GATE',
    location: 'South side',
    level: 'Level 1',
    details: 'South exit and rideshare zone access.'
  },
  {
    id: 'TRANSIT_METRO',
    name: 'NJ Transit Meadowlands Station',
    type: 'TRANSIT',
    location: 'East Concourse walkway link',
    level: 'Level 1',
    details: 'Direct trains to Secaucus Junction.'
  },
  {
    id: 'TRANSIT_RIDESHARE',
    name: 'Uber/Lyft Rideshare Zone',
    type: 'TRANSIT',
    location: 'Lot G',
    level: 'Ground level',
    details: 'Access via Gate D exit corridor.'
  }
];

export const STADIUM_AREAS = [
  'zone-a',
  'zone-b',
  'zone-c',
  'zone-d',
  'gate-a',
  'gate-b',
  'gate-c',
  'gate-d',
  'corridor-b2',
  'section-118',
  'section-120',
  'section-116',
  'section-114',
  'section-122',
  'elevator-e3',
  'medical-m1'
];

export const stadiumDataService = {
  getAllFacilities: (): Facility[] => STADIUM_FACILITIES,
  
  getFacilitiesByType: (type: string): Facility[] => {
    return STADIUM_FACILITIES.filter(f => f.type === type.toUpperCase());
  },

  isValidFacilityId: (id: string): boolean => {
    return STADIUM_FACILITIES.some(f => f.id === id);
  },

  isValidAreaId: (id: string): boolean => {
    const cleanId = id.toLowerCase().replace('_', '-');
    return STADIUM_AREAS.includes(cleanId);
  },

  resolveContext: (intent: string, preferredLanguage = 'en', stadiumState?: any): { facilities: Facility[]; areas: string[] } => {
    let facilities: Facility[] = [];
    let areas: string[] = ['zone-b', 'section-118']; // Baseline area context

    // Map base facilities first
    let baseFacilities = [...STADIUM_FACILITIES];

    // If stadiumState is passed, update details field with live status dynamically
    if (stadiumState && Array.isArray(stadiumState.gates)) {
      baseFacilities = STADIUM_FACILITIES.map(f => {
        if (f.type === 'GATE') {
          const liveGate = stadiumState.gates.find((g: any) => g.id === f.id);
          if (liveGate) {
            return {
              ...f,
              details: `${f.details} Live state: Crowd density is ${liveGate.crowdDensity}%, status is ${liveGate.status}, and average wait time is ${liveGate.avgWaitMinutes} minutes.`
            };
          }
        }
        return f;
      });
    }

    switch (intent) {
      case 'MEDICAL_ASSISTANCE':
        facilities = baseFacilities.filter(f => f.type === 'MEDICAL');
        areas = ['section-118', 'section-120', 'corridor-b2', 'medical-m1'];
        break;
      case 'NAVIGATION':
        facilities = baseFacilities.filter(f => f.type === 'GATE' || f.type === 'TRANSIT');
        areas = ['gate-c', 'gate-d', 'zone-b', 'corridor-b2'];
        break;
      case 'FACILITY_SEARCH':
        facilities = baseFacilities.filter(f => f.type === 'RESTROOM' || f.type === 'CONCESSION');
        areas = ['section-116', 'section-114', 'section-122'];
        break;
      case 'ACCESSIBILITY_ASSISTANCE':
        facilities = baseFacilities.filter(f => f.type === 'ELEVATOR' || f.type === 'RESTROOM');
        areas = ['section-119', 'elevator-e3', 'zone-d'];
        break;
      case 'FOOD_AND_BEVERAGE':
        facilities = baseFacilities.filter(f => f.type === 'CONCESSION');
        areas = ['section-114', 'section-122'];
        break;
      case 'TRANSPORT':
        facilities = baseFacilities.filter(f => f.type === 'TRANSIT' || f.id === 'gate-d');
        areas = ['gate-d', 'transit-metro', 'transit-rideshare'];
        break;
      default:
        facilities = baseFacilities.slice(0, 4); // Safe fallback general mix
    }

    return { facilities, areas };
  }
};
