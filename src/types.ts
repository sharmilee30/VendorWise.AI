export interface VendorCriteria {
  cost: number;
  quality: number;
  delivery: number;
  reliability: number;
  sustainability: number;
}

export interface Vendor {
  id: string;
  name: string;
  criteria: VendorCriteria;
  notes?: string;
}

export interface CriteriaWeights {
  cost: number;
  quality: number;
  delivery: number;
  reliability: number;
  sustainability: number;
}

export interface VendorScoreResult extends Vendor {
  rank: number;
  overallScore: number;
  contributions: {
    cost: number;
    quality: number;
    delivery: number;
    reliability: number;
    sustainability: number;
  };
  isRecommended: boolean;
  isAlternative: boolean;
  scoreGapToLeader: number;
  strengths: string[];
  weaknesses: string[];
}

export interface ScenarioSnapshot {
  id: string;
  timestamp: string;
  name: string;
  weights: CriteriaWeights;
  recommendedVendorName: string;
  recommendedScore: number;
  secondVendorName?: string;
  secondScore?: number;
}

export interface ScenarioDiff {
  changed: boolean;
  previousWinner: string;
  newWinner: string;
  previousScore: number;
  newScore: number;
  primaryCause: string;
  weightDeltas: {
    criterion: keyof CriteriaWeights;
    label: string;
    oldVal: number;
    newVal: number;
    diff: number;
  }[];
}

export interface AiRecommendationPayload {
  companyContext: string;
  rfqId?: string;
  category?: string;
  criteriaWeights: CriteriaWeights;
  rankedVendors: {
    rank: number;
    name: string;
    overallScore: number;
    criteria: VendorCriteria;
    isRecommended: boolean;
  }[];
  scenarioDiff?: ScenarioDiff | null;
}

export interface AiRecommendationResponse {
  success: boolean;
  isAiGenerated: boolean;
  modelName?: string;
  recommendedVendor: string;
  whyRankedHighest: string;
  majorStrengths: string[];
  majorWeaknesses: string[];
  bestAlternative: {
    name: string;
    justification: string;
  };
  weightSensitivity: string;
  executiveSummary: string;
  error?: string;
  rawText?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  totalWeight: number;
}
