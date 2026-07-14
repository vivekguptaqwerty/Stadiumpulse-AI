import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia since jsdom does not implement it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView since it is not supported in jsdom environment
window.HTMLElement.prototype.scrollIntoView = vi.fn();
