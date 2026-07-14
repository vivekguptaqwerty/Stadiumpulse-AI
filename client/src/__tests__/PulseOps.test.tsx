import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StadiumStateProvider } from '../store/StadiumStateContext';
import { MemoryRouter } from 'react-router-dom';
import PulseOps from '../pages/ops/PulseOps';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('PulseOps Component (Operational Dashboard)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <StadiumStateProvider>
          <PulseOps />
        </StadiumStateProvider>
      </MemoryRouter>
    );
  };

  it('renders operational dashboard with AI intelligence status indicators', async () => {
    // Mock AI status fetch
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/ai/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ provider: 'gemini', configured: true, model: 'gemini-3.5-flash' })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }));

    renderComponent();

    // Verify presence of dashboard headers
    expect(screen.getByText(/AI Operational Brief/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Event Stream/i)).toBeInTheDocument();
    expect(screen.getByText(/Human Approval/i)).toBeInTheDocument();

    // Wait for the status fetch to complete and render the correct badge
    await waitFor(() => {
      expect(screen.getByText(/Gemini Intelligence Active/i)).toBeInTheDocument();
      expect(screen.getByText(/gemini-3.5-flash/i)).toBeInTheDocument();
    });
  });

  it('displays fallback state when provider is set to mock', async () => {
    // Mock fallback status fetch
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/ai/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ provider: 'mock', configured: false, model: 'gemini-3.5-flash' })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Demo Fallback Active/i)).toBeInTheDocument();
    });
  });

  it('performs manual AI Analysis scan, renders recommendation, and applies action plan successfully', async () => {
    // Mock status and operations analysis
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/ai/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ provider: 'gemini', configured: true, model: 'gemini-3.5-flash' })
        });
      }
      if (url.includes('/api/ai/operations/analyze')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            riskDetected: true,
            riskLevel: 'CRITICAL',
            title: 'Gate C Crowd Surge',
            summary: 'Congestion has reached critical levels.',
            recommendedActions: [
              { action: 'REDIRECT_FAN_ROUTES', targetId: 'gate-c', reason: 'Reroute flow to Gate D' }
            ],
            meta: { provider: 'gemini', fallbackUsed: false, model: 'gemini-3.5-flash' }
          })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }));

    renderComponent();

    // Click on "Run AI Analysis Scan" button
    const scanButton = screen.getByText('Run AI Analysis Scan');
    fireEvent.click(scanButton);

    // Wait for the risk title to appear in the dashboard
    await waitFor(() => {
      expect(screen.getByText('Gate C Crowd Surge')).toBeInTheDocument();
      expect(screen.getByText('Review Action Plan')).toBeInTheDocument();
    });

    // Open Action Plan modal
    const reviewButton = screen.getByText('Review Action Plan');
    fireEvent.click(reviewButton);

    // Assert that modal title and details are shown
    expect(screen.getByText('AI Mitigation Plan')).toBeInTheDocument();
    expect(screen.getByText('REDIRECT_FAN_ROUTES on gate-c: Reroute flow to Gate D')).toBeInTheDocument();

    // Apply the Action Plan
    const applyButton = screen.getByText('Apply Action Plan');
    fireEvent.click(applyButton);

    // Wait for Action Plan status to transition to Applied (takes 1.5s delay)
    await waitFor(() => {
      expect(screen.getByText('Action Plan Active')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
