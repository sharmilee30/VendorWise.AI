import { GoogleGenAI } from '@google/genai';
import {
  AiRecommendationPayload,
  AiRecommendationResponse,
} from '../src/types';
import { generateDeterministicRecommendation } from '../src/services/scoringEngine';
import { createLogger, describeError, Logger } from './logger';

// Per attempt. Worst case (timeout, retry, timeout) is about 2 x this, then the rule-based fallback.
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1_000;
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_MESSAGE =
  'AI explanation is temporarily unavailable. The vendor ranking is still available based on the configured scoring model.';

/**
 * Ask Gemini to explain an already-computed ranking.
 * Never throws for Gemini problems: on a missing key, API error, timeout or unparseable
 * reply it returns the deterministic rule-engine briefing with `isAiGenerated: false`.
 * `payload` must already be validated/sanitised (see validation.ts).
 */
export async function generateGeminiRecommendation(
  payload: AiRecommendationPayload,
  log: Logger = createLogger('gemini')
): Promise<AiRecommendationResponse> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const hasKey = Boolean(apiKey && apiKey.length > 0);
  const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  log.debug('Gemini key present', { hasKey });

  if (!hasKey) {
    log.info('Gemini skipped: GEMINI_API_KEY is not configured. Using deterministic fallback.');
    const fallback = generateDeterministicRecommendation(
      payload.rankedVendors as any,
      payload.criteriaWeights,
      payload.scenarioDiff
    );

    return {
      ...fallback,
      isAiGenerated: false,
      error: FALLBACK_MESSAGE,
    };
  }

  const startTime = Date.now();
  log.info('Gemini request started', { model: modelName, candidates: payload.rankedVendors.length });

  const winner = payload.rankedVendors[0];
  const runnerUp = payload.rankedVendors[1] || winner;
  const leadMargin = winner && runnerUp ? Number((winner.overallScore - runnerUp.overallScore).toFixed(2)) : 0;

  // Build structured prompt for Gemini
  const prompt = `
You are the Chief Procurement Advisory AI for ${payload.companyContext || 'Nova Manufacturing Ltd.'}.
Your task is to provide an executive-level, professional procurement decision-support explanation based SOLELY on the pre-calculated, deterministic vendor rankings provided below.

CRITICAL INSTRUCTIONS:
1. Do NOT recalculate or alter the calculated scores or vendor rankings. The rankings are mathematically locked.
2. Interpret the deterministic results and explain the business rationale, trade-offs, and risk factors.
3. Deliver professional B2B executive advice suitable for manufacturing procurement directors.
4. Return ONLY valid JSON conforming to the requested schema.

STRUCTURED EVALUATION INPUTS:
- Company Context: ${payload.companyContext || 'Nova Manufacturing Ltd.'}
- RFQ ID: ${payload.rfqId || 'RFQ-2026-MFG-048'}
- Category: Precision Machined Components & Assemblies

ACTIVE CRITERION WEIGHTS:
- Cost Weight: ${payload.criteriaWeights.cost}%
- Quality Weight: ${payload.criteriaWeights.quality}%
- Delivery Weight: ${payload.criteriaWeights.delivery}%
- Reliability Weight: ${payload.criteriaWeights.reliability}%
- Sustainability Weight: ${payload.criteriaWeights.sustainability}%
(Total Weight: 100%)

DETERMINISTIC VENDOR RANKINGS & SCORES:
${payload.rankedVendors
  .map(
    (v) =>
      `Rank #${v.rank}: ${v.name} | Total Weighted Score: ${v.overallScore}/100 | Raw Criteria: Cost=${v.criteria.cost}, Quality=${v.criteria.quality}, Delivery=${v.criteria.delivery}, Reliability=${v.criteria.reliability}, Sustainability=${v.criteria.sustainability}`
  )
  .join('\n')}

SUMMARY METRICS:
- Recommended Vendor: ${winner?.name} (Score: ${winner?.overallScore}/100)
- Primary Runner-Up: ${runnerUp?.name} (Score: ${runnerUp?.overallScore}/100)
- Score Gap: +${leadMargin} points

