import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StadiumStateProvider } from '../store/StadiumStateContext';
import { MemoryRouter } from 'react-router-dom';
import PulseSimPage from '../pages/ops/PulseSimPage';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('PulseSimPage Component (Digital Twin Simulator)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <StadiumStateProvider>
          <PulseSimPage />
        </StadiumStateProvider>
      </MemoryRouter>
    );
  };

  it('renders simulator scenarios list and shows status parameters', () => {
    renderComponent();

    // Verify presence of simulator labels and cards
    expect(screen.getByText(/Trigger Stadium Scenarios/i)).toBeInTheDocument();
    expect(screen.getByText(/Gate C Crowd Surge/i)).toBeInTheDocument();
    expect(screen.getByText(/Normal Operations/i)).toBeInTheDocument();
    expect(screen.getByText(/Medical Incident/i)).toBeInTheDocument();
  });

  it('triggering a scenario updates simulator state', async () => {
    renderComponent();

    // Locating all trigger buttons
    const triggerButtons = screen.getAllByText('Trigger Scenario');
    
    // Find the Gate C Surge trigger button (associated card has text 'Gate C Crowd Surge')
    // The scenarios are standard: 0: Normal, 1: Gate C, 2: Medical, etc.
    // Index 1 corresponds to Gate C Crowd Surge.
    const gateCSurgeBtn = triggerButtons[1];
    expect(gateCSurgeBtn).toBeInTheDocument();

    // Trigger the surge
    fireEvent.click(gateCSurgeBtn);

    // Wait for the scenario active label to reflect gate-c-surge or changed status
    await waitFor(() => {
      // Should show Gate C active status or state in the twin view
      expect(screen.getByText(/Gate C Surge/i)).toBeInTheDocument();
    });
  });
});
