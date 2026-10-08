import { AiRecommendationResponse } from '../src/types';

/**
 * Guardrails between Gemini and the user.
 *
 * The model only EXPLAINS a ranking the app has already computed, so nothing it returns may
 * change that ranking. This module turns the model's JSON into the app's response shape:
 *  - the recommended vendor and the backup vendor always come from the app's own ranking,
 *    whatever names the model wrote (e.g. after a prompt-injection attempt in a vendor name);
 *  - every text field must be a string and every list a list of strings, otherwise it is
 *    dropped, and lengths are capped;
 *  - control characters are removed.
 */

export type ExplanationFields = Pick<
  AiRecommendationResponse,
  | 'recommendedVendor'
  | 'whyRankedHighest'
  | 'majorStrengths'
  | 'majorWeaknesses'
  | 'bestAlternative'
  | 'weightSensitivity'
  | 'executiveSummary'
>;

const MAX_TEXT = 1500;
const MAX_JUSTIFICATION = 800;
const MAX_LIST_ITEMS = 6;
const MAX_LIST_ITEM_CHARS = 400;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Keeps line breaks and tabs, removes other control characters, trims and caps the length. */
function cleanString(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
}

function cleanList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => cleanString(item, MAX_LIST_ITEM_CHARS))
    .filter((item) => item.length > 0)
    .slice(0, MAX_LIST_ITEMS);
}

export function normalizeAiReply(
  parsed: unknown,
  winnerName: string,
  runnerUpName: string
): ExplanationFields {
  const reply = isObj(parsed) ? parsed : {};
  const alternative = isObj(reply.bestAlternative) ? reply.bestAlternative : {};

  return {
    recommendedVendor: winnerName,
    whyRankedHighest: cleanString(reply.whyRankedHighest, MAX_TEXT),
    majorStrengths: cleanList(reply.majorStrengths),
    majorWeaknesses: cleanList(reply.majorWeaknesses),
    bestAlternative: {
      name: runnerUpName || 'N/A',
      justification: cleanString(alternative.justification, MAX_JUSTIFICATION),
    },
    weightSensitivity: cleanString(reply.weightSensitivity, MAX_TEXT),
    executiveSummary: cleanString(reply.executiveSummary, MAX_TEXT),
  };
}