${
  payload.scenarioDiff
    ? `SCENARIO SENSITIVITY SHIFT:
- Previous Winner: ${payload.scenarioDiff.previousWinner} (${payload.scenarioDiff.previousScore}/100)
- New Winner: ${payload.scenarioDiff.newWinner} (${payload.scenarioDiff.newScore}/100)
- Primary Cause: ${payload.scenarioDiff.primaryCause}`
    : ''
}

Please respond with a JSON object with EXACTLY this structure:
{
  "executiveSummary": "2-3 concise sentences summarizing the decision for the procurement committee.",
  "recommendedVendor": "${winner?.name || ''}",
  "whyRankedHighest": "Detailed breakdown explaining why this vendor achieved rank #1 given the current weighting profile and scores.",
  "majorStrengths": [
    "Specific strength point with numeric evidence",
    "Second key operational advantage"
  ],
  "majorWeaknesses": [
    "Identified risk or lower scoring area that requires contractual SLA monitoring",
    "Second mitigation recommendation"
  ],
  "bestAlternative": {
    "name": "${runnerUp?.name || 'None'}",
    "justification": "Why this vendor serves as the strongest backup / dual-source partner and under what operational conditions they should be engaged."
  },
  "weightSensitivity": "Analysis of how this recommendation hinges on the current weights (e.g., how shifting cost vs quality would affect the outcome) and commentary on any recent scenario changes."
}
`;

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Gemini's latency varies a lot (3s to 30s+ on the free tier), and it sometimes answers
    // 503 "high demand". Each attempt is time-boxed so a hung call can't leave the page spinning,
    // and a timeout or a temporary Google error gets one retry before we fall back.
    const attempt = async () => {
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Gemini request timed out after ${REQUEST_TIMEOUT_MS}ms`)),
          REQUEST_TIMEOUT_MS
        );
      });
      return Promise.race([
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        timeout,
      ]).finally(() => clearTimeout(timer));
    };

    let response;
    for (let tryNo = 1; ; tryNo++) {
      try {
        response = await attempt();
        break;
      } catch (err) {
        const e = err as { status?: number; message?: string };
        const transient =
          e.status === 500 || e.status === 503 || e.status === 504 || /timed out/.test(e.message || '');
        if (!transient || tryNo >= MAX_ATTEMPTS) throw err;
        log.warn('Gemini attempt failed; retrying once', {
          attempt: tryNo,
          ms: Date.now() - startTime,
          ...describeError(err),
        });
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }

    const candidateText = response.text;

    if (!candidateText || candidateText.trim() === '') {
      throw new Error('Received empty text response from Gemini API');
    }

    // Clean any markdown code block wrapper if present
    let cleanedText = candidateText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```$/, '');
    }

    const parsed = JSON.parse(cleanedText);

    log.info('Gemini request succeeded', {
      ms: Date.now() - startTime,
      model: modelName,
      recommended: parsed.recommendedVendor || winner?.name,
    });

    return {
      success: true,
      isAiGenerated: true,
      modelName,
      recommendedVendor:
        parsed.recommendedVendor || winner?.name || '',
      whyRankedHighest: parsed.whyRankedHighest || '',
      majorStrengths: Array.isArray(parsed.majorStrengths)
        ? parsed.majorStrengths
        : [],
      majorWeaknesses: Array.isArray(parsed.majorWeaknesses)
        ? parsed.majorWeaknesses
        : [],
      bestAlternative: parsed.bestAlternative || {
        name: runnerUp?.name || 'N/A',
        justification: '',
      },
      weightSensitivity: parsed.weightSensitivity || '',
      executiveSummary: parsed.executiveSummary || '',
      rawText: candidateText,
    };
  } catch (error) {
    // Log a compact, key-redacted summary (status + message), never the raw SDK error object.
    log.error('Gemini request failed; using deterministic fallback', {
      ms: Date.now() - startTime,
      model: modelName,
      ...describeError(error),
    });

    // Preserve existing deterministic fallback
    const fallback = generateDeterministicRecommendation(
      payload.rankedVendors as any,
      payload.criteriaWeights,
      payload.scenarioDiff
    );

    return {
      ...fallback,
      isAiGenerated: false,
      error: FALLBACK_MESSAGE,
    };
  }
}
