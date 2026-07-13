import { GoogleGenAI } from '@google/genai';
import { fanClassifierPrompt } from './prompts/fanClassifierPrompt';
import { fanResponsePrompt } from './prompts/fanResponsePrompt';
import { opsAnalysisPrompt } from './prompts/opsAnalysisPrompt';
import { fanClassifierSchema } from './schemas/fanClassifierSchema';
import { fanResponseSchema } from './schemas/fanResponseSchema';
import { opsAnalysisSchema } from './schemas/opsAnalysisSchema';
import { mockFallbackService } from '../services/mockFallbackService';
import { stadiumDataService } from '../services/stadiumDataService';
import type { FanGroundedResponse, FanRequestClassification, OpsAnalysisResponse } from '../types';

// Read configuration from environment variables
const provider = process.env.AI_PROVIDER || 'gemini';
const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

let ai: GoogleGenAI | null = null;
let isGeminiConfigured = false;

// Safe key check: exclude placeholders, but accept other configurations
if (provider === 'gemini' && apiKey && !apiKey.startsWith('YOUR_GEMINI_API_KEY')) {
  try {
    ai = new GoogleGenAI({ apiKey });
    isGeminiConfigured = true;
    console.log(`[AI] GoogleGenAI SDK initialized successfully. (Key: ${apiKey.substring(0, 6)}...)`);
  } catch (err) {
    console.error('[AI] Initialization failed:', err);
  }
} else {
  console.log(`[AI] Running on mock fallback provider (AI_PROVIDER=${provider}, key configured=${!!apiKey})`);
}

// Bounded timeout helper to prevent evaluators from waiting indefinitely (15-second limit)
const GEMINI_TIMEOUT_MS = 15000;
const callWithTimeout = async <T>(promise: Promise<T>, taskName: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`TimeoutError: Gemini request for "${taskName}" exceeded ${GEMINI_TIMEOUT_MS}ms limit`));
    }, GEMINI_TIMEOUT_MS);
    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
};

export const getAIStatus = () => {
  return {
    provider: isGeminiConfigured ? 'gemini' : 'mock',
    configured: isGeminiConfigured,
    model: modelName
  };
};

