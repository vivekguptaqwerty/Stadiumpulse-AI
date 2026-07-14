# StadiumPulse AI - Automated Testing Strategy & Documentation

This document outlines the testing architecture, frameworks, mocking strategies, and execution instructions for the StadiumPulse AI platform.

---

## 1. Testing Strategy & Architecture

The testing strategy is designed to ensure **100% determinism, fast execution in isolated environments, and comprehensive coverage of both API interfaces and UI components**, without calling any live Gemini APIs or consuming external cloud quotas.

```
                  ┌──────────────────────────────────────────┐
                  │              npm test (Root)             │
                  └────────────────────┬─────────────────────┘
                                       │
                  ┌────────────────────┴─────────────────────┐
                  │                                          │
       ┌──────────▼──────────┐                    ┌──────────▼──────────┐
       │   test:server       │                    │   test:client       │
       └──────────┬──────────┘                    └──────────┬──────────┘
                  │                                          │
       ┌──────────┼──────────┐                    ┌──────────┼──────────┐
       │  APIs    │  Closed  │                    │PulseOps  │PulseSim  │
       │  Health  │  Loop    │                    │PulseGuide│Components│
       └──────────┴──────────┘                    └──────────┴──────────┘
```

### Frameworks Used
*   **Vitest**: Selected as the unified test runner for both client (frontend) and server (backend) due to its sub-second startup speeds, native TypeScript compilation, and standard configuration structure.
*   **Supertest**: Used to test Express routing layers, body limits, and headers in memory without binding network ports.
*   **React Testing Library (RTL)**: Used to test React components by simulating real DOM interactions.
*   **JSDOM**: Provides the in-memory browser environment for frontend tests.

---

## 2. Gemini Mocking Strategy

To keep the test suite fast and decoupled from network state, the **Gemini model boundary is fully mocked**:

*   **No Live API Calls**: Under no circumstances does a test invoke the `@google/genai` API or make remote HTTP requests to AI Studio.
*   **Why Live Gemini is not called from automated tests**:
    *   **Deterministic Execution**: Ensures tests do not fail randomly due to LLM non-determinism, temperature variation, or network latency.
    *   **No Quota Consumption**: Avoids exhausting developer or project API limits during automated CI pipelines.
    *   **No Secret Dependency in CI**: Enables running tests securely in public/private GitHub runner environments without requiring a secret `GEMINI_API_KEY` token.
    *   **AI Boundary Isolation**: The Gemini client boundary is cleanly mocked while exercising the real Express HTTP routes, middleware, validations, and closed-loop application state logic.
*   **Deterministic Contract Testing**: Mocks enforce correct JSON response formats. This validates that the Express app, controllers, and React UI handle the grounded routing schema correctly.
*   **Dynamic Metadata Matching**: Mocks simulate both successful execution (returning `provider: 'gemini', fallbackUsed: false`) and pipeline timeouts/quota exhaustion (gracefully degrading to `provider: 'mock', fallbackUsed: true`).

---

## 3. Server Integration & Verification Tests

Located in `server/src/__tests__/`:

*   **`health.test.ts`**: Verifies base `/api/health` status and `/api/ai/status` metadata outputs.
    *   **Secret-Safe AI Status Metadata**: Asserts that the `/api/ai/status` endpoint exposes safe configuration fields (`provider`, `configured`, `model`) but never leaks secret credentials (ensures no `GEMINI_API_KEY`, `AI_KEY`, or `apiKey` fields are present in the response body).
*   **`validation.test.ts`**: Exercises comprehensive API guardrail and input validation tests:
    *   **400 Invalid AI Requests**: Missing, empty, or whitespace-only messages, and missing or invalid properties in `fanContext` objects.
    *   **400 Malformed JSON**: Triggers invalid JSON formatting errors (returning code `INVALID_JSON_PAYLOAD`).
    *   **413 Payload Too Large**: Evaluates request size limitations (returning code `PAYLOAD_TOO_LARGE` for requests > 100kb).
    *   **429 Fan AI Rate Limiting**: Validates the rate limiting threshold using a low test-specific threshold.
    *   **429 Operations AI Rate Limiting**: Verifies that `POST /api/ai/operations/analyze` correctly enforces rate limits when requests exceed the threshold.
*   **`closedLoopRouting.test.ts`**: Replaces the ad-hoc `test-closed-loop.js` verification script. It asserts the complete closed-loop domain flow:
    *   **Critical Closed-Loop Test Flow**:
        1.  **Normal Gate C Guidance**: Renders normal route instructions pointing the visitor toward Gate C.
        2.  **Gate C Congestion Surge**: Digital twin simulator updates Gate C density parameters to a critical level (84%).
        3.  **Operations Risk Analysis**: An operational scan detects high density and flags a critical congestion alert.
        4.  **Gate D Redirect Recommendation**: The operational scan outputs a mitigation action plan directing incoming flow away from Gate C toward Gate D.
        5.  **Mitigation Applied**: The operator approves the action plan, executing the mitigation.
        6.  **Updated Stadium State**: The global `stadiumState` updates to reflect the active rerouting policies.
        7.  **Rerouted Gate D Guidance**: When the same fan asks the same query ("Take me to Gate C"), the grounded responder dynamically guides the fan to Gate D instead of Gate C.

---

## 4. Rate-Limit Testing Strategy

Testing rate limits deterministically can be slow if we rely on a static high number of requests (e.g., 20).
*   **Dynamic Limits**: We refactored `server/src/routes/ai.ts` to read the maximum limit dynamically from environment variables on every request evaluation.
*   **Isolation**: In the rate-limiting test, we set `process.env.FAN_AI_RATE_LIMIT_MAX = '3'` and `process.env.OPS_AI_RATE_LIMIT_MAX = '3'`. We send 3 rapid requests and verify that the 4th request returns HTTP 429 (`AI_RATE_LIMITED`).
*   **IP Isolation**: We set the `X-Forwarded-For` header to unique IP values per test (e.g. `'1.2.3.4'` and `'5.6.7.8'`) to isolate test runs and prevent cache contamination.
*   **Reset**: A `beforeEach` hook resets the limits back to `1000` for all other tests, preventing subsequent tests from getting blocked.

---

## 5. Client Component Tests

Located in `client/src/__tests__/`:

*   **`PulseGuide.test.tsx`**: Renders the fan assistant and mocks `window.fetch` to verify proper message rendering, typing indicators, and conditional display of the `"Demo fallback active"` / `"Gemini Active"` badges.
*   **`PulseOps.test.tsx`**: Renders the operations center, mock status endpoints, and tests manual scan button clicks, modal approval overlays, and the transition of the Apply Action Plan button (including simulating the 1.5-second dispatch delay).
*   **`PulseSimPage.test.tsx`**: Validates the digital twin simulator controls and triggering scenarios.

---

## 6. Execution Commands

From the **repository root directory**, you can run these commands:

| Command | Action |
| :--- | :--- |
| **`npm test`** | **Run the complete automated test suite (Client + Server + Closed Loop)** |
| `npm run test:server` | Run only server-side Express API and closed-loop routing tests |
| `npm run test:client` | Run only client-side React component unit tests |
| `npm run test:coverage` | Generate local coverage reports for both server and client |

---

## 7. CI Automation

A GitHub Actions workflow is defined under `.github/workflows/ci.yml`. On every `push` and `pull_request`, it:
1. Installs all packages cleanly.
2. Checks TypeScript types and builds assets.
3. Runs the test suite via `npm test` without needing any secret tokens or GCP credentials.
4. Compiles the final production application.
