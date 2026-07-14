# StadiumPulse AI

[![StadiumPulse AI CI](https://github.com/stadiumpulse-ai/stadiumpulse-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/stadiumpulse-ai/stadiumpulse-ai/actions/workflows/ci.yml)

> The intelligence layer for safer, smarter stadium movement. Developed for the FIFA World Cup 2026 Developer Challenge.

StadiumPulse AI is a real-time stadium intelligence layer that aggregates venue sensor data and crowd flows to optimize movements, predict congestion risk, and route stadium visitors safely.

## Product Modules

1. **PulseGuide (AI Fan Assistant)** `/fan`
   - Mobile-first, translation-ready crowd-aware tournament companion assistant.
   - Provides route updates, facility queue times, emergency aid dispatches, and step-free navigation.
   
2. **PulseOps (Stadium Command Center)** `/ops`
   - Operational intelligence dashboard for security coordinators and tournament staff.
   - Features a dynamic, interactive SVG stadium schematic illustrating density status, real-time metrics, predictive AI operational brief panels, Recharts crowd density trend lines, and recommended mitigation action plans.

3. **PulseSim (Digital Stadium Twin)** `/ops/simulator`
   - Live simulation control panel designed to trigger stadium conditions.
   - Simulates dynamic event flows such as **Gate C Crowd Surge**, medical incidents, accessibility assistance queueing, and post-match egress.

## Technical Architecture

The frontend is built using:
- **React 18** (Vite + TypeScript)
- **Tailwind CSS** (curated dark sports-ops palette, clean accessibility and layout)
- **React Router v6** (declarative SPA routes)
- **Framer Motion** (smooth event transitions, alert animations, modal expansions)
- **Recharts** (crowd density area charts)
- **Lucide React** (consistent context iconography)

State is managed by a centralized **React Context** (`StadiumStateProvider`), which binds simulator parameter actions to operations dashboards and fan guide queries synchronously across routes in the current session.

---

## Getting Started

### Prerequisites
- Node.js v18 or later
- npm v9 or later

### Installation & Run

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch local developer server:
   ```bash
   npm run dev
   ```

The local development URL will be printed on screen (typically `http://localhost:5173`).

---

## Automated Testing

StadiumPulse AI includes a fully automated, deterministic test suite covering frontend component rendering, backend Express API routing, rate limiters, payload size restrictions, and closed-loop routing logic.

*   **Test Frameworks**: Vitest, React Testing Library, Supertest
*   **Total Test Files**: 6 files
*   **Total Automated Tests**: 27 tests (19 server/closed-loop tests, 8 client tests)
*   **Gemini Mocking**: 100% mocked model boundaries (no live API key or cloud quota consumed)
*   **Latest Test Result**: **PASSING** (All 27 automated checks passed in local validation)

For complete details on the testing setup, dynamic rate limits, and mocking architecture, refer to the [TESTING.md](file:///c:/StadiumPulse%20AI/stadiumpulse-ai/TESTING.md) guide.

To execute the test suite:
```bash
# Run the complete test suite (both Client and Server tests)
npm test

# Run only server-side integration tests
npm run test:server

# Run only client-side React component unit tests
npm run test:client

# View code coverage summaries
npm run test:coverage
```

