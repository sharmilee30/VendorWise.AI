import { AiRecommendationPayload, ScenarioDiff } from '../src/types';

/**
 * Strict validation + sanitising of the AI request body.
 *
 * Why: the payload is interpolated into an LLM prompt. Without limits a caller could send
 * megabytes of text, or put instructions in a vendor name ("ignore the rules above...").
 * We accept only the expected shape, clamp lengths, and strip control characters/newlines
 * from every free-text field.
 */

const CRITERIA = ['cost', 'quality', 'delivery', 'reliability', 'sustainability'] as const;
const MAX_VENDORS = 50;

type Result =
  | { ok: true; payload: AiRecommendationPayload }
  | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isNum = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/** Single-line, control-char-free, length-limited text. */
export function cleanText(v: unknown, maxLen: number): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function readCriteria(v: unknown, label: string): Record<(typeof CRITERIA)[number], number> | string {
  if (!isObj(v)) return `${label} must be an object`;
  const out = {} as Record<(typeof CRITERIA)[number], number>;
  for (const key of CRITERIA) {
    const n = v[key];
    if (!isNum(n, 0, 100)) return `${label}.${key} must be a number between 0 and 100`;
    out[key] = n;
  }
  return out;
}

export function parseAiPayload(body: unknown): Result {
  if (!isObj(body)) return { ok: false, error: 'Request body must be a JSON object' };

  const weights = readCriteria(body.criteriaWeights, 'criteriaWeights');
  if (typeof weights === 'string') return { ok: false, error: weights };

  if (!Array.isArray(body.rankedVendors) || body.rankedVendors.length === 0) {
    return { ok: false, error: 'rankedVendors must be a non-empty array' };
  }
  if (body.rankedVendors.length > MAX_VENDORS) {
    return { ok: false, error: `rankedVendors may contain at most ${MAX_VENDORS} vendors` };
  }

  const rankedVendors: AiRecommendationPayload['rankedVendors'] = [];
  for (let i = 0; i < body.rankedVendors.length; i++) {
    const v = body.rankedVendors[i];
    if (!isObj(v)) return { ok: false, error: `rankedVendors[${i}] must be an object` };

    const name = cleanText(v.name, 100);
    if (!name) return { ok: false, error: `rankedVendors[${i}].name is required` };
    if (!isNum(v.overallScore, 0, 100)) {
      return { ok: false, error: `rankedVendors[${i}].overallScore must be a number between 0 and 100` };
    }
    if (!isNum(v.rank, 1, MAX_VENDORS) || !Number.isInteger(v.rank)) {
      return { ok: false, error: `rankedVendors[${i}].rank must be an integer between 1 and ${MAX_VENDORS}` };
    }
    const criteria = readCriteria(v.criteria, `rankedVendors[${i}].criteria`);
    if (typeof criteria === 'string') return { ok: false, error: criteria };

    rankedVendors.push({
      rank: v.rank,
      name,
      overallScore: v.overallScore,
      criteria,
      isRecommended: v.isRecommended === true,
    });
  }

  let scenarioDiff: ScenarioDiff | null = null;
  if (body.scenarioDiff != null) {
    const d = body.scenarioDiff;
    if (
      !isObj(d) ||
      !isNum(d.previousScore, 0, 100) ||
      !isNum(d.newScore, 0, 100) ||
      !Array.isArray(d.weightDeltas) ||
      d.weightDeltas.length > CRITERIA.length
    ) {
      return { ok: false, error: 'scenarioDiff has an invalid shape' };
    }
    const weightDeltas: ScenarioDiff['weightDeltas'] = [];
    for (const w of d.weightDeltas) {
      if (
        !isObj(w) ||
        !CRITERIA.includes(w.criterion as (typeof CRITERIA)[number]) ||
        !isNum(w.oldVal, 0, 100) ||
        !isNum(w.newVal, 0, 100) ||
        !isNum(w.diff, -100, 100)
      ) {
        return { ok: false, error: 'scenarioDiff.weightDeltas has an invalid entry' };
      }
      weightDeltas.push({
        criterion: w.criterion as ScenarioDiff['weightDeltas'][number]['criterion'],
        label: cleanText(w.label, 50),
        oldVal: w.oldVal,
        newVal: w.newVal,
        diff: w.diff,
      });
    }
    scenarioDiff = {
      changed: d.changed === true,
      previousWinner: cleanText(d.previousWinner, 100),
      newWinner: cleanText(d.newWinner, 100),
      previousScore: d.previousScore,
      newScore: d.newScore,
      primaryCause: cleanText(d.primaryCause, 300),
      weightDeltas,
    };
  }

  return {
    ok: true,
    payload: {
      companyContext: cleanText(body.companyContext, 100) || 'Nova Manufacturing Ltd.',
      rfqId: cleanText(body.rfqId, 50) || undefined,
      category: cleanText(body.category, 100) || undefined,
      criteriaWeights: weights,
      rankedVendors,
      scenarioDiff,
    },
  };
}
