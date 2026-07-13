# StadiumPulse AI - Google Cloud Run Deployment Guide

This guide outlines the steps to build, package, and deploy **StadiumPulse AI** as a single consolidated service on Google Cloud Run, integrated with Secret Manager for secure API key injection, and detailed production guardrail behaviors.

---

## Prerequisites

1.  **Google Cloud SDK (gcloud CLI)**: Ensure it is installed and configured on your machine.
2.  **Authentication**: Run the following command to log in:
    ```bash
    gcloud auth login
    ```
3.  **Active GCP Project**: Ensure you have selected the appropriate target project:
    ```bash
    gcloud config set project YOUR_PROJECT_ID
    ```
4.  **Billing**: Ensure billing is enabled for your GCP project.

---

## 1. Enable Required Google Cloud APIs

Ensure all required services are enabled in your project:

```bash
gcloud services enable \
    run.googleapis.com \
    build.googleapis.com \
    secretmanager.googleapis.com
```

---

## 2. Store the Gemini API Key in Secret Manager

We store the Gemini API key securely in Secret Manager rather than baking it into the container or environment variables:

1.  Create the secret container:
    ```bash
    gcloud secrets create stadiumpulse-gemini-api-key \
        --replication-policy="automatic"
    ```
2.  Inject the secret value (replace `YOUR_ACTUAL_API_KEY` with your real Gemini API key):
    ```bash
    echo -n "YOUR_ACTUAL_API_KEY" | gcloud secrets versions add stadiumpulse-gemini-api-key --data-file=-
    ```

---

## 3. Grant Secret Manager Access to the Cloud Run Service Account

To let Cloud Run securely retrieve the API key at runtime, grant the Least Privilege role (`Secret Manager Secret Accessor`) to the default Compute Engine service account used by Cloud Run:

```bash
# Retrieve your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant secret accessor permission
gcloud secrets add-iam-policy-binding stadiumpulse-gemini-api-key \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

---

## 4. Build and Deploy to Cloud Run

We can deploy directly from source using the root Dockerfile we created. Run the following command from the `stadiumpulse-ai/` root directory:

```bash
gcloud run deploy stadiumpulse-ai \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars="AI_PROVIDER=gemini,GEMINI_MODEL=gemini-3.5-flash" \
    --set-secrets="GEMINI_API_KEY=stadiumpulse-gemini-api-key:latest"
```

---

## 5. Production Guardrails & Operations

### A. AI Endpoint Rate Limits
The server enforces separate IP-based rate limiting on AI generation endpoints to prevent quota starvation:
*   **Fan Assistant (`POST /api/ai/fan-assistant`)**: 20 requests per 10 minutes per client IP. (Configure via environment override `FAN_AI_RATE_LIMIT_MAX`).
*   **Operations Analysis (`POST /api/ai/operations/analyze`)**: 10 requests per 10 minutes per client IP. (Configure via environment override `OPS_AI_RATE_LIMIT_MAX`).
*   *Rate Limited Responses*: Return a clean JSON status code `429` containing `"code": "AI_RATE_LIMITED"`.

### B. Request Size Limits
*   Global JSON request body limits are restricted to **`100kb`** to avoid memory allocation exhausts.
*   *Payload Too Large Responses*: Return a clean JSON status code `413` containing `"code": "PAYLOAD_TOO_LARGE"`.

### C. Gemini Request Timeout & Mock Fallback
*   All Gemini API calls are raced against an application-level **`15-second`** timeout.
*   If Gemini times out, returns HTTP 429 quota exhaustion, or fails, the server logs provider metadata and activates the fallback mock service automatically.
*   *Fallback Transparency*: Responses return metadata tracking the engine status:
    `"meta": { "provider": "mock", "fallbackUsed": true }` or `"meta": { "provider": "gemini", "fallbackUsed": false }`.
    The UI renders a subtle `"Demo fallback active"` status badge to indicate fallback usage.

### D. Cloud Run Proxy Considerations
*   Cloud Run processes run behind Google Infrastructure reverse proxies which strip original headers and forward them as `X-Forwarded-For`.
*   The Express server is configured with `app.set('trust proxy', 1)` to trust only the immediate GCP proxy hop, ensuring client IP address lookups for rate-limiting remain secure and spoof-resistant.

---

## 6. Prototype Grounding Scope

> [!IMPORTANT]
> **Decision-Support Prototype**: StadiumPulse AI is a simulated decision-support prototype. In a live production environment, this application would consume telemetry signals (IoT gates flow rates, live security channels, tick logs) from authorized venue databases. 
> For the current browser hackathon demo, simulation data flows locally in the single browser session context.