export const geminiClient = {
  // pipeline 1 - Stage 1 Classifier
  classifyFanRequest: async (message: string): Promise<FanRequestClassification> => {
    const start = Date.now();
    if (!isGeminiConfigured || !ai) {
      console.log(`[AI] Classify -> Using local fallback (Gemini not configured). Duration: ${Date.now() - start}ms`);
      return mockFallbackService.classifyFanRequest(message);
    }

    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: `Classify the following fan message:\n"${message}"`,
          config: {
            systemInstruction: fanClassifierPrompt,
            responseMimeType: 'application/json',
            responseSchema: fanClassifierSchema
          }
        }),
        'Classification'
      );

      if (!response.text) {
        throw new Error('Empty response received from Gemini classifier');
      }

      const parsed: FanRequestClassification = JSON.parse(response.text);
      console.log(`[AI] Classify -> Intent: ${parsed.intent}, Urgency: ${parsed.urgency}. Duration: ${Date.now() - start}ms`);
      return parsed;
    } catch (err: any) {
      console.warn(`[AI] Classifier failed (${err.message || err}). Falling back to mock classifier.`);
      return mockFallbackService.classifyFanRequest(message);
    }
  },

  // pipeline 1 - Stage 3 Grounded Response
  generateGroundedFanResponse: async (
    message: string,
    classification: FanRequestClassification,
    allowedFacilities: any[]
  ): Promise<FanGroundedResponse> => {
    const start = Date.now();
    if (!isGeminiConfigured || !ai) {
      console.log(`[AI] Response -> Using local fallback (Gemini not configured). Duration: ${Date.now() - start}ms`);
      const fallback = mockFallbackService.getGroundedFanResponse(message, classification);
      fallback.meta = { provider: 'mock', fallbackUsed: true, model: modelName };
      return fallback;
    }

    try {
      const promptInput = {
        fanMessage: message,
        classification,
        fanLocationContext: {
          username: 'Alex',
          currentLocation: 'Section 118',
          level: 'Level 2'
        },
        ALLOWED_FACILITIES: allowedFacilities
      };

      const response = await callWithTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: `Generate a grounded response for:\n${JSON.stringify(promptInput, null, 2)}`,
          config: {
            systemInstruction: fanResponsePrompt,
            responseMimeType: 'application/json',
            responseSchema: fanResponseSchema
          }
        }),
        'Fan Response Generation'
      );

      if (!response.text) {
        throw new Error('Empty response received from Gemini response generator');
      }

      const parsed: FanGroundedResponse = JSON.parse(response.text);

      // GROUNDING VALIDATION: Validate facility IDs
      const validatedFacilityIds = parsed.groundedFacilityIds.filter(id => {
        const isValid = stadiumDataService.isValidFacilityId(id);
        if (!isValid) {
          console.warn(`[AI-Validation] Gemini generated unknown facility ID: "${id}". Dropping from response.`);
        }
        return isValid;
      });

      parsed.groundedFacilityIds = validatedFacilityIds;
      parsed.meta = { provider: 'gemini', fallbackUsed: false, model: modelName };
      console.log(`[AI] Response -> Type: ${parsed.responseType}, Grounded IDs: ${parsed.groundedFacilityIds.join(', ')}. Duration: ${Date.now() - start}ms`);
      return parsed;
    } catch (err: any) {
      console.warn(`[AI] Response generator failed (${err.message || err}). Falling back to mock response generator.`);
      const fallback = mockFallbackService.getGroundedFanResponse(message, classification);
      fallback.meta = { provider: 'mock', fallbackUsed: true, model: modelName };
      return fallback;
    }
  },

  // pipeline 2 - Operations Analysis Snapshot
  analyzeOperationsSnapshot: async (snapshot: any): Promise<OpsAnalysisResponse> => {
    const start = Date.now();
    if (!isGeminiConfigured || !ai) {
      console.log(`[AI] Ops -> Using local fallback (Gemini not configured). Duration: ${Date.now() - start}ms`);
      const fallback = mockFallbackService.analyzeOperations(snapshot);
      fallback.meta = { provider: 'mock', fallbackUsed: true, model: modelName };
      return fallback;
    }

    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: `Analyze this stadium operations snapshot:\n${JSON.stringify(snapshot, null, 2)}`,
          config: {
            systemInstruction: opsAnalysisPrompt,
            responseMimeType: 'application/json',
            responseSchema: opsAnalysisSchema
          }
        }),
        'Operations Snapshot Analysis'
      );

      if (!response.text) {
        throw new Error('Empty response received from Gemini operations analyzer');
      }

      const parsed: OpsAnalysisResponse = JSON.parse(response.text);

      // GROUNDING VALIDATION: Validate recommended action targets
      const validatedActions = parsed.recommendedActions.filter(action => {
        const isValid = stadiumDataService.isValidAreaId(action.targetId);
        if (!isValid) {
          console.warn(`[AI-Validation] Ops Gemini suggested action for unknown target: "${action.targetId}". Dropping recommendation.`);
        }
        return isValid;
      });

      parsed.recommendedActions = validatedActions;
      parsed.meta = { provider: 'gemini', fallbackUsed: false, model: modelName };
      console.log(`[AI] Ops -> Risk: ${parsed.riskLevel}, Actions Count: ${parsed.recommendedActions.length}. Duration: ${Date.now() - start}ms`);
      return parsed;
    } catch (err: any) {
      console.warn(`[AI] Operations analyzer failed (${err.message || err}). Falling back to mock ops analyzer.`);
      const fallback = mockFallbackService.analyzeOperations(snapshot);
      fallback.meta = { provider: 'mock', fallbackUsed: true, model: modelName };
      return fallback;
    }
  }
};
