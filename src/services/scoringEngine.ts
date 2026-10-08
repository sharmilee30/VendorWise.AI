import {
  Vendor,
  CriteriaWeights,
  VendorScoreResult,
  ValidationResult,
  ScenarioDiff,
  AiRecommendationResponse,
} from '../types';

export const DEFAULT_WEIGHTS: CriteriaWeights = {
  cost: 30,
  quality: 30,
  delivery: 20,
  reliability: 15,
  sustainability: 5,
};

export const DEFAULT_VENDORS: Vendor[] = [
  {
    id: 'vendor-alpha',
    name: 'Alpha Supplies',
    criteria: {
      cost: 92,
      quality: 78,
      delivery: 72,
      reliability: 80,
      sustainability: 75,
    },
    notes: 'High cost efficiency; legacy supplier for non-critical hardware.',
  },
  {
    id: 'vendor-beta',
    name: 'Beta Industrial',
    criteria: {
      cost: 80,
      quality: 94,
      delivery: 88,
      reliability: 92,
      sustainability: 86,
    },
    notes: 'Premium tier-1 precision tooling; exceptional quality assurance records.',
  },
  {
    id: 'vendor-gamma',
    name: 'Gamma Materials',
    criteria: {
      cost: 96,
      quality: 82,
      delivery: 68,
      reliability: 75,
      sustainability: 70,
    },
    notes: 'Lowest raw cost benchmark; longer ocean freight transit times.',
  },
  {
    id: 'vendor-delta',
    name: 'Delta Components',
    criteria: {
      cost: 85,
      quality: 88,
      delivery: 95,
      reliability: 89,
      sustainability: 91,
    },
    notes: 'Rapid turnaround, best-in-class delivery SLAs, strong ESG credentials.',
  },
  {
    id: 'vendor-epsilon',
    name: 'Epsilon Manufacturing',
    criteria: {
      cost: 76,
      quality: 90,
      delivery: 82,
      reliability: 87,
      sustainability: 95,
    },
    notes: 'Circular manufacturing leader; zero-landfill certified production facility.',
  },
];

export const CRITERIA_METADATA: Record<
  keyof CriteriaWeights,
  { label: string; description: string; unit: string; color: string }
> = {
  cost: {
    label: 'Cost',
    description: 'Unit pricing competitiveness, volume discounts & TCO',
    unit: '%',
    color: '#0284c7', // Sky 600
  },
  quality: {
    label: 'Quality',
    description: 'Defect rate, ISO specs compliance & precision standards',
    unit: '%',
    color: '#2563eb', // Blue 600
  },
  delivery: {
    label: 'Delivery',
    description: 'On-time delivery rate, lead-time velocity & logistics SLA',
    unit: '%',
    color: '#0d9488', // Teal 600
  },
  reliability: {
    label: 'Reliability',
    description: 'Financial stability, SLA consistency & supply continuity',
    unit: '%',
    color: '#7c3aed', // Violet 600
  },
  sustainability: {
    label: 'Sustainability',
    description: 'Carbon footprint, RoHS/REACH compliance & ESG audit',
    unit: '%',
    color: '#16a34a', // Green 600
  },
};

export const PRESET_SCENARIOS: {
  name: string;
  description: string;
  weights: CriteriaWeights;
}[] = [
  {
    name: 'Nova Manufacturing Baseline',
    description: 'Balanced production procurement standard (30% Cost, 30% Quality, 20% Delivery, 15% Reliability, 5% ESG)',
    weights: { cost: 30, quality: 30, delivery: 20, reliability: 15, sustainability: 5 },
  },
  {
    name: 'Cost Reduction / Capex Constraint',
    description: 'Aggressive procurement savings focus for high-volume non-critical components',
    weights: { cost: 50, quality: 20, delivery: 15, reliability: 10, sustainability: 5 },
  },
  {
    name: 'Aerospace & Quality Critical',
    description: 'Zero-defect manufacturing where precision and rigorous compliance outweigh cost',
    weights: { cost: 15, quality: 45, delivery: 15, reliability: 20, sustainability: 5 },
  },
  {
    name: 'Just-In-Time / Lead Time Velocity',
    description: 'Fast cycle replenishment to avoid factory line stoppages and inventory backlogs',
    weights: { cost: 20, quality: 20, delivery: 40, reliability: 15, sustainability: 5 },
  },
  {
    name: 'ESG & Green Supply Chain',
    description: 'Decarbonized supply chain with heavy emphasis on ISO-14001 and sustainability audits',
    weights: { cost: 20, quality: 25, delivery: 15, reliability: 10, sustainability: 30 },
  },
];

