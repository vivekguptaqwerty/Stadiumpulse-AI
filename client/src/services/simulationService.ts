import type { SimulationScenario } from '../types';

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'normal',
    name: 'Normal Operations',
    description: 'Standard crowd flow across all concourses. Queue wait times are low and security checkpoints are running smoothly.',
    affectedSystems: ['All gates', 'All zones', 'Security checkpoints']
  },
  {
    id: 'gate-c-surge',
    name: 'Gate C Crowd Surge',
    description: 'Simulates a sudden arrival of fans at Gate C due to shuttle arrival. Crowd density increases rapidly, causing congestion.',
    affectedSystems: ['Gate C', 'Zone B (East Concourse)', 'Corridor B2']
  },
  {
    id: 'medical-emergency',
    name: 'Medical Incident',
    description: 'Simulates a medical emergency reported in Section 118. Reroutes surrounding fan traffic and dispatches staff.',
    affectedSystems: ['Section 118', 'Medical Station M1', 'Corridor B2']
  },
  {
    id: 'accessibility-help',
    name: 'Accessibility Assistance',
    description: 'Simulates elevated requests for assistance at elevators. Priority queueing and step-free navigation optimization active.',
    affectedSystems: ['Elevator E3', 'Zone D', 'Gate A']
  },
  {
    id: 'post-match-surge',
    name: 'Post-Match Transport Surge',
    description: 'Simulates the egress flow of 72,000+ fans toward main transportation terminals, rideshare zones, and parking lots.',
    affectedSystems: ['All exit gates', 'Taxi / Rideshare queues', 'Train station links']
  }
];

export const simulationService = {
  getScenarios: (): SimulationScenario[] => [...SIMULATION_SCENARIOS]
};
