import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StadiumStateProvider } from '../store/StadiumStateContext';
import { MemoryRouter } from 'react-router-dom';
import PulseGuide from '../pages/fan/PulseGuide';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('PulseGuide Component (Fan Assistant)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <StadiumStateProvider>
          <PulseGuide />
        </StadiumStateProvider>
      </MemoryRouter>
    );
  };

  it('renders fan assistant welcome message correctly', () => {
    renderComponent();
    expect(screen.getByText(/welcome to MetLife Stadium/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask about gates/i)).toBeInTheDocument();
  });

  it('submits query and displays Gemini response message with proper status badge', async () => {
    // Mock successful fetch response
    const mockResponse = {
      message: 'Here is the path to Gate C.',
      responseType: 'ROUTE_GUIDANCE',
      urgency: 'NORMAL',
      meta: {
        provider: 'gemini',
        fallbackUsed: false,
        model: 'gemini-3.5-flash'
      }
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    }));

    renderComponent();

    const input = screen.getByPlaceholderText(/Ask about gates/i);
    // Find the Send button by locating its type/attributes or Send icon wrapper
    const sendButton = screen.getByPlaceholderText(/Ask about gates/i).nextSibling;

    fireEvent.change(input, { target: { value: 'Take me to Gate C' } });
    if (sendButton) {
      fireEvent.click(sendButton);
    } else {
      // Fallback: trigger form submit or enter keypress
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    }

    // Wait for the message to appear in UI
    await waitFor(() => {
      expect(screen.getByText('Here is the path to Gate C.')).toBeInTheDocument();
    });

    // Check metadata tags rendered on response
    expect(screen.getByText('Gemini Active')).toBeInTheDocument();
    expect(screen.queryByText('Demo fallback active')).not.toBeInTheDocument();
  });

  it('falls back to mock response and displays Fallback warning when request fails', async () => {
    // Mock failing fetch response
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    renderComponent();

    const input = screen.getByPlaceholderText(/Ask about gates/i);

    fireEvent.change(input, { target: { value: 'Take me to Gate C' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Wait for fallback message to resolve and render
    await waitFor(() => {
      expect(screen.getByText(/Demo fallback active/i)).toBeInTheDocument();
    });
  });
});