/**
 * Validates vendor entries and criteria weights strictly.
 */
export function validateInputs(
  vendors: Vendor[],
  weights: CriteriaWeights
): ValidationResult {
  const errors: string[] = [];

  // 1. Total weights validation
  const totalWeight =
    (weights.cost || 0) +
    (weights.quality || 0) +
    (weights.delivery || 0) +
    (weights.reliability || 0) +
    (weights.sustainability || 0);

  // Allow negligible floating point rounding (e.g. 99.999999999)
  const isWeight100 = Math.abs(totalWeight - 100) < 0.001;

  if (!isWeight100) {
    errors.push(
      `Criteria weights must total exactly 100%. Current total: ${Number(
        totalWeight.toFixed(2)
      )}%.`
    );
  }

  // 2. Individual weight validation
  (Object.keys(DEFAULT_WEIGHTS) as (keyof CriteriaWeights)[]).forEach((key) => {
    const val = weights[key];
    if (typeof val !== 'number' || isNaN(val)) {
      errors.push(`${CRITERIA_METADATA[key].label} weight must be a valid number.`);
    } else if (val < 0 || val > 100) {
      errors.push(
        `${CRITERIA_METADATA[key].label} weight must be between 0% and 100%.`
      );
    }
  });

  // 3. Vendor count validation
  if (!vendors || vendors.length < 2) {
    errors.push('At least two vendors are required to perform comparative evaluation.');
  }

  // 4. Vendor name checks (blank and duplicates)
  const seenNames = new Set<string>();
  vendors.forEach((vendor, index) => {
    const trimmedName = vendor.name ? vendor.name.trim() : '';
    if (!trimmedName) {
      errors.push(`Vendor #${index + 1} has a blank name. All vendors must have a unique name.`);
    } else {
      const lower = trimmedName.toLowerCase();
      if (seenNames.has(lower)) {
        errors.push(`Duplicate vendor name detected: "${trimmedName}". Vendor names must be unique.`);
      }
      seenNames.add(lower);
    }

    // 5. Criteria score checks (0 to 100)
    (Object.keys(DEFAULT_WEIGHTS) as (keyof CriteriaWeights)[]).forEach((criterion) => {
      const score = vendor.criteria[criterion];
      if (typeof score !== 'number' || isNaN(score)) {
        errors.push(
          `${vendor.name || `Vendor #${index + 1}`}: ${CRITERIA_METADATA[criterion].label} score must be a number.`
        );
      } else if (score < 0 || score > 100) {
        errors.push(
          `${vendor.name || `Vendor #${index + 1}`}: ${CRITERIA_METADATA[criterion].label} score must be between 0 and 100 (got ${score}).`
        );
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    totalWeight: Number(totalWeight.toFixed(2)),
  };
}

/**
 * Deterministic Vendor Scoring Formula:
 * Weighted Vendor Score =
 * (Cost Score × Cost Weight) +
 * (Quality Score × Quality Weight) +
 * (Delivery Score × Delivery Weight) +
 * (Reliability Score × Reliability Weight) +
 * (Sustainability Score × Sustainability Weight)
 *
 * NOTE: Weights are entered as percentages (e.g. 30 for 30%), so we divide by 100.
 * Display final score out of 100.
 */
export function calculateVendorScores(
  vendors: Vendor[],
  weights: CriteriaWeights
): VendorScoreResult[] {
  // Compute raw weighted scores
  const calculated = vendors.map((vendor) => {
    const costWeightFactor = weights.cost / 100;
    const qualityWeightFactor = weights.quality / 100;
    const deliveryWeightFactor = weights.delivery / 100;
    const reliabilityWeightFactor = weights.reliability / 100;
    const sustainabilityWeightFactor = weights.sustainability / 100;

    const costContribution = vendor.criteria.cost * costWeightFactor;
    const qualityContribution = vendor.criteria.quality * qualityWeightFactor;
    const deliveryContribution = vendor.criteria.delivery * deliveryWeightFactor;
    const reliabilityContribution = vendor.criteria.reliability * reliabilityWeightFactor;
    const sustainabilityContribution = vendor.criteria.sustainability * sustainabilityWeightFactor;

    const overallScoreRaw =
      costContribution +
      qualityContribution +
      deliveryContribution +
      reliabilityContribution +
      sustainabilityContribution;

    // Rounded strictly to 2 decimal places
    const overallScore = Number(overallScoreRaw.toFixed(2));

    // Identify relative strengths & weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    (Object.keys(DEFAULT_WEIGHTS) as (keyof CriteriaWeights)[]).forEach((key) => {
      const score = vendor.criteria[key];
      const label = CRITERIA_METADATA[key].label;
      if (score >= 88) {
        strengths.push(`${label} (${score}/100)`);
      } else if (score < 75) {
        weaknesses.push(`${label} (${score}/100)`);
      }
    });

    return {
      ...vendor,
      rank: 0,
      overallScore,
      contributions: {
        cost: Number(costContribution.toFixed(2)),
        quality: Number(qualityContribution.toFixed(2)),
        delivery: Number(deliveryContribution.toFixed(2)),
        reliability: Number(reliabilityContribution.toFixed(2)),
        sustainability: Number(sustainabilityContribution.toFixed(2)),
      },
      isRecommended: false,
      isAlternative: false,
      scoreGapToLeader: 0,
      strengths,
      weaknesses,
    };
  });

  // Sort descending by overallScore
  // In case of tie, prioritize Quality, then Reliability, then Delivery
  calculated.sort((a, b) => {
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }
    if (b.criteria.quality !== a.criteria.quality) {
      return b.criteria.quality - a.criteria.quality;
    }
    if (b.criteria.reliability !== a.criteria.reliability) {
      return b.criteria.reliability - a.criteria.reliability;
    }
    return a.name.localeCompare(b.name);
  });

  const leaderScore = calculated[0]?.overallScore || 0;

  // Assign ranks, status flags, and score gaps
  return calculated.map((item, idx) => {
    const rank = idx + 1;
    return {
      ...item,
      rank,
      isRecommended: rank === 1,
      isAlternative: rank === 2,
      scoreGapToLeader: Number((leaderScore - item.overallScore).toFixed(2)),
    };
  });
}

/**
 * Calculates scenario change difference between a previous evaluation and current evaluation.
 */
export function computeScenarioDiff(
  oldWeights: CriteriaWeights | null,
  newWeights: CriteriaWeights,
  oldWinner: string | null,
  oldScore: number | null,
  newWinner: string,
  newScore: number
): ScenarioDiff | null {
  if (!oldWinner || oldWeights === null || oldScore === null) {
    return null;
  }

  const weightDeltas = (
    Object.keys(DEFAULT_WEIGHTS) as (keyof CriteriaWeights)[]
  ).map((k) => ({
    criterion: k,
    label: CRITERIA_METADATA[k].label,
    oldVal: oldWeights[k],
    newVal: newWeights[k],
    diff: newWeights[k] - oldWeights[k],
  }));

  // Find biggest weight increase / change
  const sortedDeltas = [...weightDeltas].sort(
    (a, b) => Math.abs(b.diff) - Math.abs(a.diff)
  );
  const primaryShift = sortedDeltas[0];

  const changed = oldWinner !== newWinner;

  let primaryCause = 'Weights were adjusted across criteria.';
  if (primaryShift && Math.abs(primaryShift.diff) > 0) {
    const direction = primaryShift.diff > 0 ? 'increased' : 'decreased';
    primaryCause = `${primaryShift.label} weight ${direction} from ${primaryShift.oldVal}% to ${primaryShift.newVal}%`;
  }

  return {
    changed,
    previousWinner: oldWinner,
    newWinner,
    previousScore: oldScore,
    newScore,
    primaryCause,
    weightDeltas,
  };
}

/**
 * Deterministic Rule-Based Fallback Generator.
 * Provides high-quality, professional procurement analysis even when the AI API is offline
 * or when Gemini API key is not configured.
 */
export function generateDeterministicRecommendation(
  rankedVendors: VendorScoreResult[],
  weights: CriteriaWeights,
  scenarioDiff?: ScenarioDiff | null
): AiRecommendationResponse {
  if (!rankedVendors || rankedVendors.length === 0) {
    return {
      success: false,
      isAiGenerated: false,
      recommendedVendor: 'None',
      whyRankedHighest: 'No vendors available for scoring.',
      majorStrengths: [],
      majorWeaknesses: [],
      bestAlternative: { name: 'None', justification: 'Insufficient data' },
      weightSensitivity: 'No data',
      executiveSummary: 'Unable to evaluate without vendors.',
    };
  }

  const winner = rankedVendors[0];
  const runnerUp = rankedVendors[1] || winner;
  const leadMargin = Number((winner.overallScore - runnerUp.overallScore).toFixed(2));

  // Determine top contributing criteria to winner's score
  const highestCriterion = (
    Object.keys(winner.criteria) as (keyof CriteriaWeights)[]
  ).reduce((prev, curr) =>
    winner.criteria[curr] > winner.criteria[prev] ? curr : prev
  );

  const highestWeightedCriterion = (
    Object.keys(weights) as (keyof CriteriaWeights)[]
  ).reduce((prev, curr) =>
    weights[curr] > weights[prev] ? curr : prev
  );

  const strengthsList: string[] = [];
  (Object.keys(winner.criteria) as (keyof CriteriaWeights)[]).forEach((c) => {
    const score = winner.criteria[c];
    if (score >= 85) {
      strengthsList.push(
        `High ${CRITERIA_METADATA[c].label} benchmark score of ${score}/100, outperforming general baseline expectations.`
      );
    }
  });
  if (strengthsList.length === 0) {
    strengthsList.push(
      `Strongest category is ${CRITERIA_METADATA[highestCriterion].label} with ${winner.criteria[highestCriterion]}/100.`
    );
  }

  const weaknessesList: string[] = [];
  (Object.keys(winner.criteria) as (keyof CriteriaWeights)[]).forEach((c) => {
    const score = winner.criteria[c];
    if (score < 80) {
      weaknessesList.push(
        `Vulnerability in ${CRITERIA_METADATA[c].label} (${score}/100): recommend contractual SLA safeguards and monitoring.`
      );
    }
  });
  if (weaknessesList.length === 0) {
    weaknessesList.push(
      `Balanced score distribution across all five dimensions with no critical operational red flags.`
    );
  }

  const whyText = `${winner.name} achieved the top position with an aggregate weighted score of ${winner.overallScore}/100, outperforming ${runnerUp.name} by ${leadMargin} points. This victory is propelled by an exceptional ${CRITERIA_METADATA[highestCriterion].label} score (${winner.criteria[highestCriterion]}/100), combined with strong alignment to Nova Manufacturing's heaviest weighting priorities (${CRITERIA_METADATA[highestWeightedCriterion].label} at ${weights[highestWeightedCriterion]}%).`;

  const alternativeJustification = `${runnerUp.name} ranks #2 with a competitive score of ${runnerUp.overallScore}/100. It offers strong capabilities (particularly in ${Object.keys(runnerUp.criteria)
    .filter((k) => runnerUp.criteria[k as keyof CriteriaWeights] >= 85)
    .map((k) => CRITERIA_METADATA[k as keyof CriteriaWeights].label)
    .join(', ') || 'overall balance'}), making it an ideal secondary backup or dual-sourcing partner to mitigate single-supplier dependency.`;

  let sensitivityText = `The recommendation is sensitive to the high weighting of ${CRITERIA_METADATA[highestWeightedCriterion].label} (${weights[highestWeightedCriterion]}%). If Nova Manufacturing were to rebalance weights toward other metrics, the ranking margin of ${leadMargin} points could narrow rapidly.`;

  if (scenarioDiff && scenarioDiff.changed) {
    sensitivityText += ` In this latest run, the recommendation shifted from ${scenarioDiff.previousWinner} to ${scenarioDiff.newWinner} because ${scenarioDiff.primaryCause}.`;
  }

  const executiveSummary = `Based on Nova Manufacturing's multi-criteria evaluation model, ${winner.name} is the optimal supplier with a composite rating of ${winner.overallScore}/100. ${runnerUp.name} is recommended as the qualified secondary source.`;

  return {
    success: true,
    isAiGenerated: false,
    recommendedVendor: winner.name,
    whyRankedHighest: whyText,
    majorStrengths: strengthsList,
    majorWeaknesses: weaknessesList,
    bestAlternative: {
      name: runnerUp.name,
      justification: alternativeJustification,
    },
    weightSensitivity: sensitivityText,
    executiveSummary,
  };
}
